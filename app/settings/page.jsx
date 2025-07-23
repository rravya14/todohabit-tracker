"use client"

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
  Download,
  Upload,
  Database,
  Trash2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import LoadingSpinner from "@/components/loading-spinner"

export default function SettingsPage() {
  const { currentUser, userData, updateUserEmail, updateUserPassword, loading } = useAuth()
  const { theme, setTheme, resolvedTheme, isLoading: themeLoading } = useTheme()
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [isPasswordLoading, setIsPasswordLoading] = useState(false)
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/login")
    }
  }, [currentUser, loading, router])

  const handleEmailUpdate = async (e) => {
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
    } catch (error) {
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

  const handlePasswordUpdate = async (e) => {
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
    } catch (error) {
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

  // Handle data export
  const handleExportData = () => {
    setIsDataLoading(true)

    try {
      // Create data object to export
      const exportData = {
        todos: userData.todos || [],
        habits: userData.habits || [],
        settings: userData.settings || {},
        notificationPreferences: userData.notificationPreferences || {},
        privacySettings: userData.privacySettings || {},
        calendarSync: userData.calendarSync || {},
        exportDate: new Date().toISOString(),
      }

      // Convert to JSON string
      const dataStr = JSON.stringify(exportData, null, 2)

      // Create download link
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

      // Create download element
      const exportFileDefaultName = `todohabit_export_${new Date().toISOString().split("T")[0]}.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileDefaultName)
      linkElement.click()

      setMessage("Data exported successfully")
    } catch (error) {
      console.error("Error exporting data:", error)
      setError("Failed to export data")
    } finally {
      setIsDataLoading(false)
    }
  }

  // Handle data import
  const handleImportData = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsDataLoading(true)
    setError("")
    setMessage("")

    const reader = new FileReader()

    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result)

        // Validate imported data
        if (!importedData.todos || !importedData.habits) {
          throw new Error("Invalid data format")
        }

        // Here you would normally update the data in Firestore
        // For now, we'll just show a success message
        console.log("Data to import:", importedData)

        setMessage("Data imported successfully. Please refresh the page to see changes.")
        setIsDataLoading(false)
      } catch (error) {
        console.error("Error importing data:", error)
        setError("Failed to import data. Please check the file format.")
        setIsDataLoading(false)
      }
    }

    reader.onerror = () => {
      setError("Error reading file")
      setIsDataLoading(false)
    }

    reader.readAsText(file)
  }

  // Handle account deletion
  const handleDeleteAccount = () => {
    // This would normally show a confirmation dialog and then delete the account
    // For now, we'll just show an alert
    alert("This feature is not implemented yet. In a real app, this would delete your account after confirmation.")
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
            <TabsTrigger
              value="data"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300"
            >
              Data Management
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
                      onValueChange={(value) => setTheme(value)}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="light"
                          id="light"
                          className="border-violet-400 text-violet-600 dark:border-violet-500 dark:text-violet-400"
                        />
                        <Label htmlFor="light" className="flex items-center cursor-pointer">
                          <Sun
                            className={`h-4 w-4 mr-2 ${resolvedTheme === "light" ? "text-amber-500" : "text-amber-400"}`}
                          />
                          Light
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="dark"
                          id="dark"
                          className="border-violet-400 text-violet-600 dark:border-violet-500 dark:text-violet-400"
                        />
                        <Label htmlFor="dark" className="flex items-center cursor-pointer">
                          <Moon
                            className={`h-4 w-4 mr-2 ${resolvedTheme === "dark" ? "text-indigo-400" : "text-indigo-500"}`}
                          />
                          Dark
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value="system"
                          id="system"
                          className="border-violet-400 text-violet-600 dark:border-violet-500 dark:text-violet-400"
                        />
                        <Label htmlFor="system" className="flex items-center cursor-pointer">
                          <Laptop className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                          System
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="pt-4">
                    <div className="p-4 rounded-lg bg-white dark:bg-gray-900 border border-violet-100 dark:border-violet-800">
                      <h3 className="font-medium mb-2 text-violet-800 dark:text-violet-300">Preview</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        This is how content will appear with the {resolvedTheme} theme.
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          size="sm"
                          className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600"
                        >
                          Primary Button
                        </Button>
                        <Button size="sm" variant="outline" className="border-violet-200 dark:border-violet-700">
                          Secondary Button
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data">
            <Card className="border-violet-200 dark:border-violet-800 shadow-md dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-2xl text-violet-900 dark:text-violet-300">Data Management</CardTitle>
                <CardDescription className="dark:text-gray-400">Export, import, or delete your data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-violet-50 dark:bg-violet-900/30 p-4 rounded-lg border border-violet-200 dark:border-violet-800">
                    <h3 className="font-medium text-violet-800 dark:text-violet-300 mb-2 flex items-center">
                      <Database className="h-4 w-4 mr-2" />
                      Your Data
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      You can export your data to back it up or import it to restore from a previous backup.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 border-violet-200 dark:border-violet-700"
                        onClick={handleExportData}
                        disabled={isDataLoading}
                      >
                        {isDataLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        Export Data
                      </Button>

                      <div className="relative flex-1">
                        <Button
                          variant="outline"
                          className="w-full border-violet-200 dark:border-violet-700"
                          disabled={isDataLoading}
                          onClick={() => document.getElementById("import-file").click()}
                        >
                          {isDataLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          Import Data
                        </Button>
                        <input
                          type="file"
                          id="import-file"
                          accept=".json"
                          className="hidden"
                          onChange={handleImportData}
                          disabled={isDataLoading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-violet-200 dark:border-violet-800 pt-6">
                    <h3 className="font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>

                    <Button
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-300"
                      onClick={handleDeleteAccount}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </Button>
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
