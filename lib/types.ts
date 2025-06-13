export type TodoType = {
  id: string
  text: string
  completed: boolean
  category: string
  reminder: string | null
  reminderShown: boolean
  createdAt: string
}

export type HabitType = {
  id: string
  name: string
  frequency: "daily" | "weekly" | "custom"
  customDays?: string[] // For custom frequency (e.g., ["Monday", "Wednesday", "Friday"])
  streak: number
  completedDates: string[] // ISO date strings
  reminder: string | null
  reminderShown: boolean
  createdAt: string
}

export type CategoryType = {
  id: string
  name: string
  color: string
}

export type UserSettings = {
  theme: "light" | "dark" | "system"
}
