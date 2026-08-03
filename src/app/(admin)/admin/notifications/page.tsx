import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import NotificationsList from "./notifications-list"

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/admin/login")
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  })

  const serialized = notifications.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
    readAt: n.readAt?.toISOString() ?? null,
    sentAt: n.sentAt?.toISOString() ?? null,
    data: n.data as Record<string, unknown> | null,
    user: n.user,
  }))

  return (
    <NotificationsList
      initialNotifications={serialized}
      initialUnreadCount={unreadCount}
      currentUserId={session.user.id}
    />
  )
}
