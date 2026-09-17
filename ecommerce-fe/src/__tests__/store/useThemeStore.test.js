import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore } from '../../store/useThemeStore'

describe('useThemeStore', () => {
  // Setup: Reset the store before each test
  beforeEach(() => {
    useThemeStore.setState({ theme: 'light' })
    localStorage.clear()
  })

  it('should initialize with light theme by default', () => {
    const { theme } = useThemeStore.getState()
    expect(theme).toBe('light')
  })

  it('should set theme correctly using setTheme', () => {
    useThemeStore.getState().setTheme('dark')
    expect(useThemeStore.getState().theme).toBe('dark')

    useThemeStore.getState().setTheme('system')
    expect(useThemeStore.getState().theme).toBe('system')
  })

  it('should toggle theme from light to dark and vice versa', () => {
    // Initial state is light
    useThemeStore.getState().toggleTheme()
    expect(useThemeStore.getState().theme).toBe('dark')

    // Toggle back
    useThemeStore.getState().toggleTheme()
    expect(useThemeStore.getState().theme).toBe('light')
  })
})
