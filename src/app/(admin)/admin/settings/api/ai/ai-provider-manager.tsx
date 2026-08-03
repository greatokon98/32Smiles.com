"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Bot,
  Brain,
  Globe,
  Loader2,
  Save,
  Lock,
  Unlock,
  Pencil,
  X,
  Plus,
  Trash2,
  CheckCircle,
  Key,
} from "lucide-react"

type ProviderData = {
  id: string
  provider: string
  displayName: string
  apiKeyConfigured: boolean
  baseUrl: string | null
  defaultModel: string
  status: string
  priority: number
  rateLimit: number
  monthlyBudget: number | null
  monthlySpend: number | null
  lastUsedAt: string | null
  errorCount: number
  lastError: string | null
  createdAt: string
  updatedAt: string
}

const PROVIDER_ICONS: Record<string, typeof Bot> = {
  OPENAI: Brain,
  ANTHROPIC: Bot,
  GEMINI: Brain,
  GROQ: Bot,
  OLLAMA: Globe,
  AZURE: Globe,
  OPENROUTER: Globe,
}

export default function AIProviderManager({
  initialProviders,
}: {
  initialProviders: ProviderData[]
}) {
  const [providers, setProviders] = useState<ProviderData[]>(initialProviders)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Provider Settings</h1>
          <p className="text-gray-500 text-sm mt-1">
            Configure and manage AI provider connections
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Provider
        </button>
      </div>

      {showCreate && (
        <CreateProviderForm
          onCreated={(p) => {
            setProviders((prev) => [...prev, p])
            setShowCreate(false)
            toast.success("Provider created")
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      <div className="grid grid-cols-1 gap-6">
        {providers.map((provider) =>
          editingId === provider.id ? (
            <EditProviderCard
              key={provider.id}
              provider={provider}
              onSaved={(updated) => {
                setProviders((prev) =>
                  prev.map((p) => (p.id === updated.id ? updated : p))
                )
                setEditingId(null)
                toast.success("Provider updated")
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onEdit={() => setEditingId(provider.id)}
              onDeleted={(id) => {
                setProviders((prev) => prev.filter((p) => p.id !== id))
                toast.success("Provider deleted")
              }}
            />
          )
        )}
      </div>
    </div>
  )
}

function ProviderIcon({ provider }: { provider: string }) {
  const Icon = PROVIDER_ICONS[provider] || Bot
  const colors: Record<string, string> = {
    OPENAI: "text-green-600 bg-green-100",
    ANTHROPIC: "text-purple-600 bg-purple-100",
    GEMINI: "text-blue-600 bg-blue-100",
    GROQ: "text-orange-600 bg-orange-100",
    OLLAMA: "text-gray-600 bg-gray-100",
    AZURE: "text-blue-600 bg-blue-100",
    OPENROUTER: "text-amber-600 bg-amber-100",
  }
  return (
    <div
      className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[provider] || "text-gray-600 bg-gray-100"}`}
    >
      <Icon className="h-5 w-5" />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    INACTIVE: "bg-gray-100 text-gray-500",
    ERROR: "bg-red-100 text-red-700",
  }
  return (
    <span
      className={`text-xs px-2 py-1 rounded font-medium ${styles[status] || "bg-gray-100 text-gray-500"}`}
    >
      {status}
    </span>
  )
}

function ProviderCard({
  provider,
  onEdit,
  onDeleted,
}: {
  provider: ProviderData
  onEdit: () => void
  onDeleted: (id: string) => void
}) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm("Delete this provider configuration?")) return
    setDeleting(true)
    try {
      const res = await fetch(
        `/api/admin/settings/api/ai/${provider.id}`,
        { method: "DELETE" }
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to delete")
      }
      onDeleted(provider.id)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <ProviderIcon provider={provider.provider} />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {provider.displayName}
              </h3>
              <StatusBadge status={provider.status} />
            </div>
            <p className="text-sm text-gray-500">{provider.provider}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            Model
          </p>
          <p className="text-sm font-medium text-gray-900 mt-0.5">
            {provider.defaultModel}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            API Key
          </p>
          <p className="text-sm font-medium text-gray-900 mt-0.5 flex items-center gap-1.5">
            {provider.apiKeyConfigured ? (
              <>
                <Key className="h-3.5 w-3.5 text-green-600" />
                <span className="text-green-600">Configured</span>
              </>
            ) : (
              <>
                <Key className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-gray-400">Not configured</span>
              </>
            )}
          </p>
        </div>
        {provider.baseUrl && (
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              Base URL
            </p>
            <p className="text-sm font-medium text-gray-900 mt-0.5 truncate">
              {provider.baseUrl}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            Priority
          </p>
          <p className="text-sm font-medium text-gray-900 mt-0.5">
            {provider.priority}
          </p>
        </div>
      </div>
    </div>
  )
}

function EditProviderCard({
  provider,
  onSaved,
  onCancel,
}: {
  provider: ProviderData
  onSaved: (updated: ProviderData) => void
  onCancel: () => void
}) {
  const [displayName, setDisplayName] = useState(provider.displayName)
  const [defaultModel, setDefaultModel] = useState(provider.defaultModel)
  const [apiKey, setApiKey] = useState("")
  const [baseUrl, setBaseUrl] = useState(provider.baseUrl || "")
  const [status, setStatus] = useState(provider.status)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        displayName,
        defaultModel,
        baseUrl: baseUrl || null,
        status,
      }
      if (apiKey) body.apiKey = apiKey

      const res = await fetch(
        `/api/admin/settings/api/ai/${provider.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save")
      }
      const updated = await res.json()
      onSaved(updated)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-primary-200 p-6 ring-1 ring-primary-200">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <ProviderIcon provider={provider.provider} />
          <h3 className="text-lg font-semibold text-gray-900">
            Edit {provider.displayName}
          </h3>
        </div>
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Provider
          </label>
          <input
            type="text"
            value={provider.provider}
            disabled
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model
          </label>
          <input
            type="text"
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={
              provider.apiKeyConfigured ? "••••••••" : "Enter API key"
            }
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          {provider.apiKeyConfigured && !apiKey && (
            <p className="text-xs text-gray-400 mt-1">
              Leave empty to keep existing key
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Base URL <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.openai.com/v1"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <div className="flex items-center gap-3 h-10">
            <button
              type="button"
              role="switch"
              aria-checked={status === "ACTIVE"}
              onClick={() =>
                setStatus(status === "ACTIVE" ? "INACTIVE" : "ACTIVE")
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                status === "ACTIVE" ? "bg-green-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                  status === "ACTIVE" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium ${
                status === "ACTIVE" ? "text-green-700" : "text-gray-500"
              }`}
            >
              {status === "ACTIVE" ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>
    </div>
  )
}

function CreateProviderForm({
  onCreated,
  onCancel,
}: {
  onCreated: (provider: ProviderData) => void
  onCancel: () => void
}) {
  const [provider, setProvider] = useState("OPENAI")
  const [displayName, setDisplayName] = useState("")
  const [defaultModel, setDefaultModel] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [saving, setSaving] = useState(false)

  const PROVIDER_OPTIONS = [
    { value: "OPENAI", label: "OpenAI" },
    { value: "ANTHROPIC", label: "Anthropic" },
    { value: "GEMINI", label: "Gemini" },
    { value: "GROQ", label: "Groq" },
    { value: "OLLAMA", label: "Ollama" },
    { value: "AZURE", label: "Azure" },
    { value: "OPENROUTER", label: "OpenRouter" },
  ]

  async function handleCreate() {
    if (!displayName || !defaultModel) {
      toast.error("Display name and model are required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          displayName,
          defaultModel,
          apiKey: apiKey || undefined,
          baseUrl: baseUrl || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create")
      }
      const created = await res.json()
      onCreated(created)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-primary-200 p-6 ring-1 ring-primary-200">
      <div className="flex items-start justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary-600" />
          Add AI Provider
        </h3>
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Provider
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          >
            {PROVIDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="My OpenAI"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Model
          </label>
          <input
            type="text"
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            placeholder="gpt-4o-mini"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Base URL <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.openai.com/v1"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={handleCreate}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          {saving ? "Creating..." : "Create Provider"}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>
    </div>
  )
}
