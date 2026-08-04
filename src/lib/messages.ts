export function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a]
}

export interface MessageParticipant {
  id: string
  name: string
  email: string
  role: string
}

export function getOtherParticipant(
  conversation: {
    userAId: string
    userBId: string
    userA: MessageParticipant
    userB: MessageParticipant
  },
  userId: string
): MessageParticipant {
  const other = conversation.userAId === userId ? conversation.userB : conversation.userA
  return { id: other.id, name: other.name, email: other.email, role: other.role }
}

export type SerializedMessage = {
  id: string
  senderId: string
  body: string
  isRead: boolean
  deliveredAt: string | null
  readAt: string | null
  editedAt: string | null
  deletedAt: string | null
  createdAt: string
  replyTo: {
    id: string
    senderId: string
    body: string
    createdAt: string
  } | null
}

export const messageSelect = {
  id: true,
  senderId: true,
  body: true,
  isRead: true,
  deliveredAt: true,
  readAt: true,
  editedAt: true,
  deletedAt: true,
  createdAt: true,
  replyTo: {
    select: { id: true, senderId: true, body: true, createdAt: true },
  },
} as const

export function serializeMessage(m: {
  id: string
  senderId: string
  body: string
  isRead: boolean
  deliveredAt: Date | null
  readAt: Date | null
  editedAt: Date | null
  deletedAt: Date | null
  createdAt: Date
  replyTo: { id: string; senderId: string; body: string; createdAt: Date } | null
}): SerializedMessage {
  return {
    id: m.id,
    senderId: m.senderId,
    body: m.body,
    isRead: m.isRead,
    deliveredAt: m.deliveredAt ? m.deliveredAt.toISOString() : null,
    readAt: m.readAt ? m.readAt.toISOString() : null,
    editedAt: m.editedAt ? m.editedAt.toISOString() : null,
    deletedAt: m.deletedAt ? m.deletedAt.toISOString() : null,
    createdAt: m.createdAt.toISOString(),
    replyTo: m.replyTo
      ? {
          id: m.replyTo.id,
          senderId: m.replyTo.senderId,
          body: m.replyTo.body,
          createdAt: m.replyTo.createdAt.toISOString(),
        }
      : null,
  }
}
