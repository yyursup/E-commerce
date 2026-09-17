import { describe, it, expect } from 'vitest'
import { cn } from '../../lib/cn'

describe('cn (Tailwind class merger)', () => {
  it('should merge basic tailwind classes', () => {
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')
  })

  it('should handle conditional classes using clsx', () => {
    const isError = true
    const isSuccess = false
    expect(cn(
      'p-4 rounded',
      isError && 'bg-red-500',
      isSuccess && 'bg-green-500'
    )).toBe('p-4 rounded bg-red-500')
  })

  it('should resolve tailwind classes conflicts (tailwind-merge)', () => {
    // twMerge will keep the last conflicting class (px-4 overrides px-2)
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('should merge classes with arrays and objects', () => {
    expect(cn(
      ['w-full', 'flex'],
      { 'items-center': true, 'justify-center': false },
      'mt-4'
    )).toBe('w-full flex items-center mt-4')
  })
})
