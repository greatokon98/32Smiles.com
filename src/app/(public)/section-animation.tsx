"use client"

import { motion } from "framer-motion"
import { type ReactNode } from "react"

type Props = {
  children: ReactNode
  className?: string
  delay?: number
  direction?: "up" | "left" | "right"
}

export function AnimatedSection({ children, className, delay = 0, direction = "up" }: Props) {
  const directionMap = {
    up: { y: 30 },
    left: { x: -30 },
    right: { x: 30 },
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...directionMap[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
