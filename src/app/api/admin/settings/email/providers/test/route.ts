import { NextRequest, NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"
import { guardPermission } from "@/lib/require-permission-route"

export async function POST(request: NextRequest) {
  const { response } = await guardPermission("settings", "update")
  if (response) return response

  try {
    const body = await request.json()
    const { to, subject, body: emailBody } = body as {
      to: string
      subject: string
      body: string
    }

    if (!to) {
      return NextResponse.json({ error: "Recipient email is required" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json({ error: "Invalid recipient email address" }, { status: 400 })
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Email</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background-color:#0891b2;padding:24px 32px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="color:#ffffff;font-size:24px;margin:0;font-weight:700;">32Smiles Dental Clinic</h1>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;padding:32px;border-radius:0 0 12px 12px;">
              <h2 style="color:#111827;font-size:20px;margin:0 0 8px;">${subject || "Test Email"}</h2>
              <div style="color:#374151;font-size:14px;line-height:1.6;margin:24px 0;white-space:pre-wrap;">${emailBody || "(no content)"}</div>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
              <p style="color:#6b7280;font-size:12px;margin:0;">This is a test email from the 32Smiles admin panel.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    const result = await sendEmail({
      to,
      subject: subject || "Test Email from 32Smiles",
      html,
    })

    if (result.success) {
      return NextResponse.json({ success: true, id: result.id })
    }

    return NextResponse.json({
      success: false,
      error: result.error || "Failed to send test email. Check your email provider configuration.",
    }, { status: 500 })
  } catch (error) {
    console.error("[API] Test email error:", error)
    const message = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
