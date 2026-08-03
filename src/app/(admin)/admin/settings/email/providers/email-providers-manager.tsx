"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Mail, Server, Loader2, Save, CheckCircle, Send, ChevronDown, ChevronUp } from "lucide-react"

interface SmtpConfig {
  host: string
  port: string
  user: string
  pass: string
  from: string
  secure: string
}

interface EmailProvidersManagerProps {
  userEmail: string
  resendConfigured: boolean
  resendApiKey: string
  smtpConfig: SmtpConfig
}

export default function EmailProvidersManager({
  userEmail,
  resendConfigured,
  resendApiKey: initialResendKey,
  smtpConfig: initialSmtp,
}: EmailProvidersManagerProps) {
  const [activeTab, setActiveTab] = useState<"resend" | "smtp">("resend")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>(initialSmtp)
  const [resendKey, setResendKey] = useState("")

  const [testOpen, setTestOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [testTo, setTestTo] = useState(userEmail)
  const [testSubject, setTestSubject] = useState("Test Email from 32Smiles")
  const [testBody, setTestBody] = useState("Hello testing email — this is a test from 32Smiles.")

  function updateSmtpField(key: keyof SmtpConfig, value: string) {
    setSmtpConfig((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const settings: Record<string, string> = {}
      if (activeTab === "resend") {
        if (resendKey) settings.RESEND_API_KEY = resendKey
      } else {
        if (smtpConfig.host) settings.SMTP_HOST = smtpConfig.host
        if (smtpConfig.port) settings.SMTP_PORT = smtpConfig.port
        if (smtpConfig.user) settings.SMTP_USER = smtpConfig.user
        if (smtpConfig.pass) settings.SMTP_PASS = smtpConfig.pass
        if (smtpConfig.from) settings.SMTP_FROM = smtpConfig.from
        if (smtpConfig.secure) settings.SMTP_SECURE = smtpConfig.secure
      }

      const res = await fetch("/api/admin/settings/email/providers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeTab, settings }),
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        setResendKey("")
        toast.success("Email provider settings saved")
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to save")
      }
    } catch {
      toast.error("Failed to save email provider settings")
    } finally {
      setSaving(false)
    }
  }

  async function handleSendTest() {
    if (!testTo) {
      toast.error("Please enter a recipient email")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/admin/settings/email/providers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testTo, subject: testSubject, body: testBody }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success("Test email sent successfully!")
      } else {
        toast.error(data.error || "Failed to send test email")
      }
    } catch {
      toast.error("Failed to send test email")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Email Providers</h1>
        <p className="text-gray-500 text-sm mt-1">Configure your email sending providers</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => { setActiveTab("resend"); setSaved(false) }}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "resend"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Mail className="h-4 w-4" />
              Resend
            </button>
            <button
              onClick={() => { setActiveTab("smtp"); setSaved(false) }}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "smtp"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Server className="h-4 w-4" />
              SMTP
            </button>
          </nav>
        </div>

        <div className="p-6 space-y-6">
          {activeTab === "resend" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200">
                <div className={`w-3 h-3 rounded-full ${resendConfigured ? "bg-green-500" : "bg-gray-300"}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {resendConfigured ? "Resend API Key Configured" : "Resend API Key Not Configured"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {resendConfigured
                      ? "Emails will be sent via Resend"
                      : "Enter your Resend API key below to enable email sending"}
                  </p>
                </div>
              </div>
              <div>
                <label htmlFor="resend_key" className="block text-sm font-medium text-gray-700 mb-1">
                  Resend API Key
                </label>
                <input
                  id="resend_key"
                  type="password"
                  value={resendKey}
                  onChange={(e) => { setResendKey(e.target.value); setSaved(false) }}
                  placeholder={initialResendKey ? "•••••••• (replace)" : "re_..."}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  {initialResendKey
                    ? `Current key: ${initialResendKey}. Leave blank to keep current.`
                    : "Get your API key from the Resend dashboard."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="smtp_host" className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                  <input
                    id="smtp_host"
                    type="text"
                    value={smtpConfig.host}
                    onChange={(e) => updateSmtpField("host", e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="smtp_port" className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                  <input
                    id="smtp_port"
                    type="text"
                    value={smtpConfig.port}
                    onChange={(e) => updateSmtpField("port", e.target.value)}
                    placeholder="587"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="smtp_user" className="block text-sm font-medium text-gray-700 mb-1">SMTP Username</label>
                  <input
                    id="smtp_user"
                    type="text"
                    value={smtpConfig.user}
                    onChange={(e) => updateSmtpField("user", e.target.value)}
                    placeholder="user@gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="smtp_pass" className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
                  <input
                    id="smtp_pass"
                    type="password"
                    value={smtpConfig.pass}
                    onChange={(e) => updateSmtpField("pass", e.target.value)}
                    placeholder="********"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="smtp_from" className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
                  <input
                    id="smtp_from"
                    type="text"
                    value={smtpConfig.from}
                    onChange={(e) => updateSmtpField("from", e.target.value)}
                    placeholder="noreply@32smiles.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="smtp_secure" className="block text-sm font-medium text-gray-700 mb-1">Secure (TLS)</label>
                  <select
                    id="smtp_secure"
                    value={smtpConfig.secure}
                    onChange={(e) => updateSmtpField("secure", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-white"
                  >
                    <option value="">Auto</option>
                    <option value="true">Yes (SSL/TLS)</option>
                    <option value="false">No (STARTTLS)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={() => setTestOpen(!testOpen)}
          className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-gray-400" />
            Send Test Email
          </div>
          {testOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </button>

        {testOpen && (
          <div className="border-t border-gray-200 p-6 space-y-4">
            <div>
              <label htmlFor="test_to" className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input
                id="test_to"
                type="email"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            <div>
              <label htmlFor="test_subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                id="test_subject"
                type="text"
                value={testSubject}
                onChange={(e) => setTestSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            <div>
              <label htmlFor="test_body" className="block text-sm font-medium text-gray-700 mb-1">Body</label>
              <textarea
                id="test_body"
                rows={3}
                value={testBody}
                onChange={(e) => setTestBody(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm resize-none"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSendTest}
                disabled={sending || !testTo}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {sending ? "Sending..." : "Send Test Email"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
