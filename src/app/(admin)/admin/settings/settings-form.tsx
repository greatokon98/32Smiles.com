"use client"

import { useState } from "react"
import { toast } from "sonner"
import { FilePicker } from "@/components/admin/file-picker"
import {
  Settings,
  Search,
  Mail,
  Image,
  Loader2,
  Save,
  CheckCircle,
  Home,
  Shield,
} from "lucide-react"

type Tab = "general" | "seo" | "email" | "images" | "homepage" | "insurance"

const TABS: { id: Tab; label: string; icon: typeof Settings }[] = [
  { id: "general", label: "General", icon: Settings },
  { id: "seo", label: "SEO", icon: Search },
  { id: "email", label: "Email", icon: Mail },
  { id: "images", label: "Site Images", icon: Image },
  { id: "homepage", label: "Homepage", icon: Home },
  { id: "insurance", label: "Insurance", icon: Shield },
]

interface FieldDef {
  key: string
  label: string
  type: "text" | "textarea" | "toggle"
  placeholder?: string
}

const TAB_FIELDS: Record<Tab, FieldDef[]> = {
  general: [
    { key: "clinic_name", label: "Clinic Name", type: "text", placeholder: "32Smiles Dental Clinic" },
    { key: "clinic_tagline", label: "Tagline", type: "text", placeholder: "Your Smile, Our Priority" },
    { key: "clinic_description", label: "Description", type: "textarea", placeholder: "About the clinic..." },
    { key: "contact_email", label: "Contact Email", type: "text", placeholder: "info@32smiles.com" },
    { key: "contact_phone", label: "Contact Phone", type: "text", placeholder: "+234 800 123 4567" },
    { key: "contact_address", label: "Address", type: "textarea", placeholder: "Clinic address..." },
    { key: "business_hours_weekday", label: "Weekday Hours", type: "text", placeholder: "8:00 AM - 6:00 PM" },
    { key: "business_hours_saturday", label: "Saturday Hours", type: "text", placeholder: "9:00 AM - 4:00 PM" },
    { key: "business_hours_sunday", label: "Sunday Hours", type: "text", placeholder: "Closed" },
  ],
  seo: [
    { key: "seo_meta_title", label: "Default Meta Title", type: "text", placeholder: "32Smiles Dental Clinic" },
    { key: "seo_meta_description", label: "Default Meta Description", type: "textarea", placeholder: "Description for search engines..." },
    { key: "seo_og_image", label: "OG Image URL", type: "text", placeholder: "https://example.com/og-image.jpg" },
  ],
  email: [
    { key: "email_notifications_enabled", label: "Enable Email Notifications", type: "toggle" },
    { key: "email_notification_address", label: "Notification Email", type: "text", placeholder: "notifications@32smiles.com" },
  ],
  images: [],
  homepage: [
    { key: "hero_tagline_1", label: "Hero Tagline 1", type: "text", placeholder: "Advanced Care, Gentle Touch" },
    { key: "hero_tagline_2", label: "Hero Tagline 2", type: "text", placeholder: "Expert Dentists, Warm Smiles" },
    { key: "hero_tagline_3", label: "Hero Tagline 3", type: "text", placeholder: "Modern Technology, Real Results" },
    { key: "hero_tagline_4", label: "Hero Tagline 4", type: "text", placeholder: "Your Comfort, Our Commitment" },
    { key: "stats_years", label: "Stats: Years of Experience", type: "text", placeholder: "10" },
    { key: "stats_patients", label: "Stats: Patients Served", type: "text", placeholder: "5000" },
    { key: "stats_satisfaction", label: "Stats: Satisfaction Rate (%)", type: "text", placeholder: "98" },
    { key: "stats_emergency_label", label: "Stats: Emergency Label", type: "text", placeholder: "24/7 Emergency Support" },
  ],
  insurance: [
    { key: "insurance_companies", label: "Insurance Companies (comma separated)", type: "textarea", placeholder: "Aetna, Cigna, Delta Dental, MetLife" },
  ],
}

