"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { MessagesSquare, Send, Loader2, Users, Check, ChevronDown, ChevronUp } from "lucide-react"
import { ROLE_LABELS } from "@/lib/role-permissions"
import { cn } from "@/lib/utils"

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
}

interface Conversation {
  id: string
  lastMessageAt: string
  otherUser: StaffMember
  lastMessage: {
    body: string
    senderId: string
    createdAt: string
    isRead: boolean
  } | null
  unreadCount: number
}

interface ThreadMessage {
  id: string
  senderId: string
  body: string
  isRead: boolean
  createdAt: string
}

const ROLE_BADGES: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700",
  ADMIN: "bg-blue-100 text-blue-700",
  EDITOR: "bg-green-100 text-green-700",
  RECEPTIONIST: "bg-orange-100 text-orange-700",
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("")
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatListTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  if (sameDay) {
    return formatTime(iso)
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function CommunicationPanel({
  currentUserId,
  staff,
}: {
  currentUserId: string
  staff: StaffMember[]
}) {
  const searchParams = useSearchParams()
  const initialConversationId = searchParams.get("conversationId")

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId)
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [loadingThread, setLoadingThread] = useState(false)
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const threadEndRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/messages/conversations")
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
    } catch {
      // ignore
    } finally {
      setLoadingConversations(false)
    }
  }, [])

  const loadThread = useCallback(
    async (conversationId: string) => {
      if (loadingRef.current) return
      loadingRef.current = true
      try {
        const res = await fetch(`/api/admin/messages?conversationId=${conversationId}`)
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages || [])
          setConversations((prev) =>
            prev.map((c) =>
              c.id === conversationId ? { ...c, unreadCount: 0 } : c
            )
          )
        }
      } catch {
        // ignore
      } finally {
        loadingRef.current = false
      }
    },
    []
  )

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    const id = setInterval(loadConversations, 25000)
    return () => clearInterval(id)
  }, [loadConversations])

  useEffect(() => {
    if (!selectedId) return
    loadThread(selectedId)
    const id = setInterval(() => loadThread(selectedId), 4000)
    return () => clearInterval(id)
  }, [selectedId, loadThread])

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const openThread = useCallback(
    async (conversationId: string) => {
      setSelectedId(conversationId)
      loadThread(conversationId)
      loadConversations()
    },
    [loadThread, loadConversations]
  )

  async function handleSend() {
    if (!draft.trim() || !selectedId || sending) return
    const conversation = conversations.find((c) => c.id === selectedId)
    if (!conversation) return

    setSending(true)
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: conversation.otherUser.id,
          message: draft,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, data.message])
        setDraft("")
        loadConversations()
      }
    } catch {
      // ignore
    } finally {
      setSending(false)
    }
  }

  async function handleStartConversation(participant: StaffMember) {
    setPickerOpen(false)
    try {
      const res = await fetch("/api/admin/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: participant.id }),
      })
      if (res.ok) {
        const data = await res.json()
        await loadConversations()
        openThread(data.conversation.id)
      }
    } catch {
      // ignore
    }
  }

  const selected = conversations.find((c) => c.id === selectedId) || null
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  return (
    <div className="h-[calc(100vh-180px)] min-h-[480px] flex gap-4">
      {/* Conversation list */}
      <div className="w-full sm:w-80 lg:w-96 shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Communication</h1>
            <p className="text-xs text-gray-500">
              {totalUnread > 0 ? `${totalUnread} unread` : "Private staff messaging"}
            </p>
          </div>
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700"
          >
            <Users className="h-3.5 w-3.5" />
            New Message
          </button>
        </div>

        {pickerOpen && (
          <div className="border-b border-gray-100 max-h-52 overflow-y-auto">
            <p className="px-4 pt-3 text-[11px] font-medium text-gray-400 uppercase">
              Select a staff member
            </p>
            <div className="py-1">
              {staff.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleStartConversation(s)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold shrink-0">
                    {initials(s.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                    <p className="text-xs text-gray-500 truncate">{s.email}</p>
                  </div>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", ROLE_BADGES[s.role] || "bg-gray-100 text-gray-600")}>
                    {ROLE_LABELS[s.role] || s.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loadingConversations && conversations.length === 0 ? (
            <div className="py-12 text-center">
              <Loader2 className="h-7 w-7 text-gray-300 animate-spin mx-auto" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-12 text-center px-4">
              <MessagesSquare className="h-10 w-10 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-500 mt-3">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">Start a message with any staff member</p>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => openThread(c.id)}
                className={cn(
                  "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                  selectedId === c.id && "bg-primary-50/60"
                )}
              >
                <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold shrink-0">
                  {initials(c.otherUser.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.otherUser.name}</p>
                    {c.lastMessage && (
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {formatListTime(c.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className={cn("text-xs mt-0.5 truncate", c.unreadCount > 0 ? "text-gray-800 font-semibold" : "text-gray-500")}>
                    {c.lastMessage
                      ? `${c.lastMessage.senderId === currentUserId ? "You: " : ""}${c.lastMessage.body}`
                      : "No messages yet"}
                  </p>
                </div>
                {c.unreadCount > 0 && (
                  <span className="min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 shrink-0 mt-0.5">
                    {c.unreadCount}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 min-w-0 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {selected ? (
          <>
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold shrink-0">
                {initials(selected.otherUser.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{selected.otherUser.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {selected.otherUser.email}
                </p>
              </div>
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", ROLE_BADGES[selected.otherUser.role] || "bg-gray-100 text-gray-600")}>
                {ROLE_LABELS[selected.otherUser.role] || selected.otherUser.role}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50/50">
              {loadingThread && messages.length === 0 ? (
                <div className="py-12 text-center">
                  <Loader2 className="h-7 w-7 text-gray-300 animate-spin mx-auto" />
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center">
                  <MessagesSquare className="h-9 w-9 text-gray-300 mx-auto" />
                  <p className="text-sm text-gray-500 mt-3">Say hello to {selected.otherUser.name.split(" ")[0]}</p>
                </div>
              ) : (
                messages.map((m) => {
                  const mine = m.senderId === currentUserId
                  return (
                    <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
                          mine
                            ? "bg-primary-600 text-white rounded-br-md"
                            : "bg-white border border-gray-100 text-gray-800 rounded-bl-md"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <div className={cn("flex items-center gap-1 mt-1 text-[10px]", mine ? "text-primary-200 justify-end" : "text-gray-400")}>
                          <span>{formatTime(m.createdAt)}</span>
                          {mine && m.isRead && (
                            <span className="inline-flex items-center gap-0.5 text-primary-100">
                              <Check className="h-3 w-3" /> Read
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={threadEndRef} />
            </div>

            <div className="px-4 py-3 border-t border-gray-100 flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                rows={1}
                placeholder={`Message ${selected.otherUser.name.split(" ")[0]}...`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none max-h-32"
              />
              <button
                onClick={handleSend}
                disabled={sending || !draft.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <MessagesSquare className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mt-4">Select a conversation</h2>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              Choose a conversation from the list or start a new message with any staff member.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
