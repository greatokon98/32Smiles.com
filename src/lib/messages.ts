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
