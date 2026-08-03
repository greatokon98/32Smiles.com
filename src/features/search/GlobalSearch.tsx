"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X, Clock, ArrowRight, FileText, Stethoscope, ShoppingBag, Users, GraduationCap, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type SearchResult = {
  id: string
  type: string
  title: string
  excerpt: string | null
  url: string
  date: string | null
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  SERVICE: { label: "Service", icon: Stethoscope, color: "bg-blue-100 bg-blue-900/30 text-blue-700 text-blue-400" },
  BLOG_POST: { label: "Blog", icon: FileText, color: "bg-green-100 bg-green-900/30 text-green-700 text-green-400" },
  PRODUCT: { label: "Product", icon: ShoppingBag, color: "bg-purple-100 bg-purple-900/30 text-purple-700 text-purple-400" },
  TEAM_MEMBER: { label: "Team", icon: Users, color: "bg-orange-100 bg-orange-900/30 text-orange-700 text-orange-400" },
  EDUCATION_PATIENT: { label: "Education", icon: GraduationCap, color: "bg-teal-100 bg-teal-900/30 text-teal-700 text-teal-400" },
  EDUCATION_PROFESSIONAL: { label: "Education", icon: GraduationCap, color: "bg-teal-100 bg-teal-900/30 text-teal-700 text-teal-400" },
}

const RECENT_SEARCHES_KEY = "32smiles_recent_searches"
const MAX_RECENT = 5

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveRecentSearch(q: string) {
  const recent = getRecentSearches().filter((r) => r !== q)
  recent.unshift(q)
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY)
}

