"use client"

import { ThemeProvider } from "./theme-provider"
import { AuthProvider } from "../contexts/AuthContext"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  )
}