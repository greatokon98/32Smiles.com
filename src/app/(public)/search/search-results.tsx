"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  X,
  FileText,
  Stethoscope,
  ShoppingBag,
  Users,
  GraduationCap,
  Calendar,
  SearchX,
} from "lucide-react"
import { cn, formatDate } from "@/lib/utils"

type SearchResult = {
  id: string
  type: string
  title: string
  excerpt: string | null
  url: string
  date: string | null
}

type SearchApiResponse = {
  results: SearchResult[]
  total: number
  query: string
}

const TYPE_TABS = [
  { value: "ALL", label: "All" },
  { value: "SERVICES", label: "Services" },
  { value: "BLOG", label: "Blog" },
  { value: "PRODUCTS", label: "Products" },
  { value: "TEAM", label: "Team" },
  { value: "EDUCATION", label: "Education" },
] as const

const TYPE_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  SERVICE: { label: "Service", icon: Stethoscope, color: "bg-blue-100 text-blue-700" },
  BLOG_POST: { label: "Blog Post", icon: FileText, color: "bg-green-100 text-green-700" },
  PRODUCT: { label: "Product", icon: ShoppingBag, color: "bg-purple-100 text-purple-700" },
  TEAM_MEMBER: { label: "Team Member", icon: Users, color: "bg-orange-100 text-orange-700" },
  EDUCATION_PATIENT: { label: "Patient Education", icon: GraduationCap, color: "bg-teal-100 text-teal-700" },
  EDUCATION_PROFESSIONAL: { label: "Professional Education", icon: GraduationCap, color: "bg-teal-100 text-teal-700" },
}

const ITEMS_PER_PAGE = 10

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
}

type Props = {
  initialQuery: string
  initialType: string
}

export function SearchResults({ initialQuery, initialType }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get("q") || initialQuery
  const urlType = searchParams.get("type") || initialType

  const [inputValue, setInputValue] = useState(urlQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const abortRef = useRef<AbortController | null>(null)
  const searchKey = `${urlQuery}-${urlType}`

  const executeSearch = useCallback(async (searchQuery: string, typeFilter: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (!searchQuery.trim()) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const params = new URLSearchParams({ q: searchQuery, limit: "50" })
      if (typeFilter && typeFilter !== "ALL") {
        params.set("type", typeFilter)
      }
      const res = await fetch(`/api/search?${params.toString()}`, {
        signal: controller.signal,
      })
      if (!res.ok) throw new Error("Search failed")
      const data: SearchApiResponse = await res.json()
      setResults(data.results || [])
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setResults([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!urlQuery.trim()) return undefined

    const timer = setTimeout(() => {
      executeSearch(urlQuery, urlType)
    }, 300)

    return () => {
      clearTimeout(timer)
    }
  }, [urlQuery, urlType, executeSearch])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inputValue.trim()
    const params = new URLSearchParams()
    if (trimmed) params.set("q", trimmed)
    if (urlType !== "ALL") params.set("type", urlType)
    const qs = params.toString()
    router.push(`/search${qs ? `?${qs}` : ""}`)
  }

  function handleTypeChange(type: string) {
    const trimmed = urlQuery.trim()
    const params = new URLSearchParams()
    if (trimmed) params.set("q", trimmed)
    if (type !== "ALL") params.set("type", type)
    const qs = params.toString()
    router.push(`/search${qs ? `?${qs}` : ""}`)
  }

  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE)
  const paginatedResults = results.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div>
      {/* Search Input */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search for services, articles, products..."
            className="w-full pl-12 pr-24 py-4 text-lg rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          />
          {inputValue && (
            <button
              type="button"
              onClick={() => {
                setInputValue("")
                setResults([])
              }}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </form>

      {/* Type Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTypeChange(tab.value)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              urlType === tab.value
                ? "bg-primary-600 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!isLoading && urlQuery.trim() && results.length > 0 && (
        <>
          <p className="text-sm text-gray-500 mb-6">
            {results.length} result{results.length !== 1 ? "s" : ""} found
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={searchKey}
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-3"
            >
              {paginatedResults.map((result) => {
                const config = TYPE_CONFIG[result.type] || {
                  label: result.type,
                  icon: FileText,
                  color: "bg-gray-100 text-gray-700",
                }
                const Icon = config.icon

                return (
                  <motion.div key={result.id} variants={item}>
                    <Link
                      href={result.url}
                      className="group block bg-white rounded-xl p-5 shadow-sm hover:shadow-md border border-gray-100 transition-all duration-200"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "p-2 rounded-lg shrink-0 mt-0.5",
                            config.color
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                              {result.title}
                            </h3>
                            <span
                              className={cn(
                                "text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider",
                                config.color
                              )}
                            >
                              {config.label}
                            </span>
                          </div>
                          {result.excerpt && (
                            <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                              {result.excerpt}
                            </p>
                          )}
                          {result.date && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                              <Calendar className="h-3 w-3" />
                              {formatDate(result.date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => {
                    setCurrentPage(page)
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-colors",
                    page === currentPage
                      ? "bg-primary-600 text-white"
                      : "text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
                  )}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!isLoading && urlQuery.trim() && results.length === 0 && (
        <div className="text-center py-16">
          <SearchX className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No results found
          </h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            We couldn&apos;t find anything matching &quot;{urlQuery}&quot;.
            Try different keywords or browse our content directly.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/services"
              className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              Browse Services
            </Link>
            <Link
              href="/blog"
              className="px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Read Blog
            </Link>
            <Link
              href="/products"
              className="px-5 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Shop Products
            </Link>
          </div>
        </div>
      )}

      {/* Initial State */}
      {!isLoading && !urlQuery.trim() && (
        <div className="text-center py-16">
          <Search className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Search 32Smiles
          </h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Find dental services, read our latest blog posts, explore products, or meet our expert team.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-lg mx-auto">
            {[
              { label: "Services", href: "/services", icon: Stethoscope },
              { label: "Blog Posts", href: "/blog", icon: FileText },
              { label: "Products", href: "/products", icon: ShoppingBag },
              { label: "Our Team", href: "/team", icon: Users },
              { label: "Patient Education", href: "/education/patient", icon: GraduationCap },
              { label: "FAQ", href: "/faq", icon: FileText },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-gray-100 text-sm font-medium text-gray-700 hover:border-primary-200 hover:text-primary-600 transition-colors"
              >
                <link.icon className="h-4 w-4 shrink-0" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
