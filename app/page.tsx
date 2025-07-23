"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TodoList from "@/components/todo-list"
import HabitTracker from "@/components/habit-tracker"
import type { TodoType, HabitType } from "@/lib/types"
import { CheckCircle2, ListTodo, Sparkles } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import UserMenu from "@/components/user-menu"
import { updateUserTodos, updateUserHabits } from "@/lib/firestore"
import LoadingSpinner from "@/components/loading-spinner"
import FirestoreErrorBanner from "@/components/firestore-error-banner"

export default function Home() {
  const [todos, setTodos] = useState<TodoType[]>([])
  const [habits, setHabits] = useState<HabitType[]>([])
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const { currentUser, userData, loading, firestoreError } = useAuth()
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/login")
    }
  }, [currentUser, loading, router])

  // Load data from Firestore via userData
  useEffect(() => {
    if (userData) {
      setTodos(userData.todos || [])
      setHabits(userData.habits || [])
      setIsDataLoaded(true)
    }
  }, [userData])

  // Save todos to Firestore or localStorage fallback
  useEffect(() => {
    const saveTodos = async () => {
      if (currentUser && isDataLoaded) {
        try {
          await updateUserTodos(currentUser.uid, todos)
        } catch (error) {
          console.error("Error saving todos:", error)
          // Fallback to localStorage is handled in the updateUserTodos function
        }
      }
    }

    saveTodos()
  }, [todos, currentUser, isDataLoaded])

  // Save habits to Firestore or localStorage fallback
  useEffect(() => {
    const saveHabits = async () => {
      if (currentUser && isDataLoaded) {
        try {
          await updateUserHabits(currentUser.uid, habits)
        } catch (error) {
          console.error("Error saving habits:", error)
          // Fallback to localStorage is handled in the updateUserHabits function
        }
      }
    }

    saveHabits()
  }, [habits, currentUser, isDataLoaded])

  // Check for reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date()

      // Check todo reminders
      todos.forEach((todo) => {
        if (todo.reminder && !todo.reminderShown) {
          const reminderTime = new Date(todo.reminder)
          if (reminderTime <= now && !todo.completed) {
            // Show notification
            if (Notification.permission === "granted") {
              new Notification("Todo Reminder", {
                body: todo.text,
                icon: "/favicon.ico",
              })
            }

            // Update todo to mark reminder as shown
            setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, reminderShown: true } : t)))
          }
        }
      })

      // Check habit reminders
      habits.forEach((habit) => {
        if (habit.reminder && !habit.reminderShown) {
          const reminderTime = new Date(habit.reminder)
          if (reminderTime <= now) {
            // Show notification
            if (Notification.permission === "granted") {
              new Notification("Habit Reminder", {
                body: habit.name,
                icon: "/favicon.ico",
              })
            }

            // Update habit to mark reminder as shown
            setHabits((prev) => prev.map((h) => (h.id === habit.id ? { ...h, reminderShown: true } : h)))
          }
        }
      })
    }

    // Request notification permission
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission()
    }

    // Check reminders every minute
    const intervalId = setInterval(checkReminders, 60000)
    checkReminders() // Check immediately on load

    return () => clearInterval(intervalId)
  }, [todos, habits])

  // Show loading state or redirect to login
  if (loading || !currentUser || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50 to-white dark:from-slate-900 dark:to-slate-800">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex justify-between items-center mb-6 pt-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-violet-600 dark:text-violet-400" />
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-500 dark:from-violet-400 dark:to-fuchsia-300">
              TodoHabit
            </h1>
          </div>
          <UserMenu />
        </div>

        {firestoreError && <FirestoreErrorBanner error={firestoreError} />}

        <div className="flex flex-col items-center mb-10">
          <p className="text-gray-600 dark:text-gray-300 text-center mb-8">Manage your tasks and build better habits</p>

          <Tabs defaultValue="todos" className="w-full">
            <TabsList className="grid grid-cols-2 mb-8 bg-violet-100 dark:bg-gray-800 p-1 rounded-xl shadow-sm backdrop-blur-sm">
              <TabsTrigger
                value="todos"
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300 data-[state=active]:shadow-sm transition-all duration-200"
              >
                <ListTodo className="h-4 w-4" />
                <span>Todo List</span>
              </TabsTrigger>
              <TabsTrigger
                value="habits"
                className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300 data-[state=active]:shadow-sm transition-all duration-200"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Habit Tracker</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="todos" className="mt-0">
              <TodoList todos={todos} setTodos={setTodos} />
            </TabsContent>

            <TabsContent value="habits" className="mt-0">
              <HabitTracker habits={habits} setHabits={setHabits} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}
