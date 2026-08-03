"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CarouselImage {
  url: string
  title: string
}

export function ImageCarousel({ images }: { images: CarouselImage[] }) {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % images.length)
  }, [images.length])

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length])

  useEffect(() => {
    if (images.length <= 1 || isPaused) return
    const timer = setInterval(next, 4000)
    return () => clearInterval(timer)
  }, [images.length, isPaused, next])

  if (images.length === 0) return null

  return (
    <div
      className="relative w-full h-80 lg:h-96 overflow-hidden rounded-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {images.map((img, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
        >
          <Image
            src={img.url}
            alt={img.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority={i === 0}
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all"
      >
        <ChevronLeft className="h-5 w-5 text-gray-800" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all"
      >
        <ChevronRight className="h-5 w-5 text-gray-800" />
      </button>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? "bg-white w-6" : "bg-white/50 hover:bg-white/80"}`}
          />
        ))}
      </div>
    </div>
  )
}
