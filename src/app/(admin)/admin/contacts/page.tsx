import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import ContactList from "./contact-list"

export const dynamic = "force-dynamic"

export default async function ContactsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/admin/login")
  }

  const submissions = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      subject: true,
      message: true,
      isRead: true,
      isReplied: true,
      repliedAt: true,
      lastReply: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  const serialized = submissions.map((s) => ({
    ...s,
    repliedAt: s.repliedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }))

  return <ContactList initialSubmissions={serialized} />
}
