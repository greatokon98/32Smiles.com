"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Star } from "lucide-react"

type Testimonial = {
  name: string
  quote: string
  photoUrl?: string
  rating?: number
}

const defaultAvatars = ["/images/testimonials/1.png", "/images/testimonials/2.png", "/images/testimonials/3.png", "/images/testimonials/1.jpg"]

type Props = {
  testimonials: Testimonial[]
  avatarImages?: string[]
}

export function TestimonialsCarousel({ testimonials, avatarImages = defaultAvatars }: Props) {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [itemsPerView, setItemsPerView] = useState(3)

  useEffect(() => {
    const update = () => setItemsPerView(window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 3)
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  const max = Math.max(0, testimonials.length - itemsPerView)

  useEffect(() => {
    setCurrent((prev) => Math.min(prev, max))
  }, [max])

  const next = useCallback(() => {
    setCurrent((prev) => Math.min(prev + 1, max))
  }, [max])

  const prev = useCallback(() => {
    setCurrent((prev) => Math.max(prev - 1, 0))
  }, [])

  useEffect(() => {
    if (isPaused || testimonials.length <= itemsPerView) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [isPaused, next, testimonials.length])

  if (testimonials.length === 0) return null

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Carousel viewport */}
      <div className="overflow-hidden">
        <motion.div
          className="flex gap-6"
          animate={{ x: `-${current * (100 / itemsPerView)}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {testimonials.map((testimonial, i) => (
            <div
              key={i}
              className="max-w-[400px] mx-auto bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all shrink-0" style={{ minWidth: `calc(100%/${itemsPerView} - 1rem)` }}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating || 5)].map((_, j) => (
                  <Star key={`f-${j}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                {[...Array(5 - (testimonial.rating || 5))].map((_, j) => (
                  <Star key={`e-${j}`} className="h-4 w-4 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 text-sm mb-6 italic leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-primary-100 shrink-0">
                  <Image
                    src={testimonial.photoUrl || avatarImages[i % avatarImages.length]}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <p className="font-bold text-gray-900 text-sm">{testimonial.name}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Navigation arrows */}
      {testimonials.length > itemsPerView && (
        <>
          <button
            onClick={prev}
            disabled={current === 0}
            className="absolute -left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={next}
            disabled={current >= max}
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </>
      )}

      {/* Dots */}
      {testimonials.length > itemsPerView && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: max + 1 }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === current
                  ? "bg-primary-600 w-6"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
