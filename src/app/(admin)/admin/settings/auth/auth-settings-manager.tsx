"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, Save, CheckCircle, Globe, Shield, Key } from "lucide-react"

interface AuthSettingsManagerProps {
  initialSettings: Record<string, string>
}

export default function AuthSettingsManager({ initialSettings }: AuthSettingsManagerProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function updateField(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function toggleField(key: string) {
    updateField(key, settings[key] === "true" ? "false" : "true")
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch("/api/admin/settings/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to save")
      }
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Authentication Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage OAuth providers, session settings, and password policy</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 space-y-8">
          {/* OAuth Providers */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">OAuth Providers</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Google OAuth</p>
                  <p className="text-sm text-gray-500">
                    {settings.google_oauth_configured === "true"
                      ? "Configured with GOOGLE_CLIENT_ID"
                      : "Not configured — set GOOGLE_CLIENT_ID env var"}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.google_oauth_enabled === "true"}
                  onClick={() => toggleField("google_oauth_enabled")}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    settings.google_oauth_enabled === "true" ? "bg-primary-600" : "bg-gray-200"
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                    settings.google_oauth_enabled === "true" ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg opacity-60">
                <div>
                  <p className="font-medium text-gray-900">GitHub OAuth</p>
                  <p className="text-sm text-gray-500">Coming soon</p>
                </div>
                <button
                  type="button"
                  disabled
                  role="switch"
                  aria-checked={false}
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-gray-200"
                >
                  <span className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 translate-x-0" />
                </button>
              </div>
            </div>
          </section>

          {/* Session Settings */}
          <section className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Session Settings</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="session_duration_hours" className="block text-sm font-medium text-gray-700 mb-1">
                  Session Duration (hours)
                </label>
                <input
                  id="session_duration_hours"
                  type="number"
                  min={1}
                  max={720}
                  value={settings.session_duration_hours || "24"}
                  onChange={(e) => updateField("session_duration_hours", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                />
              </div>
              <div>
                <label htmlFor="max_login_attempts" className="block text-sm font-medium text-gray-700 mb-1">
                  Max Login Attempts
                </label>
                <input
                  id="max_login_attempts"
                  type="number"
                  min={1}
                  max={100}
                  value={settings.max_login_attempts || "5"}
                  onChange={(e) => updateField("max_login_attempts", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                />
              </div>
            </div>
          </section>

          {/* Password Policy */}
          <section className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Password Policy</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="password_min_length" className="block text-sm font-medium text-gray-700 mb-1">
                  Min Password Length
                </label>
                <input
                  id="password_min_length"
                  type="number"
                  min={4}
                  max={128}
                  value={settings.password_min_length || "8"}
                  onChange={(e) => updateField("password_min_length", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="password_require_special" className="text-sm font-medium text-gray-700">
                    Require Special Characters
                  </label>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.password_require_special === "true"}
                    onClick={() => toggleField("password_require_special")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      settings.password_require_special === "true" ? "bg-primary-600" : "bg-gray-200"
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                      settings.password_require_special === "true" ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password_require_numbers" className="text-sm font-medium text-gray-700">
                    Require Numbers
                  </label>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.password_require_numbers === "true"}
                    onClick={() => toggleField("password_require_numbers")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      settings.password_require_numbers === "true" ? "bg-primary-600" : "bg-gray-200"
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                      settings.password_require_numbers === "true" ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password_require_uppercase" className="text-sm font-medium text-gray-700">
                    Require Uppercase
                  </label>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.password_require_uppercase === "true"}
                    onClick={() => toggleField("password_require_uppercase")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      settings.password_require_uppercase === "true" ? "bg-primary-600" : "bg-gray-200"
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                      settings.password_require_uppercase === "true" ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  )
}
