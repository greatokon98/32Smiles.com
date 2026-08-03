"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Search } from "lucide-react"

interface FAQ {
  id: string
  question: string
  answer: string
  category: string | null
}

interface FAQListProps {
  groupedFaqs: Record<string, FAQ[]>
}

export default function FAQList({ groupedFaqs }: FAQListProps) {
  const [search, setSearch] = useState("")
  const [openId, setOpenId] = useState<string | null>(null)
  const categories = Object.keys(groupedFaqs)

  const filtered = categories.reduce((acc, cat) => {
    const items = groupedFaqs[cat].filter(
      (faq) =>
        faq.question.toLowerCase().includes(search.toLowerCase()) ||
        faq.answer.toLowerCase().includes(search.toLowerCase())
    )
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, FAQ[]>)

  return (
    <>
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-lg"
        />
      </div>

      {Object.entries(filtered).map(([category, faqs]) => (
        <div key={category} className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{category}</h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <div key={faq.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: openId === faq.id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0"
                  >
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openId === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-5 text-gray-600 border-t border-gray-700">
                        <p className="pt-4 whitespace-pre-line">{faq.answer}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      ))}

      {Object.keys(filtered).length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No questions found matching your search.</p>
        </div>
      )}
    </>
  )
}
