"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Prisma } from "@prisma/client"

type TeamMemberItem = Prisma.TeamMemberGetPayload<{
  include: {
    content: {
      include: {
        featuredImage: true
      }
    }
    photoFile: true
  }
}>

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
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

export function TeamPreview({ members }: { members: TeamMemberItem[] }) {
  if (members.length === 0) return null

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
    >
      {members.map((member) => {
        const photoUrl = member.photoFile?.url || member.content.featuredImage?.url

        return (
          <motion.div key={member.id} variants={item}>
            <Link
              href={`/team/${member.content.slug}`}
              className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 text-center"
            >
              <div className="relative aspect-square bg-gradient-to-br from-primary-50 to-primary-100 overflow-hidden">
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt={member.content.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-5xl font-bold text-primary-200 text-primary-700">
                      {member.content.title.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                  {member.content.title}
                </h3>
                <p className="text-primary-600 text-sm font-medium mb-2">
                  {member.specialty}
                </p>
                {member.credentials && (
                  <p className="text-gray-500 text-xs line-clamp-1">
                    {member.credentials}
                  </p>
                )}
                <span className="inline-flex items-center gap-1 text-primary-600 text-sm font-semibold mt-3 group-hover:gap-2 transition-all">
                  View Profile <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
