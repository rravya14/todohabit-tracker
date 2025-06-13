"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth"
import { auth, storage } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { createUserDocument, getUserData, updateUserProfile } from "@/lib/firestore"
import type { UserData } from "@/lib/firestore"

interface AuthContextType {
  currentUser: User | null
  userData: UserData | null
  loading: boolean
  firestoreError: string | null
  signup: (email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  googleSignIn: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserProfileData: (displayName?: string, photoFile?: File) => Promise<void>
  updateUserEmail: (email: string, password: string) => Promise<void>
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>
  reAuthenticate: (password: string) => Promise<boolean>
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [firestoreError, setFirestoreError] = useState<string | null>(null)
  const router = useRouter()

  // Fetch user data from Firestore
  const fetchUserData = async (user: User) => {
    try {
      setFirestoreError(null)
      let data = await getUserData(user.uid)

      // If user document doesn't exist, create it
      if (!data) {
        data = await createUserDocument(user.uid, user.email, user.displayName, user.photoURL)
      }

      setUserData(data)
    } catch (error: any) {
      console.error("Error fetching user data:", error)

      // Handle Firestore permission errors
      if (error.code === "permission-denied") {
        setFirestoreError("Firestore permission denied. Please check your security rules.")
      } else {
        setFirestoreError("Error loading user data. Please try again later.")
      }

      // Create a fallback user data object using localStorage
      const fallbackData = createFallbackUserData(user)
      setUserData(fallbackData)
    }
  }

  // Create fallback user data from localStorage if Firestore fails
  const createFallbackUserData = (user: User): UserData => {
    // Try to get data from localStorage
    const todosKey = `todos_${user.uid}`
    const habitsKey = `habits_${user.uid}`
    const themeKey = "theme"

    let todos = []
    let habits = []
    let theme: "light" | "dark" | "system" = "system"

    try {
      const savedTodos = localStorage.getItem(todosKey)
      if (savedTodos) {
        todos = JSON.parse(savedTodos)
      }

      const savedHabits = localStorage.getItem(habitsKey)
      if (savedHabits) {
        habits = JSON.parse(savedHabits)
      }

      const savedTheme = localStorage.getItem(themeKey) as "light" | "dark" | "system" | null
      if (savedTheme) {
        theme = savedTheme
      }
    } catch (e) {
      console.error("Error reading from localStorage:", e)
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      todos,
      habits,
      settings: {
        theme,
      },
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    }
  }

  // Refresh user data from Firestore
  const refreshUserData = async () => {
    if (currentUser) {
      await fetchUserData(currentUser)
    }
  }

  async function signup(email: string, password: string) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)

      // Create user document in Firestore
      try {
        await createUserDocument(result.user.uid, result.user.email)
      } catch (error) {
        console.error("Error creating user document:", error)
        // Create fallback user data in localStorage
        const fallbackData = createFallbackUserData(result.user)
        setUserData(fallbackData)
      }

      router.push("/")
    } catch (error) {
      throw error
    }
  }

  async function login(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/")
    } catch (error) {
      throw error
    }
  }

  async function logout() {
    try {
      await signOut(auth)
      setUserData(null)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  async function googleSignIn() {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)

      // Create or update user document in Firestore
      try {
        await createUserDocument(result.user.uid, result.user.email, result.user.displayName, result.user.photoURL)
      } catch (error) {
        console.error("Error creating user document:", error)
        // Create fallback user data in localStorage
        const fallbackData = createFallbackUserData(result.user)
        setUserData(fallbackData)
      }

      router.push("/")
    } catch (error) {
      throw error
    }
  }

  function resetPassword(email: string) {
    return sendPasswordResetEmail(auth, email)
  }

  async function updateUserProfileData(displayName?: string, photoFile?: File) {
    if (!currentUser) throw new Error("No user logged in")

    let photoURL = currentUser.photoURL
    const oldPhotoURL = currentUser.photoURL

    try {
      if (photoFile) {
        // Delete old profile image if it exists and is from our storage
        if (oldPhotoURL && oldPhotoURL.includes(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "")) {
          try {
            // Extract the path from the URL
            const oldPhotoPath = oldPhotoURL.split(".com/o/")[1].split("?")[0]
            const decodedPath = decodeURIComponent(oldPhotoPath)
            const oldFileRef = ref(storage, decodedPath)
            await deleteObject(oldFileRef)
          } catch (error) {
            console.error("Error deleting old profile image:", error)
            // Continue even if deletion fails
          }
        }

        // Upload new profile image
        const timestamp = new Date().getTime()
        const fileRef = ref(storage, `profile-images/${currentUser.uid}/${timestamp}_${photoFile.name}`)
        await uploadBytes(fileRef, photoFile)
        photoURL = await getDownloadURL(fileRef)
      }

      // Update Firebase Auth profile
      await updateProfile(currentUser, {
        displayName: displayName || currentUser.displayName,
        photoURL,
      })

      // Try to update Firestore user document
      try {
        await updateUserProfile(currentUser.uid, {
          displayName: displayName || currentUser.displayName,
          photoURL,
        })
      } catch (error) {
        console.error("Error updating Firestore profile:", error)
        // Update local userData state
        if (userData) {
          setUserData({
            ...userData,
            displayName: displayName || userData.displayName,
            photoURL,
          })
        }
      }

      // Refresh user data
      await refreshUserData()
    } catch (error) {
      console.error("Error updating profile:", error)
      throw error
    }
  }

  async function updateUserEmail(email: string, password: string) {
    if (!currentUser) throw new Error("No user logged in")

    try {
      // Re-authenticate user before changing email
      await reAuthenticate(password)

      // Update email in Firebase Auth
      await updateEmail(currentUser, email)

      // Try to update email in Firestore
      try {
        await updateUserProfile(currentUser.uid, { email })
      } catch (error) {
        console.error("Error updating email in Firestore:", error)
        // Update local userData state
        if (userData) {
          setUserData({
            ...userData,
            email,
          })
        }
      }

      // Refresh user data
      await refreshUserData()
    } catch (error) {
      throw error
    }
  }

  async function updateUserPassword(currentPassword: string, newPassword: string) {
    if (!currentUser) throw new Error("No user logged in")

    try {
      // Re-authenticate user before changing password
      await reAuthenticate(currentPassword)

      // Update password in Firebase Auth
      await updatePassword(currentUser, newPassword)
    } catch (error) {
      throw error
    }
  }

  async function reAuthenticate(password: string) {
    if (!currentUser || !currentUser.email) throw new Error("No user logged in or email missing")

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, password)
      await reauthenticateWithCredential(currentUser, credential)
      return true
    } catch (error) {
      console.error("Re-authentication failed:", error)
      return false
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)

      if (user) {
        await fetchUserData(user)
      } else {
        setUserData(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userData,
    loading,
    firestoreError,
    signup,
    login,
    logout,
    googleSignIn,
    resetPassword,
    updateUserProfileData,
    updateUserEmail,
    updateUserPassword,
    reAuthenticate,
    refreshUserData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
