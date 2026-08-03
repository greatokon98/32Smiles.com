"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

type Props = {
  taglines: string[]
}

export function HeroTextCycler({ taglines }: Props) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (taglines.length <= 1) return
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % taglines.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [taglines.length])

  if (taglines.length === 0) return null

  return (
    <div className="relative h-12 lg:h-14">
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="text-xl lg:text-2xl text-primary-100 leading-relaxed absolute inset-0"
        >
          {taglines[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
