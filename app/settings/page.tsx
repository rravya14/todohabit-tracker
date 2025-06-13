"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { useTheme } from "@/context/theme-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  SettingsIcon,
  Moon,
  Sun,
  Laptop,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import LoadingSpinner from "@/components/loading-spinner"

export default function SettingsPage() {
  const { currentUser, userData, updateUserEmail, updateUserPassword, loading } = useAuth()
  const { theme, setTheme, isLoading: themeLoading } = useTheme()
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/login")
    }
  }, [currentUser, loading, router])

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !currentUser.email) return

    setError("")
    setMessage("")
    setIsEmailLoading(true)

    try {
      await updateUserEmail(email, currentPassword)
      setMessage("Email updated successfully")
      setEmail("")
      setCurrentPassword("")
    } catch (error: any) {
      let errorMessage = "Failed to update email"

      if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password"
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email is already in use"
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address"
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "Please log out and log back in to change your email"
      }

      setError(errorMessage)
    } finally {
      setIsEmailLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    setError("")
    setMessage("")

    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match")
    }

    if (newPassword.length < 6) {
      return setError("Password must be at least 6 characters")
    }

    setIsPasswordLoading(true)

    try {
      await updateUserPassword(currentPassword, newPassword)
      setMessage("Password updated successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      let errorMessage = "Failed to update password"

      if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect current password"
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak"
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "Please log out and log back in to change your password"
      }

      setError(errorMessage)
    } finally {
      setIsPasswordLoading(false)
    }
  }

  if (loading || !currentUser || !userData || themeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50 to-white dark:from-violet-950 dark:to-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white dark:from-violet-950 dark:to-gray-900 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-violet-900 dark:text-violet-300 mb-6 flex items-center">
          <SettingsIcon className="h-6 w-6 mr-2" />
          Settings
        </h1>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="bg-violet-100 dark:bg-violet-900 p-1 rounded-xl">
            <TabsTrigger
              value="account"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300"
            >
              Account
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300"
            >
              Appearance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <div className="space-y-6">
              <Card className="border-violet-200 dark:border-violet-800 shadow-md dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-2xl text-violet-900 dark:text-violet-300">Email Settings</CardTitle>
                  <CardDescription className="dark:text-gray-400">Update your email address</CardDescription>
                </CardHeader>
                <CardContent>
                  {message && (
                    <Alert className="mb-4 bg-green-50 border-green-200 text-green-800 dark:bg-green-900 dark:border-green-800 dark:text-green-100">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription>{message}</AlertDescription>
                    </Alert>
                  )}
                  {error && (
                    <Alert variant="destructive" className="mb-4 dark:bg-red-900 dark:border-red-800 dark:text-white">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleEmailUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-email" className="text-violet-800 dark:text-violet-300">
                        Current Email
                      </Label>
                      <Input
                        id="current-email"
                        type="email"
                        value={currentUser.email || ""}
                        disabled
                        className="border-violet-200 dark:border-violet-700 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-email" className="text-violet-800 dark:text-violet-300">
                        New Email
                      </Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="border-violet-200 dark:border-violet-700 focus:border-violet-400 focus:ring-violet-400 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="current-password-email" className="text-violet-800 dark:text-violet-300">
                        Current Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="current-password-email"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          className="pr-10 border-violet-200 dark:border-violet-700 focus:border-violet-400 focus:ring-violet-400 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400"
                        >
                          {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 dark:from-violet-500 dark:to-fuchsia-400"
                      disabled={isEmailLoading}
                    >
                      {isEmailLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Email"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-violet-200 dark:border-violet-800 shadow-md dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-2xl text-violet-900 dark:text-violet-300">Password Settings</CardTitle>
                  <CardDescription className="dark:text-gray-400">Update your password</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password" className="text-violet-800 dark:text-violet-300">
                        Current Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          className="pr-10 border-violet-200 dark:border-violet-700 focus:border-violet-400 focus:ring-violet-400 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400"
                        >
                          {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-violet-800 dark:text-violet-300">
                        New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="pr-10 border-violet-200 dark:border-violet-700 focus:border-violet-400 focus:ring-violet-400 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400"
                        >
                          {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-violet-800 dark:text-violet-300">
                        Confirm New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="pr-10 border-violet-200 dark:border-violet-700 focus:border-violet-400 focus:ring-violet-400 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-400"
                        >
                          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 dark:from-violet-500 dark:to-fuchsia-400"
                      disabled={isPasswordLoading}
                    >
                      {isPasswordLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appearance">
            <Card className="border-violet-200 dark:border-violet-800 shadow-md dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-2xl text-violet-900 dark:text-violet-300">Theme Settings</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Customize the appearance of the application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-violet-800 dark:text-violet-300">Theme Mode</Label>
                    <RadioGroup
                      value={theme}
                      onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="light" id="light" className="border-violet-400 text-violet-600" />
                        <Label htmlFor="light" className="flex items-center cursor-pointer">
                          <Sun className="h-4 w-4 mr-2 text-amber-500" />
                          Light
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="dark" id="dark" className="border-violet-400 text-violet-600" />
                        <Label htmlFor="dark" className="flex items-center cursor-pointer">
                          <Moon className="h-4 w-4 mr-2 text-indigo-400" />
                          Dark
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="system" id="system" className="border-violet-400 text-violet-600" />
                        <Label htmlFor="system" className="flex items-center cursor-pointer">
                          <Laptop className="h-4 w-4 mr-2 text-gray-500" />
                          System
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
