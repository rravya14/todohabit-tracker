"use client"

import type React from "react"

import { useState } from "react"
import type { TodoType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Calendar, Plus, Trash2, Edit, Check, X, Tag, ListTodo } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { motion } from "framer-motion"

const defaultCategories = [
  {
    id: "work",
    name: "Work",
    color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  },
  {
    id: "personal",
    name: "Personal",
    color:
      "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
  },
  {
    id: "health",
    name: "Health",
    color:
      "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  },
  {
    id: "shopping",
    name: "Shopping",
    color:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  },
  {
    id: "other",
    name: "Other",
    color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700",
  },
]

export default function TodoList({
  todos,
  setTodos,
}: { todos: TodoType[]; setTodos: React.Dispatch<React.SetStateAction<TodoType[]>> }) {
  const [newTodo, setNewTodo] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("personal")
  const [reminderDate, setReminderDate] = useState("")
  const [reminderTime, setReminderTime] = useState("")
  const [filter, setFilter] = useState("all")
  const [editingTodo, setEditingTodo] = useState<TodoType | null>(null)

  const addTodo = () => {
    if (newTodo.trim() === "") return

    let reminder = null
    if (reminderDate && reminderTime) {
      reminder = new Date(`${reminderDate}T${reminderTime}`).toISOString()
    }

    const todo: TodoType = {
      id: Date.now().toString(),
      text: newTodo,
      completed: false,
      category: selectedCategory,
      reminder,
      reminderShown: false,
      createdAt: new Date().toISOString(),
    }

    setTodos([...todos, todo])
    setNewTodo("")
    setReminderDate("")
    setReminderTime("")
  }

  const updateTodo = () => {
    if (!editingTodo || editingTodo.text.trim() === "") return

    let reminder = null
    if (reminderDate && reminderTime) {
      reminder = new Date(`${reminderDate}T${reminderTime}`).toISOString()
    }

    setTodos(
      todos.map((todo) =>
        todo.id === editingTodo.id
          ? {
              ...editingTodo,
              reminder,
              reminderShown: reminder !== editingTodo.reminder ? false : editingTodo.reminderShown,
            }
          : todo,
      ),
    )

    setEditingTodo(null)
    setReminderDate("")
    setReminderTime("")
  }

  const toggleTodo = (id: string) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))
  }

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id))
  }

  const startEditing = (todo: TodoType) => {
    setEditingTodo(todo)
    setSelectedCategory(todo.category)

    if (todo.reminder) {
      const date = new Date(todo.reminder)
      setReminderDate(date.toISOString().split("T")[0])
      setReminderTime(date.toTimeString().slice(0, 5))
    } else {
      setReminderDate("")
      setReminderTime("")
    }
  }

  const cancelEditing = () => {
    setEditingTodo(null)
    setReminderDate("")
    setReminderTime("")
  }

  const filteredTodos = todos.filter((todo) => {
    if (filter === "all") return true
    if (filter === "active") return !todo.completed
    if (filter === "completed") return todo.completed
    return todo.category === filter
  })

  const getCategoryColor = (categoryId: string) => {
    const category = defaultCategories.find((c) => c.id === categoryId)
    return category
      ? category.color
      : "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <h2 className="text-2xl font-bold text-violet-900 dark:text-violet-300 flex items-center gap-2">
          <ListTodo className="h-6 w-6" />
          Tasks
        </h2>

        <Card className="border-violet-200 dark:border-gray-700 shadow-sm rounded-xl backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Add a new task..."
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  className="pl-10 border-violet-200 dark:border-gray-600 focus:border-violet-400 dark:focus:border-violet-500 focus:ring-violet-400 dark:focus:ring-violet-500 rounded-lg bg-white dark:bg-gray-800"
                />
                <Plus className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-violet-400 dark:text-violet-500" />
              </div>

              <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[150px] border-violet-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                      <SelectValue placeholder="Category" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {defaultCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center">
                          <span
                            className={`w-2 h-2 rounded-full mr-2 ${category.color.split(" ")[0]} dark:${category.color.split("dark:")[1]?.split(" ")[0] || category.color.split(" ")[0]}`}
                          ></span>
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

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
                        <Label htmlFor="reminder-date" className="text-right text-violet-700 dark:text-violet-400">
                          Date
                        </Label>
                        <Input
                          id="reminder-date"
                          type="date"
                          value={reminderDate}
                          onChange={(e) => setReminderDate(e.target.value)}
                          className="col-span-3 border-violet-200 dark:border-gray-600 rounded-lg"
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="reminder-time" className="text-right text-violet-700 dark:text-violet-400">
                          Time
                        </Label>
                        <Input
                          id="reminder-time"
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
                  onClick={addTodo}
                  className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className={`rounded-lg ${filter === "all" ? "bg-violet-600 hover:bg-violet-700 shadow-md" : "border-violet-200 dark:border-gray-600 hover:bg-violet-50 dark:hover:bg-gray-700"}`}
        >
          All
        </Button>
        <Button
          variant={filter === "active" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("active")}
          className={`rounded-lg ${filter === "active" ? "bg-violet-600 hover:bg-violet-700 shadow-md" : "border-violet-200 dark:border-gray-600 hover:bg-violet-50 dark:hover:bg-gray-700"}`}
        >
          Active
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("completed")}
          className={`rounded-lg ${
            filter === "completed"
              ? "bg-violet-600 hover:bg-violet-700 shadow-md"
              : "border-violet-200 dark:border-gray-600 hover:bg-violet-50 dark:hover:bg-gray-700"
          }`}
        >
          Completed
        </Button>
        {defaultCategories.map((category) => (
          <Button
            key={category.id}
            variant={filter === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(category.id)}
            className={`rounded-lg ${
              filter === category.id
                ? "bg-violet-600 hover:bg-violet-700 shadow-md"
                : "border-violet-200 dark:border-gray-600 hover:bg-violet-50 dark:hover:bg-gray-700"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full mr-2 ${category.color.split(" ")[0]} dark:${category.color.split("dark:")[1]?.split(" ")[0] || category.color.split(" ")[0]}`}
            ></span>
            {category.name}
          </Button>
        ))}
      </div>

      {filteredTodos.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-violet-100 dark:border-gray-700 shadow-sm backdrop-blur-sm">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-violet-50 dark:bg-violet-900/30 rounded-full">
              <ListTodo className="h-8 w-8 text-violet-400 dark:text-violet-500" />
            </div>
          </div>
          <p>No tasks found. Add a new task to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTodos.map((todo) => (
            <motion.div
              key={todo.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                className={`${todo.completed ? "bg-gray-50 dark:bg-gray-800/50" : "bg-white dark:bg-gray-800"} border-violet-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl backdrop-blur-sm`}
              >
                <CardContent className="p-4">
                  {editingTodo && editingTodo.id === todo.id ? (
                    <div className="space-y-3">
                      <Input
                        type="text"
                        value={editingTodo.text}
                        onChange={(e) => setEditingTodo({ ...editingTodo, text: e.target.value })}
                        className="w-full border-violet-200 dark:border-gray-600 rounded-lg"
                      />

                      <div className="flex flex-wrap gap-2">
                        <Select
                          value={editingTodo.category}
                          onValueChange={(value) => setEditingTodo({ ...editingTodo, category: value })}
                        >
                          <SelectTrigger className="w-[150px] border-violet-200 dark:border-gray-600 rounded-lg">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            {defaultCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center">
                                  <span
                                    className={`w-2 h-2 rounded-full mr-2 ${category.color.split(" ")[0]} dark:${category.color.split("dark:")[1]?.split(" ")[0] || category.color.split(" ")[0]}`}
                                  ></span>
                                  {category.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="border-violet-200 dark:border-gray-600 hover:bg-violet-50 dark:hover:bg-gray-700 rounded-lg bg-transparent"
                            >
                              <Bell className="h-4 w-4 mr-2 text-violet-500 dark:text-violet-400" />
                              {todo.reminder ? "Change Reminder" : "Add Reminder"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="border-violet-200 dark:border-gray-700 rounded-xl">
                            <DialogHeader>
                              <DialogTitle className="text-violet-900 dark:text-violet-300">Set Reminder</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                  htmlFor="edit-reminder-date"
                                  className="text-right text-violet-700 dark:text-violet-400"
                                >
                                  Date
                                </Label>
                                <Input
                                  id="edit-reminder-date"
                                  type="date"
                                  value={reminderDate}
                                  onChange={(e) => setReminderDate(e.target.value)}
                                  className="col-span-3 border-violet-200 dark:border-gray-600 rounded-lg"
                                  min={new Date().toISOString().split("T")[0]}
                                />
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                  htmlFor="edit-reminder-time"
                                  className="text-right text-violet-700 dark:text-violet-400"
                                >
                                  Time
                                </Label>
                                <Input
                                  id="edit-reminder-time"
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
                          onClick={updateTodo}
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
                          id={`todo-${todo.id}`}
                          checked={todo.completed}
                          onCheckedChange={() => toggleTodo(todo.id)}
                          className="mt-1 border-violet-300 dark:border-gray-600 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600 rounded"
                        />
                        <div className="space-y-1">
                          <label
                            htmlFor={`todo-${todo.id}`}
                            className={`font-medium ${todo.completed ? "line-through text-gray-500 dark:text-gray-400" : "text-gray-800 dark:text-gray-200"}`}
                          >
                            {todo.text}
                          </label>
                          <div className="flex flex-wrap gap-2 items-center">
                            <Badge className={`${getCategoryColor(todo.category)} border rounded-md`}>
                              {defaultCategories.find((c) => c.id === todo.category)?.name || todo.category}
                            </Badge>

                            {todo.reminder && (
                              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <Calendar className="h-3 w-3 mr-1 text-violet-400 dark:text-violet-500" />
                                {new Date(todo.reminder).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(todo)}
                          className="hover:bg-violet-50 dark:hover:bg-gray-700 hover:text-violet-700 dark:hover:text-violet-400 rounded-lg"
                        >
                          <Edit className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTodo(todo.id)}
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
