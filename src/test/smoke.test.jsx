import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('react + jest-dom smoke check', () => {
  it('renders a component and matches jest-dom matchers', () => {
    render(<button type="button">Hello</button>)
    expect(screen.getByRole('button', { name: 'Hello' })).toBeInTheDocument()
  })
})
