import prisma from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import type { NotificationType } from "@prisma/client"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
const FROM_EMAIL = process.env.EMAIL_FROM || "great.okon98@gmail.com"
const APP_NAME = "32Smiles Dental Clinic"

function baseTemplate(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background-color:#0891b2;padding:24px 32px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="color:#ffffff;font-size:24px;margin:0;font-weight:700;">${APP_NAME}</h1>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;padding:32px;border-radius:0 0 12px 12px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:24px;text-align:center;">
              <p style="color:#9ca3af;font-size:12px;margin:0;">
                &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br/>
                This is an automated message, please do not reply directly.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function notifyOrderStatusChange(
  order: {
    id: string
    orderNumber: string
    customerEmail: string
    customerName: string
  },
  newStatus: string
) {
  const label = newStatus.charAt(0).toUpperCase() + newStatus.slice(1).toLowerCase()
  const title = `Order ${label}`
  const messages: Record<string, string> = {
    CONFIRMED: "Your order has been confirmed and is being processed.",
    PROCESSING: "Your order is currently being processed.",
    SHIPPED: "Your order has been shipped and is on its way!",
    DELIVERED: "Your order has been delivered. Thank you for your purchase!",
    CANCELLED: "Your order has been cancelled. If you have any questions, please contact us.",
  }
  const message = messages[newStatus] || `Your order #${order.orderNumber} status has been updated to ${label}.`

  try {
    const user = await prisma.user.findUnique({
      where: { email: order.customerEmail },
      select: { id: true },
    })
    if (user) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "SYSTEM_ALERT" as NotificationType,
          channel: "IN_APP",
          title,
          message,
          data: { orderId: order.id, orderNumber: order.orderNumber, status: newStatus },
        },
      })
    }
  } catch (e) {
    console.error("[Notify] Failed to create in-app notification:", e)
  }

  try {
    const statusColor: Record<string, string> = {
      CONFIRMED: "#f0fdfa",
      PROCESSING: "#eff6ff",
      SHIPPED: "#fef3c7",
      DELIVERED: "#f0fdfa",
      CANCELLED: "#fef2f2",
    }
    const borderColor: Record<string, string> = {
      CONFIRMED: "#99f6e4",
      PROCESSING: "#bfdbfe",
      SHIPPED: "#fde68a",
      DELIVERED: "#99f6e4",
      CANCELLED: "#fecaca",
    }

    const content = `
      <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">${title}</h2>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">Hello ${order.customerName},</p>
      <div style="background-color:${statusColor[newStatus] || "#f9fafb"};border:1px solid ${borderColor[newStatus] || "#e5e7eb"};border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="color:#374151;font-size:14px;margin:0;line-height:1.6;">${message}</p>
      </div>
      <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
        <p style="color:#6b7280;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Order Number</p>
        <p style="color:#0891b2;font-size:20px;font-weight:700;margin:0;">${order.orderNumber}</p>
      </div>
      <div style="text-align:center;">
        <a href="${APP_URL}/dashboard/orders" style="display:inline-block;background-color:#0891b2;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View Order</a>
      </div>
    `

    await sendEmail({
      to: order.customerEmail,
      subject: `Order #${order.orderNumber} - ${label}`,
      html: baseTemplate(title, content),
    })
  } catch (e) {
    console.error("[Notify] Failed to send order status email:", e)
  }
}

export async function notifyAppointmentStatusChange(
  appointment: {
    id: string
    patientEmail: string
    patientName: string
    date: Date
    time: string
    service: string | null
  },
  newStatus: string
) {
  const typeMap: Record<string, string> = {
    CONFIRMED: "APPOINTMENT_CONFIRMED",
    CANCELLED: "APPOINTMENT_CANCELLED",
    COMPLETED: "APPOINTMENT_UPDATED",
    NO_SHOW: "APPOINTMENT_UPDATED",
  }
  const titleMap: Record<string, string> = {
    CONFIRMED: "Appointment Confirmed",
    CANCELLED: "Appointment Cancelled",
    COMPLETED: "Appointment Completed",
    NO_SHOW: "Appointment Marked No-Show",
  }
  const messages: Record<string, string> = {
    CONFIRMED: "Your appointment has been confirmed.",
    CANCELLED: "Your appointment has been cancelled.",
    COMPLETED: "Your appointment has been completed.",
    NO_SHOW: "Your appointment has been marked as no-show.",
  }

  const title = titleMap[newStatus] || "Appointment Updated"
  const message = messages[newStatus] || `Your appointment status has been updated to ${newStatus.toLowerCase()}.`
  const dateStr = new Date(appointment.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  try {
    const user = await prisma.user.findUnique({
      where: { email: appointment.patientEmail },
      select: { id: true },
    })
    if (user) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: (typeMap[newStatus] || "APPOINTMENT_UPDATED") as NotificationType,
          channel: "IN_APP",
          title,
          message,
          data: { appointmentId: appointment.id, status: newStatus },
        },
      })
    }
  } catch (e) {
    console.error("[Notify] Failed to create in-app notification:", e)
  }

  try {
    const statusColor: Record<string, string> = {
      CONFIRMED: "#f0fdfa",
      CANCELLED: "#fef2f2",
      COMPLETED: "#f0fdfa",
      NO_SHOW: "#fef3c7",
    }
    const borderColor: Record<string, string> = {
      CONFIRMED: "#99f6e4",
      CANCELLED: "#fecaca",
      COMPLETED: "#99f6e4",
      NO_SHOW: "#fde68a",
    }

    const content = `
      <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">${title}</h2>
      <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">Hello ${appointment.patientName},</p>
      <div style="background-color:${statusColor[newStatus] || "#f9fafb"};border:1px solid ${borderColor[newStatus] || "#e5e7eb"};border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="color:#374151;font-size:14px;margin:0;line-height:1.6;">${message}</p>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;">
        <tr>
          <td style="padding:20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0;color:#6b7280;font-size:13px;width:100px;">Date</td>
                <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">${dateStr}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#6b7280;font-size:13px;">Time</td>
                <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">${appointment.time}</td>
              </tr>
              ${appointment.service ? `
              <tr>
                <td style="padding:6px 0;color:#6b7280;font-size:13px;">Service</td>
                <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">${appointment.service}</td>
              </tr>` : ""}
            </table>
          </td>
        </tr>
      </table>
      <div style="text-align:center;">
        <a href="${APP_URL}/dashboard/appointments" style="display:inline-block;background-color:#0891b2;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View Appointments</a>
      </div>
    `

    await sendEmail({
      to: appointment.patientEmail,
      subject: title,
      html: baseTemplate(title, content),
    })
  } catch (e) {
    console.error("[Notify] Failed to send appointment status email:", e)
  }
}
