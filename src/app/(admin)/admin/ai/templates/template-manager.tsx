"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  Search,
  Brain,
  Loader2,
  X,
  Trash2,
  Edit2,
  Play,
  Tag,
  ChevronDown,
  ChevronUp,
  Check,
  FileText,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"

interface Template {
  id: string
  name: string
  description: string | null
  category: string
  template: string
  systemPrompt: string | null
  variables: string[]
  defaultParams: Record<string, unknown> | null
  isActive: boolean
  isSystem: boolean
  version: number
  createdAt: string
  updatedAt: string
}

interface TemplateForm {
  name: string
  category: string
  description: string
  template: string
  systemPrompt: string
  variables: string
  isActive: boolean
}

const EMPTY_FORM: TemplateForm = {
  name: "",
  category: "",
  description: "",
  template: "",
  systemPrompt: "",
  variables: "",
  isActive: true,
}

const CATEGORY_COLORS: Record<string, string> = {
  CONTENT: "bg-blue-100 text-blue-700",
  SEO: "bg-amber-100 text-amber-700",
  EDITING: "bg-purple-100 text-purple-700",
  IMAGE: "bg-pink-100 text-pink-700",
  MARKETING: "bg-green-100 text-green-700",
  EDUCATION: "bg-cyan-100 text-cyan-700",
}

function getCategoryColor(cat: string) {
  return CATEGORY_COLORS[cat] || "bg-gray-100 text-gray-600"
}

