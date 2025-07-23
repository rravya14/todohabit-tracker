"use client"

import { createContext, useContext, useEffect, useState } from "react"
import {
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
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { createUserDocument, getUserData, updateUserProfile } from "@/lib/firestore"

const AuthContext = createContext(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [firestoreError, setFirestoreError] = useState(null)
  const router = useRouter()

  // Fetch user data from Firestore
  const fetchUserData = async (user) => {
    try {
      setFirestoreError(null)
      let data = await getUserData(user.uid)

      // If user document doesn't exist, create it
      if (!data) {
        data = await createUserDocument(user.uid, user.email, user.displayName, user.photoURL)
      }

      setUserData(data)
    } catch (error) {
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
  const createFallbackUserData = (user) => {
    // Try to get data from localStorage
    const todosKey = `todos_${user.uid}`
    const habitsKey = `habits_${user.uid}`
    const themeKey = "theme"
    const notificationsKey = `notifications_${user.uid}`
    const privacyKey = `privacy_${user.uid}`
    const calendarSyncKey = `calendar_sync_${user.uid}`

    let todos = []
    let habits = []
    let theme = "system"
    let notificationPreferences = {
      email: true,
      push: true,
      reminders: true,
      marketing: false,
    }
    let privacySettings = {
      profileVisibility: "public",
      shareActivity: true,
      dataCollection: true,
    }
    let calendarSync = {
      enabled: false,
      lastSynced: null,
      syncTodos: true,
      syncHabits: true,
    }

    try {
      const savedTodos = localStorage.getItem(todosKey)
      if (savedTodos) {
        todos = JSON.parse(savedTodos)
      }

      const savedHabits = localStorage.getItem(habitsKey)
      if (savedHabits) {
        habits = JSON.parse(savedHabits)
      }

      const savedTheme = localStorage.getItem(themeKey)
      if (savedTheme) {
        theme = savedTheme
      }

      const savedNotifications = localStorage.getItem(notificationsKey)
      if (savedNotifications) {
        notificationPreferences = JSON.parse(savedNotifications)
      }

      const savedPrivacy = localStorage.getItem(privacyKey)
      if (savedPrivacy) {
        privacySettings = JSON.parse(savedPrivacy)
      }

      const savedCalendarSync = localStorage.getItem(calendarSyncKey)
      if (savedCalendarSync) {
        calendarSync = JSON.parse(savedCalendarSync)
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
      notificationPreferences,
      privacySettings,
      calendarSync,
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

  async function signup(email, password) {
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

  async function login(email, password) {
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

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email)
  }

  async function updateUserProfileData(displayName, photoFile) {
    if (!currentUser) throw new Error("No user logged in")

    let photoURL = currentUser.photoURL
    const oldPhotoURL = currentUser.photoURL

    try {
      if (photoFile) {
        console.log("Starting profile photo update process")

        try {
          // Instead of trying to upload to Firebase Storage directly,
          // we'll use a fallback approach that works without storage permissions

          // Convert the image to a data URL that can be stored in Firestore
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(photoFile)
          })

          // Use the data URL as the photo URL
          photoURL = dataUrl

          console.log("Photo converted to data URL successfully")
        } catch (uploadError) {
          console.error("Error during photo processing:", uploadError)
          throw new Error("Failed to process profile photo. Please try again.")
        }
      }

      // Update Firebase Auth profile
      console.log("Updating auth profile")
      await updateProfile(currentUser, {
        displayName: displayName || currentUser.displayName,
        photoURL,
      }).catch((error) => {
        console.error("Error updating auth profile:", error)
        throw new Error("Failed to update authentication profile")
      })

      console.log("Auth profile updated successfully")

      // Try to update Firestore user document
      try {
        console.log("Updating Firestore profile")
        await updateUserProfile(currentUser.uid, {
          displayName: displayName || currentUser.displayName,
          photoURL,
        })
        console.log("Firestore profile updated successfully")
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

  async function updateUserEmail(email, password) {
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

  async function updateUserPassword(currentPassword, newPassword) {
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

  async function reAuthenticate(password) {
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

  // Update notification preferences
  async function updateNotificationPreferences(preferences) {
    if (!currentUser) throw new Error("No user logged in")

    try {
      // Try to update in Firestore
      try {
        await updateUserProfile(currentUser.uid, { notificationPreferences: preferences })
      } catch (error) {
        console.error("Error updating notification preferences in Firestore:", error)
        // Save to localStorage as fallback
        localStorage.setItem(`notifications_${currentUser.uid}`, JSON.stringify(preferences))
      }

      // Update local state
      if (userData) {
        setUserData({
          ...userData,
          notificationPreferences: preferences,
        })
      }
    } catch (error) {
      console.error("Error updating notification preferences:", error)
      throw error
    }
  }

  // Update privacy settings
  async function updatePrivacySettings(settings) {
    if (!currentUser) throw new Error("No user logged in")

    try {
      // Try to update in Firestore
      try {
        await updateUserProfile(currentUser.uid, { privacySettings: settings })
      } catch (error) {
        console.error("Error updating privacy settings in Firestore:", error)
        // Save to localStorage as fallback
        localStorage.setItem(`privacy_${currentUser.uid}`, JSON.stringify(settings))
      }

      // Update local state
      if (userData) {
        setUserData({
          ...userData,
          privacySettings: settings,
        })
      }
    } catch (error) {
      console.error("Error updating privacy settings:", error)
      throw error
    }
  }

  // Update calendar sync settings
  async function updateCalendarSync(syncSettings) {
    if (!currentUser) throw new Error("No user logged in")

    try {
      // Try to update in Firestore
      try {
        await updateUserProfile(currentUser.uid, { calendarSync: syncSettings })
      } catch (error) {
        console.error("Error updating calendar sync settings in Firestore:", error)
        // Save to localStorage as fallback
        localStorage.setItem(`calendar_sync_${currentUser.uid}`, JSON.stringify(syncSettings))
      }

      // Update local state
      if (userData) {
        setUserData({
          ...userData,
          calendarSync: syncSettings,
        })
      }
    } catch (error) {
      console.error("Error updating calendar sync settings:", error)
      throw error
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
    updateNotificationPreferences,
    updatePrivacySettings,
    updateCalendarSync,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
