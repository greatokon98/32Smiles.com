"use client"

import { useState, useMemo } from "react"
import { Pagination } from "@/components/admin/pagination"
import {
  Search,
  Mail,
  MailOpen,
  User,
  Phone,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  StickyNote,
  CheckCircle,
  Circle,
  Send,
} from "lucide-react"

interface ContactSubmission {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  isRead: boolean
  isReplied: boolean
  repliedAt: string | null
  lastReply: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

type ReadFilter = "" | "unread" | "read"

const ITEMS_PER_PAGE = 15

export default function ContactList({
  initialSubmissions,
}: {
  initialSubmissions: ContactSubmission[]
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [search, setSearch] = useState("")
  const [readFilter, setReadFilter] = useState<ReadFilter>("")
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null)
  const [notesValue, setNotesValue] = useState("")
  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyValue, setReplyValue] = useState("")
  const [replySendingId, setReplySendingId] = useState<string | null>(null)
  const [replyError, setReplyError] = useState<string | null>(null)
  const [replySuccess, setReplySuccess] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let result = submissions

    if (readFilter === "unread") {
      result = result.filter((s) => !s.isRead)
    } else if (readFilter === "read") {
      result = result.filter((s) => s.isRead)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.subject.toLowerCase().includes(q)
      )
    }

    return result
  }, [submissions, search, readFilter])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  const unreadCount = submissions.filter((s) => !s.isRead).length

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  async function handleToggleRead(id: string) {
    setUpdatingId(id)
    try {
      const submission = submissions.find((s) => s.id === id)
      if (!submission) return

      const res = await fetch(`/api/admin/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: !submission.isRead }),
      })

      if (res.ok) {
        const updated = await res.json()
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, isRead: updated.isRead, updatedAt: updated.updatedAt } : s
          )
        )
      } else {
        const err = await res.json()
        alert(err.error || "Failed to update submission")
      }
    } catch {
      alert("Failed to update submission")
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleSaveNotes(id: string) {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesValue }),
      })

      if (res.ok) {
        const updated = await res.json()
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, notes: updated.notes, updatedAt: updated.updatedAt } : s
          )
        )
        setEditingNotesId(null)
      } else {
        const err = await res.json()
        alert(err.error || "Failed to save notes")
      }
    } catch {
      alert("Failed to save notes")
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleSendReply(id: string) {
    if (!replyValue.trim()) {
      setReplyError("Reply message is required")
      return
    }
    setReplySendingId(id)
    setReplyError(null)
    setReplySuccess(null)
    try {
      const res = await fetch(`/api/admin/contacts/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyValue }),
      })

      if (res.ok) {
        const updated = await res.json()
        const target = submissions.find((s) => s.id === id)
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  isReplied: updated.isReplied,
                  repliedAt: updated.repliedAt,
                  lastReply: updated.lastReply,
                  updatedAt: new Date().toISOString(),
                }
              : s
          )
        )
        setReplyValue("")
        setReplyingId(null)
        setReplySuccess(`Reply sent to ${target?.email}`)
      } else {
        const err = await res.json()
        setReplyError(err.error || "Failed to send reply")
      }
    } catch {
      setReplyError("Failed to send reply")
    } finally {
      setReplySendingId(null)
    }
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
    if (expandedId !== id) {
      const submission = submissions.find((s) => s.id === id)
      if (submission && !submission.isRead) {
        handleToggleRead(id)
      }
    }
  }

  function startEditNotes(submission: ContactSubmission) {
    setEditingNotesId(submission.id)
    setNotesValue(submission.notes || "")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Submissions</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filtered.length} submission{filtered.length !== 1 ? "s" : ""}
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-orange-600 font-medium">
                <Circle className="h-2 w-2 fill-orange-500" />
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or subject..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={readFilter}
          onChange={(e) => {
            setReadFilter(e.target.value as ReadFilter)
            setPage(1)
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        >
          <option value="">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {paginated.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-4">No submissions found</p>
          </div>
        ) : (
          <div className="divide-y">
            {paginated.map((submission) => {
              const isExpanded = expandedId === submission.id
              const isUpdating = updatingId === submission.id
              const isEditingNotes = editingNotesId === submission.id

              return (
                <div key={submission.id}>
                  <div
                    onClick={() => toggleExpand(submission.id)}
                    className={`flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !submission.isRead ? "bg-orange-50/40" : ""
                    }`}
                  >
                    <div className="shrink-0">
                      {!submission.isRead ? (
                        <Mail className="h-5 w-5 text-orange-500" />
                      ) : (
                        <MailOpen className="h-5 w-4 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm truncate ${
                            !submission.isRead ? "font-semibold text-gray-900" : "text-gray-700"
                          }`}
                        >
                          {submission.name}
                        </p>
                        <span className="text-xs text-gray-400 shrink-0">
                          {submission.email}
                        </span>
                      </div>
                      <p
                        className={`text-sm truncate mt-0.5 ${
                          !submission.isRead ? "font-medium text-gray-800" : "text-gray-500"
                        }`}
                      >
                        {submission.subject}
                      </p>
                    </div>

                    <div className="text-xs text-gray-400 shrink-0 hidden sm:block">
                      {formatDate(submission.createdAt)}
                    </div>

                    <div className="shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-5 bg-gray-50 border-t">
                      <div className="pt-4 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{submission.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <a
                              href={`mailto:${submission.email}`}
                              className="text-primary-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {submission.email}
                            </a>
                          </div>
                          {submission.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <a
                                href={`tel:${submission.phone}`}
                                className="text-primary-600 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {submission.phone}
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <FileText className="h-3.5 w-3.5" />
                          <span>Received {formatDateTime(submission.createdAt)}</span>
                          {submission.isReplied && (
                            <span className="ml-2 inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                              <CheckCircle className="h-3 w-3" />
                              Replied
                            </span>
                          )}
                        </div>

                        <div className="bg-white rounded-lg border p-4">
                          <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                            {submission.message}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <StickyNote className="h-4 w-4 text-gray-400" />
                            <span className="text-xs font-medium text-gray-500 uppercase">
                              Admin Notes
                            </span>
                          </div>
                          {isEditingNotes ? (
                            <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                              <textarea
                                value={notesValue}
                                onChange={(e) => setNotesValue(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                                placeholder="Add internal notes about this submission..."
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveNotes(submission.id)}
                                  disabled={isUpdating}
                                  className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 inline-flex items-center gap-1.5"
                                >
                                  {isUpdating && <Loader2 className="h-3 w-3 animate-spin" />}
                                  Save Notes
                                </button>
                                <button
                                  onClick={() => setEditingNotesId(null)}
                                  className="px-3 py-1.5 border text-gray-600 text-xs font-medium rounded-md hover:bg-gray-100"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="group"
                            >
                              {submission.notes ? (
                                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-sm text-gray-700">
                                  {submission.notes}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-400 italic">No notes yet</p>
                              )}
                              <button
                                onClick={() => startEditNotes(submission)}
                                className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                              >
                                {submission.notes ? "Edit Notes" : "Add Notes"}
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Send className="h-4 w-4 text-gray-400" />
                            <span className="text-xs font-medium text-gray-500 uppercase">
                              Respond to {submission.name}
                            </span>
                          </div>

                          {submission.isReplied && submission.lastReply && (
                            <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1.5">
                                <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                <span className="text-xs font-medium text-green-700">
                                  Replied{submission.repliedAt ? ` ${formatDateTime(submission.repliedAt)}` : ""}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {submission.lastReply}
                              </p>
                            </div>
                          )}

                          {replyingId === submission.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={replyValue}
                                onChange={(e) => {
                                  setReplyValue(e.target.value)
                                  setReplyError(null)
                                }}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                                placeholder={`Write a reply that will be emailed to ${submission.email}...`}
                              />
                              {replyError && (
                                <p className="text-xs text-red-600">{replyError}</p>
                              )}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSendReply(submission.id)}
                                  disabled={replySendingId === submission.id}
                                  className="px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 inline-flex items-center gap-1.5"
                                >
                                  {replySendingId === submission.id && (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  )}
                                  Send Reply
                                </button>
                                <button
                                  onClick={() => {
                                    setReplyingId(null)
                                    setReplyValue("")
                                    setReplyError(null)
                                  }}
                                  className="px-3 py-1.5 border text-gray-600 text-xs font-medium rounded-md hover:bg-gray-100"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setReplyingId(submission.id)
                                setReplyError(null)
                                setReplySuccess(null)
                              }}
                              className="text-xs text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
                            >
                              <Send className="h-3 w-3" />
                              {submission.isReplied ? "Send Another Reply" : "Reply to This Contact"}
                            </button>
                          )}

                          {replySuccess && replyingId !== submission.id && (
                            <p className="text-xs text-green-600">{replySuccess}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleToggleRead(submission.id)}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-medium rounded-md hover:bg-white disabled:opacity-50 text-gray-600"
                          >
                            {isUpdating ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : submission.isRead ? (
                              <Mail className="h-3 w-3" />
                            ) : (
                              <MailOpen className="h-3 w-3" />
                            )}
                            {submission.isRead ? "Mark Unread" : "Mark Read"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="border-t px-6 py-4 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  )
}
