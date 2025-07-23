"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "@/context/auth-context"
import { updateUserSettings } from "@/lib/firestore"

const ThemeContext = createContext(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("system")
  const [resolvedTheme, setResolvedTheme] = useState("light")
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
        const savedTheme = localStorage.getItem("theme")
        if (savedTheme) {
          setThemeState(savedTheme)
        }
      }
      setIsLoading(false)
    }

    initializeTheme()
  }, [userData])

  // Set theme function that updates both state and storage
  const setTheme = async (newTheme) => {
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

  // Apply theme to document and determine resolved theme
  useEffect(() => {
    if (isLoading) return

    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    let effectiveTheme
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
      effectiveTheme = systemTheme
    } else {
      root.classList.add(theme)
      effectiveTheme = theme
    }

    setResolvedTheme(effectiveTheme)

    // Set a data attribute on html for CSS selectors
    root.setAttribute("data-theme", effectiveTheme)

    // Apply theme color to meta tag for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", effectiveTheme === "dark" ? "#0f172a" : "#ffffff")
    } else {
      const meta = document.createElement("meta")
      meta.name = "theme-color"
      meta.content = effectiveTheme === "dark" ? "#0f172a" : "#ffffff"
      document.head.appendChild(meta)
    }
  }, [theme, isLoading])

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    const handleChange = () => {
      const root = window.document.documentElement
      root.classList.remove("light", "dark")
      const newTheme = mediaQuery.matches ? "dark" : "light"
      root.classList.add(newTheme)
      setResolvedTheme(newTheme)
      root.setAttribute("data-theme", newTheme)

      // Update theme color meta tag
      const metaThemeColor = document.querySelector('meta[name="theme-color"]')
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content", newTheme === "dark" ? "#0f172a" : "#ffffff")
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, isLoading }}>{children}</ThemeContext.Provider>
}
