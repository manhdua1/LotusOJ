import React, { useState, useEffect } from 'react'
import { ThemeContext, type AppTheme } from './themeTypes'

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('lotusoj_theme')
    if (saved === 'dark' || saved === 'light') {
      return saved
    }
    const editorTheme = localStorage.getItem('lotusoj_editor_theme')
    if (editorTheme === 'vs-dark') return 'dark'
    if (editorTheme === 'light') return 'light'
    return 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('lotusoj_theme', theme)
    localStorage.setItem('lotusoj_editor_theme', theme === 'dark' ? 'vs-dark' : 'light')
  }, [theme])

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}