export default function TemplateManager({
  initialTemplates,
}: {
  initialTemplates: Template[]
}) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TemplateForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [testModalId, setTestModalId] = useState<string | null>(null)
  const [testVars, setTestVars] = useState<Record<string, string>>({})
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  const categories = [...new Set(templates.map((t) => t.category))].sort()

  const filtered = templates.filter((t) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    )
  })

  const openCreate = useCallback(() => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }, [])

  const openEdit = useCallback((tpl: Template) => {
    setEditingId(tpl.id)
    setForm({
      name: tpl.name,
      category: tpl.category,
      description: tpl.description || "",
      template: tpl.template,
      systemPrompt: tpl.systemPrompt || "",
      variables: tpl.variables.join(", "),
      isActive: tpl.isActive,
    })
    setShowForm(true)
  }, [])

  const closeForm = useCallback(() => {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }, [])

  async function handleSave() {
    if (!form.name.trim() || !form.category.trim()) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim().toUpperCase(),
        description: form.description.trim() || null,
        template: form.template,
        systemPrompt: form.systemPrompt || null,
        variables: form.variables
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        isActive: form.isActive,
      }

      const url = editingId
        ? `/api/admin/ai/templates/${editingId}`
        : "/api/admin/ai/templates"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        alert(err.error || "Failed to save template")
        return
      }

      const saved = await res.json()

      if (editingId) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === editingId ? { ...t, ...saved } : t))
        )
      } else {
        setTemplates((prev) => [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)))
      }
      closeForm()
    } catch {
      alert("Failed to save template")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/ai/templates/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || "Failed to delete template")
        return
      }
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      setConfirmDeleteId(null)
      if (expandedId === id) setExpandedId(null)
    } catch {
      alert("Failed to delete template")
    } finally {
      setDeletingId(null)
    }
  }

  async function handleTestRender() {
    if (!testModalId) return
    setTesting(true)
    setTestResult(null)
    try {
      const tpl = templates.find((t) => t.id === testModalId)
      if (!tpl) return

      let rendered = tpl.template
      for (const [key, val] of Object.entries(testVars)) {
        rendered = rendered.replaceAll(`{{${key}}}`, val || `[${key}]`)
      }

      let sysRendered = tpl.systemPrompt || ""
      for (const [key, val] of Object.entries(testVars)) {
        sysRendered = sysRendered.replaceAll(`{{${key}}}`, val || `[${key}]`)
      }

      const parts: string[] = []
      if (sysRendered) parts.push(`--- System Prompt ---\n${sysRendered}`)
      parts.push(`--- User Prompt ---\n${rendered}`)
      setTestResult(parts.join("\n\n"))
    } catch {
      setTestResult("Error rendering template")
    } finally {
      setTesting(false)
    }
  }

  function openTest(tpl: Template) {
    setTestModalId(tpl.id)
    const vars: Record<string, string> = {}
    tpl.variables.forEach((v) => {
      vars[v] = ""
    })
    setTestVars(vars)
    setTestResult(null)
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Brain className="h-7 w-7 text-primary-600" />
              Prompt Templates
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {templates.length} template{templates.length !== 1 ? "s" : ""}
              {" · "}
              {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            New Template
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Brain className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="text-gray-500 mt-4">
              {templates.length === 0
                ? "No templates yet. Create your first one!"
                : "No templates match your search."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((tpl) => {
                const isExpanded = expandedId === tpl.id
                return (
                  <motion.div
                    key={tpl.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {tpl.name}
                            </h3>
                            {tpl.isSystem && (
                              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                                System
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${getCategoryColor(
                                tpl.category
                              )}`}
                            >
                              {tpl.category}
                            </span>
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                tpl.isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                            >
                              {tpl.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setExpandedId(isExpanded ? null : tpl.id)
                          }
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors shrink-0"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {tpl.description && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {tpl.description}
                        </p>
                      )}

                      {tpl.variables.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                          <Tag className="h-3 w-3 text-gray-400 shrink-0" />
                          {tpl.variables.map((v) => (
                            <span
                              key={v}
                              className="text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                            >
                              {`{{${v}}}`}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-4">
                        <button
                          onClick={() => openEdit(tpl)}
                          className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => openTest(tpl)}
                          className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md text-green-600 hover:bg-green-50 transition-colors"
                        >
                          <Play className="h-3 w-3" />
                          Test
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(tpl.id)}
                          className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors ml-auto"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t px-5 py-4 bg-gray-50 space-y-3">
                            {tpl.systemPrompt && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  System Prompt
                                </p>
                                <pre className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg p-3 whitespace-pre-wrap max-h-40 overflow-y-auto font-mono">
                                  {tpl.systemPrompt}
                                </pre>
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                User Prompt Template
                              </p>
                              <pre className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg p-3 whitespace-pre-wrap max-h-40 overflow-y-auto font-mono">
                                {tpl.template}
                              </pre>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span>v{tpl.version}</span>
                              <span>
                                Updated{" "}
                                {new Date(tpl.updatedAt).toLocaleDateString(
                                  "en-NG",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create / Edit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && closeForm()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary-600" />
                  {editingId ? "Edit Template" : "New Template"}
                </h2>
                <button
                  onClick={closeForm}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="e.g. Blog Post Writer"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, category: e.target.value }))
                      }
                      placeholder="e.g. CONTENT, SEO, EDITING"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                      list="category-suggestions"
                    />
                    <datalist id="category-suggestions">
                      {categories.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="Brief description of what this template does"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    System Prompt
                  </label>
                  <textarea
                    value={form.systemPrompt}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, systemPrompt: e.target.value }))
                    }
                    rows={4}
                    placeholder="Instructions for the AI model behavior..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm font-mono resize-y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Prompt Template
                  </label>
                  <textarea
                    value={form.template}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, template: e.target.value }))
                    }
                    rows={6}
                    placeholder="Use {{variableName}} for dynamic values..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm font-mono resize-y"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Variables{" "}
                    <span className="text-gray-400 font-normal">
                      (comma-separated)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={form.variables}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, variables: e.target.value }))
                    }
                    placeholder="topic, audience, wordCount"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                  />
                  {form.variables.trim() && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {form.variables
                        .split(",")
                        .map((v) => v.trim())
                        .filter(Boolean)
                        .map((v) => (
                          <span
                            key={v}
                            className="text-[11px] bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full"
                          >
                            {`{{${v}}}`}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, isActive: !f.isActive }))
                    }
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    {form.isActive ? (
                      <ToggleRight className="h-6 w-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                    {form.isActive ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
                <button
                  onClick={closeForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.name.trim() || !form.category.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={(e) =>
              e.target === e.currentTarget && setConfirmDeleteId(null)
            }
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Delete Template
                  </h3>
                  <p className="text-sm text-gray-500">This cannot be undone.</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-medium">
                  {templates.find((t) => t.id === confirmDeleteId)?.name}
                </span>
                ?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  disabled={deletingId === confirmDeleteId}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deletingId === confirmDeleteId && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Test Render Modal */}
      <AnimatePresence>
        {testModalId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={(e) =>
              e.target === e.currentTarget && setTestModalId(null)
            }
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Play className="h-5 w-5 text-green-600" />
                  Test Template
                </h2>
                <button
                  onClick={() => setTestModalId(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-500">
                  Fill in sample values for the variables to preview the rendered
                  prompt.
                </p>

                {Object.keys(testVars).length === 0 && (
                  <p className="text-sm text-gray-400 italic">
                    This template has no variables.
                  </p>
                )}

                {Object.entries(testVars).map(([key, val]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {`{{${key}}}`}
                    </label>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) =>
                        setTestVars((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      placeholder={`Enter sample value for "${key}"`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                ))}

                <button
                  onClick={handleTestRender}
                  disabled={testing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {testing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Render
                </button>

                {testResult && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Rendered Output
                    </p>
                    <pre className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-4 whitespace-pre-wrap max-h-60 overflow-y-auto font-mono">
                      {testResult}
                    </pre>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end rounded-b-2xl">
                <button
                  onClick={() => setTestModalId(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
