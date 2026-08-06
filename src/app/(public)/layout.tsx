import { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"
import { siteConfig } from "@/config/site"
import { Phone, Mail, Clock, ChevronDown } from "lucide-react"
import { SessionProvider } from "next-auth/react"
import { GlobalSearch } from "@/features/search/GlobalSearch"
import { BackToTop } from "./back-to-top"
import { CartProvider } from "@/features/cart/cart-context"
import { CartIcon } from "@/features/cart/cart-icon"
import AnalyticsProvider from "@/features/analytics/AnalyticsProvider"
import { MobileNav } from "./mobile-nav"
import { HeaderUserMenu } from "./header-user-menu"
import NotificationBell from "@/features/notifications/NotificationBell"
import { FooterNewsletter } from "./footer-newsletter"
import { getPublicSettings } from "@/lib/settings"
import { isDemoModeEnabled } from "@/lib/demo-gate"

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const demoMode = isDemoModeEnabled()
  const publicSettings = await getPublicSettings()
  const logoUrl = publicSettings.site_logo_url || "/images/logo.png"
  const footerLogoUrl = publicSettings.site_footer_logo_url || "/images/32smiles.png"
  return (
    <div className="flex flex-col min-h-full bg-white bg-gray-950">
      <AnalyticsProvider />
      <SessionProvider>
      <CartProvider>
      {/* Top Bar */}
      <div className="bg-primary-800 text-white text-sm">
        <div className="container mx-auto px-4 py-2 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <a href={`tel:${siteConfig.contact.phone.replace(/[^0-9+]/g, "")}`} className="flex items-center gap-1 hover:text-primary-200">
              <Phone className="h-3 w-3" />
              {siteConfig.contact.phone}
            </a>
            <a href={`mailto:${siteConfig.contact.email}`} className="flex items-center gap-1 hover:text-primary-200">
              <Mail className="h-3 w-3" />
              {siteConfig.contact.email}
            </a>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Mon - Fri: {siteConfig.business.hours.monday}</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src={logoUrl}
              alt="32Smiles Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link href="/" className="text-gray-700 hover:text-primary-600 font-medium px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Home</Link>
            <Link href="/about" className="text-gray-700 hover:text-primary-600 font-medium px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">About</Link>
            <Link href="/services" className="text-gray-700 hover:text-primary-600 font-medium px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Services</Link>
            <div className="relative group">
              <button className="text-gray-700 hover:text-primary-600 font-medium px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1">
                Education <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-2 min-w-[200px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <Link href="/education/patient" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600">Patient Education</Link>
                <Link href="/education/professional" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600">Professional Education</Link>
              </div>
            </div>
            <Link href="/blog" className="text-gray-700 hover:text-primary-600 font-medium px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Blog</Link>
            <Link href="/products" className="text-gray-700 hover:text-primary-600 font-medium px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Products</Link>
            <Link href="/gallery" className="text-gray-700 hover:text-primary-600 font-medium px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Gallery</Link>
            <Link href="/contact" className="text-gray-700 hover:text-primary-600 font-medium px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Contact</Link>
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-2">
            <NotificationBell />
            <HeaderUserMenu />
            <CartIcon />
            <GlobalSearch />
            <Link
              href="/appointment"
              className="bg-primary-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-primary-700 transition-colors shadow-sm"
            >
              Book Appointment
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <MobileNav />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 bg-gray-950 text-gray-300">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Column 1 - About */}
            <div>
              <Link href="/" className="inline-block mb-4">
                <Image src={footerLogoUrl} alt="32Smiles" width={140} height={36} className="h-8 w-auto brightness-0 invert opacity-80" />
              </Link>
              <p className="text-sm leading-relaxed mb-6">{siteConfig.mission}</p>
              <div className="flex items-center gap-3">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 hover:bg-primary-600 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 hover:bg-primary-600 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 hover:bg-primary-600 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 hover:bg-primary-600 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>

            {/* Column 2 - Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/about" className="hover:text-primary-400 transition-colors">About Us</Link></li>
                <li><Link href="/services" className="hover:text-primary-400 transition-colors">Services</Link></li>
                <li><Link href="/team" className="hover:text-primary-400 transition-colors">Our Team</Link></li>
                <li><Link href="/blog" className="hover:text-primary-400 transition-colors">Blog</Link></li>
                <li><Link href="/products" className="hover:text-primary-400 transition-colors">Products</Link></li>
                <li><Link href="/gallery" className="hover:text-primary-400 transition-colors">Gallery</Link></li>
                <li><Link href="/faq" className="hover:text-primary-400 transition-colors">FAQ</Link></li>
                <li><Link href="/appointment" className="hover:text-primary-400 transition-colors">Book Appointment</Link></li>
              </ul>
            </div>

            {/* Column 3 - Contact & Hours */}
            <div>
              <h4 className="text-white font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-3 text-sm mb-6">
                <li className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-0.5 shrink-0 text-primary-400" />
                  <a href={`tel:${siteConfig.contact.phone.replace(/[^0-9+]/g, "")}`} className="hover:text-white transition-colors">
                    {siteConfig.contact.phone}
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0 text-primary-400" />
                  <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-white transition-colors">
                    {siteConfig.contact.email}
                  </a>
                </li>
                <li className="text-sm leading-relaxed pl-6">{siteConfig.contact.address}</li>
              </ul>
              <h4 className="text-white font-semibold mb-3">Opening Hours</h4>
              <ul className="space-y-1.5 text-sm">
                <li className="flex justify-between"><span>Mon - Fri</span><span className="text-white">9:00 AM - 6:00 PM</span></li>
                <li className="flex justify-between"><span>Saturday</span><span className="text-white">10:00 AM - 2:00 PM</span></li>
                <li className="flex justify-between"><span>Sunday</span><span className="text-gray-500">Closed</span></li>
              </ul>
            </div>

            {/* Column 4 - Newsletter */}
            <div>
              <h4 className="text-white font-semibold mb-4">Stay Updated</h4>
              <p className="text-sm leading-relaxed mb-4">Subscribe to our newsletter for the latest dental health tips, clinic updates, and special offers.</p>
              <FooterNewsletter />
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>&copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
            <div className="flex gap-6 items-center">
              {demoMode && (
                <span className="text-primary-400">Confidential — for evaluation only</span>
              )}
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
      </CartProvider>
      </SessionProvider>
      <BackToTop />
    </div>
  )
}
