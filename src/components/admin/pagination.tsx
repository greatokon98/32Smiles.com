"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

type PaginationProps = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  function getPageNumbers(): (number | "...")[] {
    const pages: (number | "...")[] = []
    const showPages = new Set<number>()

    showPages.add(1)
    showPages.add(totalPages)
    showPages.add(page)
    if (page > 1) showPages.add(page - 1)
    if (page < totalPages) showPages.add(page + 1)

    const sorted = Array.from(showPages).sort((a, b) => a - b)

    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
        pages.push("...")
      }
      pages.push(sorted[i])
    }

    return pages
  }

  const btnBase = "inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors"

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={`${btnBase} text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {getPageNumbers().map((p, i) =>
        p === "..." ? (
          <span key={`e-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`${btnBase} ${
              p === page
                ? "bg-primary-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={`${btnBase} text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
