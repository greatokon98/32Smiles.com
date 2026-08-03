"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  LayoutDashboard,
  FileText,
  Image,
  Sparkles,
  Settings,
  BarChart3,
  Calendar,
  ShoppingCart,
  MessageSquare,
  MessagesSquare,
  Bell,
  Users,
  Shield,
  Key,
  Activity,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/config/site"
import type { Resource, Action, Permission } from "@/lib/permissions"
import { buildNavItems, ROLE_LABELS } from "@/lib/permissions"

interface NavItem {
  label: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  type: "link" | "group"
  children?: NavItem[]
  resource?: Resource
  action?: Action
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, type: "link", resource: "dashboard" },

  { label: "Content", icon: FileText, href: "/admin/content", type: "link", resource: "content" },

  { label: "Media Library", href: "/admin/media", icon: Image, type: "link", resource: "media" },
  { label: "AI Studio", href: "/admin/ai-studio", icon: Sparkles, type: "link", resource: "ai-studio" },
  { label: "AI Settings", href: "/admin/ai", icon: Settings, type: "link", resource: "ai-settings" },
  { label: "AI Templates", href: "/admin/ai/templates", icon: FileText, type: "link", resource: "ai-templates" },
  { label: "AI Usage", href: "/admin/ai/usage", icon: BarChart3, type: "link", resource: "ai-usage" },

  { label: "Appointments", href: "/admin/appointments", icon: Calendar, type: "link", resource: "appointments" },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart, type: "link", resource: "orders" },
  { label: "Contacts", href: "/admin/contacts", icon: MessageSquare, type: "link", resource: "contacts" },
  { label: "Notifications", href: "/admin/notifications", icon: Bell, type: "link", resource: "notifications" },
  { label: "Communication", href: "/admin/communication", icon: MessagesSquare, type: "link", resource: "communication" },

  {
    label: "Users", icon: Users, type: "group", resource: "users",
    children: [
      { label: "All Users", href: "/admin/users", icon: Users, type: "link", resource: "users" },
      { label: "Create User", href: "/admin/users/create", icon: Users, type: "link", resource: "users", action: "create" },
      { label: "Invite User", href: "/admin/users/invite", icon: Users, type: "link", resource: "users", action: "invite" },
      { label: "Patient Accounts", href: "/admin/users/patients", icon: Users, type: "link", resource: "users" },
      { label: "User Activity", href: "/admin/users/activity", icon: Activity, type: "link", resource: "users" },
    ],
  },

  {
    label: "Roles & Permissions", icon: Shield, type: "group", resource: "roles",
    children: [
      { label: "Roles", href: "/admin/roles", icon: Shield, type: "link", resource: "roles" },
      { label: "Permission Matrix", href: "/admin/roles/permissions", icon: Key, type: "link", resource: "roles" },
      { label: "Create Role", href: "/admin/roles/create", icon: Shield, type: "link", resource: "roles", action: "create" },
      { label: "Assign Permissions", href: "/admin/roles/assign", icon: Key, type: "link", resource: "roles" },
    ],
  },

  {
    label: "API Manager", icon: Key, type: "group", resource: "api-manager",
    children: [
      { label: "AI Providers", href: "/admin/settings/api/ai", icon: Sparkles, type: "link", resource: "api-manager" },
    ],
  },

  { label: "Analytics", href: "/admin/analytics", icon: BarChart3, type: "link", resource: "analytics" },
  { label: "Audit Logs", href: "/admin/users/activity", icon: ClipboardList, type: "link", resource: "audit-logs" },

  {
    label: "Settings", icon: Settings, type: "group", resource: "settings",
    children: [
      { label: "General", href: "/admin/settings", icon: Settings, type: "link", resource: "settings" },
      { label: "Email Providers", href: "/admin/settings/email/providers", icon: Mail, type: "link", resource: "settings" },
      { label: "Authentication", href: "/admin/settings/auth", icon: Shield, type: "link", resource: "settings" },
      { label: "Environment Variables", href: "/admin/settings/env", icon: Key, type: "link", resource: "settings" },
    ],
  },
]

interface AdminSidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
  userName: string
  userRole: string
  userPermissions?: Permission[]
  onSignOut: () => void
}

