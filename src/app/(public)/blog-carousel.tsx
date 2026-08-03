"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"

type BlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  featuredImage?: { url: string } | null
}

const defaultBlogImages = ["/images/blog/1.jpg", "/images/blog/2.jpg", "/images/blog/3.jpg"]

const fallbackPosts: BlogPost[] = [
  { id: "fb-1", slug: "/blog", title: "Healthy Smile Tips", excerpt: "Expert advice for maintaining optimal oral health between visits." },
  { id: "fb-2", slug: "/blog", title: "Latest Dental Treatments", excerpt: "Discover the latest advancements in modern dentistry." },
  { id: "fb-3", slug: "/blog", title: "Patient Success Story", excerpt: "See how our patients achieved their dream smiles." },
]

type Props = {
  posts: BlogPost[]
  blogImages?: string[]
}

export function BlogCarousel({ posts, blogImages = defaultBlogImages }: Props) {
  const items = posts.length > 0 ? posts : fallbackPosts
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [itemsPerView, setItemsPerView] = useState(3)

  useEffect(() => {
    const update = () => setItemsPerView(window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 3)
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  const duplicated = [...items, ...items]
  const max = items.length

  const next = useCallback(() => {
    setCurrent((prev) => {
      const nextIndex = prev + 1
      if (nextIndex >= max) return 0
      return nextIndex
    })
  }, [max])

  const prev = useCallback(() => {
    setCurrent((prev) => (prev === 0 ? max - 1 : prev - 1))
  }, [max])

  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(next, 4000)
    return () => clearInterval(timer)
  }, [isPaused, next])

  const translateX = -(current * (100 / itemsPerView))

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="overflow-hidden">
        <div
          className="flex gap-6 transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(${translateX}%)` }}
        >
          {duplicated.map((post, i) => (
            <div key={`${post.id}-${i}`} className="shrink-0" style={{ minWidth: `calc(100%/${itemsPerView} - 1rem)` }}>
              <Link
                href={`/blog/${post.slug}`}
                className="group flex flex-col h-full bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all max-w-[400px] mx-auto"
              >
                <div className="relative aspect-[4/3] bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden shrink-0">
                  <Image
                    src={post.featuredImage?.url || blogImages[i % blogImages.length]}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="flex flex-col flex-1 p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">{post.excerpt}</p>
                  <span className="text-primary-600 text-sm font-semibold inline-flex items-center gap-1 mt-auto">
                    Read More <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {items.length > itemsPerView && (
        <>
          <button
            onClick={prev}
            className="absolute -left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={next}
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </>
      )}

      <div className="text-center mt-6">
        <Link
          href="/blog"
          className="text-primary-600 font-semibold inline-flex items-center gap-2 hover:gap-3 transition-all"
        >
          View All Articles <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  )
}
