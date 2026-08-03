"use client"

import { useState, useCallback, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight, Maximize2, ImageIcon } from "lucide-react"
import { Prisma } from "@prisma/client"

type GalleryItem = Prisma.GalleryItemGetPayload<{
  include: {
    content: true
    imageFile: true
    fullImageFile: true
  }
}>

type FallbackItem = {
  id: string
  title: string
  category: string | null
  imageUrl: string
  fullImageUrl: string
}

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04 },
  },
}

const item = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
}

export function GalleryGrid({
  items,
  categories,
  fallbackItems,
}: {
  items?: GalleryItem[]
  categories: string[]
  fallbackItems?: FallbackItem[]
}) {
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const useFallback = !items || items.length === 0
  const displayItems = useFallback ? (fallbackItems || []) : items

  const filtered =
    activeCategory === "all"
      ? displayItems
      : displayItems.filter((galleryItem) => {
          if (useFallback) {
            return (galleryItem as FallbackItem).category === activeCategory
          }
          return (galleryItem as GalleryItem).category === activeCategory
        })

  const openLightbox = useCallback(
    (index: number) => setLightboxIndex(index),
    [],
  )

  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return
    setLightboxIndex((lightboxIndex + 1) % filtered.length)
  }, [lightboxIndex, filtered.length])

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return
    setLightboxIndex(
      (lightboxIndex - 1 + filtered.length) % filtered.length,
    )
  }, [lightboxIndex, filtered.length])

  useEffect(() => {
    if (lightboxIndex === null) return

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox()
      if (e.key === "ArrowRight") goNext()
      if (e.key === "ArrowLeft") goPrev()
    }

    window.addEventListener("keydown", handler)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", handler)
      document.body.style.overflow = ""
    }
  }, [lightboxIndex, closeLightbox, goNext, goPrev])

  function getItemAfterSrc(galleryItem: GalleryItem | FallbackItem): string {
    if (useFallback) {
      return (galleryItem as FallbackItem).fullImageUrl || (galleryItem as FallbackItem).imageUrl
    }
    const gi = galleryItem as GalleryItem
    return gi.fullImageFile?.url || gi.imageFile?.url || ""
  }

  function getItemBeforeSrc(galleryItem: GalleryItem | FallbackItem): string {
    if (useFallback) {
      return (galleryItem as FallbackItem).imageUrl || ""
    }
    const gi = galleryItem as GalleryItem
    return gi.imageFile?.url || ""
  }

  function getItemAlt(galleryItem: GalleryItem | FallbackItem): string {
    if (useFallback) {
      return (galleryItem as FallbackItem).title || "Gallery image"
    }
    const gi = galleryItem as GalleryItem
    return gi.altText || gi.content.title || "Gallery image"
  }

  function getItemCaption(galleryItem: GalleryItem | FallbackItem): string {
    if (useFallback) {
      return (galleryItem as FallbackItem).title || ""
    }
    const gi = galleryItem as GalleryItem
    return gi.caption || gi.content.title
  }

  function getItemCategory(galleryItem: GalleryItem | FallbackItem): string | null {
    if (useFallback) {
      return (galleryItem as FallbackItem).category
    }
    return (galleryItem as GalleryItem).category
  }

  const lightboxItem = lightboxIndex !== null ? filtered[lightboxIndex] : null
  const lightboxSrc = lightboxItem ? getItemAfterSrc(lightboxItem) : null

  return (
    <>
      {categories.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === "all"
                ? "bg-primary-600 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-primary-600 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          variants={container}
          initial="hidden"
          animate="show"
          className="columns-1 sm:columns-2 lg:columns-3 gap-4"
        >
          {filtered.map((galleryItem, index) => {
            const afterSrc = getItemAfterSrc(galleryItem)
            const beforeSrc = getItemBeforeSrc(galleryItem)
            const alt = getItemAlt(galleryItem)
            const caption = getItemCaption(galleryItem)
            const category = getItemCategory(galleryItem)
            const hasBefore = !!beforeSrc

            return (
              <motion.div
                key={galleryItem.id}
                variants={item}
                className="break-inside-avoid mb-4"
              >
                <button
                  onClick={() => openLightbox(index)}
                  className="group relative block w-full overflow-hidden rounded-xl bg-gray-100 cursor-pointer focus:outline-none"
                >
                  <div className="relative w-full aspect-[4/3]">
                    {hasBefore ? (
                      <>
                        <Image
                          src={afterSrc}
                          alt={alt}
                          fill
                          className="object-cover transition-all duration-500 group-hover:opacity-0"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <Image
                          src={beforeSrc}
                          alt={alt}
                          fill
                          className="object-cover transition-all duration-500 opacity-0 group-hover:opacity-100"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          loading="lazy"
                        />
                      </>
                    ) : (
                      afterSrc && (
                        <Image
                          src={afterSrc}
                          alt={alt}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      )
                    )}

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end justify-between p-4 opacity-0 group-hover:opacity-100">
                      <span className="text-white text-sm font-medium line-clamp-1">
                        {caption}
                      </span>
                      <Maximize2 className="h-5 w-5 text-white shrink-0" />
                    </div>

                    {category && (
                      <span className="absolute top-3 left-3 bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
                        {category}
                      </span>
                    )}
                  </div>
                </button>
              </motion.div>
            )
          })}
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">
            No images found in this category.
          </p>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10 p-2"
            >
              <X className="h-6 w-6" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                goPrev()
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10 p-2 bg-black/30 rounded-full hover:bg-black/50"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                goNext()
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10 p-2 bg-black/30 rounded-full hover:bg-black/50"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-[90vw] h-[98vh] flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {lightboxSrc ? (
                <div className="relative w-full flex-1 min-h-0">
                  <Image
                    src={lightboxSrc}
                    alt={lightboxItem ? getItemAlt(lightboxItem) : "Gallery image"}
                    fill
                    className="object-contain lg:object-cover rounded-lg"
                    sizes="100vw"
                    priority
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-white/40 gap-2">
                  <ImageIcon className="h-16 w-16" />
                  <p className="text-sm">No image available</p>
                </div>
              )}

              {lightboxItem && getItemCaption(lightboxItem) && (
                <div className="mt-2 text-center">
                  <p className="text-white text-sm font-medium">
                    {getItemCaption(lightboxItem)}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between mt-1 px-4 w-full max-w-[90vw]">
                {lightboxItem && getItemCategory(lightboxItem) && (
                  <span className="text-white/50 text-xs">
                    {getItemCategory(lightboxItem)}
                  </span>
                )}
                <span className="text-white/40 text-xs ml-auto">
                  {lightboxIndex !== null ? lightboxIndex + 1 : 1} / {filtered.length}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
