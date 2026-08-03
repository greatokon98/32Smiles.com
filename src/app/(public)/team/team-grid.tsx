"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

interface SerializedTeamMember {
  id: string
  contentId: string
  title: string
  slug: string
  excerpt: string | null
  specialty: string
  credentials: string | null
  photoUrl: string | null
  isFeatured: boolean
}

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
}

export function TeamGrid({ members }: { members: SerializedTeamMember[] }) {
  if (members.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">
          Team profiles coming soon. Stay tuned!
        </p>
      </div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
    >
      {members.map((member) => (
        <motion.div key={member.id} variants={item}>
          <Link
            href={`/team/${member.slug}`}
            className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full"
          >
            <div className="relative aspect-[3/4] bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden">
              {member.photoUrl ? (
                <Image
                  src={member.photoUrl}
                  alt={member.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-6xl font-bold text-primary-200 text-primary-700">
                    {member.title.charAt(0)}
                  </span>
                </div>
              )}
              {member.isFeatured && (
                <span className="absolute top-3 left-3 bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Featured
                </span>
              )}
            </div>

            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                {member.title}
              </h2>
              <p className="text-primary-600 text-sm font-medium mb-2">
                {member.specialty}
              </p>
              {member.credentials && (
                <p className="text-gray-500 text-xs mb-3">
                  {member.credentials}
                </p>
              )}
              {member.excerpt && (
                <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                  {member.excerpt}
                </p>
              )}
              <span className="text-primary-600 text-sm font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                View Profile <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}
