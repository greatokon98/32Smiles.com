import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import {
  FileText,
  Briefcase,
  ShoppingBag,
  GraduationCap,
  Users,
  HelpCircle,
  MessageSquare,
  Image,
  Star,
} from "lucide-react"

export const dynamic = "force-dynamic"

const contentTypes = [
  { type: "BLOG_POST", label: "Blog Posts", icon: FileText, description: "News, articles, and updates" },
  { type: "SERVICE", label: "Services", icon: Briefcase, description: "Dental services offered" },
  { type: "PRODUCT", label: "Products", icon: ShoppingBag, description: "Product catalog" },
  { type: "EDUCATION_PATIENT", label: "Patient Education", icon: GraduationCap, description: "Patient-facing articles" },
  { type: "EDUCATION_PROFESSIONAL", label: "Professional Education", icon: GraduationCap, description: "Professional articles" },
  { type: "TEAM_MEMBER", label: "Team Members", icon: Users, description: "Staff profiles" },
  { type: "FAQ", label: "FAQs", icon: HelpCircle, description: "Frequently asked questions" },
  { type: "TESTIMONIAL", label: "Testimonials", icon: Star, description: "Patient reviews" },
  { type: "GALLERY_ITEM", label: "Gallery", icon: Image, description: "Photo gallery" },
]

export default function AdminContentPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <Link href="/admin/dashboard" className="text-xl font-bold text-primary-600">
            32Smiles Admin
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Content Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contentTypes.map((ct) => (
            <Link
              key={ct.type}
              href={`/admin/content/${ct.type}`}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md hover:border-primary-300 border border-transparent transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center shrink-0">
                  <ct.icon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{ct.label}</h2>
                  <p className="text-sm text-gray-500 mt-1">{ct.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
