"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Search, Clock, User, ChevronLeft, ChevronRight, X, Loader2, FileText, ArrowRight } from "lucide-react"
import { Prisma } from "@prisma/client"
import { formatDate } from "@/lib/utils"

type BlogPostItem = Prisma.BlogPostGetPayload<{
  include: {
    content: {
      include: {
        author: true
        featuredImage: true
      }
    }
  }
}>

type Category = Prisma.CategoryGetPayload<{}>

type Props = {
  posts: BlogPostItem[]
  currentPage: number
  totalPages: number
  totalPosts: number
  searchQuery?: string
  categories?: Category[]
  activeCategory?: string
}

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
}

function buildPageUrl(page: number, query?: string) {
  const params = new URLSearchParams()
  if (page > 1) params.set("page", String(page))
  if (query) params.set("q", query)
  const qs = params.toString()
  return `/blog${qs ? `?${qs}` : ""}`
}

type SearchResult = {
  id: string
  type: string
  title: string
  excerpt: string | null
  url: string
  date: string | null
}

export function BlogList({
  posts,
  currentPage,
  totalPages,
  totalPosts,
  searchQuery,
  categories,
  activeCategory,
}: Props) {
  const router = useRouter()
  const [query, setQuery] = useState(searchQuery || "")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [hasInteracted, setHasInteracted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const resultsListRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  function navigateToSearch(term: string) {
    const params = new URLSearchParams()
    if (term.trim()) params.set("q", term.trim())
    if (activeCategory) params.set("category", activeCategory)
    const qs = params.toString()
    window.location.href = `/blog${qs ? `?${qs}` : ""}`
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    navigateToSearch(query)
  }

  function clearSearch() {
    const params = new URLSearchParams()
    if (activeCategory) params.set("category", activeCategory)
    const qs = params.toString()
    window.location.href = `/blog${qs ? `?${qs}` : ""}`
  }

  function navigateToResult(url: string) {
    router.push(url)
  }

  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex(prev => Math.min(prev + 1, blogResults.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === "Enter" && blogResults.length > 0 && activeIndex >= 0) {
      e.preventDefault()
      navigateToResult(blogResults[activeIndex].url)
    }
  }

  function handleCategoryClick(slug: string | undefined) {
    const params = new URLSearchParams()
    if (slug) params.set("category", slug)
    if (searchQuery) params.set("q", searchQuery)
    const qs = params.toString()
    window.location.href = `/blog${qs ? `?${qs}` : ""}`
  }

  const executeSearch = useCallback(async (searchQuery: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (!searchQuery.trim()) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setShowDropdown(true)

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=10&type=BLOG`, {
        signal: controller.signal,
      })
      if (!res.ok) throw new Error("Search failed")
      const data = await res.json()
      setResults(data.results || [])
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("[BlogList] Search error:", err)
        setResults([])
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!query.trim()) {
      setResults([])
      setIsLoading(false)
      setShowDropdown(false)
      return
    }
    setIsLoading(true)
    setShowDropdown(true)
    timerRef.current = setTimeout(() => {
      executeSearch(query)
    }, 300)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, executeSearch])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false); setHasInteracted(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { setShowDropdown(false); setHasInteracted(false) }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const blogResults = results.filter(r => r.type === "BLOG_POST")

  useEffect(() => {
    setActiveIndex(0)
    itemRefs.current = itemRefs.current.slice(0, blogResults.length)
  }, [blogResults.length])

  useEffect(() => {
    if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" })
    }
  }, [activeIndex])

  return (
    <div>
      {/* Category filter */}
      {categories && categories.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => handleCategoryClick(undefined)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !activeCategory
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.slug)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat.slug
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div className="max-w-xl mx-auto mb-12" ref={dropdownRef}>
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setHasInteracted(true) }}
            onFocus={() => setHasInteracted(true)}
            placeholder="Search articles..."
            className="w-full pl-12 pr-24 py-3.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            onKeyDown={handleInputKeyDown}
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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

          {/* Live search dropdown */}
          {(hasInteracted || isLoading) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-20">
              {isLoading && (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                  <span className="text-sm text-gray-500">Searching...</span>
                </div>
              )}

              {!isLoading && Object.keys(blogResults).length === 0 && query.trim() && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-gray-500">No blog posts found for &ldquo;{query}&rdquo;</p>
                  <button
                    type="button"
                    onClick={() => navigateToSearch(query)}
                    className="mt-2 text-sm text-primary-600 hover:underline font-medium"
                  >
                    View all results &rarr;
                  </button>
                </div>
              )}

              {!isLoading && blogResults.length > 0 && (
                <div>
                  <div ref={resultsListRef} className="max-h-60 overflow-y-auto" role="listbox">
                    {blogResults.map((result, idx) => (
                      <button
                        key={result.id}
                        ref={el => { itemRefs.current[idx] = el }}
                        type="button"
                        onClick={() => navigateToResult(result.url)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                          idx === activeIndex ? "bg-primary-50" : ""
                        }`}
                        role="option"
                        aria-selected={idx === activeIndex}
                      >
                        <div className="mt-0.5 p-1.5 rounded-lg shrink-0 bg-green-100 text-green-700">
                          <FileText className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
                          {result.excerpt && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">{result.excerpt}</p>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-300 mt-1 shrink-0" />
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => navigateToSearch(query)}
                      className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium text-center"
                    >
                      View all results for &ldquo;{query}&rdquo; &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
        {searchQuery && (
          <p className="mt-3 text-sm text-gray-500 text-center">
            {totalPosts} result{totalPosts !== 1 ? "s" : ""} for &ldquo;
            {searchQuery}&rdquo;
          </p>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-4">
            {searchQuery
              ? "No articles match your search."
              : "Blog posts coming soon. Stay tuned!"}
          </p>
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="text-primary-600 font-semibold hover:text-primary-700 transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <>
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center"
          >
            {posts.map((post) => {
              const content = post.content
              const imageUrl = content.featuredImage?.url
              const authorName = content.author?.name || "32Smiles"

              return (
                <motion.article key={post.id} variants={item} className="w-full max-w-[400px]">
                  <Link
                    href={`/blog/${content.slug}`}
                    className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full"
                  >
                    <div className="relative aspect-[16/10] bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={content.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-5xl font-bold text-primary-200 text-primary-700">
                            {content.title.charAt(0)}
                          </span>
                        </div>
                      )}
                      {content.featured && (
                        <span className="absolute top-3 left-3 bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          Featured
                        </span>
                      )}
                    </div>

                    <div className="p-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                        {content.title}
                      </h2>

                      {content.excerpt && (
                        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                          {content.excerpt}
                        </p>
                      )}

                      <div className="flex items-center flex-wrap gap-3 text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {authorName}
                        </span>
                        {content.publishedAt && (
                          <span>{formatDate(content.publishedAt)}</span>
                        )}
                        {post.readingTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {post.readingTime} min read
                          </span>
                        )}
                      </div>

                      <span className="text-primary-600 text-sm font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        Read More
                      </span>
                    </div>
                  </Link>
                </motion.article>
              )
            })}
          </motion.div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12 flex-wrap">
              {currentPage > 1 && (
                <Link
                  href={buildPageUrl(currentPage - 1, searchQuery)}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Link>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  const isCurrent = page === currentPage
                  const showPage =
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1

                  if (!showPage) {
                    if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span
                          key={page}
                          className="px-2 text-gray-400 text-sm"
                        >
                          ...
                        </span>
                      )
                    }
                    return null
                  }

                  return (
                    <Link
                      key={page}
                      href={buildPageUrl(page, searchQuery)}
                      className={`w-10 h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                        isCurrent
                          ? "bg-primary-600 text-white"
                          : "text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </Link>
                  )
                },
              )}

              {currentPage < totalPages && (
                <Link
                  href={buildPageUrl(currentPage + 1, searchQuery)}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
