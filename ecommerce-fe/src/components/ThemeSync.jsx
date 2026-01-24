import { useEffect } from 'react'
import { useThemeStore } from '../store/useThemeStore'

export default function ThemeSync() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const isDark = theme === 'dark'
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return null
}
