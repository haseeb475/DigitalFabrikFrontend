import { jsPDF } from 'jspdf'

// Wallet export utilities.
//
// The structuring functions (`formatContextSummary`, `formatCardContent`) emit
// ordered *section arrays* — a renderer-agnostic representation that both the
// PDF renderer (task 6.5) and the legacy text path consume. `buildExportModel`
// assembles those sections into the full export model `{ title, contextSummary,
// cards[] }`, with the context summary first followed by every action card in
// guide order (Req 8.2, 8.4, 8.5).

/**
 * Normalize a card's `content` into an ordered list of sections.
 *
 * Section order follows Req 8.2: body → steps → checklist items → sources
 * (the optional CTA is appended last as the "next step").
 *
 * @param {{ content?: { body?: string, steps?: string[], items?: Array<{text: string}>, sources?: Array<{label: string, url: string}>, cta?: { label: string, url: string } } }} card
 * @returns {Array<object>} ordered card content sections
 */
export function formatCardContent(card) {
  const sections = []
  const content = card?.content
  if (!content) return sections

  if (content.body) {
    sections.push({ kind: 'body', text: content.body })
  }

  if (content.steps?.length) {
    sections.push({ kind: 'steps', items: content.steps.slice() })
  }

  if (content.items?.length) {
    sections.push({
      kind: 'checklist',
      items: content.items.map((item) => item.text),
    })
  }

  if (content.sources?.length) {
    sections.push({
      kind: 'sources',
      items: content.sources.map((s) => ({ label: s.label, url: s.url })),
    })
  }

  if (content.cta) {
    sections.push({ kind: 'cta', label: content.cta.label, url: content.cta.url })
  }

  return sections
}

/**
 * Normalize a context summary into an ordered list of sections.
 *
 * Section order follows Req 8.4: the selected goal text first, then each
 * answered question paired with its answer, then any follow-up prompts.
 *
 * @param {{ goalLabel?: string, userPrompt?: string, answeredQuestions?: Array<{question: string, answerLabel: string}>, followUpPrompts?: Array<string|{text: string}> }} contextSummary
 * @returns {Array<object>} ordered context summary sections
 */
export function formatContextSummary(contextSummary) {
  const sections = []
  if (!contextSummary) return sections

  // The selected goal text comes from the goal label when present, otherwise
  // the user's free-text prompt.
  sections.push({
    kind: 'goal',
    text: contextSummary.goalLabel ?? contextSummary.userPrompt ?? '',
  })

  if (contextSummary.answeredQuestions?.length) {
    sections.push({
      kind: 'answeredQuestions',
      items: contextSummary.answeredQuestions.map((a) => ({
        question: a.question,
        answer: a.answerLabel,
      })),
    })
  }

  if (contextSummary.followUpPrompts?.length) {
    sections.push({
      kind: 'followUps',
      items: contextSummary.followUpPrompts.map((f) =>
        typeof f === 'string' ? f : f.text,
      ),
    })
  }

  return sections
}

/**
 * Extract the ordered list of action cards from a wallet item or bundle.
 *
 * - A single-card item (`type: 'card'`) yields its one card.
 * - A full-session item (`type: 'session'`) yields every card in guide order.
 * - A wallet bundle (no `type`, has `cards`) yields every card in guide order.
 *
 * @param {object} item wallet item or bundle
 * @returns {Array<object>} action cards in guide order
 */
function extractCards(item) {
  if (!item) return []
  if (item.type === 'card') return item.card ? [item.card] : []
  if (Array.isArray(item.cards)) return item.cards
  return []
}

/**
 * Build the pure, renderer-agnostic export model for a saved guide.
 *
 * The model places the context summary first, followed by every action card in
 * guide order, each card carrying its content sections in body → steps →
 * checklist → sources order (Req 8.2, 8.4, 8.5).
 *
 * @param {object} item a wallet item (single card or full session) or bundle
 * @returns {{ title: string, contextSummary: Array<object>, cards: Array<{ id: string, title: string, description: string, sections: Array<object> }> }}
 */
