"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Camera, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import LoadingSpinner from "@/components/loading-spinner"

export default function ProfilePage() {
  const { currentUser, userData, updateUserProfileData, loading, refreshUserData } = useAuth()
  const [displayName, setDisplayName] = useState("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPhotoLoading, setIsPhotoLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push("/login")
    } else if (currentUser && userData) {
      setDisplayName(userData.displayName || "")
    }
  }, [currentUser, userData, loading, router])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpdatePhoto = async () => {
    if (!photoFile) return

    setError("")
    setMessage("")
    setIsPhotoLoading(true)

    try {
      await updateUserProfileData(undefined, photoFile)
      setMessage("Profile photo updated successfully")
      setPhotoFile(null)
      // Refresh user data to get the updated photo URL
      await refreshUserData()
    } catch (error: any) {
      setError(error.message || "Failed to update profile photo")
    } finally {
      setIsPhotoLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setIsLoading(true)

    try {
      await updateUserProfileData(displayName)
      setMessage("Profile updated successfully")
    } catch (error: any) {
      setError(error.message || "Failed to update profile")
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

        <Card className="border-violet-200 dark:border-violet-800 shadow-md dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl text-violet-900 dark:text-violet-300">Your Profile</CardTitle>
            <CardDescription className="dark:text-gray-400">Update your personal information</CardDescription>
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
                  />
                </div>

                {photoFile && (
                  <Button
                    onClick={handleUpdatePhoto}
                    variant="outline"
                    size="sm"
                    disabled={isPhotoLoading}
                    className="mt-2"
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
      </div>
    </div>
  )
}
