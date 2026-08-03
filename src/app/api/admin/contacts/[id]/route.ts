import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { guardPermission } from "@/lib/require-permission-route"
import { ROLE_LABELS } from "@/lib/role-permissions"
import { sendContactAssignmentEmail } from "@/lib/email"

const NOTE_ROLE_REGEX = /\b(super\s*admins?|receptions?ists?|editors?|admins?)\b/gi

function extractMentionedRoles(note: string): string[] {
  const roles = new Set<string>()
  let match: RegExpExecArray | null
  NOTE_ROLE_REGEX.lastIndex = 0
  while ((match = NOTE_ROLE_REGEX.exec(note)) !== null) {
    const word = match[1].toLowerCase()
    let role: string
    if (word.startsWith("super")) role = "SUPER_ADMIN"
    else if (word.startsWith("reception")) role = "RECEPTIONIST"
    else if (word.startsWith("editor")) role = "EDITOR"
    else role = "ADMIN"
    roles.add(role)
  }
  return Array.from(roles)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await guardPermission("contacts", "update")
  if (response) return response

  try {
    const { id } = await params
    const body = await request.json()
    const { isRead, notes } = body as { isRead?: boolean; notes?: string }

    const submission = await prisma.contactSubmission.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        subject: true,
      },
    })

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    const notesChanged = typeof notes === "string"

    if (typeof isRead === "boolean") {
      updateData.isRead = isRead
    }

    if (notesChanged) {
      updateData.notes = notes || null
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      )
    }

    const updated = await prisma.contactSubmission.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        isRead: true,
        notes: true,
        updatedAt: true,
      },
    })

    if (notesChanged && notes && notes.trim()) {
      const mentionedRoles = extractMentionedRoles(notes)
      if (mentionedRoles.length > 0) {
        try {
          for (const role of mentionedRoles) {
            const recipients = await prisma.user.findMany({
              where: {
                role,
                isActive: true,
                deletedAt: null,
                id: { not: session.user.id },
              },
              select: { id: true, name: true, email: true },
            })
            if (recipients.length === 0) continue

            const roleLabel = ROLE_LABELS[role] || role
            const title = `Action required: Contact assigned to ${roleLabel}`
            const message = `${submission.name} — "${submission.subject}". ${notes}`

            await prisma.notification.createMany({
              data: recipients.map((r) => ({
                userId: r.id,
                type: "CONTACT_ASSIGNED",
                channel: "IN_APP",
                title,
                message,
                data: {
                  contactId: submission.id,
                  contactSubject: submission.subject,
                  role,
                },
              })),
            })

            for (const recipient of recipients) {
              try {
                await sendContactAssignmentEmail({
                  toName: recipient.name || roleLabel,
                  toEmail: recipient.email,
                  roleLabel,
                  contactName: submission.name,
                  contactEmail: submission.email,
                  contactSubject: submission.subject,
                  note: notes,
                })
              } catch (emailError) {
                console.error("[API] Contact assignment email failed:", emailError)
              }
            }
          }
        } catch (dispatchError) {
          console.error("[API] Contact assignment dispatch error:", dispatchError)
        }
      }
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[API] Contact update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
