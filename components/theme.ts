import { createContext, useContext } from 'react'

export interface ThemeColors {
  /** Primary accent — titles, cursors, active states, pointers */
  primary: string
  /** Secondary accent — tools, keywords, categories */
  secondary: string
  /** Info — links, folders, supplementary highlights */
  info: string
  /** Success — confirmed, selected, checkmarks, completions */
  success: string
  /** Warning — pending, paused, caution states */
  warning: string
  /** Error — danger, denied, critical, stopped */
  error: string
}

export const defaultColors: ThemeColors = {
  primary: '#FF71CE',
  secondary: '#B967FF',
  info: '#01CDFE',
  success: '#05FFA1',
  warning: '#FFC164',
  error: '#FF6B6B',
}

const ThemeContext = createContext<ThemeColors>(defaultColors)

export const ThemeProvider = ThemeContext.Provider

export function useTheme(): ThemeColors {
  return useContext(ThemeContext)
}
