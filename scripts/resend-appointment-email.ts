import dotenv from "dotenv"
import path from "path"
import bcrypt from "bcryptjs"

dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true })

function generateTempPassword(): string {
  return (
    Math.random().toString(36).substring(2, 10) +
    Math.random().toString(36).substring(2, 6).toUpperCase() +
    "1!"
  )
}

async function main() {
  console.log("[1] loading prisma + email")
  const { prisma } = await import("../src/lib/prisma")
  const { sendAppointmentConfirmation } = await import("../src/lib/email")
  console.log("[2] modules loaded")

  const email = process.env.RESEND_PATIENT_EMAIL || "godisgreatoluwatobi98@gmail.com"

  const appointment = await prisma.appointment.findFirst({
    where: { patientEmail: email },
    orderBy: { createdAt: "desc" },
  })
  console.log("[3] appointment:", appointment?.id ?? "NOT FOUND")

  if (!appointment) {
    console.error(`No appointment found for ${email}`)
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  console.log("[4] user:", user?.id ?? "NOT FOUND")

  const tempPassword = generateTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, isActive: true },
    })
    console.log(`[5] Password reset for existing user ${email}`)
  } else {
    await prisma.user.create({
      data: {
        email,
        name: appointment.patientName,
        passwordHash,
        isActive: true,
        role: "VIEWER",
      },
    })
    console.log(`[5] Created user ${email}`)
  }

  console.log("[6] sending email...")
  const result = await sendAppointmentConfirmation({
    patientName: appointment.patientName,
    patientEmail: appointment.patientEmail,
    date: appointment.date,
    time: appointment.time,
    service: appointment.service,
    tempPassword,
  })
  console.log("[7] Email result:", JSON.stringify(result))
  console.log("New temporary password:", tempPassword)

  await prisma.$disconnect()
  console.log("[8] done")
  process.exit(0)
}

main().catch((err) => {
  console.error("Resend failed:", err)
  process.exit(1)
})
