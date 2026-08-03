import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = passwordSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Cannot change password for social login accounts" },
        { status: 400 }
      )
    }

    const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    const newHash = await bcrypt.hash(data.newPassword, 12)

    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newHash },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
  }
}
