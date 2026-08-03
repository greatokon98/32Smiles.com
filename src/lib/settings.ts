import prisma from "@/lib/prisma"
import { cache } from "react"

const PUBLIC_SETTING_KEYS = ["site_logo_url", "site_logo_file_id", "site_footer_logo_url", "site_og_image_url"]

export async function getPublicSettings(): Promise<Record<string, string>> {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: PUBLIC_SETTING_KEYS } },
      select: { key: true, value: true },
    })
    const result: Record<string, string> = {}
    for (const s of settings) {
      result[s.key] = s.value
    }
    return result
  } catch {
    return {}
  }
}

export async function getSiteLogoUrl(): Promise<string> {
  const settings = await getPublicSettings()
  return settings.site_logo_url || "/images/logo.png"
}

const IMAGE_SETTING_KEYS = [
  "hero_bg_homepage", "hero_bg_homepage_cta", "hero_bg_about",
  "hero_bg_services", "hero_bg_products", "hero_bg_blog",
  "hero_bg_gallery", "hero_bg_team", "hero_bg_insurance",
  "hero_bg_faq", "hero_bg_contact", "hero_bg_cart",
  "hero_bg_appointment", "hero_bg_education_patient", "hero_bg_education_professional",
  "about_story_image", "homepage_slider_image",
  "testimonial_avatar_1", "testimonial_avatar_2", "testimonial_avatar_3", "testimonial_avatar_4",
  "gallery_fallback_images", "team_fallback_photos", "blog_fallback_images",
  "before_after_fallback_images", "service_fallback_images", "product_fallback_images",
  "site_logo_url", "site_footer_logo_url", "site_og_image_url",
  "why_choose_us_image",
]

export const getAllImageSettings = cache(async (): Promise<Record<string, string>> => {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: IMAGE_SETTING_KEYS } },
      select: { key: true, value: true },
    })
    const result: Record<string, string> = {}
    for (const s of settings) {
      result[s.key] = s.value
    }
    return result
  } catch {
    return {}
  }
})

export function getSetting(settings: Record<string, string>, key: string, fallback: string): string {
  return settings[key] || fallback
}