export default function AdminSidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
  userName,
  userRole,
  userPermissions,
  onSignOut,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const { status: sessionStatus } = useSession()
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [activePopup, setActivePopup] = useState<string | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (sessionStatus !== "authenticated") return
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/admin/messages/unread")
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setUnreadMessages(data.unreadCount || 0)
        }
      } catch {
        // ignore
      }
    }
    load()
    const id = setInterval(load, 30000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [sessionStatus])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar-expanded-groups")
      if (saved) setExpandedGroups(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!activePopup) return
      const target = e.target as HTMLElement
      if (!target.closest("[data-popup-container]") && !target.closest("[data-sidebar-toggle]")) {
        setActivePopup(null)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [activePopup])

  useEffect(() => {
    const initial: Record<string, boolean> = {}
    navItems.forEach((item) => {
      if (item.type === "group") {
        const active = item.children?.some((child) =>
          child.href && pathname.startsWith(child.href)
        )
        if (active) initial[item.label] = true
      }
    })
    if (Object.keys(initial).length > 0) {
      setExpandedGroups((prev) => ({ ...prev, ...initial }))
    }
  }, [pathname])

  const toggleGroup = useCallback((label: string) => {
    setExpandedGroups((prev) => {
      const next = { ...prev, [label]: !prev[label] }
      try { localStorage.setItem("sidebar-expanded-groups", JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const permittedNavItems = useMemo(() => {
    if (!userRole) return []
    return buildNavItems(navItems, userRole, userPermissions)
  }, [userRole, userPermissions])

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") return pathname === "/admin/dashboard"
    return pathname.startsWith(href)
  }

  const renderNavItem = (item: NavItem, depth = 0) => {
    if (item.type === "link" && item.href) {
      const active = isActive(item.href)
      return (
        <Link
          key={item.href}
          href={item.href}
          title={collapsed ? item.label : undefined}
          onClick={() => {
            if (window.innerWidth < 1024) onMobileClose()
          }}
          className={cn(
            "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors relative",
            collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
            depth > 0 && !collapsed && "ml-5",
            active
              ? "bg-primary-50 text-primary-700"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <item.icon
            className={cn(
              "h-5 w-5 shrink-0",
              active ? "text-primary-600" : "text-gray-400"
            )}
          />
          {!collapsed && <span>{item.label}</span>}
          {item.href === "/admin/communication" && unreadMessages > 0 && (
            <span
              className={cn(
                "min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5",
                collapsed ? "absolute -top-1 -right-1" : "ml-auto"
              )}
            >
              {unreadMessages > 99 ? "99+" : unreadMessages}
            </span>
          )}
          {collapsed && depth > 0 && (
            <span className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50">
              {item.label}
            </span>
          )}
        </Link>
      )
    }

    if (item.type === "group") {
      const isExpanded = expandedGroups[item.label]
      const hasActiveChild = item.children?.some(
        (child) => child.href && isActive(child.href)
      )

      if (collapsed) {
        const showPopup = activePopup === item.label
        return (
          <div key={item.label} className="relative">
            <div
              ref={showPopup ? popupRef : undefined}
              className={cn(
                "flex items-center justify-center px-2 py-2.5 rounded-lg cursor-pointer transition-colors",
                hasActiveChild
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
              onClick={(e) => {
                e.stopPropagation()
                if (activePopup === item.label) {
                  setActivePopup(null)
                } else {
                  setActivePopup(item.label)
                  const rect = e.currentTarget.getBoundingClientRect()
                  setPopupPosition({ top: rect.top, left: rect.right + 8 })
                }
              }}
              data-sidebar-toggle
            >
              <item.icon className={cn("h-5 w-5 shrink-0")} />
            </div>
            {showPopup && popupPosition && createPortal(
              <div
                className="fixed bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px] z-[100]"
                style={{ top: popupPosition.top, left: popupPosition.left }}
                data-popup-container
                onClick={() => setActivePopup(null)}
              >
                {item.children?.map((child) =>
                  child.href ? (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => {
                        onMobileClose()
                        setActivePopup(null)
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                        child.href && isActive(child.href)
                          ? "bg-primary-50 text-primary-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <child.icon className="h-4 w-4 shrink-0" />
                      <span>{child.label}</span>
                    </Link>
                  ) : null
                )}
              </div>,
              document.body
            )}
          </div>
        )
      }

      return (
        <div key={item.label}>
          <button
            onClick={() => toggleGroup(item.label)}
            className={cn(
              "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              hasActiveChild
                ? "bg-primary-50 text-primary-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <item.icon
              className={cn(
                "h-5 w-5 shrink-0",
                hasActiveChild ? "text-primary-600" : "text-gray-400"
              )}
            />
            <span className="flex-1 text-left">{item.label}</span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>
          {isExpanded && item.children && (
            <div className="mt-1 space-y-1">
              {item.children.map((child) => renderNavItem(child, depth + 1))}
            </div>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-x-hidden",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div
          className={cn(
            "flex items-center h-16 border-b border-gray-200 shrink-0",
            collapsed ? "justify-center px-2" : "px-4"
          )}
        >
          <Link href="/admin/dashboard" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">32</span>
            </div>
            {!collapsed && (
              <span className="text-sm font-semibold text-gray-900 truncate">
                {siteConfig.name}
              </span>
            )}
          </Link>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {permittedNavItems.map((item) => renderNavItem(item))}
        </nav>

        <div className="border-t border-gray-200 p-2 shrink-0">
          <button
            onClick={onToggle}
            className="hidden lg:flex items-center justify-center w-full gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>

          {collapsed ? (
            <div className="flex flex-col items-center gap-1 px-2 py-2.5">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <span className="text-primary-700 text-xs font-semibold">
                  {userName
                    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                    : "AD"}
                </span>
              </div>
              <button
                onClick={onSignOut}
                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                <span className="text-primary-700 text-xs font-semibold">
                  {userName
                    ? userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                    : "AD"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userName || "Admin"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userRole
                    ? ROLE_LABELS[userRole] || userRole
                    : "Administrator"}
                </p>
              </div>
              <button
                onClick={onSignOut}
                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
