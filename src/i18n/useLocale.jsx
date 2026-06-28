import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { apiService } from '../services/mockApi'
import de from './locales/de.json'
import en from './locales/en.json'

const LOCALES = { en, de }

const LocaleContext = createContext(null)

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

function interpolate(template, params = {}) {
  if (!template) return ''
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => params[key] ?? '')
}

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState('de')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    apiService.fetchLocale().then((saved) => {
      setLocaleState(saved)
      setReady(true)
    })
  }, [])

  const setLocale = useCallback(async (next) => {
    setLocaleState(next)
    await apiService.saveLocale(next)
    document.documentElement.lang = next
  }, [])

  const t = useCallback(
    (key, params) => {
      const strings = LOCALES[locale] ?? LOCALES.de
      const value = getNestedValue(strings, key) ?? getNestedValue(LOCALES.en, key) ?? key
      return typeof value === 'string' ? interpolate(value, params) : value
    },
    [locale],
  )

  const value = useMemo(
    () => ({ locale, setLocale, t, ready }),
    [locale, setLocale, t, ready],
  )

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider')
  }
  return context
}
