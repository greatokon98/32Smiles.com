"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Copy,
  Save,
  RefreshCw,
  FileText,
  Search,
  Image,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Zap,
  DollarSign,
} from "lucide-react"
import { contentTypeConfigs, type FormField } from "./generation-wizard-config"

interface Template {
  id: string
  name: string
  slug: string
  category: string
  description?: string
  variables: string[]
}

interface Provider {
  name: string
  available: boolean
  enabled: boolean
  defaultModel: string
}

interface BrandVoice {
  id: string
  name: string
  tone: string
}

interface GenerationResult {
  content: string
  tokens: { input: number; output: number }
  cost: number
  provider: string
  model: string
  latency: number
}

const CONTENT_TYPES = [
  { id: "blog", label: "Blog Post", icon: FileText, color: "bg-blue-100 text-blue-600" },
  { id: "service", label: "Service Description", icon: FileText, color: "bg-green-100 text-green-600" },
  { id: "education", label: "Education Article", icon: FileText, color: "bg-purple-100 text-purple-600" },
  { id: "faq", label: "FAQ Generation", icon: FileText, color: "bg-amber-100 text-amber-600" },
  { id: "seo", label: "SEO Meta Tags", icon: Search, color: "bg-pink-100 text-pink-600" },
  { id: "image", label: "Image Prompt", icon: Image, color: "bg-cyan-100 text-cyan-600" },
  { id: "rewrite", label: "Content Rewrite", icon: RotateCcw, color: "bg-orange-100 text-orange-600" },
]

const TEMPLATES_MAP: Record<string, string> = {
  blog: "blog-post-writer",
  service: "service-description",
  education: "content-rewriter",
  faq: "faq-generator",
  seo: "seo-meta-writer",
  image: "image-prompt-generator",
  rewrite: "content-rewriter",
}

function getDefaultValues(type: string): Record<string, any> {
  const config = contentTypeConfigs[type]
  if (!config) return {}
  const values: Record<string, any> = {}
  for (const field of config.fields) {
    if (field.defaultValue !== undefined) {
      values[field.name] = field.defaultValue
    } else if (field.type === "toggle") {
      values[field.name] = false
    } else {
      values[field.name] = ""
    }
  }
  return values
}

interface Props {
  templates: Template[]
  providers: Provider[]
  brandVoices: BrandVoice[]
}