export function buildExportModel(item) {
  const cards = extractCards(item).map((card) => ({
    id: card.id,
    title: card.title,
    description: card.description,
    sections: formatCardContent(card),
  }))

  return {
    title: item?.title ?? 'Saved Guide',
    contextSummary: formatContextSummary(item?.contextSummary),
    cards,
  }
}

/**
 * Slugify a title using the established wallet-export slug rules: take the
 * first 40 chars, collapse non-alphanumerics to hyphens, and trim edge hyphens.
 *
 * @param {string} title
 * @returns {string} slug (may be empty when the title has no usable characters)
 */
function slugifyTitle(title) {
  return String(title ?? '')
    .slice(0, 40)
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Convert a saved-at / generated-at value into a `YYYY-MM-DD` stamp, falling
 * back to today's date when the value is missing or unparseable so the helper
 * never throws.
 *
 * @param {string|number|Date|undefined} value
 * @returns {string} `YYYY-MM-DD`
 */
function toDateStamp(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10)
  return date.toISOString().slice(0, 10)
}

/**
 * Build a PDF filename for a saved guide, reusing the existing slug logic plus
 * the saved date. The result always ends in `.pdf` (Req 8.3):
 * `migrant-assistant-<slug>-<YYYY-MM-DD>.pdf`.
 *
 * @param {{ title?: string, savedAt?: string, generatedAt?: string }} item
 * @returns {string} the `.pdf` filename
 */
export function buildExportFilename(item) {
  const slug = slugifyTitle(item?.title) || 'guide'
  const date = toDateStamp(item?.savedAt ?? item?.generatedAt)
  return `migrant-assistant-${slug}-${date}.pdf`
}

// --- PDF rendering (jsPDF) --------------------------------------------------
// `renderPdf` walks the renderer-agnostic export model with a simple `y`-cursor,
// wrapping long text and calling `doc.addPage()` whenever the cursor would run
// past the bottom margin. Manual pagination keeps the implementation
// dependency-light and handles guides of up to 50 cards well within budget
// (Req 8.1). Content order matches the model: context summary first, then every
// card in guide order, each with body → steps → checklist → sources (Req 8.2,
// 8.4, 8.5).

const PAGE_MARGIN = 48 // pt
const FONT_FAMILY = 'helvetica'

/**
 * Render an export model (from `buildExportModel`) into a jsPDF document.
 *
 * @param {{ title: string, contextSummary: Array<object>, cards: Array<object> }} model
 * @returns {import('jspdf').jsPDF} the generated jsPDF document
 */
