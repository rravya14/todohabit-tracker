"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { HabitType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Bell, Plus, Trash2, Edit, Check, X, Award, Flame, Calendar, CheckCircle2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { motion, AnimatePresence } from "framer-motion"

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export default function HabitTracker({
  habits,
  setHabits,
}: { habits: HabitType[]; setHabits: React.Dispatch<React.SetStateAction<HabitType[]>> }) {
  const [newHabit, setNewHabit] = useState("")
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "custom">("daily")
  const [customDays, setCustomDays] = useState<string[]>([])
  const [reminderDate, setReminderDate] = useState("")
  const [reminderTime, setReminderTime] = useState("")
  const [editingHabit, setEditingHabit] = useState<HabitType | null>(null)
  const [achievements, setAchievements] = useState<{ id: string; title: string; description: string }[]>([])

  // Get today's date as YYYY-MM-DD
  const today = new Date().toISOString().split("T")[0]

  useEffect(() => {
    // Check for achievements
    const checkAchievements = () => {
      const newAchievements = []

      habits.forEach((habit) => {
        // First completion achievement
        if (habit.completedDates.length === 1) {
          newAchievements.push({
            id: `first-${habit.id}`,
            title: "First Step",
            description: `You completed "${habit.name}" for the first time!`,
          })
        }

        // 7-day streak achievement
        if (habit.streak === 7) {
          newAchievements.push({
            id: `week-${habit.id}`,
            title: "Week Warrior",
            description: `You maintained a 7-day streak for "${habit.name}"!`,
          })
        }

        // 30-day streak achievement
        if (habit.streak === 30) {
          newAchievements.push({
            id: `month-${habit.id}`,
            title: "Monthly Master",
            description: `You maintained a 30-day streak for "${habit.name}"!`,
          })
        }
      })

      if (newAchievements.length > 0) {
        setAchievements((prev) => [...prev, ...newAchievements])

        // Show notification for new achievements
        if (Notification.permission === "granted") {
          newAchievements.forEach((achievement) => {
            new Notification("Achievement Unlocked!", {
              body: `${achievement.title}: ${achievement.description}`,
              icon: "/favicon.ico",
            })
          })
        }
      }
    }

    checkAchievements()
  }, [habits])

  const addHabit = () => {
    if (newHabit.trim() === "") return

    let reminder = null
    if (reminderDate && reminderTime) {
      reminder = new Date(`${reminderDate}T${reminderTime}`).toISOString()
    }

    const habit: HabitType = {
      id: Date.now().toString(),
      name: newHabit,
      frequency,
      customDays: frequency === "custom" ? customDays : undefined,
      streak: 0,
      completedDates: [],
      reminder,
      reminderShown: false,
      createdAt: new Date().toISOString(),
    }

    setHabits([...habits, habit])
    setNewHabit("")
    setFrequency("daily")
    setCustomDays([])
    setReminderDate("")
    setReminderTime("")
  }

  const updateHabit = () => {
    if (!editingHabit || editingHabit.name.trim() === "") return

    let reminder = null
    if (reminderDate && reminderTime) {
      reminder = new Date(`${reminderDate}T${reminderTime}`).toISOString()
    }

    setHabits(
      habits.map((habit) =>
        habit.id === editingHabit.id
          ? {
              ...editingHabit,
              frequency,
              customDays: frequency === "custom" ? customDays : undefined,
              reminder,
              reminderShown: reminder !== editingHabit.reminder ? false : editingHabit.reminderShown,
            }
          : habit,
      ),
    )

    setEditingHabit(null)
    setFrequency("daily")
    setCustomDays([])
    setReminderDate("")
    setReminderTime("")
  }

  const toggleHabitCompletion = (habit: HabitType) => {
    const todayStr = today
    const isCompleted = habit.completedDates.includes(todayStr)

    let updatedCompletedDates
    let updatedStreak

    if (isCompleted) {
      // Uncomplete habit for today
      updatedCompletedDates = habit.completedDates.filter((date) => date !== todayStr)

      // Recalculate streak
      updatedStreak = calculateStreak(updatedCompletedDates)
    } else {
      // Complete habit for today
      updatedCompletedDates = [...habit.completedDates, todayStr]

      // Update streak
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split("T")[0]

      if (habit.completedDates.includes(yesterdayStr) || habit.streak === 0) {
        updatedStreak = habit.streak + 1
      } else {
        updatedStreak = 1 // Reset streak if yesterday was missed
      }
    }

    setHabits(
      habits.map((h) =>
        h.id === habit.id ? { ...h, completedDates: updatedCompletedDates, streak: updatedStreak } : h,
      ),
    )
  }

  const calculateStreak = (completedDates: string[]) => {
    if (completedDates.length === 0) return 0

    // Sort dates in ascending order
    const sortedDates = [...completedDates].sort()

    // Start from the most recent date
    const latestDate = new Date(sortedDates[sortedDates.length - 1])
    let currentStreak = 1

    // Count consecutive days backward
    for (let i = 1; i <= 100; i++) {
      // Limit to 100 days to avoid infinite loops
      const prevDate = new Date(latestDate)
      prevDate.setDate(prevDate.getDate() - i)
      const prevDateStr = prevDate.toISOString().split("T")[0]

      if (sortedDates.includes(prevDateStr)) {
        currentStreak++
      } else {
        break
      }
    }

    return currentStreak
  }

  const deleteHabit = (id: string) => {
    setHabits(habits.filter((habit) => habit.id !== id))
  }

  const startEditing = (habit: HabitType) => {
    setEditingHabit(habit)
    setFrequency(habit.frequency)
    setCustomDays(habit.customDays || [])

    if (habit.reminder) {
      const date = new Date(habit.reminder)
      setReminderDate(date.toISOString().split("T")[0])
      setReminderTime(date.toTimeString().slice(0, 5))
    } else {
      setReminderDate("")
      setReminderTime("")
    }
  }

  const cancelEditing = () => {
    setEditingHabit(null)
    setFrequency("daily")
    setCustomDays([])
    setReminderDate("")
    setReminderTime("")
  }

  const toggleCustomDay = (day: string) => {
    if (customDays.includes(day)) {
      setCustomDays(customDays.filter((d) => d !== day))
    } else {
      setCustomDays([...customDays, day])
    }
  }

  const shouldCompleteToday = (habit: HabitType) => {
    const today = new Date()
    const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][today.getDay()]

    if (habit.frequency === "daily") return true
    if (habit.frequency === "weekly" && dayOfWeek === "Monday") return true
    if (habit.frequency === "custom" && habit.customDays?.includes(dayOfWeek)) return true

    return false
  }

  const isCompletedToday = (habit: HabitType) => {
    return habit.completedDates.includes(today)
  }

  const dismissAchievement = (id: string) => {
    setAchievements(achievements.filter((a) => a.id !== id))
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {achievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <h3 className="text-xl font-bold mb-3 flex items-center text-amber-700 dark:text-amber-400">
              <Award className="h-5 w-5 mr-2 text-amber-500 dark:text-amber-400" />
              Achievements
            </h3>
            <div className="space-y-2">
              {achievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800 shadow-sm rounded-xl backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                            <Award className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-amber-800 dark:text-amber-300">{achievement.title}</h4>
                            <p className="text-sm text-amber-700 dark:text-amber-400">{achievement.description}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissAchievement(achievement.id)}
                          className="text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-800 dark:hover:text-amber-300 rounded-lg"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold text-violet-900 dark:text-violet-300 flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6" />
          Habits
        </h2>

        <Card className="border-violet-200 dark:border-gray-700 shadow-sm rounded-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Add a new habit..."
                  value={newHabit}
                  onChange={(e) => setNewHabit(e.target.value)}
                  className="pl-10 border-violet-200 dark:border-gray-600 focus:border-violet-400 dark:focus:border-violet-500 focus:ring-violet-400 dark:focus:ring-violet-500 rounded-lg bg-white dark:bg-gray-800"
                />
                <Plus className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-violet-400 dark:text-violet-500" />
              </div>

              <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                <Select value={frequency} onValueChange={(value: "daily" | "weekly" | "custom") => setFrequency(value)}>
                  <SelectTrigger className="w-full sm:w-[150px] border-violet-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                      <SelectValue placeholder="Frequency" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>

                {frequency === "custom" && (
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <Badge
                        key={day}
                        variant={customDays.includes(day) ? "default" : "outline"}
                        className={`cursor-pointer rounded-md ${
                          customDays.includes(day)
                            ? "bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50"
                            : "border-violet-200 dark:border-gray-600 hover:bg-violet-50 dark:hover:bg-gray-700"
                        }`}
                        onClick={() => toggleCustomDay(day)}
                      >
                        {day.substring(0, 3)}
                      </Badge>
                    ))}
                  </div>
                )}

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto border-violet-200 dark:border-gray-600 hover:bg-violet-50 dark:hover:bg-gray-700 rounded-lg bg-transparent"
                    >
                      <Bell className="h-4 w-4 mr-2 text-violet-500 dark:text-violet-400" />
                      Reminder
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border-violet-200 dark:border-gray-700 rounded-xl">
                    <DialogHeader>
                      <DialogTitle className="text-violet-900 dark:text-violet-300">Set Reminder</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                          htmlFor="habit-reminder-date"
                          className="text-right text-violet-700 dark:text-violet-400"
                        >
                          Date
                        </Label>
                        <Input
                          id="habit-reminder-date"
                          type="date"
                          value={reminderDate}
                          onChange={(e) => setReminderDate(e.target.value)}
                          className="col-span-3 border-violet-200 dark:border-gray-600 rounded-lg"
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                          htmlFor="habit-reminder-time"
                          className="text-right text-violet-700 dark:text-violet-400"
                        >
                          Time
                        </Label>
                        <Input
                          id="habit-reminder-time"
                          type="time"
                          value={reminderTime}
                          onChange={(e) => setReminderTime(e.target.value)}
                          className="col-span-3 border-violet-200 dark:border-gray-600 rounded-lg"
                        />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  onClick={addHabit}
                  className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Habit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-violet-100 dark:border-gray-700 shadow-sm backdrop-blur-sm">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-violet-50 dark:bg-violet-900/30 rounded-full">
              <CheckCircle2 className="h-8 w-8 text-violet-400 dark:text-violet-500" />
            </div>
          </div>
          <p>No habits found. Add a new habit to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {habits.map((habit) => (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white dark:bg-gray-800 border-violet-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl backdrop-blur-sm">
                <CardContent className="p-4">
                  {editingHabit && editingHabit.id === habit.id ? (
                    <div className="space-y-3">
                      <Input
                        type="text"
                        value={editingHabit.name}
                        onChange={(e) => setEditingHabit({ ...editingHabit, name: e.target.value })}
                        className="w-full border-violet-200 dark:border-gray-600 rounded-lg"
                      />

                      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                        <Select
                          value={frequency}
                          onValueChange={(value: "daily" | "weekly" | "custom") => setFrequency(value)}
                        >
                          <SelectTrigger className="w-full sm:w-[150px] border-violet-200 dark:border-gray-600 rounded-lg">
                            <SelectValue placeholder="Frequency" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>

                        {frequency === "custom" && (
                          <div className="flex flex-wrap gap-2">
                            {daysOfWeek.map((day) => (
                              <Badge
                                key={day}
                                variant={customDays.includes(day) ? "default" : "outline"}
                                className={`cursor-pointer rounded-md ${
                                  customDays.includes(day)
                                    ? "bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50"
                                    : "border-violet-200 dark:border-gray-600 hover:bg-violet-50 dark:hover:bg-gray-700"
                                }`}
                                onClick={() => toggleCustomDay(day)}
                              >
                                {day.substring(0, 3)}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="border-violet-200 dark:border-gray-600 hover:bg-violet-50 dark:hover:bg-gray-700 rounded-lg bg-transparent"
                            >
                              <Bell className="h-4 w-4 mr-2 text-violet-500 dark:text-violet-400" />
                              {habit.reminder ? "Change Reminder" : "Add Reminder"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="border-violet-200 dark:border-gray-700 rounded-xl">
                            <DialogHeader>
                              <DialogTitle className="text-violet-900 dark:text-violet-300">Set Reminder</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                  htmlFor="edit-habit-reminder-date"
                                  className="text-right text-violet-700 dark:text-violet-400"
                                >
                                  Date
                                </Label>
                                <Input
                                  id="edit-habit-reminder-date"
                                  type="date"
                                  value={reminderDate}
                                  onChange={(e) => setReminderDate(e.target.value)}
                                  className="col-span-3 border-violet-200 dark:border-gray-600 rounded-lg"
                                  min={new Date().toISOString().split("T")[0]}
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                  htmlFor="edit-habit-reminder-time"
                                  className="text-right text-violet-700 dark:text-violet-400"
                                >
                                  Time
                                </Label>
                                <Input
                                  id="edit-habit-reminder-time"
                                  type="time"
                                  value={reminderTime}
                                  onChange={(e) => setReminderTime(e.target.value)}
                                  className="col-span-3 border-violet-200 dark:border-gray-600 rounded-lg"
                                />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          onClick={updateHabit}
                          variant="default"
                          size="sm"
                          className="bg-violet-600 hover:bg-violet-700 rounded-lg shadow-md"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Save
                        </Button>

                        <Button
                          onClick={cancelEditing}
                          variant="outline"
                          size="sm"
                          className="border-violet-200 dark:border-gray-600 hover:bg-violet-50 dark:hover:bg-gray-700 rounded-lg bg-transparent"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id={`habit-${habit.id}`}
                          checked={isCompletedToday(habit)}
                          onCheckedChange={() => toggleHabitCompletion(habit)}
                          className="mt-1 border-violet-300 dark:border-gray-600 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600 rounded"
                          disabled={!shouldCompleteToday(habit)}
                        />
                        <div className="space-y-2">
                          <div>
                            <label
                              htmlFor={`habit-${habit.id}`}
                              className="font-medium text-gray-800 dark:text-gray-200"
                            >
                              {habit.name}
                            </label>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge
                                variant="outline"
                                className="border-violet-200 dark:border-gray-600 text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30 rounded-md"
                              >
                                {habit.frequency === "daily" && "Daily"}
                                {habit.frequency === "weekly" && "Weekly"}
                                {habit.frequency === "custom" && "Custom"}
                              </Badge>

                              {habit.frequency === "custom" && (
                                <div className="flex flex-wrap gap-1">
                                  {habit.customDays?.map((day) => (
                                    <Badge
                                      key={day}
                                      variant="secondary"
                                      className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-300 rounded-md"
                                    >
                                      {day.substring(0, 3)}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              {habit.reminder && (
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                  <Bell className="h-3 w-3 mr-1 text-violet-400 dark:text-violet-500" />
                                  {new Date(habit.reminder).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <div className="p-1 bg-orange-50 dark:bg-orange-900/30 rounded-full">
                                <Flame className="h-3 w-3 text-orange-500 dark:text-orange-400" />
                              </div>
                              <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                                Streak: {habit.streak} days
                              </span>
                            </div>
                            <Progress
                              value={Math.min(habit.streak * 10, 100)}
                              className="h-2 bg-orange-100 dark:bg-orange-900/30 rounded-full"
                              indicatorClassName="bg-gradient-to-r from-orange-500 to-red-500 dark:from-orange-400 dark:to-red-400 rounded-full"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(habit)}
                          className="hover:bg-violet-50 dark:hover:bg-gray-700 hover:text-violet-700 dark:hover:text-violet-400 rounded-lg"
                        >
                          <Edit className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteHabit(habit.id)}
                          className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
