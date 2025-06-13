"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { updateUserSettings } from "@/lib/firestore"

type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [isLoading, setIsLoading] = useState(true)
  const { currentUser, userData, firestoreError } = useAuth()

  // Initialize theme from userData or localStorage
  useEffect(() => {
    const initializeTheme = () => {
      // If user is logged in and we have userData, use theme from userData
      if (userData?.settings?.theme) {
        setThemeState(userData.settings.theme)
      } else {
        // Otherwise, try to get from localStorage as fallback
        const savedTheme = localStorage.getItem("theme") as Theme | null
        if (savedTheme) {
          setThemeState(savedTheme)
        }
      }
      setIsLoading(false)
    }

    initializeTheme()
  }, [userData])

  // Set theme function that updates both state and storage
  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme)

    // Always update localStorage for immediate effect and fallback
    localStorage.setItem("theme", newTheme)

    // If user is logged in and no Firestore error, update theme in Firestore
    if (currentUser && !firestoreError) {
      try {
        await updateUserSettings(currentUser.uid, { theme: newTheme })
      } catch (error) {
        console.error("Error updating theme in Firestore:", error)
        // Already saved to localStorage as fallback
      }
    }
  }

  // Apply theme to document
  useEffect(() => {
    if (isLoading) return

    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme, isLoading])

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const handleChange = () => {
      const root = window.document.documentElement
      root.classList.remove("light", "dark")
      root.classList.add(mediaQuery.matches ? "dark" : "light")
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>{children}</ThemeContext.Provider>
}
