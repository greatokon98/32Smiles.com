import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import SettingsForm from "./settings-form"

export const dynamic = "force-dynamic"

const DEFAULT_SETTINGS: Record<string, string> = {
  clinic_name: "32Smiles Dental Clinic",
  clinic_tagline: "Your Smile, Our Priority",
  clinic_description:
    "32Smiles is a leading dental clinic offering comprehensive dental care services in a comfortable and modern environment.",
  contact_email: "info@32smiles.com",
  contact_phone: "+234 800 123 4567",
  contact_address: "",
  business_hours_weekday: "8:00 AM - 6:00 PM",
  business_hours_saturday: "9:00 AM - 4:00 PM",
  business_hours_sunday: "Closed",
  seo_meta_title: "32Smiles Dental Clinic - Quality Dental Care",
  seo_meta_description:
    "Professional dental care services. General dentistry, cosmetic dentistry, orthodontics, and more at 32Smiles Dental Clinic.",
  seo_og_image: "",
  email_notifications_enabled: "true",
  email_notification_address: "notifications@32smiles.com",
  hero_tagline_1: "Advanced Care, Gentle Touch",
  hero_tagline_2: "Expert Dentists, Warm Smiles",
  hero_tagline_3: "Modern Technology, Real Results",
  hero_tagline_4: "Your Comfort, Our Commitment",
  stats_years: "10",
  stats_patients: "5000",
  stats_satisfaction: "98",
  stats_emergency_label: "24/7 Emergency Support",
  insurance_companies: "Aetna, Cigna, Delta Dental, MetLife, Blue Cross, Guardian, Humana, UnitedHealthcare",
}

export default async function SettingsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/admin/login")
  }

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    redirect("/admin")
  }

  const settings = await prisma.setting.findMany({
    select: { key: true, value: true },
  })

  const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS }
  for (const s of settings) {
    settingsMap[s.key] = s.value
  }

  return <SettingsForm initialSettings={settingsMap} />
}
