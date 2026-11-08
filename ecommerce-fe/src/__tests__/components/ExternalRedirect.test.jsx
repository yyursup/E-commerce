import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import ExternalRedirect from '../../components/ExternalRedirect'

describe('ExternalRedirect', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('replaces the current page with the external URL and renders nothing', () => {
    const replace = vi.fn()
    vi.stubGlobal('location', { ...window.location, replace })

    const { container } = render(<ExternalRedirect to="http://localhost:3001/register" />)

    expect(replace).toHaveBeenCalledOnce()
    expect(replace).toHaveBeenCalledWith('http://localhost:3001/register')
    expect(container.innerHTML).toBe('')
  })
})
