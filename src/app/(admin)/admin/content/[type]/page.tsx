import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import ContentList from "@/features/admin/content/components/ContentList"

const TYPE_LABELS: Record<string, string> = {
  BLOG_POST: "Blog Posts",
  SERVICE: "Services",
  PRODUCT: "Products",
  EDUCATION_PATIENT: "Patient Education",
  EDUCATION_PROFESSIONAL: "Professional Education",
  GALLERY_ITEM: "Gallery",
  TEAM_MEMBER: "Team Members",
  FAQ: "FAQs",
  TESTIMONIAL: "Testimonials",
}

export default async function ContentListPage({
  params,
}: {
  params: Promise<{ type: string }>
}) {
  const { type } = await params
  const typeName = TYPE_LABELS[type] || type

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/admin/content" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back to {typeName}</span>
          </Link>
          <a href="/admin/dashboard" className="text-xl font-bold text-primary-600">
            32Smiles Admin
          </a>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ContentList />
      </div>
    </div>
  )
}
