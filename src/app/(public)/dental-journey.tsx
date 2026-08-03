"use client"

import { motion } from "framer-motion"
import { Calendar, Search, ClipboardCheck, Smile } from "lucide-react"

const steps = [
  {
    icon: Calendar,
    number: "01",
    title: "Book Appointment",
    desc: "Schedule your visit online or by phone — we offer flexible hours including evenings.",
  },
  {
    icon: Search,
    number: "02",
    title: "Comprehensive Exam",
    desc: "Our dentists perform a thorough examination using advanced diagnostic technology.",
  },
  {
    icon: ClipboardCheck,
    number: "03",
    title: "Treatment Plan",
    desc: "We create a personalized plan with transparent pricing and timeline.",
  },
  {
    icon: Smile,
    number: "04",
    title: "Ongoing Care",
    desc: "Regular checkups and preventive care to maintain your healthy, beautiful smile.",
  },
]

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.15 },
  },
}

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
}

const numberVariants = {
  hidden: { opacity: 0, scale: 0.4 },
  show: { opacity: 0.1, scale: 1, transition: { duration: 0.7, ease: "easeOut" as const } },
}

export function DentalJourney() {
  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">
            Your Dental Journey
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2 mb-4">
            A Simple Path to a Healthier Smile
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A simple, comfortable process from your first visit to ongoing care.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line (desktop) — ghost background */}
          <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-primary-100" />
          {/* Animated segments */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.35, ease: "easeOut" }}
            className="hidden md:block absolute top-12 left-[18.75%] w-[12.5%] h-0.5 bg-primary-500 origin-left"
          />
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.30, duration: 0.35, ease: "easeOut" }}
            className="hidden md:block absolute top-12 left-[43.75%] w-[12.5%] h-0.5 bg-primary-500 origin-left"
          />
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.45, duration: 0.35, ease: "easeOut" }}
            className="hidden md:block absolute top-12 left-[68.75%] w-[12.5%] h-0.5 bg-primary-500 origin-left"
          />
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-6"
          >

          {steps.map((step, i) => (
            <motion.div
              key={i}
              variants={item}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative z-10 w-24 h-24 bg-white border-2 border-primary-100 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                <step.icon className="h-10 w-10 text-primary-600" />
              </div>
              <motion.div variants={numberVariants} className="absolute -top-10 sm:-top-12 left-1/2 text-6xl sm:text-[115px] font-bold text-primary-900 tabular-nums select-none pointer-events-none">
                {step.number}
              </motion.div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed max-w-xs">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
        </div>
      </div>
    </section>
  )
}
