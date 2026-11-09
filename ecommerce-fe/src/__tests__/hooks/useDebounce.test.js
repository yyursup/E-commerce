import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebounce } from '../../hooks/useDebounce'

describe('useDebounce', () => {
  afterEach(() => vi.useRealTimers())

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('iphone', 300))
    expect(result.current).toBe('iphone')
  })

  it('only publishes the latest value after the delay', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'i' },
    })

    rerender({ value: 'ip' })
    act(() => vi.advanceTimersByTime(200))
    rerender({ value: 'iphone' })
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe('i') // timer restarted on every keystroke

    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toBe('iphone')
  })
})
