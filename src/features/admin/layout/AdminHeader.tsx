"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, ChevronDown, ExternalLink, LogOut, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { ROLE_LABELS } from "@/lib/permissions"
import NotificationBell from "@/features/notifications/NotificationBell"

const pageTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/content": "Content Management",
  "/admin/media": "Media Library",
  "/admin/ai": "AI Studio",
  "/admin/ai-studio": "AI Studio",
  "/admin/ai/templates": "AI Templates",
  "/admin/ai/usage": "AI Usage",
  "/admin/appointments": "Appointments",
  "/admin/orders": "Orders",
  "/admin/contacts": "Contacts",
  "/admin/notifications": "Notifications",
  "/admin/users": "Users",
  "/admin/roles": "Roles & Permissions",
  "/admin/analytics": "Analytics",
  "/admin/settings": "Settings",
  "/admin/profile": "My Profile",
}

interface AdminHeaderProps {
  onMobileMenuToggle: () => void
  userId: string
  userName: string
  userRole: string
  onSignOut: () => void
}

export default function AdminHeader({ onMobileMenuToggle, userId, userName, userRole, onSignOut }: AdminHeaderProps) {
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const title =
    pageTitles[pathname] ||
    (pathname.startsWith("/admin/content") ? "Content Management" : "Admin")

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD"

  const role = userRole ? ROLE_LABELS[userRole] || userRole : "Administrator"

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          <span>View Site</span>
        </Link>

        <NotificationBell userId={userId} />

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 text-xs font-semibold">{initials}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 leading-tight">{userName || "Admin"}</p>
              <p className="text-xs text-gray-500 leading-tight">{role}</p>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-gray-400 hidden sm:block transition-transform",
                dropdownOpen && "rotate-180"
              )}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <Link
                href="/admin/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
              <Link
                href="/"
                target="_blank"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 sm:hidden"
              >
                <ExternalLink className="h-4 w-4" />
                View Site
              </Link>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={() => {
                  setDropdownOpen(false)
                  onSignOut()
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
