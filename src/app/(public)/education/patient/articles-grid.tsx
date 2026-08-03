"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { Clock, BookOpen } from "lucide-react"
import { Prisma } from "@prisma/client"
import { formatDate } from "@/lib/utils"

type EducationArticleItem = Prisma.ContentGetPayload<{
  include: {
    educationArticle: true
    featuredImage: true
    author: true
  }
}>

type Props = {
  articles: EducationArticleItem[]
}

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
}

export function PatientArticlesGrid({ articles }: Props) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-16">
        <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">
          Patient education articles coming soon. Check back later!
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
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
    >
      {articles.map((article) => {
        const imageUrl = article.featuredImage?.url
        const ea = article.educationArticle

        return (
          <motion.article key={article.id} variants={item}>
            <Link
              href={`/education/patient/${article.slug}`}
              className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full"
            >
              <div className="relative aspect-[16/10] bg-gradient-to-br from-teal-50 to-teal-100 overflow-hidden">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookOpen className="h-12 w-12 text-teal-200" />
                  </div>
                )}
                {article.featured && (
                  <span className="absolute top-3 left-3 bg-teal-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Featured
                  </span>
                )}
                {ea?.educationType && (
                  <span className="absolute top-3 right-3 bg-white/90 text-teal-700 text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm">
                    {ea.educationType}
                  </span>
                )}
              </div>

              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors line-clamp-2">
                  {article.title}
                </h2>

                {article.excerpt && (
                  <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>
                )}

                <div className="flex items-center flex-wrap gap-3 text-sm text-gray-500">
                  {ea?.readingTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {ea.readingTime} min read
                    </span>
                  )}
                  {article.publishedAt && (
                    <span>{formatDate(article.publishedAt)}</span>
                  )}
                </div>

                <span className="mt-4 text-teal-600 text-sm font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read Article
                </span>
              </div>
            </Link>
          </motion.article>
        )
      })}
    </motion.div>
  )
}
