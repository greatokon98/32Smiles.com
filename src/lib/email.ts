import { Resend } from "resend"
import nodemailer from "nodemailer"
import { formatCurrency } from "@/lib/utils"

let resendInstance: Resend | null = null
let transporterInstance: nodemailer.Transporter | null = null

async function getResend(): Promise<Resend | null> {
  if (resendInstance) return resendInstance
  let apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    try {
      const { default: prisma } = await import("@/lib/prisma")
      const setting = await prisma.setting.findUnique({
        where: { key: "RESEND_API_KEY" },
        select: { value: true },
      })
      if (setting?.value) {
        apiKey = setting.value
        process.env.RESEND_API_KEY = apiKey
      }
    } catch (e) {
      console.error("[Email] Failed to load Resend API key from DB:", e)
    }
  }
  if (apiKey) {
    resendInstance = new Resend(apiKey)
  }
  return resendInstance
}

async function getTransporter(): Promise<nodemailer.Transporter | null> {
  if (transporterInstance) return transporterInstance

  let host = process.env.SMTP_HOST
  let port = process.env.SMTP_PORT
  let secure = process.env.SMTP_SECURE
  let user = process.env.SMTP_USER
  let pass = process.env.SMTP_PASS
  let from = process.env.SMTP_FROM

  if (!host) {
    try {
      const { default: prisma } = await import("@/lib/prisma")
      const dbSettings = await prisma.setting.findMany({
        where: { key: { in: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM", "SMTP_SECURE"] } },
        select: { key: true, value: true },
      })
      const dbMap: Record<string, string> = {}
      for (const s of dbSettings) {
        dbMap[s.key] = s.value
      }
      host = dbMap.SMTP_HOST || host
      port = dbMap.SMTP_PORT || port
      secure = dbMap.SMTP_SECURE || secure
      user = dbMap.SMTP_USER || user
      pass = dbMap.SMTP_PASS || pass
      from = dbMap.SMTP_FROM || from
    } catch (e) {
      console.error("[Email] Failed to load SMTP config from DB:", e)
    }
  }

  if (!host) return null

  transporterInstance = nodemailer.createTransport({
    host,
    port: parseInt(port || "587", 10),
    secure: secure === "true",
    auth: { user: user || "", pass: pass || "" },
  })
  if (from) process.env.SMTP_FROM = from
  return transporterInstance
}

async function getFromEmail(): Promise<string> {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM
  try {
    const { default: prisma } = await import("@/lib/prisma")
    const setting = await prisma.setting.findUnique({
      where: { key: "EMAIL_FROM" },
      select: { value: true },
    })
    if (setting?.value) return setting.value
  } catch {}
  return "great.okon98@gmail.com"
}
const APP_NAME = "32Smiles Dental Clinic"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://32smiless.vercel.app"

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW = 60 * 1000

setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, RATE_LIMIT_WINDOW)

function checkRateLimit(email: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(email)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(email, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }

  record.count++
  return true
}

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  replyTo?: string
}

interface EmailResult {
  id: string | null
  success: boolean
  error?: string
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const recipients = Array.isArray(options.to) ? options.to : [options.to]

  for (const recipient of recipients) {
    if (!checkRateLimit(recipient)) {
      console.error(`[Email] Rate limit exceeded for ${recipient}`)
      return {
        id: null,
        success: false,
        error: `Rate limit exceeded for ${recipient}. Maximum ${RATE_LIMIT_MAX} emails per minute.`,
      }
    }
  }

  const fromEmail = await getFromEmail()
  const transporter = await getTransporter()
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromEmail,
        to: recipients.join(", "),
        subject: options.subject,
        html: options.html,
        replyTo: options.replyTo,
      })

      console.log(`[Email] Sent via SMTP to ${recipients.join(", ")} | ID: ${info.messageId}`)
      return { id: info.messageId || null, success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      console.error("[Email] SMTP send failed:", message)
      return { id: null, success: false, error: `SMTP: ${message}` }
    }
  }

  const resend = await getResend()
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: fromEmail,
        to: recipients,
        subject: options.subject,
        html: options.html,
        replyTo: options.replyTo,
      })

      if (result.error) {
        const message =
          typeof result.error === "object" && result.error !== null && "message" in result.error
            ? String((result.error as { message: unknown }).message)
            : String(result.error)
        console.error("[Email] Resend send failed:", result.error)
        return { id: null, success: false, error: `Resend: ${message}` }
      }

      console.log(`[Email] Sent via Resend to ${recipients.join(", ")} | ID: ${result.data?.id}`)
      return { id: result.data?.id ?? null, success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      console.error("[Email] Resend exception:", message)
      return { id: null, success: false, error: `Resend: ${message}` }
    }
  }

  console.warn(`[Email] No email provider configured (Resend or SMTP). Email NOT sent to: ${recipients.join(", ")}, Subject: ${options.subject}`)
  if (process.env.NODE_ENV === "development") {
    return { id: "dev-mode", success: true }
  }
  return { id: null, success: false, error: "No email provider configured" }
}

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

interface AppointmentDetails {
  patientName: string
  patientEmail: string
  date: Date | string
  time: string
  service?: string | null
  tempPassword?: string
}

