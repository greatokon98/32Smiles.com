import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { guardPermission } from "@/lib/require-permission-route"
import { sendContactReply } from "@/lib/email"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await guardPermission("contacts", "update")
  if (response) return response

  try {
    const { id } = await params
    const body = await request.json()
    const { message } = body as { message?: string }

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Reply message is required" },
        { status: 400 }
      )
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: "Reply message is too long" },
        { status: 400 }
      )
    }

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

    const result = await sendContactReply({
      toName: submission.name,
      toEmail: submission.email,
      subject: submission.subject,
      message: message.trim(),
    })

    if (!result.success && result.error) {
      return NextResponse.json(
        { error: `Failed to send reply email: ${result.error}` },
        { status: 502 }
      )
    }

    const updated = await prisma.contactSubmission.update({
      where: { id },
      data: {
        isReplied: true,
        repliedAt: new Date(),
        repliedById: session.user.id,
        lastReply: message.trim(),
      },
      select: {
        id: true,
        isReplied: true,
        repliedAt: true,
        lastReply: true,
      },
    })

    return NextResponse.json({
      ...updated,
      repliedAt: updated.repliedAt ? updated.repliedAt.toISOString() : null,
    })
  } catch (error) {
    console.error("[API] Contact reply error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
