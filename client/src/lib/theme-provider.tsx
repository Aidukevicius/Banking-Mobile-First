import { createContext, useContext, useEffect, useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { apiRequest, queryClient } from "./queryClient"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  // Only fetch user settings if we have a token (user is authenticated)
  const hasToken = !!localStorage.getItem("token")
  const { data: settings } = useQuery<{ theme: string; currency: string }>({
    queryKey: ["/api/settings"],
    enabled: hasToken,
  })

  // Update theme mutation
  const updateThemeMutation = useMutation({
    mutationFn: async (newTheme: Theme) => {
      return apiRequest("PUT", "/api/settings", { theme: newTheme })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] })
    },
  })

  // Sync theme from settings when loaded
  useEffect(() => {
    if (settings?.theme) {
      setThemeState(settings.theme as Theme)
      localStorage.setItem(storageKey, settings.theme)
    }
  }, [settings, storageKey])

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setThemeState(theme)
      // Save to backend
      updateThemeMutation.mutate(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}