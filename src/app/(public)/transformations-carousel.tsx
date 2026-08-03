"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2 } from "lucide-react"

type TransformationItem = {
  imageUrl: string
  fullImageUrl?: string
  caption: string
}

const BATCH_SIZE = 3
const INTERVAL_MS = 60_000

export function TransformationsCarousel({ items }: { items: TransformationItem[] }) {
  const [batch, setBatch] = useState(0)
  const totalBatches = Math.ceil(items.length / BATCH_SIZE)

  const goNext = useCallback(() => {
    setBatch((prev) => (prev + 1) % totalBatches)
  }, [totalBatches])

  useEffect(() => {
    if (totalBatches <= 1) return
    const timer = setInterval(goNext, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [goNext, totalBatches])

  if (items.length === 0) return null

  const start = batch * BATCH_SIZE
  const visible = items.slice(start, start + BATCH_SIZE)

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={batch}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center"
      >
        {visible.map((item, i) => (
          <div key={`${batch}-${i}`} className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg group w-full max-w-[400px]">
            {item.fullImageUrl ? (
              <div className="flex h-full">
                <div className="relative w-1/2 overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={`${item.caption} - Before`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 16vw"
                  />
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">Before</div>
                </div>
                <div className="w-px bg-white/30 relative z-10" />
                <div className="relative w-1/2 overflow-hidden">
                  <Image
                    src={item.fullImageUrl}
                    alt={`${item.caption} - After`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 16vw"
                  />
                  <div className="absolute top-2 right-2 bg-primary-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">After</div>
                </div>
              </div>
            ) : (
              <Image
                src={item.imageUrl}
                alt={item.caption}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6 pointer-events-none">
              <div className="flex items-center gap-2 text-white">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <span className="font-semibold">{item.caption}</span>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </AnimatePresence>
  )
}
