"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface FirestoreErrorBannerProps {
  error: string
}

export default function FirestoreErrorBanner({ error }: FirestoreErrorBannerProps) {
  const [showRules, setShowRules] = useState(false)

  return (
    <Alert variant="destructive" className="mb-6 dark:bg-red-900 dark:border-red-800 dark:text-white">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Firestore Error</AlertTitle>
      <AlertDescription className="space-y-4">
        <p>{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowRules(!showRules)}
          className="dark:border-red-700 dark:text-white"
        >
          {showRules ? "Hide Security Rules" : "Show Required Security Rules"}
        </Button>

        {showRules && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md overflow-auto">
            <pre className="text-xs whitespace-pre-wrap">
              {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}`}
            </pre>
            <p className="mt-4 text-sm">
              Copy these rules to your Firebase Console:
              <br />
              Firestore Database → Rules tab → Replace the rules → Publish
            </p>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
