"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Home, LogOut, Menu, Plus, Share2, Upload, X, RefreshCw } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
// import DocumentsList from "@/app/documents/renewal/page"

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isLoggedIn, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Use useEffect to check if component is mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close mobile menu when path changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Close mobile menu when screen size increases
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("sidebar")
      const menuButton = document.getElementById("menu-button")

      if (
        isMobileMenuOpen &&
        sidebar &&
        menuButton &&
        !sidebar.contains(event.target as Node) &&
        !menuButton.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isMobileMenuOpen])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isMobileMenuOpen])

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true
    if (path !== "/" && pathname.startsWith(path)) return true
    return false
  }

  const handleLogout = () => {
    logout()
  }

  // Updated menuItems array with corrected renewal button path
  const menuItems = [
    { name: "Dashboard", path: "/", icon: Home },
    { name: "Add Document", path: "/documents/add", icon: Plus },
    { name: "All Documents", path: "/documents", icon: FileText },
    { name: "Renewal", path: "/documents/renewal", icon: RefreshCw },
    { name: "Shared", path: "/shared", icon: Share2 },
  ]

  // Don't show sidebar on login page
  if (pathname === "/login") {
    return null
  }

  // Don't render anything until mounted to avoid hydration issues
  if (!mounted || !isLoggedIn) {
    return (
      <div className="md:hidden fixed top-4 left-4 z-50" id="menu-button">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/login")}
          className="bg-emerald-800 text-white hover:bg-emerald-700 p-2 h-10 w-10 rounded-full shadow-lg"
          aria-label="Login"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Mobile menu button - always show when not on login page */}
      <div className="md:hidden fixed top-4 left-4 z-50" id="menu-button">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-emerald-800 text-white hover:bg-emerald-700 p-2 h-10 w-10 rounded-full shadow-lg"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ease-in-out"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`fixed md:sticky top-0 left-0 z-40 w-[85%] xs:w-[280px] md:w-64 bg-emerald-800 text-white h-screen flex flex-col transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } overflow-y-auto`}
      >
        <div className="p-4 border-b border-emerald-700 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center">
            <FileText className="mr-2 flex-shrink-0" />
            <span className="truncate">Document Manager</span>
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-white hover:bg-emerald-700 p-1 h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div  className="flex-1 p-4 overflow-y-auto">
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center p-3 rounded-lg transition-colors ${
                  isActive(item.path) ? "bg-emerald-700 text-white" : "text-emerald-100 hover:bg-emerald-700/70"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-emerald-700">
          <div className="flex flex-col gap-3">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-500 h-12" asChild>
              <Link href="/documents/add" onClick={() => setIsMobileMenuOpen(false)}>
                <Upload className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">Upload New</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full border-red-500 text-red-100 hover:bg-red-700 hover:text-white h-10"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">Logout</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}