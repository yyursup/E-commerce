import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSearchHistory } from '../../hooks/useSearchHistory'

const KEY = 'ecommerce_search_history'
const stored = () => JSON.parse(localStorage.getItem(KEY))

describe('useSearchHistory', () => {
  beforeEach(() => localStorage.clear())

  it('loads saved history on mount', () => {
    localStorage.setItem(KEY, JSON.stringify(['laptop', 'tai nghe']))
    const { result } = renderHook(() => useSearchHistory())
    expect(result.current.searchHistory).toEqual(['laptop', 'tai nghe'])
  })

  it('survives corrupt storage', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    localStorage.setItem(KEY, '{not json')
    const { result } = renderHook(() => useSearchHistory())
    expect(result.current.searchHistory).toEqual([])
    spy.mockRestore()
  })

  it('adds trimmed terms to the top and persists them', () => {
    const { result } = renderHook(() => useSearchHistory())
    act(() => result.current.addSearchTerm('  laptop  '))
    act(() => result.current.addSearchTerm('chuột'))
    expect(result.current.searchHistory).toEqual(['chuột', 'laptop'])
    expect(stored()).toEqual(['chuột', 'laptop'])
  })

  it('ignores blank terms', () => {
    const { result } = renderHook(() => useSearchHistory())
    act(() => result.current.addSearchTerm('   '))
    act(() => result.current.addSearchTerm(''))
    expect(result.current.searchHistory).toEqual([])
  })

  it('moves a repeated term to the top without duplicating it, ignoring case', () => {
    const { result } = renderHook(() => useSearchHistory())
    act(() => result.current.addSearchTerm('iPhone'))
    act(() => result.current.addSearchTerm('ipad'))
    act(() => result.current.addSearchTerm('IPHONE'))
    expect(result.current.searchHistory).toEqual(['IPHONE', 'ipad'])
  })

  it('keeps only the 10 most recent terms', () => {
    const { result } = renderHook(() => useSearchHistory())
    for (let i = 1; i <= 12; i++) act(() => result.current.addSearchTerm(`term ${i}`))
    expect(result.current.searchHistory).toHaveLength(10)
    expect(result.current.searchHistory[0]).toBe('term 12')
    expect(result.current.searchHistory).not.toContain('term 2')
  })

  it('removes a single term', () => {
    localStorage.setItem(KEY, JSON.stringify(['a', 'b']))
    const { result } = renderHook(() => useSearchHistory())
    act(() => result.current.removeSearchTerm('a'))
    expect(result.current.searchHistory).toEqual(['b'])
    expect(stored()).toEqual(['b'])
  })

  it('clears everything', () => {
    localStorage.setItem(KEY, JSON.stringify(['a']))
    const { result } = renderHook(() => useSearchHistory())
    act(() => result.current.clearHistory())
    expect(result.current.searchHistory).toEqual([])
    expect(localStorage.getItem(KEY)).toBeNull()
  })
})