export default function SettingsForm({
  initialSettings,
}: {
  initialSettings: Record<string, string>
}) {
  const [activeTab, setActiveTab] = useState<Tab>("general")
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [logoUrl, setLogoUrl] = useState(initialSettings.site_logo_url || "/images/logo.png")
  const [logoId, setLogoId] = useState(initialSettings.site_logo_file_id || "")
  const [footerLogoUrl, setFooterLogoUrl] = useState(initialSettings.site_footer_logo_url || "/images/32smiles.png")
  const [footerLogoId, setFooterLogoId] = useState(initialSettings.site_footer_logo_file_id || "")
  const [ogImageUrl, setOgImageUrl] = useState(initialSettings.site_og_image_url || "/images/og-default.jpg")
  const [ogImageId, setOgImageId] = useState(initialSettings.site_og_image_file_id || "")
  const [whyChooseUsUrl, setWhyChooseUsUrl] = useState(initialSettings.why_choose_us_image || "/images/team/1.jpg")
  const [whyChooseUsId, setWhyChooseUsId] = useState(initialSettings.why_choose_us_image_file_id || "")

  type HeroBgField = { key: string; label: string; default: string }
  const heroBgFields: HeroBgField[] = [
    { key: "hero_bg_homepage", label: "Homepage", default: "/images/bg/bg1.jpg" },
    { key: "hero_bg_homepage_cta", label: "Homepage CTA", default: "/images/bg/bg2.jpg" },
    { key: "hero_bg_about", label: "About", default: "/images/bg/bg1.jpg" },
    { key: "hero_bg_services", label: "Services", default: "/images/bg/bg5.jpg" },
    { key: "hero_bg_products", label: "Products", default: "/images/bg/bg6.jpg" },
    { key: "hero_bg_blog", label: "Blog", default: "/images/bg/bg4.jpg" },
    { key: "hero_bg_gallery", label: "Gallery", default: "/images/bg/bg3.jpg" },
    { key: "hero_bg_team", label: "Team", default: "/images/bg/bg9.jpg" },
    { key: "hero_bg_insurance", label: "Insurance", default: "/images/bg/bg3.jpg" },
    { key: "hero_bg_faq", label: "FAQ", default: "/images/bg/bg7.jpg" },
    { key: "hero_bg_contact", label: "Contact", default: "/images/bg/bg8.jpg" },
    { key: "hero_bg_cart", label: "Cart", default: "/images/bg/bg6.jpg" },
    { key: "hero_bg_appointment", label: "Appointment", default: "/images/bg/bg12.jpg" },
    { key: "hero_bg_education_patient", label: "Patient Education", default: "/images/bg/bg10.jpg" },
    { key: "hero_bg_education_professional", label: "Professional Education", default: "/images/bg/bg11.jpg" },
  ]

  const [heroBgUrls, setHeroBgUrls] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const f of heroBgFields) {
      initial[f.key] = initialSettings[f.key] || f.default
    }
    return initial
  })
  const [heroBgFileIds, setHeroBgFileIds] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const f of heroBgFields) {
      initial[f.key] = initialSettings[`${f.key}_file_id`] || ""
    }
    return initial
  })

  const [aboutStoryUrl, setAboutStoryUrl] = useState(initialSettings.about_story_image || "/images/about/dc1.png")
  const [aboutStoryId, setAboutStoryId] = useState(initialSettings.about_story_image_file_id || "")
  const [homepageSliderUrl, setHomepageSliderUrl] = useState(initialSettings.homepage_slider_image || "/images/gallery/3.jpg")
  const [homepageSliderId, setHomepageSliderId] = useState(initialSettings.homepage_slider_image_file_id || "")

  type AvatarField = { key: string; label: string; default: string }
  const avatarFields: AvatarField[] = [
    { key: "testimonial_avatar_1", label: "Avatar 1", default: "/images/testimonials/1.png" },
    { key: "testimonial_avatar_2", label: "Avatar 2", default: "/images/testimonials/2.png" },
    { key: "testimonial_avatar_3", label: "Avatar 3", default: "/images/testimonials/3.png" },
    { key: "testimonial_avatar_4", label: "Avatar 4", default: "/images/testimonials/1.jpg" },
  ]

  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const f of avatarFields) {
      initial[f.key] = initialSettings[f.key] || f.default
    }
    return initial
  })
  const [avatarFileIds, setAvatarFileIds] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const f of avatarFields) {
      initial[f.key] = initialSettings[`${f.key}_file_id`] || ""
    }
    return initial
  })

  const [fallbackJsonSettings, setFallbackJsonSettings] = useState<Record<string, string>>(() => {
    const keys = ["gallery_fallback_images", "team_fallback_photos", "blog_fallback_images", "before_after_fallback_images", "service_fallback_images", "product_fallback_images"]
    const initial: Record<string, string> = {}
    for (const key of keys) {
      initial[key] = initialSettings[key] || ""
    }
    return initial
  })

  function updateField(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      if (activeTab === "images") {
        const fieldsToSave: Record<string, string> = {
          site_logo_url: logoUrl,
          site_logo_file_id: logoId,
          site_footer_logo_url: footerLogoUrl,
          site_footer_logo_file_id: footerLogoId,
          site_og_image_url: ogImageUrl,
          site_og_image_file_id: ogImageId,
          about_story_image: aboutStoryUrl,
          about_story_image_file_id: aboutStoryId,
          homepage_slider_image: homepageSliderUrl,
          homepage_slider_image_file_id: homepageSliderId,
        }
        for (const f of heroBgFields) {
          fieldsToSave[f.key] = heroBgUrls[f.key]
          fieldsToSave[`${f.key}_file_id`] = heroBgFileIds[f.key]
        }
        for (const f of avatarFields) {
          fieldsToSave[f.key] = avatarUrls[f.key]
          fieldsToSave[`${f.key}_file_id`] = avatarFileIds[f.key]
        }
        for (const [key, value] of Object.entries(fallbackJsonSettings)) {
          fieldsToSave[key] = value
        }
        const res = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settings: fieldsToSave }),
        })
        if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
        else { const err = await res.json(); toast.error(err.error || "Failed to save") }
      } else if (activeTab === "homepage") {
        const fieldsToSave: Record<string, string> = {}
        for (const field of TAB_FIELDS["homepage"]) {
          fieldsToSave[field.key] = settings[field.key] || ""
        }
        fieldsToSave["why_choose_us_image"] = whyChooseUsUrl
        fieldsToSave["why_choose_us_image_file_id"] = whyChooseUsId
        const res = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settings: fieldsToSave }),
        })
        if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
        else { const err = await res.json(); toast.error(err.error || "Failed to save") }
      } else {
        const fieldsToSave: Record<string, string> = {}
        for (const field of TAB_FIELDS[activeTab]) {
          fieldsToSave[field.key] = settings[field.key] || ""
        }
        const res = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settings: fieldsToSave }),
        })
        if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
        else { const err = await res.json(); toast.error(err.error || "Failed to save") }
      }
    } catch { toast.error("Failed to save settings") } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your clinic&apos;s information, SEO, email, and images</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSaved(false) }} className={`flex items-center gap-2 px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? "border-primary-500 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 space-y-6">
          {activeTab === "images" ? (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Logo</h3>
                <p className="text-sm text-gray-500 mb-3">Upload your clinic logo. This appears in the header.</p>
                <FilePicker
                  currentValue={logoUrl}
                  onSelect={(file) => { setLogoId(file.id); setLogoUrl(file.url) }}
                  label="Header Logo"
                />
              </div>
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Footer Logo</h3>
                <p className="text-sm text-gray-500 mb-3">Upload a logo for the footer. Typically an inverted/light version.</p>
                <FilePicker
                  currentValue={footerLogoUrl}
                  onSelect={(file) => { setFooterLogoId(file.id); setFooterLogoUrl(file.url) }}
                  label="Footer Logo"
                />
              </div>
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Default OG Image</h3>
                <p className="text-sm text-gray-500 mb-3">This image is used when your site is shared on social media.</p>
                <FilePicker
                  currentValue={ogImageUrl}
                  onSelect={(file) => { setOgImageId(file.id); setOgImageUrl(file.url) }}
                  label="OG Image"
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Hero Backgrounds</h3>
                <p className="text-sm text-gray-500 mb-4">Choose background images for each page hero section.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {heroBgFields.map((f) => (
                    <FilePicker
                      key={f.key}
                      currentValue={heroBgUrls[f.key]}
                      onSelect={(file) => { setHeroBgFileIds((prev) => ({ ...prev, [f.key]: file.id })); setHeroBgUrls((prev) => ({ ...prev, [f.key]: file.url })) }}
                      label={f.label}
                    />
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Page Images</h3>
                <div className="space-y-6">
                  <FilePicker
                    currentValue={aboutStoryUrl}
                    onSelect={(file) => { setAboutStoryId(file.id); setAboutStoryUrl(file.url) }}
                    label="About - Story Image"
                  />
                  <FilePicker
                    currentValue={homepageSliderUrl}
                    onSelect={(file) => { setHomepageSliderId(file.id); setHomepageSliderUrl(file.url) }}
                    label="Homepage - Slider Image"
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Testimonial Avatars</h3>
                <p className="text-sm text-gray-500 mb-4">Default avatars for the testimonial carousel.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {avatarFields.map((f) => (
                    <FilePicker
                      key={f.key}
                      currentValue={avatarUrls[f.key]}
                      onSelect={(file) => { setAvatarFileIds((prev) => ({ ...prev, [f.key]: file.id })); setAvatarUrls((prev) => ({ ...prev, [f.key]: file.url })) }}
                      label={f.label}
                    />
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Fallback JSON Data</h3>
                <p className="text-sm text-gray-500 mb-4">JSON arrays/objects used as fallback when no database content exists.</p>
                <div className="space-y-4">
                  {Object.entries(fallbackJsonSettings).map(([key, value]) => (
                    <div key={key}>
                      <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">{key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</label>
                      <textarea id={key} rows={4} value={value} onChange={(e) => { setFallbackJsonSettings((prev) => ({ ...prev, [key]: e.target.value })); setSaved(false) }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm font-mono resize-y" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === "homepage" ? (
            <div className="space-y-8">
              <div className="space-y-6">
                {TAB_FIELDS.homepage.map((field) => (
                  <div key={field.key}>
                    <label htmlFor={field.key} className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    <input id={field.key} type="text" value={settings[field.key] || ""} onChange={(e) => updateField(field.key, e.target.value)} placeholder={field.placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm" />
                  </div>
                ))}
              </div>
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Why Choose Us Image</h3>
                <p className="text-sm text-gray-500 mb-3">Choose the image displayed in the Why Choose Us section on the homepage.</p>
                <FilePicker
                  currentValue={whyChooseUsUrl}
                  onSelect={(file) => { setWhyChooseUsId(file.id); setWhyChooseUsUrl(file.url) }}
                  label="Why Choose Us Image"
                />
              </div>
            </div>
          ) : (
            TAB_FIELDS[activeTab].map((field) => (
              <div key={field.key}>
                <label htmlFor={field.key} className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                {field.type === "textarea" ? (
                  <textarea id={field.key} rows={3} value={settings[field.key] || ""} onChange={(e) => updateField(field.key, e.target.value)} placeholder={field.placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm resize-y" />
                ) : field.type === "toggle" ? (
                  <button type="button" role="switch" aria-checked={settings[field.key] === "true"} onClick={() => updateField(field.key, settings[field.key] === "true" ? "false" : "true")} className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${settings[field.key] === "true" ? "bg-primary-600" : "bg-gray-200"}`}>
                    <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${settings[field.key] === "true" ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                ) : (
                  <input id={field.key} type="text" value={settings[field.key] || ""} onChange={(e) => updateField(field.key, e.target.value)} placeholder={field.placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm" />
                )}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  )
}
