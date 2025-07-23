"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  User,
  Camera,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Loader2,
  X,
  RefreshCw,
  Shield,
  Bell,
  Calendar,
  Trash2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import LoadingSpinner from "@/components/loading-spinner"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"

export default function ProfilePage() {
  const {
    currentUser,
    userData,
    updateUserProfileData,
    loading,
    refreshUserData,
    updateNotificationPreferences,
    updatePrivacySettings,
    updateCalendarSync,
  } = useAuth()
  const [displayName, setDisplayName] = useState("")
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPhotoLoading, setIsPhotoLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const fileInputRef = useRef(null)
  const router = useRouter()

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true)
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    push: true,
    reminders: true,
    marketing: false,
  })

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    shareActivity: true,
    dataCollection: true,
  })

  // Calendar sync settings state
  const [calendarSync, setCalendarSync] = useState({
    enabled: false,
    lastSynced: null,
    syncTodos: true,
    syncHabits: true,
  })

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/login")
    } else if (currentUser && userData) {
      setDisplayName(userData.displayName || "")

      // Initialize notification preferences
      if (userData.notificationPreferences) {
        setNotificationPrefs(userData.notificationPreferences)
      }

      // Initialize privacy settings
      if (userData.privacySettings) {
        setPrivacySettings(userData.privacySettings)
      }

      // Initialize calendar sync settings
      if (userData.calendarSync) {
        setCalendarSync(userData.calendarSync)
      }
    }
  }, [currentUser, userData, loading, router])

  // Reset photo preview when userData changes (e.g. after successful upload)
  useEffect(() => {
    if (userData?.photoURL && !photoPreview) {
      // Force refresh the image by adding a timestamp query parameter
      const timestamp = new Date().getTime()
      const photoURLWithTimestamp = userData.photoURL.includes("?")
        ? `${userData.photoURL}&_t=${timestamp}`
        : `${userData.photoURL}?_t=${timestamp}`

      // Create a new Image to preload
      const img = new Image()
      img.src = photoURLWithTimestamp
      img.onload = () => {
        if (isMounted.current) {
          // Only update state if component is still mounted
          setPhotoPreview(null) // Clear any existing preview
        }
      }
    }
  }, [userData?.photoURL, photoPreview])

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Profile image must be less than 5MB")
        return
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("File must be an image")
        return
      }

      setPhotoFile(file)
      setError("")

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpdatePhoto = async () => {
    if (!photoFile) return

    setError("")
    setMessage("")
    setIsPhotoLoading(true)
    setUploadProgress(0)

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + Math.random() * 15
        return newProgress >= 90 ? 90 : newProgress
      })
    }, 300)

    try {
      // Check file size before uploading
      if (photoFile.size > 2 * 1024 * 1024) {
        // 2MB limit
        clearInterval(progressInterval)
        setUploadProgress(0)
        setError("Image size should be less than 2MB. Please choose a smaller image.")
        setIsPhotoLoading(false)
        return
      }

      await updateUserProfileData(undefined, photoFile)

      // Complete the progress bar
      clearInterval(progressInterval)
      setUploadProgress(100)

      setMessage("Profile photo updated successfully")
      setPhotoFile(null)
      setPhotoPreview(null)

      // Refresh user data to get the updated photo URL
      await refreshUserData()
    } catch (error) {
      clearInterval(progressInterval)
      setUploadProgress(0)
      setError(error.message || "Failed to update profile photo")
      console.error("Photo upload error:", error)
    } finally {
      // Small delay to ensure UI updates properly
      setTimeout(() => {
        if (isMounted.current) {
          setIsPhotoLoading(false)
        }
      }, 500)
    }
  }

  const cancelPhotoUpdate = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    setError("")

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setIsLoading(true)

    try {
      await updateUserProfileData(displayName)
      setMessage("Profile updated successfully")
    } catch (error) {
      setError(error.message || "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForceRefresh = async () => {
    setIsPhotoLoading(true)
    try {
      await refreshUserData()
      // Force browser to reload the image by adding a timestamp
      if (userData?.photoURL) {
        const timestamp = new Date().getTime()
        const img = new Image()
        img.src = `${userData.photoURL}?_t=${timestamp}`
        img.onload = () => {
          if (isMounted.current) {
            setIsPhotoLoading(false)
          }
        }
        img.onerror = () => {
          if (isMounted.current) {
            setIsPhotoLoading(false)
          }
        }
      } else {
        setIsPhotoLoading(false)
      }
    } catch (error) {
      console.error("Error refreshing user data:", error)
      setIsPhotoLoading(false)
    }
  }

  // Handle notification preferences update
  const handleNotificationChange = async (key, value) => {
    const updatedPrefs = { ...notificationPrefs, [key]: value }
    setNotificationPrefs(updatedPrefs)

    try {
      await updateNotificationPreferences(updatedPrefs)
      setMessage("Notification preferences updated")
    } catch (error) {
      setError("Failed to update notification preferences")
      console.error("Error updating notification preferences:", error)
    }
  }

  // Handle privacy settings update
  const handlePrivacyChange = async (key, value) => {
    const updatedSettings = { ...privacySettings, [key]: value }
    setPrivacySettings(updatedSettings)

    try {
      await updatePrivacySettings(updatedSettings)
      setMessage("Privacy settings updated")
    } catch (error) {
      setError("Failed to update privacy settings")
      console.error("Error updating privacy settings:", error)
    }
  }

  // Handle calendar sync settings update
  const handleCalendarSyncChange = async (key, value) => {
    const updatedSettings = { ...calendarSync, [key]: value }

    // If enabling sync, set last synced time
    if (key === "enabled" && value === true) {
      updatedSettings.lastSynced = new Date().toISOString()
    }

    setCalendarSync(updatedSettings)

    try {
      await updateCalendarSync(updatedSettings)
      setMessage("Calendar sync settings updated")
    } catch (error) {
      setError("Failed to update calendar sync settings")
      console.error("Error updating calendar sync settings:", error)
    }
  }

  // Handle Google Calendar connection
  const handleConnectGoogleCalendar = async () => {
    setIsLoading(true)
    try {
      // Simulate Google OAuth flow
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const updatedSettings = {
        ...calendarSync,
        enabled: true,
        lastSynced: new Date().toISOString(),
        provider: "google",
      }

      setCalendarSync(updatedSettings)
      await updateCalendarSync(updatedSettings)

      setMessage("Google Calendar connected successfully")
    } catch (error) {
      setError("Failed to connect Google Calendar")
      console.error("Error connecting Google Calendar:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle calendar disconnect
  const handleDisconnectCalendar = async () => {
    setIsLoading(true)
    try {
      const updatedSettings = {
        ...calendarSync,
        enabled: false,
        lastSynced: null,
        provider: null,
      }

      setCalendarSync(updatedSettings)
      await updateCalendarSync(updatedSettings)

      setMessage("Calendar disconnected successfully")
    } catch (error) {
      setError("Failed to disconnect calendar")
      console.error("Error disconnecting calendar:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || !currentUser || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-violet-50 to-white dark:from-violet-950 dark:to-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const userInitials = userData.displayName
    ? userData.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : userData.email?.charAt(0).toUpperCase() || "U"

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
          <User className="h-6 w-6 mr-2" />
          Profile
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

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-violet-100 dark:bg-violet-900 p-1 rounded-xl">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300"
            >
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="privacy"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300"
            >
              <Shield className="h-4 w-4 mr-2" />
              Privacy
            </TabsTrigger>
            <TabsTrigger
              value="calendar"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-violet-200 dark:border-violet-800 shadow-md dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-2xl text-violet-900 dark:text-violet-300">Your Profile</CardTitle>
                <CardDescription className="dark:text-gray-400">Update your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24 border-2 border-violet-200 dark:border-violet-700">
                        {isPhotoLoading ? (
                          <div className="h-full w-full flex items-center justify-center bg-violet-100 dark:bg-violet-800">
                            <LoadingSpinner />
                          </div>
                        ) : (
                          <>
                            <AvatarImage
                              src={photoPreview || userData.photoURL || ""}
                              alt={userData.displayName || "User"}
                              className="object-cover"
                            />
                            <AvatarFallback className="text-2xl bg-violet-100 text-violet-800 dark:bg-violet-800 dark:text-violet-200">
                              {userInitials}
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      <label
                        htmlFor="photo-upload"
                        className="absolute bottom-0 right-0 p-1 bg-violet-600 dark:bg-violet-500 rounded-full cursor-pointer hover:bg-violet-700 dark:hover:bg-violet-600 transition-colors"
                      >
                        <Camera className="h-4 w-4 text-white" />
                        <span className="sr-only">Upload photo</span>
                      </label>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                        ref={fileInputRef}
                      />

                      {!photoFile && userData.photoURL && (
                        <button
                          onClick={handleForceRefresh}
                          className="absolute top-0 right-0 p-1 bg-violet-600 dark:bg-violet-500 rounded-full cursor-pointer hover:bg-violet-700 dark:hover:bg-violet-600 transition-colors"
                          title="Refresh photo"
                        >
                          <RefreshCw className="h-4 w-4 text-white" />
                        </button>
                      )}
                    </div>

                    {photoFile && (
                      <div className="w-full max-w-xs space-y-2">
                        {isPhotoLoading && (
                          <Progress value={uploadProgress} className="h-2 w-full bg-violet-100 dark:bg-violet-800" />
                        )}

                        <div className="flex gap-2">
                          <Button
                            onClick={handleUpdatePhoto}
                            variant="default"
                            size="sm"
                            disabled={isPhotoLoading}
                            className="flex-1"
                          >
                            {isPhotoLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              "Update Photo"
                            )}
                          </Button>

                          <Button
                            onClick={cancelPhotoUpdate}
                            variant="outline"
                            size="sm"
                            disabled={isPhotoLoading}
                            className="border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-900 dark:hover:text-red-300 bg-transparent"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <p className="text-sm text-gray-500 dark:text-gray-400">{userData.email}</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName" className="text-violet-800 dark:text-violet-300">
                        Display Name
                      </Label>
                      <Input
                        id="displayName"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="border-violet-200 dark:border-violet-700 focus:border-violet-400 focus:ring-violet-400 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 dark:from-violet-500 dark:to-fuchsia-400"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Profile"
                      )}
                    </Button>
                  </form>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Want to change your password?{" "}
                  <Link
                    href="/settings"
                    className="text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300 font-medium"
                  >
                    Go to Settings
                  </Link>
                </p>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-violet-200 dark:border-violet-800 shadow-md dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-2xl text-violet-900 dark:text-violet-300">
                  Notification Preferences
                </CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Manage how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base text-violet-800 dark:text-violet-300">Email Notifications</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notificationPrefs.email}
                      onCheckedChange={(checked) => handleNotificationChange("email", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base text-violet-800 dark:text-violet-300">Push Notifications</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive push notifications in your browser
                      </p>
                    </div>
                    <Switch
                      checked={notificationPrefs.push}
                      onCheckedChange={(checked) => handleNotificationChange("push", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base text-violet-800 dark:text-violet-300">Task Reminders</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive reminders for upcoming tasks and habits
                      </p>
                    </div>
                    <Switch
                      checked={notificationPrefs.reminders}
                      onCheckedChange={(checked) => handleNotificationChange("reminders", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base text-violet-800 dark:text-violet-300">Marketing Updates</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive updates about new features and promotions
                      </p>
                    </div>
                    <Switch
                      checked={notificationPrefs.marketing}
                      onCheckedChange={(checked) => handleNotificationChange("marketing", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card className="border-violet-200 dark:border-violet-800 shadow-md dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-2xl text-violet-900 dark:text-violet-300">Privacy Settings</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Control your data and privacy preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-base text-violet-800 dark:text-violet-300">Profile Visibility</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button
                        variant={privacySettings.profileVisibility === "public" ? "default" : "outline"}
                        className={
                          privacySettings.profileVisibility === "public" ? "bg-violet-600 hover:bg-violet-700" : ""
                        }
                        onClick={() => handlePrivacyChange("profileVisibility", "public")}
                      >
                        Public
                      </Button>
                      <Button
                        variant={privacySettings.profileVisibility === "friends" ? "default" : "outline"}
                        className={
                          privacySettings.profileVisibility === "friends" ? "bg-violet-600 hover:bg-violet-700" : ""
                        }
                        onClick={() => handlePrivacyChange("profileVisibility", "friends")}
                      >
                        Friends Only
                      </Button>
                      <Button
                        variant={privacySettings.profileVisibility === "private" ? "default" : "outline"}
                        className={
                          privacySettings.profileVisibility === "private" ? "bg-violet-600 hover:bg-violet-700" : ""
                        }
                        onClick={() => handlePrivacyChange("profileVisibility", "private")}
                      >
                        Private
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base text-violet-800 dark:text-violet-300">Activity Sharing</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Allow sharing of your activity with friends
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.shareActivity}
                      onCheckedChange={(checked) => handlePrivacyChange("shareActivity", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base text-violet-800 dark:text-violet-300">Data Collection</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Allow anonymous usage data collection to improve the app
                      </p>
                    </div>
                    <Switch
                      checked={privacySettings.dataCollection}
                      onCheckedChange={(checked) => handlePrivacyChange("dataCollection", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar">
            <Card className="border-violet-200 dark:border-violet-800 shadow-md dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-2xl text-violet-900 dark:text-violet-300">Calendar Integration</CardTitle>
                <CardDescription className="dark:text-gray-400">
                  Sync your tasks and habits with your calendar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {calendarSync.enabled ? (
                    <>
                      <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                          <p className="text-green-800 dark:text-green-300 font-medium">
                            Calendar connected: Google Calendar
                          </p>
                        </div>
                        {calendarSync.lastSynced && (
                          <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                            Last synced: {new Date(calendarSync.lastSynced).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base text-violet-800 dark:text-violet-300">Sync Tasks</Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Add your tasks to your calendar</p>
                          </div>
                          <Switch
                            checked={calendarSync.syncTodos}
                            onCheckedChange={(checked) => handleCalendarSyncChange("syncTodos", checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-base text-violet-800 dark:text-violet-300">Sync Habits</Label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Add your habits to your calendar</p>
                          </div>
                          <Switch
                            checked={calendarSync.syncHabits}
                            onCheckedChange={(checked) => handleCalendarSyncChange("syncHabits", checked)}
                          />
                        </div>
                      </div>

                      <div className="pt-4">
                        <Button
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-300 bg-transparent"
                          onClick={handleDisconnectCalendar}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Disconnect Calendar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center py-8 space-y-4">
                      <Calendar className="h-16 w-16 text-violet-400 dark:text-violet-500" />
                      <div className="text-center">
                        <h3 className="text-lg font-medium text-violet-800 dark:text-violet-300">
                          Connect your calendar
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mt-1">
                          Sync your tasks and habits with your calendar to stay organized across all your devices.
                        </p>
                      </div>
                      <Button
                        className="bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 dark:from-violet-500 dark:to-fuchsia-400"
                        onClick={handleConnectGoogleCalendar}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                              <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                              />
                              <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                              />
                              <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                              />
                              <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                              />
                            </svg>
                            Connect Google Calendar
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