function useDebouncedSearch(delay = 300) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const executeSearch = useCallback(async (searchQuery: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (!searchQuery.trim()) {
      setResults([])
      setIsLoading(false)
      setActiveIndex(0)
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=20`, {
        signal: controller.signal,
      })
      if (!res.ok) throw new Error("Search failed")
      const data = await res.json()
      setResults(data.results || [])
      setActiveIndex(0)
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setResults([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!newQuery.trim()) {
      setResults([])
      setIsLoading(false)
      setActiveIndex(0)
      return
    }
    setIsLoading(true)
    setActiveIndex(0)
    timerRef.current = setTimeout(() => {
      executeSearch(newQuery)
    }, delay)
  }, [delay, executeSearch])

  const reset = useCallback(() => {
    setQuery("")
    setResults([])
    setIsLoading(false)
    setActiveIndex(0)
    abortRef.current?.abort()
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return { query, results, isLoading, activeIndex, setActiveIndex, updateQuery, reset }
}

export function GlobalSearch() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const { query, results, isLoading, activeIndex, setActiveIndex, updateQuery, reset } = useDebouncedSearch()

  const groupedResults = results.reduce(
    (acc, result) => {
      const group = result.type
      if (!acc[group]) acc[group] = []
      acc[group].push(result)
      return acc
    },
    {} as Record<string, SearchResult[]>
  )

  const flatResults = Object.values(groupedResults).flat()

  const open = useCallback(() => {
    setIsOpen(true)
    setRecentSearches(getRecentSearches())
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    reset()
  }, [reset])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        if (isOpen) {
          close()
        } else {
          open()
        }
      }
      if (e.key === "Escape" && isOpen) {
        close()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, open, close])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  function handleSelect(result: SearchResult) {
    saveRecentSearch(query)
    close()
    router.push(result.url)
  }

  function handleSelectRecent(recentQuery: string) {
    updateQuery(recentQuery)
  }

  function handleClearRecent() {
    clearRecentSearches()
    setRecentSearches([])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      saveRecentSearch(query.trim())
      close()
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((prev) => Math.min(prev + 1, flatResults.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (flatResults.length > 0 && activeIndex < flatResults.length) {
        handleSelect(flatResults[activeIndex])
      }
    }
  }

  return (
    <>
      <button
        onClick={open}
        className="flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors p-2 rounded-lg hover:bg-gray-50"
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
        <span className="hidden md:inline text-sm font-medium">Search</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={close}
            />

            <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -10 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                <form onSubmit={handleSubmit} className="flex items-center px-4 border-b border-gray-100 bg-white relative">
                  <div className="flex items-center group">
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 text-gray-400 animate-spin transition-colors duration-200 peer-focus:text-primary-500" />
                    ) : (
                      <Search className="h-5 w-5 text-gray-400 transition-colors duration-200 peer-focus:text-primary-500" />
                    )}
                  </div>
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => updateQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search services, articles, products..."
                    className="peer flex-1 px-3 py-4 text-base text-gray-900 placeholder-gray-400 bg-transparent border-none outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus:border-none focus:shadow-none"
                    style={{ outline: "none" }}
                  />
                  <div className="flex items-center gap-2">
                    {query && (
                      <button
                        type="button"
                        onClick={() => {
                          reset()
                          inputRef.current?.focus()
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="submit"
                      className="text-gray-400 hover:text-primary-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-0"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={close}
                      className="px-2 py-1 text-xs font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-0"
                    >
                      ESC
                    </button>
                  </div>
                </form>

                <div className="max-h-[60vh] overflow-y-auto">
                  {!query.trim() && recentSearches.length > 0 && (
                    <div className="p-2">
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Recent Searches
                        </span>
                        <button
                          onClick={handleClearRecent}
                          className="text-xs text-gray-400 hover:text-gray-600 hover:text-gray-300"
                        >
                          Clear
                        </button>
                      </div>
                      {recentSearches.map((recent, i) => (
                        <button
                          key={`${recent}-${i}`}
                          onClick={() => handleSelectRecent(recent)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-left"
                        >
                          <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="truncate">{recent}</span>
                          <ArrowRight className="h-3 w-3 text-gray-600 ml-auto shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}

                  {!query.trim() && recentSearches.length === 0 && (
                    <div className="px-4 py-12 text-center">
                      <Search className="h-10 w-10 text-gray-200 text-gray-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">
                        Start typing to search across all content
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Try &quot;implants&quot;, &quot;whitening&quot;, or &quot;root canal&quot;
                      </p>
                    </div>
                  )}

                  {query.trim() && !isLoading && flatResults.length === 0 && (
                    <div className="px-4 py-12 text-center">
                      <p className="text-sm text-gray-500 mb-1">
                        No results found for &quot;{query}&quot;
                      </p>
                      <p className="text-xs text-gray-400">
                        Try different keywords or{" "}
                        <button
                          onClick={() => {
                            saveRecentSearch(query)
                            close()
                            router.push(`/search?q=${encodeURIComponent(query)}`)
                          }}
                          className="text-primary-600 hover:underline"
                        >
                          view all results
                        </button>
                      </p>
                    </div>
                  )}

                  {query.trim() && flatResults.length > 0 && (
                    <div className="p-2">
                      {Object.entries(groupedResults).map(([type, items]) => {
                        const config = TYPE_CONFIG[type] || {
                          label: type,
                          icon: FileText,
                          color: "bg-gray-100 text-gray-700",
                        }
                        const Icon = config.icon
                        return (
                          <div key={type} className="mb-2 last:mb-0">
                            <div className="px-3 py-2">
                              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                {config.label}s ({items.length})
                              </span>
                            </div>
                            {items.map((result) => {
                              const globalIdx = flatResults.indexOf(result)
                              return (
                                <button
                                  key={result.id}
                                  onClick={() => handleSelect(result)}
                                  onMouseEnter={() => setActiveIndex(globalIdx)}
                                  className={cn(
                                    "w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                                    globalIdx === activeIndex
                                      ? "bg-primary-100 text-primary-900"
                                      : "text-gray-700 hover:bg-gray-100"
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "mt-0.5 p-1.5 rounded-lg shrink-0",
                                      config.color
                                    )}
                                  >
                                    <Icon className="h-3.5 w-3.5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                      {result.title}
                                    </p>
                                    {result.excerpt && (
                                      <p className="text-xs text-gray-500 truncate mt-0.5">
                                        {result.excerpt}
                                      </p>
                                    )}
                                  </div>
                                  <ArrowRight
                                    className={cn(
                                      "h-4 w-4 mt-1 shrink-0 transition-opacity",
                                      globalIdx === activeIndex
                                        ? "text-primary-400 opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                </button>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {isLoading && query.trim() && (
                    <div className="p-4 space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-start gap-3 animate-pulse">
                          <div className="w-8 h-8 rounded-lg bg-gray-200 shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 px-4 py-2.5 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px]">&#8593;&#8595;</kbd>
                      navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px]">&#9166;</kbd>
                      select
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px]">esc</kbd>
                      close
                    </span>
                  </div>
                  {flatResults.length > 0 && (
                    <button
                      onClick={handleSubmit}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View all results &rarr;
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
