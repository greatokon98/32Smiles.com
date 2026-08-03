"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SessionProvider, useSession, signOut } from "next-auth/react"
import NotificationBell from "@/features/notifications/NotificationBell"
import {
  LayoutDashboard,
  Calendar,
  ShoppingBag,
  User,
  Menu,
  X,
  LogOut,
  ChevronRight,
  FolderOpen,
  Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"

const sidebarLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/appointments", label: "My Appointments", icon: Calendar },
  { href: "/dashboard/orders", label: "My Orders", icon: ShoppingBag },
  { href: "/dashboard/files", label: "My Files", icon: FolderOpen },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/profile", label: "Edit Profile", icon: User },
]

function DashboardSidebar({ mobileOpen, onMobileClose }: { mobileOpen: boolean; onMobileClose: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onMobileClose} />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 shrink-0">
          <Link href="/dashboard" className="text-lg font-bold text-primary-600">
            32Smiles
          </Link>
          <button
            onClick={onMobileClose}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-4 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900 truncate">
            {session?.user?.name || "Patient"}
          </p>
          <p className="text-xs text-gray-500">Patient Dashboard</p>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  if (window.innerWidth < 1024) onMobileClose()
                }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <link.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary-600" : "text-gray-400")} />
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-gray-200 p-3">
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <NotificationBell />
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            Back to Site <ChevronRight className="h-3 w-3" />
          </Link>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </SessionProvider>
  )
}