export async function sendAppointmentConfirmation(
  appointment: AppointmentDetails
): Promise<EmailResult> {
  const dateStr = new Date(appointment.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const content = `
    <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">Appointment Confirmed</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">Thank you, ${appointment.patientName}. Your appointment has been booked.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;margin-bottom:24px;">
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
    ${appointment.tempPassword ? `
    <div style="background-color:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#0f766e;font-size:14px;font-weight:600;margin:0 0 8px;">Your Account Has Been Created</p>
      <p style="color:#374151;font-size:13px;margin:0 0 4px;">Email: ${appointment.patientEmail}</p>
      <p style="color:#374151;font-size:13px;margin:0 0 4px;">Temporary password: ${appointment.tempPassword}</p>
      <p style="color:#6b7280;font-size:12px;margin:8px 0 0;">You can log in at <a href="${APP_URL}/admin/login" style="color:#0891b2;text-decoration:underline;">${APP_URL}/admin/login</a> and change your password from your profile. Track your appointments from your dashboard.</p>
    </div>` : ""}
    <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">
      If you need to reschedule or cancel, please call us or reply to this email at least 24 hours before your appointment.
    </p>
    <div style="text-align:center;margin-top:24px;">
      <a href="${APP_URL}" style="display:inline-block;background-color:#0891b2;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Visit Our Website</a>
    </div>
  `

  return sendEmail({
    to: appointment.patientEmail,
    subject: `Appointment Confirmed - ${dateStr} at ${appointment.time}`,
    html: baseTemplate("Appointment Confirmation", content),
  })
}

interface ContactFormDetails {
  name: string
  email: string
  phone?: string | null
  subject: string
  message: string
}

interface ContactAssignmentDetails {
  toName: string
  toEmail: string
  roleLabel: string
  contactName: string
  contactEmail: string
  contactSubject: string
  note: string
}

export async function sendContactAssignmentEmail(
  details: ContactAssignmentDetails
): Promise<EmailResult> {
  const content = `
    <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">Action Required: Contact Assigned to You</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">Hello ${details.toName}, a contact submission has been assigned to the <strong>${details.roleLabel}</strong> team. Please attend to it.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef3c7;border:1px solid #fde68a;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;width:100px;">From</td>
              <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">${details.contactName}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;">Email</td>
              <td style="padding:6px 0;color:#111827;font-size:14px;"><a href="mailto:${details.contactEmail}" style="color:#0891b2;">${details.contactEmail}</a></td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;">Subject</td>
              <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">${details.contactSubject}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;">Instruction</p>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap;">${details.note}</p>
    </div>
    <div style="text-align:center;">
      <a href="${APP_URL}/admin/contacts" style="display:inline-block;background-color:#0891b2;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Open in Admin</a>
    </div>
  `

  return sendEmail({
    to: details.toEmail,
    replyTo: details.contactEmail,
    subject: `Action Required: ${details.contactSubject} (assigned to ${details.roleLabel})`,
    html: baseTemplate("Contact Assigned", content),
  })
}

export async function sendContactReply(
  details: {
    toName: string
    toEmail: string
    subject: string
    message: string
  }
): Promise<EmailResult> {
  const content = `
    <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">Re: ${details.subject}</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">Hello ${details.toName},</p>
    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap;">${details.message}</p>
    </div>
    <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">
      Thank you for contacting ${APP_NAME}. If you have any further questions, please reply to this email.
    </p>
  `

  return sendEmail({
    to: details.toEmail,
    subject: `Re: ${details.subject}`,
    html: baseTemplate("Reply", content),
  })
}

export async function sendContactFormNotification(
  submission: ContactFormDetails,
  adminEmail: string
): Promise<EmailResult> {
  const content = `
    <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">New Contact Submission</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">A new message has been submitted through the contact form.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef3c7;border:1px solid #fde68a;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;width:100px;">From</td>
              <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">${submission.name}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;">Email</td>
              <td style="padding:6px 0;color:#111827;font-size:14px;"><a href="mailto:${submission.email}" style="color:#0891b2;">${submission.email}</a></td>
            </tr>
            ${submission.phone ? `
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;">Phone</td>
              <td style="padding:6px 0;color:#111827;font-size:14px;"><a href="tel:${submission.phone}" style="color:#0891b2;">${submission.phone}</a></td>
            </tr>` : ""}
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;">Subject</td>
              <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">${submission.subject}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;">Message</p>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap;">${submission.message}</p>
    </div>
    <div style="text-align:center;">
      <a href="${APP_URL}/admin/contacts" style="display:inline-block;background-color:#0891b2;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View in Admin</a>
    </div>
  `

  return sendEmail({
    to: adminEmail,
    replyTo: submission.email,
    subject: `New Contact: ${submission.subject}`,
    html: baseTemplate("New Contact Submission", content),
  })
}

interface OrderConfirmationDetails {
  customerName: string
  customerEmail: string
  orderNumber: string
  items: { title: string; quantity: number; price: number }[]
  total: number
  deliveryAddress: string
  currency?: string
  tempPassword?: string
}

export async function sendOrderConfirmation(
  order: OrderConfirmationDetails
): Promise<EmailResult> {
  const currency = order.currency || "NGN"
  const itemsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:14px;">${item.title}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:14px;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:14px;text-align:right;">${formatCurrency(item.price, currency)}</td>
    </tr>`
    )
    .join("")

  const content = `
    <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">Order Confirmed</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">Thank you, ${order.customerName}. Your order has been placed successfully.</p>
    <div style="background-color:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:16px 20px;margin-bottom:24px;text-align:center;">
      <p style="color:#6b7280;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.05em;">Order Number</p>
      <p style="color:#0891b2;font-size:24px;font-weight:700;margin:0;">${order.orderNumber}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;">
      <thead>
        <tr>
          <th style="padding:10px 12px;background-color:#f9fafb;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;text-align:left;border-bottom:2px solid #e5e7eb;">Item</th>
          <th style="padding:10px 12px;background-color:#f9fafb;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;text-align:center;border-bottom:2px solid #e5e7eb;">Qty</th>
          <th style="padding:10px 12px;background-color:#f9fafb;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;text-align:right;border-bottom:2px solid #e5e7eb;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding:10px 12px;border-top:2px solid #e5e7eb;color:#374151;font-size:14px;font-weight:600;text-align:right;">Total</td>
          <td style="padding:10px 12px;border-top:2px solid #e5e7eb;color:#0891b2;font-size:16px;font-weight:700;text-align:right;">${formatCurrency(order.total, currency)}</td>
        </tr>
      </tfoot>
    </table>
    <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#6b7280;font-size:12px;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Delivery Address</p>
      <p style="color:#374151;font-size:14px;margin:0;line-height:1.5;">${order.deliveryAddress}</p>
    </div>
    ${order.tempPassword ? `
    <div style="background-color:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#6b7280;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Your account has been created</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:4px 0;color:#6b7280;font-size:13px;width:100px;">Email</td>
          <td style="padding:4px 0;color:#111827;font-size:14px;font-weight:600;">${order.customerEmail}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#6b7280;font-size:13px;">Temporary password</td>
          <td style="padding:4px 0;color:#111827;font-size:14px;font-weight:600;">${order.tempPassword}</td>
        </tr>
      </table>
      <p style="color:#6b7280;font-size:13px;margin:8px 0 0;line-height:1.5;">
        You can log in at <a href="${APP_URL}/admin/login" style="color:#0891b2;">${APP_URL}/admin/login</a> and change your password from your profile.
      </p>
    </div>` : ""}
    <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">
      We'll notify you when your order ships. If you have any questions, please contact our support team.
    </p>
    <div style="text-align:center;margin-top:24px;">
      <a href="${APP_URL}/order/confirmation/${order.orderNumber}" style="display:inline-block;background-color:#0891b2;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View Order</a>
    </div>
  `

  return sendEmail({
    to: order.customerEmail,
    subject: `Order Confirmed - ${order.orderNumber}`,
    html: baseTemplate("Order Confirmation", content),
  })
}

interface PasswordResetDetails {
  name: string
  email: string
  newPassword: string
}

export async function sendPasswordResetEmail(
  details: PasswordResetDetails
): Promise<EmailResult> {
  const content = `
    <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">Password Reset</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">Hello ${details.name},</p>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">Your password has been reset by an administrator. Here are your new login credentials:</p>
    <div style="background-color:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="color:#111827;font-size:14px;margin:0 0 8px;"><strong>Email:</strong> ${details.email}</p>
      <p style="color:#111827;font-size:14px;margin:0 0 8px;"><strong>New Password:</strong> <code style="background:#e5e7eb;padding:2px 6px;border-radius:4px;font-size:14px;">${details.newPassword}</code></p>
    </div>
    <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 16px;">
      Please log in and change your password immediately after logging in.
    </p>
    <div style="text-align:center;margin-top:24px;">
      <a href="${APP_URL}/admin/login" style="display:inline-block;background-color:#0891b2;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Log In Now</a>
    </div>
  `

  return sendEmail({
    to: details.email,
    subject: "Your password has been reset",
    html: baseTemplate("Password Reset", content),
  })
}

export async function sendAppointmentReminder(
  appointment: AppointmentDetails
): Promise<EmailResult> {
  const dateStr = new Date(appointment.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const content = `
    <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">Appointment Reminder</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">This is a friendly reminder about your upcoming appointment.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;width:100px;">Patient</td>
              <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">${appointment.patientName}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;">Date</td>
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
    <div style="background-color:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="color:#92400e;font-size:13px;margin:0;line-height:1.5;">
        <strong>Please arrive 10 minutes early</strong> to complete any necessary paperwork. If you need to reschedule or cancel, please contact us as soon as possible.
      </p>
    </div>
    <div style="text-align:center;">
      <a href="tel:${APP_URL}" style="display:inline-block;background-color:#0891b2;color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Contact Us</a>
    </div>
  `

  return sendEmail({
    to: appointment.patientEmail,
    subject: `Reminder: Appointment on ${dateStr} at ${appointment.time}`,
    html: baseTemplate("Appointment Reminder", content),
  })
}
