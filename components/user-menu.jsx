"use client"

import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, User, Settings } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function UserMenu() {
  const { currentUser, userData, logout } = useAuth()
  const [imageKey, setImageKey] = useState(Date.now())

  // Refresh the image when userData changes
  useEffect(() => {
    if (userData?.photoURL) {
      setImageKey(Date.now())
    }
  }, [userData?.photoURL])

  if (!currentUser || !userData) {
    return null
  }

  const userInitials = userData.displayName
    ? userData.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : userData.email?.charAt(0).toUpperCase() || "U"

  // Ensure the photo URL has a cache-busting parameter or works with data URLs
  const photoURL = userData.photoURL
    ? userData.photoURL.startsWith("data:")
      ? userData.photoURL // Don't modify data URLs
      : userData.photoURL.includes("?")
        ? `${userData.photoURL}&_t=${imageKey}`
        : `${userData.photoURL}?_t=${imageKey}`
    : ""

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-violet-200 dark:border-violet-700">
            <AvatarImage
              src={photoURL || "/placeholder.svg"}
              alt={userData.displayName || "User"}
              className="object-cover"
            />
            <AvatarFallback className="bg-violet-100 text-violet-800 dark:bg-violet-800 dark:text-violet-200">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 dark:bg-gray-800 dark:border-gray-700" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none dark:text-white">{userData.displayName || "User"}</p>
            <p className="text-xs leading-none text-gray-500 dark:text-gray-400">{userData.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="dark:border-gray-700" />
        <Link href="/profile">
          <DropdownMenuItem className="cursor-pointer dark:text-gray-200 dark:focus:bg-violet-900 dark:hover:bg-violet-900/50">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/settings">
          <DropdownMenuItem className="cursor-pointer dark:text-gray-200 dark:focus:bg-violet-900 dark:hover:bg-violet-900/50">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator className="dark:border-gray-700" />
        <DropdownMenuItem
          className="cursor-pointer text-red-600 dark:text-red-400 dark:focus:bg-red-900 dark:focus:text-red-200 dark:hover:bg-red-900/50"
          onClick={() => logout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
