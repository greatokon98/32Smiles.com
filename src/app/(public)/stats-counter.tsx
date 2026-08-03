"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import { Award, Users, Heart, Phone } from "lucide-react"

type StatItem = {
  icon: typeof Award
  value: string
  label: string
}

type Props = {
  years: string
  patients: string
  satisfaction: string
  emergencyLabel: string
}

function AnimatedNumber({ target, suffix = "" }: { target: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })
  const [count, setCount] = useState(0)
  const numericTarget = parseInt(target.replace(/[^0-9]/g, ""), 10) || 0

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const duration = 1500
    const step = Math.max(1, Math.floor(numericTarget / 60))
    const timer = setInterval(() => {
      start += step
      if (start >= numericTarget) {
        setCount(numericTarget)
        clearInterval(timer)
      } else {
        setCount(start)
      }
    }, duration / 60)
    return () => clearInterval(timer)
  }, [isInView, numericTarget])

  return <span ref={ref}>{count}{suffix}</span>
}

export function StatsCounter({ years, patients, satisfaction, emergencyLabel }: Props) {
  const stats: StatItem[] = [
    { icon: Award, value: years, label: "Years of Experience" },
    { icon: Users, value: patients, label: "Patients Served" },
    { icon: Heart, value: satisfaction, label: "Client Satisfaction" },
    { icon: Phone, value: emergencyLabel, label: "Emergency Support" },
  ]

  return (
    <section className="py-12 bg-white border-b border-gray-100">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                {i < 3 ? (
                  <>
                    <AnimatedNumber target={stat.value} suffix={i === 2 ? "%" : "+"} />
                  </>
                ) : (
                  stat.value
                )}
              </p>
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