export default function GenerationWizard({ templates, providers, brandVoices }: Props) {
  const [step, setStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  const [contentType, setContentType] = useState("blog")
  const [formValues, setFormValues] = useState<Record<string, any>>(() => getDefaultValues("blog"))
  const [selectedProvider, setSelectedProvider] = useState("openai")
  const [brandVoiceId, setBrandVoiceId] = useState("")
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(true)

  const config = contentTypeConfigs[contentType]
  const fields = config?.fields ?? []

  function handleContentTypeSelect(type: string) {
    if (type === contentType) return
    const newDefaults = getDefaultValues(type)
    const newConfig = contentTypeConfigs[type]
    if (!newConfig) return
    for (const key of Object.keys(formValues)) {
      if (key in newDefaults) {
        const field = newConfig.fields.find(f => f.name === key)
        if (field?.type === "select" && field.options) {
          if (field.options.some(o => o.value === formValues[key])) {
            newDefaults[key] = formValues[key]
          }
        } else if (field?.type === "number" && typeof formValues[key] === "number") {
          newDefaults[key] = formValues[key]
        } else if (typeof formValues[key] === typeof newDefaults[key]) {
          newDefaults[key] = formValues[key]
        }
      }
    }
    setContentType(type)
    setFormValues(newDefaults)
  }

  function updateField(name: string, value: any) {
    setFormValues(prev => ({ ...prev, [name]: value }))
  }

  const steps = [
    { num: 1, label: "Content Type" },
    { num: 2, label: "Details" },
    { num: 3, label: "AI Settings" },
    { num: 4, label: "Generate" },
  ]

  async function handleGenerate() {
    setIsGenerating(true)
    setError(null)
    setResult(null)

    const startTime = Date.now()

    const payload: Record<string, any> = {
      contentType,
      ...formValues,
      provider: selectedProvider,
      templateSlug: TEMPLATES_MAP[contentType] || "blog-post-writer",
      brandVoiceId: brandVoiceId || undefined,
      useKnowledgeBase,
    }

    if (payload.keyTopics && typeof payload.keyTopics === "string") {
      payload.keyTopics = payload.keyTopics.split(",").map((k: string) => k.trim()).filter(Boolean)
    }

    try {
      const res = await fetch("/api/admin/ai-studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Generation failed")
      }

      setResult({
        content: data.content,
        tokens: data.tokens,
        cost: data.cost,
        provider: data.provider,
        model: data.model,
        latency: data.latency,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  function handleCopy() {
    if (result) {
      navigator.clipboard.writeText(result.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleSaveDraft() {
    if (!result) return
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function renderField(field: FormField, values: Record<string, any>, onChange: (name: string, value: any) => void) {
    const value = values[field.name] ?? ""
    switch (field.type) {
      case "text":
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}{field.required ? " *" : ""}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        )
      case "textarea":
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}{field.required ? " *" : ""}
            </label>
            <textarea
              value={value}
              onChange={(e) => onChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              rows={3}
            />
          </div>
        )
      case "select":
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}{field.required ? " *" : ""}
            </label>
            <select
              value={value}
              onChange={(e) => onChange(field.name, e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        )
      case "number":
        if (field.name === "wordCount") {
          return (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}: {value}
              </label>
              <input
                type="range"
                min={200}
                max={2000}
                step={100}
                value={value || 800}
                onChange={(e) => onChange(field.name, Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>200</span>
                <span>2000</span>
              </div>
            </div>
          )
        }
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}{field.required ? " *" : ""}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => onChange(field.name, Number(e.target.value))}
              placeholder={field.placeholder}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        )
      case "toggle":
        return (
          <div key={field.name}>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => onChange(field.name, e.target.checked)}
                className="rounded"
              />
              {field.label}
            </label>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Progress Bar */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step >= s.num
                    ? "bg-primary-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > s.num ? <CheckCircle2 className="h-4 w-4" /> : s.num}
              </div>
              <span className={`ml-2 text-sm ${step >= s.num ? "text-gray-900 font-medium" : "text-gray-400"}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-3 ${step > s.num ? "bg-primary-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6 min-h-[400px]">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-lg font-semibold mb-4">Select Content Type</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CONTENT_TYPES.map((ct) => {
                  const cfg = contentTypeConfigs[ct.id]
                  return (
                    <button
                      key={ct.id}
                      onClick={() => handleContentTypeSelect(ct.id)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        contentType === ct.id
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${ct.color}`}>
                        <ct.icon className="h-5 w-5" />
                      </div>
                      <p className="font-medium text-sm">{ct.label}</p>
                      {cfg?.description && (
                        <p className="text-xs text-gray-500 mt-1 leading-tight">{cfg.description}</p>
                      )}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-lg font-semibold mb-4">Content Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(() => {
                  const toggleFields = fields.filter(f => f.type === "toggle")
                  const nonToggleFields = fields.filter(f => f.type !== "toggle")
                  const mid = Math.ceil(nonToggleFields.length / 2)
                  const leftFields = [...nonToggleFields.slice(0, mid), ...toggleFields.slice(0, Math.ceil(toggleFields.length / 2))]
                  const rightFields = [...nonToggleFields.slice(mid), ...toggleFields.slice(Math.ceil(toggleFields.length / 2))]
                  return (
                    <>
                      <div className="space-y-4">
                        {leftFields.map(field => renderField(field, formValues, updateField))}
                      </div>
                      <div className="space-y-4">
                        {rightFields.map(field => renderField(field, formValues, updateField))}
                      </div>
                    </>
                  )
                })()}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-lg font-semibold mb-4">AI Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Provider Selection */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">AI Provider</h3>
                  <div className="space-y-2">
                    {providers
                      .filter((p) => p.available || p.enabled)
                      .map((p) => (
                        <label
                          key={p.name}
                          className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedProvider === p.name
                              ? "border-primary-500 bg-primary-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="provider"
                            value={p.name}
                            checked={selectedProvider === p.name}
                            onChange={(e) => setSelectedProvider(e.target.value)}
                            className="text-primary-600"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium capitalize">{p.name}</p>
                            <p className="text-xs text-gray-500">{p.defaultModel}</p>
                          </div>
                          <div
                            className={`w-2 h-2 rounded-full ${
                              p.available ? "bg-green-500" : p.enabled ? "bg-yellow-500" : "bg-gray-300"
                            }`}
                          />
                        </label>
                      ))}
                  </div>
                </div>

                {/* Brand Voice */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Brand Voice</h3>
                  <select
                    value={brandVoiceId}
                    onChange={(e) => setBrandVoiceId(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Default</option>
                    {brandVoices.map((bv) => (
                      <option key={bv.id} value={bv.id}>
                        {bv.name} ({bv.tone})
                      </option>
                    ))}
                  </select>

                  <div className="mt-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={useKnowledgeBase}
                        onChange={(e) => setUseKnowledgeBase(e.target.checked)}
                        className="rounded"
                      />
                      Use Knowledge Base context
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-5">
                      AI will reference approved content for accuracy
                    </p>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Generation Preview</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium">{CONTENT_TYPES.find((c) => c.id === contentType)?.label}</span>
                    </div>
                    {fields.slice(0, 4).map((f) => {
                      const val = formValues[f.name]
                      if (val === undefined || val === "") return null
                      const display = typeof val === "boolean" ? (val ? "Yes" : "No") : f.type === "number" ? `~${val}` : String(val)
                      return (
                        <div key={f.name} className="flex justify-between">
                          <span className="text-gray-500">{f.label}:</span>
                          <span className="font-medium truncate ml-2 max-w-[140px]">{display}</span>
                        </div>
                      )
                    })}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Provider:</span>
                      <span className="font-medium capitalize">{selectedProvider}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">KB Context:</span>
                      <span className="font-medium">{useKnowledgeBase ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Generate & Review</h2>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || fields.some(f => f.required && !formValues[f.name]?.toString().trim())}
                  className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {result ? "Regenerate" : "Generate"}
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Zap className="h-4 w-4" />
                        {result.tokens.input.toLocaleString()} in / {result.tokens.output.toLocaleString()} out
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />${result.cost.toFixed(4)}
                      </span>
                      <span>{result.latency}ms</span>
                      <span className="capitalize">{result.provider} / {result.model}</span>
                    </div>
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap">{result.content}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={handleSaveDraft}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                      {saved ? "Saved!" : "Save as Draft"}
                    </button>
                  </div>
                </div>
              )}

              {!result && !error && !isGenerating && (
                <div className="text-center py-12 text-gray-400">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Click &quot;Generate&quot; to create content</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="border-t px-6 py-4 flex justify-between">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        {step < 4 && (
          <button
            onClick={() => setStep(Math.min(4, step + 1))}
            disabled={step === 4 || (step === 1 && !contentType) || (step === 2 && fields.some(f => f.required && !formValues[f.name]?.toString().trim()))}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
