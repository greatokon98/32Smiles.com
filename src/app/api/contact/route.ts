import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

// POST /api/contact - Submit contact form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = contactSchema.parse(body)

    // Check for spam (simple rate limit by email)
    const recentSubmission = await prisma.contactSubmission.findFirst({
      where: {
        email: data.email,
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }, // 5 minutes
      },
    })

    if (recentSubmission) {
      return NextResponse.json(
        { error: "Please wait a few minutes before submitting again" },
        { status: 429 }
      )
    }

    const submission = await prisma.contactSubmission.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
      },
    })

    return NextResponse.json(
      { success: true, id: submission.id },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error("[API] Contact form error:", error)
    return NextResponse.json(
      { error: "Failed to submit form" },
      { status: 500 }
    )
  }
}
