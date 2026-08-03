"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { slugify, stripHtml } from "@/lib/utils"
import SEOEditor from "./SEOEditor"
import { FilePicker } from "@/components/admin/file-picker"
import { toast } from "sonner"

const RichTextEditor = dynamic(
  () => import("@/components/admin/rich-text-editor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => <div className="border border-gray-300 rounded-lg p-8 text-sm text-gray-400 text-center">Loading editor...</div>,
  }
)
import {
  Save,
  Eye,
  Send,
  ArrowLeft,
  Loader2,
  Settings,
  Image,
  Tag,
  FileText,
} from "lucide-react"

interface ContentEditorProps {
  type: string
  id?: string
  initialData?: Record<string, unknown>
}

export default function ContentEditor({ type, id, initialData }: ContentEditorProps) {
  const router = useRouter()
  const isEditing = !!id

  const [title, setTitle] = useState((initialData?.title as string) || "")
  const [slug, setSlug] = useState((initialData?.slug as string) || "")
  const [excerpt, setExcerpt] = useState((initialData?.excerpt as string) || "")
  const [body, setBody] = useState((initialData?.body as string) || "")
  const [status, setStatus] = useState((initialData?.status as string) || "DRAFT")
  const [featured, setFeatured] = useState((initialData?.featured as boolean) || false)
  const [tags, setTags] = useState<string[]>((initialData?.tags as string[]) || [])
  const [activeTab, setActiveTab] = useState<"content" | "seo" | "settings">("content")
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)

  const [featuredImageId, setFeaturedImageId] = useState((initialData?.featuredImageId as string) || "")
  const [featuredImageUrl, setFeaturedImageUrl] = useState((initialData?.featuredImage as { url?: string })?.url || "")

  const [galleryCategory, setGalleryCategory] = useState((initialData?.galleryItem as { category?: string })?.category || "")
  const [galleryCaption, setGalleryCaption] = useState((initialData?.galleryItem as { caption?: string })?.caption || "")
  const [galleryAltText, setGalleryAltText] = useState((initialData?.galleryItem as { altText?: string })?.altText || "")
  const [gallerySortOrder, setGallerySortOrder] = useState((initialData?.galleryItem as { sortOrder?: number })?.sortOrder || 0)

  const [productPrice, setProductPrice] = useState((initialData?.product as { price?: number })?.price || "")
  const [productBrand, setProductBrand] = useState((initialData?.product as { brand?: string })?.brand || "")
  const [productRating, setProductRating] = useState((initialData?.product as { rating?: number })?.rating || "")

  const [teamSpecialty, setTeamSpecialty] = useState((initialData?.teamMember as { specialty?: string })?.specialty || "")
  const [teamCredentials, setTeamCredentials] = useState((initialData?.teamMember as { credentials?: string })?.credentials || "")
  const [teamPhotoFileId, setTeamPhotoFileId] = useState((initialData?.teamMember as { photoFileId?: string })?.photoFileId || "")
  const [teamPhotoUrl, setTeamPhotoUrl] = useState((initialData?.teamMember as { photoFile?: { url?: string } })?.photoFile?.url || "")
  const [teamBio, setTeamBio] = useState((initialData?.teamMember as { bio?: string })?.bio || "")
  const [teamSocialLinks, setTeamSocialLinks] = useState(JSON.stringify((initialData?.teamMember as { socialLinks?: Record<string, string> })?.socialLinks || {}, null, 2))

  const [eduCategory, setEduCategory] = useState((initialData?.educationArticle as { educationType?: string })?.educationType || "")

  // ─── Gallery Item (additional) ───────────────────────────
  const [galleryImageFileId, setGalleryImageFileId] = useState((initialData?.galleryItem as { imageFileId?: string })?.imageFileId || "")
  const [galleryImageFileUrl, setGalleryImageFileUrl] = useState((initialData?.galleryItem as { imageFile?: { url?: string } })?.imageFile?.url || "")
  const [galleryFullImageFileId, setGalleryFullImageFileId] = useState((initialData?.galleryItem as { fullImageFileId?: string })?.fullImageFileId || "")
  const [galleryFullImageFileUrl, setGalleryFullImageFileUrl] = useState((initialData?.galleryItem as { fullImageFile?: { url?: string } })?.fullImageFile?.url || "")

  // ─── Testimonial ─────────────────────────────────────────
  const [testimonialClientName, setTestimonialClientName] = useState((initialData?.testimonial as { clientName?: string })?.clientName || "")
  const [testimonialClientTitle, setTestimonialClientTitle] = useState((initialData?.testimonial as { clientTitle?: string })?.clientTitle || "")
  const [testimonialRating, setTestimonialRating] = useState((initialData?.testimonial as { rating?: number })?.rating || "")
  const [testimonialPhotoFileId, setTestimonialPhotoFileId] = useState((initialData?.testimonial as { photoFileId?: string })?.photoFileId || "")
  const [testimonialPhotoUrl, setTestimonialPhotoUrl] = useState((initialData?.testimonial as { photoFile?: { url?: string } })?.photoFile?.url || "")
  const [testimonialIsFeatured, setTestimonialIsFeatured] = useState((initialData?.testimonial as { isFeatured?: boolean })?.isFeatured || false)
  const [testimonialSortOrder, setTestimonialSortOrder] = useState((initialData?.testimonial as { sortOrder?: number })?.sortOrder || 0)

  // ─── FAQ ─────────────────────────────────────────────────
  const [faqQuestion, setFaqQuestion] = useState((initialData?.faq as { question?: string })?.question || "")
  const [faqAnswer, setFaqAnswer] = useState((initialData?.faq as { answer?: string })?.answer || "")
  const [faqCategory, setFaqCategory] = useState((initialData?.faq as { category?: string })?.category || "")
  const [faqIsStandalone, setFaqIsStandalone] = useState((initialData?.faq as { isStandalone?: boolean })?.isStandalone || false)
  const [faqSortOrder, setFaqSortOrder] = useState((initialData?.faq as { sortOrder?: number })?.sortOrder || 0)

  // ─── Blog Post ───────────────────────────────────────────
  const [blogReadingTime, setBlogReadingTime] = useState((initialData?.blogPost as { readingTime?: number })?.readingTime || "")
  const [blogAllowComments, setBlogAllowComments] = useState((initialData?.blogPost as { allowComments?: boolean })?.allowComments ?? true)
  const [blogIsFeatured, setBlogIsFeatured] = useState((initialData?.blogPost as { isFeatured?: boolean })?.isFeatured || false)

  // ─── Product (additional) ────────────────────────────────
  const [productSku, setProductSku] = useState((initialData?.product as { sku?: string })?.sku || "")
  const [productInStock, setProductInStock] = useState((initialData?.product as { inStock?: boolean })?.inStock ?? true)
  const [productSalePrice, setProductSalePrice] = useState((initialData?.product as { salePrice?: number })?.salePrice || "")
  const [productCurrency, setProductCurrency] = useState((initialData?.product as { currency?: string })?.currency || "NGN")
  const [productIsHot, setProductIsHot] = useState((initialData?.product as { isHot?: boolean })?.isHot || false)
  const [productIsOnSale, setProductIsOnSale] = useState((initialData?.product as { isOnSale?: boolean })?.isOnSale || false)
  const [productProductCategoryId, setProductProductCategoryId] = useState((initialData?.product as { productCategoryId?: string })?.productCategoryId || "")

  // ─── Education Article (additional) ──────────────────────
  const [eduReadingTime, setEduReadingTime] = useState((initialData?.educationArticle as { readingTime?: number })?.readingTime || "")
  const [eduSortOrder, setEduSortOrder] = useState((initialData?.educationArticle as { sortOrder?: number })?.sortOrder || 0)
  const [eduIsFeatured, setEduIsFeatured] = useState((initialData?.educationArticle as { isFeatured?: boolean })?.isFeatured || false)

  const autoSaveDeps = [body, title, featuredImageId, excerpt, galleryImageFileId, testimonialPhotoFileId, faqQuestion, blogReadingTime, productProductCategoryId, eduReadingTime, teamBio, teamSocialLinks] as const
  useEffect(() => {
    if (!isEditing) return
    if (type === "FAQ" ? !faqQuestion : !title) return
    const timer = setTimeout(() => { handleAutoSave() }, 3000)
    return () => clearTimeout(timer)
  }, autoSaveDeps)

  const handleAutoSave = useCallback(async () => {
    if (!id || !title) return
    setAutoSaving(true)
    try {
      await fetch(`/api/admin/content/${type}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      })
    } catch (error) {
      console.error("Auto-save failed:", error)
    } finally {
      setAutoSaving(false)
    }
  }, [id, title, slug, excerpt, body, status, type, featuredImageId,
      galleryImageFileId, galleryImageFileUrl, galleryFullImageFileId, galleryFullImageFileUrl,
      galleryCategory, galleryCaption, galleryAltText, gallerySortOrder,
      productPrice, productBrand, productRating,
      productSku, productInStock, productSalePrice, productCurrency,
      productIsHot, productIsOnSale, productProductCategoryId,
      teamSpecialty, teamCredentials, teamPhotoFileId, teamBio, teamSocialLinks,
      eduCategory, eduReadingTime, eduSortOrder, eduIsFeatured,
      testimonialClientName, testimonialClientTitle, testimonialRating,
      testimonialPhotoFileId, testimonialPhotoUrl, testimonialIsFeatured, testimonialSortOrder,
      faqQuestion, faqAnswer, faqCategory, faqIsStandalone, faqSortOrder,
      blogReadingTime, blogAllowComments, blogIsFeatured])

  useEffect(() => {
    if (type === "FAQ" && faqQuestion) {
      setTitle(faqQuestion)
      setSlug(slugify(faqQuestion))
    }
  }, [faqQuestion])

  useEffect(() => {
    if (type === "TESTIMONIAL" && testimonialClientName) {
      setTitle(testimonialClientName)
      setSlug(slugify(testimonialClientName))
    }
  }, [testimonialClientName])

  function generateSlug() { setSlug(slugify(title)) }

  function buildPayload() {
    const payload: Record<string, unknown> = {
      title, slug: slug || slugify(title), excerpt, body, status, featured, tags, type,
      featuredImageId: featuredImageId || null,
    }
    if (type === "GALLERY_ITEM") {
      payload.galleryItem = {
        category: galleryCategory, caption: galleryCaption, altText: galleryAltText,
        sortOrder: Number(gallerySortOrder),
        imageFileId: galleryImageFileId || null,
        fullImageFileId: galleryFullImageFileId || null,
      }
    }
    if (type === "PRODUCT") {
      payload.product = {
        price: productPrice ? Number(productPrice) : undefined,
        brand: productBrand || undefined,
        rating: productRating ? Number(productRating) : undefined,
        sku: productSku || undefined,
        inStock: productInStock,
        salePrice: productSalePrice ? Number(productSalePrice) : undefined,
        currency: productCurrency || undefined,
        isHot: productIsHot,
        isOnSale: productIsOnSale,
        productCategoryId: productProductCategoryId || undefined,
      }
    }
    if (type === "TEAM_MEMBER") {
      let parsedSocial: Record<string, string> | undefined
      try { const p = JSON.parse(teamSocialLinks); if (typeof p === "object" && p !== null) parsedSocial = p } catch {}
      payload.teamMember = { specialty: teamSpecialty, credentials: teamCredentials, photoFileId: teamPhotoFileId || null, bio: teamBio || undefined, socialLinks: parsedSocial }
    }
    if (type === "TESTIMONIAL") {
      payload.testimonial = {
        clientName: testimonialClientName,
        clientTitle: testimonialClientTitle || undefined,
        rating: testimonialRating ? Number(testimonialRating) : undefined,
        photoFileId: testimonialPhotoFileId || null,
        isFeatured: testimonialIsFeatured,
        sortOrder: Number(testimonialSortOrder),
      }
    }
    if (type === "FAQ") {
      payload.faq = {
        question: faqQuestion,
        answer: faqAnswer,
        category: faqCategory || undefined,
        isStandalone: faqIsStandalone,
        sortOrder: Number(faqSortOrder),
      }
    }
    if (type === "BLOG_POST") {
      payload.blogPost = {
        readingTime: blogReadingTime ? Number(blogReadingTime) : undefined,
        allowComments: blogAllowComments,
        isFeatured: blogIsFeatured,
      }
    }
    if (type === "EDUCATION_PATIENT" || type === "EDUCATION_PROFESSIONAL") {
      payload.educationArticle = {
        educationType: eduCategory || undefined,
        readingTime: eduReadingTime ? Number(eduReadingTime) : undefined,
        sortOrder: Number(eduSortOrder),
        isFeatured: eduIsFeatured,
      }
    }
    return payload
  }

  async function handleSave(publishStatus?: string) {
    if (type === "FAQ" ? !faqQuestion : !title) { alert(type === "FAQ" ? "Question is required" : "Title is required"); return }
    setSaving(true)
    try {
      const payload = buildPayload()
      if (publishStatus) payload.status = publishStatus
      const url = isEditing ? `/api/admin/content/${type}/${id}` : `/api/admin/content/${type}`
      const res = await fetch(url, { method: isEditing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (res.ok) {
        toast.success("Saved successfully")
        const content = await res.json()
        if (!isEditing) router.replace(`/admin/content/${type}/${content.id}`)
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to save")
      }
    } catch (error) { toast.error("Failed to save") } finally { setSaving(false) }
  }

  async function handlePublish() {
    await handleSave("PUBLISHED")
  }

  const wordCount = stripHtml(body).split(/\s+/).filter(Boolean).length
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))
  const typeName = type === "EDUCATION_PROFESSIONAL" ? "Professional Education" : type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())

  const formatDateSafe = (date: Date | string | null | undefined): string => {
    if (!date) return "—"
    const d = new Date(date)
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="h-5 w-5" /></button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{isEditing ? "Edit" : "Create"} {typeName}</h1>
            {autoSaving && <p className="text-xs text-gray-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Auto-saving...</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{wordCount} words · {readingTime} min read</span>
          <button onClick={() => handleSave()} disabled={saving} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Draft
          </button>
          <button onClick={handlePublish} disabled={saving} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 inline-flex items-center gap-2">
            <Send className="h-4 w-4" /> Publish
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            {type === "FAQ" ? (
              <input type="text" placeholder="Enter question..." value={faqQuestion} onChange={(e) => setFaqQuestion(e.target.value)} className="w-full text-2xl font-bold border-0 focus:outline-none focus:ring-0 placeholder:text-gray-300" />
            ) : type === "TESTIMONIAL" ? (
              <input type="text" placeholder="Enter client name..." value={testimonialClientName} onChange={(e) => setTestimonialClientName(e.target.value)} className="w-full text-2xl font-bold border-0 focus:outline-none focus:ring-0 placeholder:text-gray-300" />
            ) : (
              <>
                <input type="text" placeholder="Enter title..." value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-2xl font-bold border-0 focus:outline-none focus:ring-0 placeholder:text-gray-300" />
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-gray-500">Slug:</span>
                  <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} onBlur={generateSlug} className="flex-1 text-sm border border-gray-200 rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="auto-generated-slug" />
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="border-b px-6 flex gap-6">
              {[
                { id: "content", label: "Content", icon: FileText },
                { id: "seo", label: "SEO", icon: Settings },
                { id: "settings", label: "Settings", icon: Settings },
              ].map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-primary-600 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="p-6">
              {activeTab === "content" && (
                <div className="space-y-4">
                  {type === "FAQ" ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
                        <textarea value={faqAnswer} onChange={(e) => setFaqAnswer(e.target.value)} rows={6} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm resize-y" placeholder="Full answer text..." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <input type="text" value={faqCategory} onChange={(e) => setFaqCategory(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="e.g. Insurance, Treatment, General" />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2"><input type="checkbox" id="faqStandalone" checked={faqIsStandalone} onChange={(e) => setFaqIsStandalone(e.target.checked)} className="h-4 w-4 text-primary-600 rounded" /><label htmlFor="faqStandalone" className="text-sm font-medium text-gray-700">Standalone FAQ</label></div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                        <input type="number" value={faqSortOrder} onChange={(e) => setFaqSortOrder(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                      </div>
                    </>
                  ) : type === "TESTIMONIAL" ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quote</label>
                        <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={4} className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm resize-y" placeholder="The testimonial quote..." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client Title</label>
                        <input type="text" value={testimonialClientTitle} onChange={(e) => setTestimonialClientTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="e.g. Happy Patient" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                        <input type="number" min="1" max="5" value={testimonialRating} onChange={(e) => setTestimonialRating(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Client Photo</label>
                        <FilePicker
                          currentValue={testimonialPhotoUrl}
                          onSelect={(file) => { setTestimonialPhotoFileId(file.id); setTestimonialPhotoUrl(file.url) }}
                          label=""
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="testimonialFeatured" checked={testimonialIsFeatured} onChange={(e) => setTestimonialIsFeatured(e.target.checked)} className="h-4 w-4 text-primary-600 rounded" />
                        <label htmlFor="testimonialFeatured" className="text-sm font-medium text-gray-700">Featured</label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                        <input type="number" value={testimonialSortOrder} onChange={(e) => setTestimonialSortOrder(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                        <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none" placeholder="Brief summary..." />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Body Content</label>
                        <RichTextEditor value={body} onChange={setBody} placeholder="Start writing your content..." minHeight={320} />
                        <p className="text-xs text-gray-400 mt-1">Format with the toolbar, or paste HTML, Markdown, plain text, or rich text (Word/Google Docs). Add images inline via the toolbar or by dragging &amp; pasting.</p>
                      </div>
                    </>
                  )}
                </div>
              )}
              {activeTab === "seo" && <SEOEditor contentId={id || ""} initialData={initialData?.seoMetadata as Record<string, unknown> | undefined} contentTitle={title} contentExcerpt={excerpt} />}
              {activeTab === "settings" && (
                <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
                    <input type="checkbox" id="featured" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="h-4 w-4 text-primary-600 rounded" />
                    <label htmlFor="featured" className="text-sm font-medium text-gray-700">Featured {typeName.replace(/s$/, "")}</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                      <option value="DRAFT">Draft</option>
                      <option value="AI_GENERATED">AI Generated</option>
                      <option value="AI_ASSISTED">AI Assisted</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="APPROVED">Approved</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-medium text-gray-900 mb-3">Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Current:</span><span className="font-medium">{status.replace(/_/g, " ")}</span></div>
              {initialData?.publishedAt != null && <div className="flex justify-between text-sm"><span className="text-gray-500">Published:</span><span>{formatDateSafe(initialData.publishedAt as string)}</span></div>}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-medium text-gray-900 mb-3"><Image className="h-4 w-4 inline mr-2" />Featured Image</h3>
            <FilePicker
              currentValue={featuredImageUrl}
              onSelect={(file) => { setFeaturedImageId(file.id); setFeaturedImageUrl(file.url) }}
              label=""
            />
          </div>

          {type === "GALLERY_ITEM" && (
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <h3 className="font-medium text-gray-900">Gallery Settings</h3>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={galleryCategory} onChange={(e) => setGalleryCategory(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">Select category</option>
                  <option value="clinic">Clinic</option>
                  <option value="team">Team</option>
                  <option value="transformations">Transformations</option>
                  <option value="equipment">Equipment</option>
                </select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                <input type="text" value={galleryCaption} onChange={(e) => setGalleryCaption(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Image caption" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
                <input type="text" value={galleryAltText} onChange={(e) => setGalleryAltText(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Accessibility alt text" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input type="number" value={gallerySortOrder} onChange={(e) => setGallerySortOrder(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Before Image</label>
                <FilePicker
                  currentValue={galleryImageFileUrl}
                  onSelect={(file) => { setGalleryImageFileId(file.id); setGalleryImageFileUrl(file.url) }}
                  label=""
                /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">After Image</label>
                <FilePicker
                  currentValue={galleryFullImageFileUrl}
                  onSelect={(file) => { setGalleryFullImageFileId(file.id); setGalleryFullImageFileUrl(file.url) }}
                  label=""
                /></div>
            </div>
          )}

          {type === "PRODUCT" && (
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <h3 className="font-medium text-gray-900">Product Details</h3>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Price (NGN)</label>
                <input type="number" value={productPrice} onChange={(e) => setProductPrice(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. 3500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <input type="text" value={productBrand} onChange={(e) => setProductBrand(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. Colgate" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                <input type="number" min="1" max="5" step="0.1" value={productRating} onChange={(e) => setProductRating(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input type="text" value={productSku} onChange={(e) => setProductSku(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. SMILE-001" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="inStock" checked={productInStock} onChange={(e) => setProductInStock(e.target.checked)} className="h-4 w-4 text-primary-600 rounded" /><label htmlFor="inStock" className="text-sm font-medium text-gray-700">In Stock</label></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="isHot" checked={productIsHot} onChange={(e) => setProductIsHot(e.target.checked)} className="h-4 w-4 text-primary-600 rounded" /><label htmlFor="isHot" className="text-sm font-medium text-gray-700">Hot Product</label></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="isOnSale" checked={productIsOnSale} onChange={(e) => setProductIsOnSale(e.target.checked)} className="h-4 w-4 text-primary-600 rounded" /><label htmlFor="isOnSale" className="text-sm font-medium text-gray-700">On Sale</label></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Sale Price</label>
                <input type="number" value={productSalePrice} onChange={(e) => setProductSalePrice(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. 2500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select value={productCurrency} onChange={(e) => setProductCurrency(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"><option value="NGN">NGN</option><option value="USD">USD</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Category ID</label>
                <input type="text" value={productProductCategoryId} onChange={(e) => setProductProductCategoryId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Enter product category ID" /></div>
            </div>
          )}

          {type === "TEAM_MEMBER" && (
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <h3 className="font-medium text-gray-900">Team Member Details</h3>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Team Photo</label>
                <FilePicker
                  currentValue={teamPhotoUrl}
                  onSelect={(file) => { setTeamPhotoFileId(file.id); setTeamPhotoUrl(file.url) }}
                  label=""
                /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                <input type="text" value={teamSpecialty} onChange={(e) => setTeamSpecialty(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. Cosmetic Dentist" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Credentials</label>
                <input type="text" value={teamCredentials} onChange={(e) => setTeamCredentials(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. DDS, FAGD" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea value={teamBio} onChange={(e) => setTeamBio(e.target.value)} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-y" placeholder="Team member biography..." /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Social Links (JSON)</label>
                <textarea value={teamSocialLinks} onChange={(e) => setTeamSocialLinks(e.target.value)} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none font-mono text-xs resize-y" placeholder='{"youtube": "...", "instagram": "...", "linkedin": "...", "twitter": "..."}' /></div>
            </div>
          )}

          {type === "TESTIMONIAL" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-medium text-gray-900 mb-3">Testimonial (auto-generated)</h3>
              <p className="text-sm text-gray-500">Quote, client details, rating, and photo are managed in the Content tab above.</p>
            </div>
          )}

          {type === "FAQ" && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-medium text-gray-900 mb-3">FAQ (auto-generated)</h3>
              <p className="text-sm text-gray-500">Question, answer, and category are managed in the Content tab above.</p>
            </div>
          )}

          {type === "BLOG_POST" && (
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <h3 className="font-medium text-gray-900">Blog Settings</h3>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Reading Time (minutes)</label>
                <input type="number" min="1" value={blogReadingTime} onChange={(e) => setBlogReadingTime(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Auto-calculated if empty" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="blogAllowComments" checked={blogAllowComments} onChange={(e) => setBlogAllowComments(e.target.checked)} className="h-4 w-4 text-primary-600 rounded" /><label htmlFor="blogAllowComments" className="text-sm font-medium text-gray-700">Allow Comments</label></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="blogFeatured" checked={blogIsFeatured} onChange={(e) => setBlogIsFeatured(e.target.checked)} className="h-4 w-4 text-primary-600 rounded" /><label htmlFor="blogFeatured" className="text-sm font-medium text-gray-700">Featured Post</label></div>
            </div>
          )}

          {(type === "EDUCATION_PATIENT" || type === "EDUCATION_PROFESSIONAL") && (
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
              <h3 className="font-medium text-gray-900">Education Settings</h3>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={eduCategory} onChange={(e) => setEduCategory(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">Select category</option>
                  <option value="hygiene">Hygiene</option>
                  <option value="prevention">Prevention</option>
                  <option value="treatment">Treatment</option>
                  <option value="general">General</option>
                </select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Reading Time (minutes)</label>
                <input type="number" min="1" value={eduReadingTime} onChange={(e) => setEduReadingTime(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Auto-calculated if empty" /></div>
              <div className="flex items-center gap-2"><input type="checkbox" id="eduFeatured" checked={eduIsFeatured} onChange={(e) => setEduIsFeatured(e.target.checked)} className="h-4 w-4 text-primary-600 rounded" /><label htmlFor="eduFeatured" className="text-sm font-medium text-gray-700">Featured</label></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input type="number" value={eduSortOrder} onChange={(e) => setEduSortOrder(Number(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" /></div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-medium text-gray-900 mb-3"><Tag className="h-4 w-4 inline mr-2" />Tags</h3>
            <input type="text" placeholder="Add tag (press Enter)" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const v = (e.target as HTMLInputElement).value.trim(); if (v && !tags.includes(v)) setTags([...tags, v]); (e.target as HTMLInputElement).value = "" } }} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
            {tags.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{tags.map((tag) => <span key={tag} className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded flex items-center gap-1">{tag}<button onClick={() => setTags(tags.filter((t) => t !== tag))}>&times;</button></span>)}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
