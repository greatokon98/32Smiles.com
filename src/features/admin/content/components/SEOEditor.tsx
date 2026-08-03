"use client"

import { useState, useCallback } from "react"
import { Search, Globe, Eye, AlertTriangle, Check } from "lucide-react"

interface SEOEditorProps {
  contentId: string
  initialData?: {
    metaTitle?: string | null
    metaDescription?: string | null
    ogTitle?: string | null
    ogDescription?: string | null
    ogImage?: string | null
    focusKeyword?: string | null
    canonicalUrl?: string | null
    noIndex?: boolean
    noFollow?: boolean
  }
  contentTitle?: string
  contentExcerpt?: string
}

export default function SEOEditor({
  contentId,
  initialData,
  contentTitle,
  contentExcerpt,
}: SEOEditorProps) {
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || contentTitle || "")
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || contentExcerpt || "")
  const [ogTitle, setOgTitle] = useState(initialData?.ogTitle || "")
  const [ogDescription, setOgDescription] = useState(initialData?.ogDescription || "")
  const [ogImage, setOgImage] = useState(initialData?.ogImage || "")
  const [focusKeyword, setFocusKeyword] = useState(initialData?.focusKeyword || "")
  const [canonicalUrl, setCanonicalUrl] = useState(initialData?.canonicalUrl || "")
  const [noIndex, setNoIndex] = useState(initialData?.noIndex || false)
  const [noFollow, setNoFollow] = useState(initialData?.noFollow || false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const titleLength = metaTitle.length
  const descriptionLength = metaDescription.length

  const titleScore = titleLength === 0 ? 0 : titleLength <= 60 ? 100 : titleLength <= 70 ? 70 : 40
  const descriptionScore = descriptionLength === 0 ? 0 : descriptionLength <= 160 ? 100 : descriptionLength <= 180 ? 70 : 40

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/content/${contentId}/seo`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metaTitle,
          metaDescription,
          ogTitle,
          ogDescription,
          ogImage,
          focusKeyword,
          canonicalUrl,
          noIndex,
          noFollow,
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } catch (error) {
      console.error("Failed to save SEO:", error)
    } finally {
      setSaving(false)
    }
  }, [contentId, metaTitle, metaDescription, ogTitle, ogDescription, ogImage, focusKeyword, canonicalUrl, noIndex, noFollow])

  return (
    <div className="space-y-6">
      {/* Score Summary */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">SEO Score:</span>
          <span className={`text-sm font-bold ${titleScore + descriptionScore >= 140 ? "text-green-600" : titleScore + descriptionScore >= 80 ? "text-yellow-600" : "text-red-600"}`}>
            {Math.round((titleScore + descriptionScore) / 2)}%
          </span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-auto px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 inline-flex items-center gap-2"
        >
          {saved ? <Check className="h-4 w-4" /> : saving ? <span className="animate-spin">⏳</span> : <Search className="h-4 w-4" />}
          {saved ? "Saved!" : "Save SEO"}
        </button>
      </div>

      {/* Meta Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
        <input
          type="text"
          value={metaTitle}
          onChange={(e) => setMetaTitle(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          placeholder="Page title for search engines"
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-400">{titleLength}/60 characters</p>
          {titleLength > 60 && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> May be truncated in search results
            </p>
          )}
        </div>
        {/* Google preview */}
        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-blue-700 font-medium truncate">{metaTitle || "Page Title"}</p>
          <p className="text-xs text-green-700">32smiles.com{canonicalUrl || "/..."}</p>
          <p className="text-xs text-gray-500 truncate mt-1">{metaDescription || "No description set"}</p>
        </div>
      </div>

      {/* Meta Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
        <textarea
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
          placeholder="Brief description for search results"
        />
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-400">{descriptionLength}/160 characters</p>
          {descriptionLength > 160 && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> May be truncated
            </p>
          )}
        </div>
      </div>

      {/* Focus Keyword */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Search className="h-4 w-4 inline mr-1" />
          Focus Keyword
        </label>
        <input
          type="text"
          value={focusKeyword}
          onChange={(e) => setFocusKeyword(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          placeholder="Main keyword to optimize for"
        />
      </div>

      {/* Open Graph */}
      <div className="border-t pt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          <Globe className="h-4 w-4 inline mr-1" />
          Open Graph (Social Sharing)
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">OG Title</label>
            <input
              type="text"
              value={ogTitle}
              onChange={(e) => setOgTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="Title for social media shares"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">OG Description</label>
            <textarea
              value={ogDescription}
              onChange={(e) => setOgDescription(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
              placeholder="Description for social media shares"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">OG Image URL</label>
            <input
              type="text"
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* Advanced */}
      <div className="border-t pt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Advanced</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Canonical URL</label>
            <input
              type="text"
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="/blog/my-post"
            />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={noIndex}
                onChange={(e) => setNoIndex(e.target.checked)}
                className="h-4 w-4 text-primary-600 rounded"
              />
              No Index
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={noFollow}
                onChange={(e) => setNoFollow(e.target.checked)}
                className="h-4 w-4 text-primary-600 rounded"
              />
              No Follow
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