export function renderPdf(model) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageHeight = doc.internal.pageSize.getHeight()
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - PAGE_MARGIN * 2
  let y = PAGE_MARGIN

  // Advance to a new page when `needed` vertical space won't fit below `y`.
  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - PAGE_MARGIN) {
      doc.addPage()
      y = PAGE_MARGIN
    }
  }

  // Write wrapped text starting at the current cursor, honoring an optional
  // left indent, font size/style, and a trailing gap. Each wrapped line is
  // checked for overflow individually so a long block paginates correctly.
  const writeText = (
    text,
    { fontSize = 11, fontStyle = 'normal', indent = 0, gapAfter = 0 } = {},
  ) => {
    doc.setFont(FONT_FAMILY, fontStyle)
    doc.setFontSize(fontSize)
    const lineHeight = fontSize * 1.35
    const lines = doc.splitTextToSize(String(text ?? ''), contentWidth - indent)
    lines.forEach((line) => {
      ensureSpace(lineHeight)
      doc.text(line, PAGE_MARGIN + indent, y)
      y += lineHeight
    })
    y += gapAfter
  }

  // Title.
  writeText(model.title ?? 'Saved Guide', { fontSize: 20, fontStyle: 'bold', gapAfter: 12 })

  // Context summary sections.
  model.contextSummary?.forEach((section) => {
    if (section.kind === 'goal') {
      writeText('Your question', { fontSize: 13, fontStyle: 'bold', gapAfter: 2 })
      writeText(section.text, { gapAfter: 10 })
    } else if (section.kind === 'answeredQuestions') {
      writeText('What we asked you', { fontSize: 13, fontStyle: 'bold', gapAfter: 2 })
      section.items.forEach((a) => {
        writeText(`• ${a.question}`, { indent: 12, gapAfter: 1 })
        writeText(`→ ${a.answer}`, { indent: 24, fontStyle: 'italic', gapAfter: 4 })
      })
      y += 6
    } else if (section.kind === 'followUps') {
      writeText('Follow-up questions', { fontSize: 13, fontStyle: 'bold', gapAfter: 2 })
      section.items.forEach((f) => writeText(`• ${f}`, { indent: 12, gapAfter: 1 }))
      y += 10
    }
  })

  // Action cards, in guide order.
  model.cards?.forEach((card) => {
    writeText(card.title ?? '', { fontSize: 15, fontStyle: 'bold', gapAfter: 2 })
    if (card.description) {
      writeText(card.description, { fontStyle: 'italic', gapAfter: 6 })
    }

    card.sections?.forEach((section) => {
      if (section.kind === 'body') {
        writeText(section.text, { gapAfter: 6 })
      } else if (section.kind === 'steps') {
        writeText('Steps', { fontSize: 12, fontStyle: 'bold', gapAfter: 2 })
        section.items.forEach((step, i) =>
          writeText(`${i + 1}. ${step}`, { indent: 12, gapAfter: 1 }),
        )
        y += 6
      } else if (section.kind === 'checklist') {
        writeText('Checklist', { fontSize: 12, fontStyle: 'bold', gapAfter: 2 })
        section.items.forEach((item) => writeText(`• ${item}`, { indent: 12, gapAfter: 1 }))
        y += 6
      } else if (section.kind === 'sources') {
        writeText('Sources', { fontSize: 12, fontStyle: 'bold', gapAfter: 2 })
        section.items.forEach((s) =>
          writeText(`${s.label}: ${s.url}`, { indent: 12, gapAfter: 1 }),
        )
        y += 6
      } else if (section.kind === 'cta') {
        writeText(`Next step: ${section.label} (${section.url})`, {
          fontStyle: 'bold',
          gapAfter: 6,
        })
      }
    })

    y += 12 // spacing between cards
  })

  return doc
}

/**
 * Generate and download a PDF for a single wallet item (single card or full
 * session). Generation is wrapped in `try/catch`: on failure the error is
 * re-thrown so the caller can surface an error indication, and no saved state
 * is touched here (Req 8.6).
 *
 * @param {object} item a wallet item (single card or full session)
 */
export function downloadWalletItemAsPdf(item) {
  try {
    const model = buildExportModel(item)
    const filename = buildExportFilename(item)
    const doc = renderPdf(model)
    doc.save(filename)
  } catch (error) {
    throw new Error(`Failed to generate PDF: ${error.message}`, { cause: error })
  }
}

/**
 * Generate and download a PDF for a full wallet bundle (an entire guide
 * session). The bundle is adapted to the export-model shape before rendering.
 * Generation is wrapped in `try/catch` per Req 8.6.
 *
 * @param {{ title?: string, generatedAt?: string, contextSummary?: object, cards?: Array<object> }} bundle
 */
export function downloadWalletBundleAsPdf(bundle) {
  const item = {
    type: 'session',
    title: bundle?.title,
    savedAt: bundle?.generatedAt,
    generatedAt: bundle?.generatedAt,
    contextSummary: bundle?.contextSummary,
    cards: bundle?.cards,
  }
  downloadWalletItemAsPdf(item)
}
