"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

export function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"

    // If not logged in and not on login page, redirect to login
    if (!isLoggedIn && pathname !== "/login") {
      router.push("/login")
    } else if (isLoggedIn && pathname === "/login") {
      // If logged in and on login page, redirect to dashboard
      router.push("/")
    }

    setIsLoading(false)
  }, [pathname, router])

  // Show nothing while checking auth
  if (isLoading) {
    return null
  }

  return <>{children}</>
}
