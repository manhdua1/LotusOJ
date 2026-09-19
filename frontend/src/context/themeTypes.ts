import { createContext } from 'react'

export type AppTheme = 'light' | 'dark'

export interface ThemeContextType {
  theme: AppTheme
  toggleTheme: () => void
  setTheme: (theme: AppTheme) => void
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)
