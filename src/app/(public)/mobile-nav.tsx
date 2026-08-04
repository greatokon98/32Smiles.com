"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Menu, X, Phone, Mail, ChevronDown, LayoutDashboard, LogOut, User, Bell } from "lucide-react"
import { siteConfig } from "@/config/site"
import { GlobalSearch } from "@/features/search/GlobalSearch"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/blog", label: "Blog" },
  { href: "/products", label: "Products" },
  { href: "/gallery", label: "Gallery" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
]

const educationLinks = [
  { href: "/education/patient", label: "Patient Education" },
  { href: "/education/professional", label: "Professional Education" },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const [eduOpen, setEduOpen] = useState(false)
  const { data: session } = useSession()
  const user = session?.user
  const dashboardHref = user?.role === "VIEWER" ? "/dashboard" : "/admin/dashboard"

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl overflow-y-auto animate-slideLeft">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="text-lg font-bold text-primary-600">32Smiles</span>
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <GlobalSearch />
            </div>

            {/* Nav Links */}
            <nav className="p-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-lg font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              {/* Education Dropdown */}
              <button
                onClick={() => setEduOpen(!eduOpen)}
                className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-lg font-medium transition-colors"
              >
                Education
                <ChevronDown className={`h-4 w-4 transition-transform ${eduOpen ? "rotate-180" : ""}`} />
              </button>
              {eduOpen && (
                <div className="ml-4 space-y-1">
                  {educationLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-primary-600 rounded-lg transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </nav>

            {/* Contact Info */}
            <div className="p-4 border-t border-gray-100 space-y-3">
              <a
                href={`tel:${siteConfig.contact.phone.replace(/[^0-9+]/g, "")}`}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
              >
                <Phone className="h-4 w-4" />
                {siteConfig.contact.phone}
              </a>
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600"
              >
                <Mail className="h-4 w-4" />
                {siteConfig.contact.email}
              </a>
            </div>

            {/* Account */}
            {user ? (
              <div className="p-4 border-t border-gray-100 space-y-1">
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name || "My Account"}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <Link
                  href={dashboardHref}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-lg font-medium transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href={user.role === "VIEWER" ? "/dashboard/profile" : "/admin/settings"}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-lg font-medium transition-colors"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <Link
                  href={user.role === "VIEWER" ? "/dashboard/notifications" : "/admin/notifications"}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-primary-600 rounded-lg font-medium transition-colors"
                >
                  <Bell className="h-4 w-4" />
                  Notifications
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-2 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="p-4 border-t border-gray-100">
                <Link
                  href="/admin/login"
                  onClick={() => setOpen(false)}
                  className="block w-full border border-gray-300 text-center text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Login
                </Link>
              </div>
            )}

            {/* CTA */}
            <div className="p-4">
              <Link
                href="/appointment"
                onClick={() => setOpen(false)}
                className="block w-full bg-primary-600 text-white text-center px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Book Appointment
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}