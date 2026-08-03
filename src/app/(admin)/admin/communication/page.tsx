import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import CommunicationPanel from "./communication-panel"

export const dynamic = "force-dynamic"

export default async function CommunicationPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/admin/login")
  }

  const me = session.user.id

  const staff = await prisma.user.findMany({
    where: {
      role: { not: "VIEWER" },
      isActive: true,
      deletedAt: null,
      id: { not: me },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  })

  return <CommunicationPanel currentUserId={me} staff={staff} />
}
