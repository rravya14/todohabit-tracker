import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"

// Create a new user document in Firestore
export async function createUserDocument(uid, email, displayName = null, photoURL = null) {
  try {
    const userRef = doc(db, "users", uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      const userData = {
        uid,
        email,
        displayName,
        photoURL,
        todos: [],
        habits: [],
        settings: {
          theme: "system",
        },
        notificationPreferences: {
          email: true,
          push: true,
          reminders: true,
          marketing: false,
        },
        privacySettings: {
          profileVisibility: "public",
          shareActivity: true,
          dataCollection: true,
        },
        calendarSync: {
          enabled: false,
          lastSynced: null,
          syncTodos: true,
          syncHabits: true,
        },
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      }

      await setDoc(userRef, userData)
      return userData
    }

    // Update lastLogin if user already exists
    await updateDoc(userRef, {
      lastLogin: new Date().toISOString(),
    })

    return userSnap.data()
  } catch (error) {
    console.error("Error creating user document:", error)
    throw error
  }
}

// Get user data from Firestore
export async function getUserData(uid) {
  try {
    const userRef = doc(db, "users", uid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      return userSnap.data()
    }
    return null
  } catch (error) {
    console.error("Error getting user data:", error)
    // Rethrow with specific code for permission errors
    if (error.code === "permission-denied" || error.message.includes("Missing or insufficient permissions")) {
      const permissionError = new Error("Missing or insufficient permissions")
      permissionError.code = "permission-denied"
      throw permissionError
    }
    throw error
  }
}

// Update user todos in Firestore
export async function updateUserTodos(uid, todos) {
  try {
    const userRef = doc(db, "users", uid)
    await updateDoc(userRef, { todos })
  } catch (error) {
    console.error("Error updating todos:", error)
    // Save to localStorage as fallback
    localStorage.setItem(`todos_${uid}`, JSON.stringify(todos))
    throw error
  }
}

// Update user habits in Firestore
export async function updateUserHabits(uid, habits) {
  try {
    const userRef = doc(db, "users", uid)
    await updateDoc(userRef, { habits })
  } catch (error) {
    console.error("Error updating habits:", error)
    // Save to localStorage as fallback
    localStorage.setItem(`habits_${uid}`, JSON.stringify(habits))
    throw error
  }
}

// Update user settings in Firestore
export async function updateUserSettings(uid, settings) {
  try {
    const userRef = doc(db, "users", uid)
    await updateDoc(userRef, { settings })
  } catch (error) {
    console.error("Error updating settings:", error)
    // Save to localStorage as fallback
    localStorage.setItem("theme", settings.theme)
    throw error
  }
}

// Update user profile in Firestore
export async function updateUserProfile(uid, data) {
  try {
    const userRef = doc(db, "users", uid)
    await updateDoc(userRef, data)
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}
