import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import type { TodoType, HabitType, UserSettings } from "@/lib/types"

// User data structure in Firestore
export interface UserData {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  todos: TodoType[]
  habits: HabitType[]
  settings: UserSettings
  createdAt: string
  lastLogin: string
}

// Create a new user document in Firestore
export async function createUserDocument(
  uid: string,
  email: string | null,
  displayName: string | null = null,
  photoURL: string | null = null,
) {
  try {
    const userRef = doc(db, "users", uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      const userData: UserData = {
        uid,
        email,
        displayName,
        photoURL,
        todos: [],
        habits: [],
        settings: {
          theme: "system",
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

    return userSnap.data() as UserData
  } catch (error: any) {
    console.error("Error creating user document:", error)
    throw error
  }
}

// Get user data from Firestore
export async function getUserData(uid: string): Promise<UserData | null> {
  try {
    const userRef = doc(db, "users", uid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      return userSnap.data() as UserData
    }
    return null
  } catch (error: any) {
    console.error("Error getting user data:", error)
    // Rethrow with specific code for permission errors
    if (error.code === "permission-denied" || error.message.includes("Missing or insufficient permissions")) {
      const permissionError = new Error("Missing or insufficient permissions")
      ;(permissionError as any).code = "permission-denied"
      throw permissionError
    }
    throw error
  }
}

// Update user todos in Firestore
export async function updateUserTodos(uid: string, todos: TodoType[]) {
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
export async function updateUserHabits(uid: string, habits: HabitType[]) {
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
export async function updateUserSettings(uid: string, settings: UserSettings) {
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
export async function updateUserProfile(uid: string, data: Partial<UserData>) {
  try {
    const userRef = doc(db, "users", uid)
    await updateDoc(userRef, data)
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}
