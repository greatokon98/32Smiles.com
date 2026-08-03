import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { contentService } from "@/services/content.service"
import ContentEditor from "@/features/admin/content/components/ContentEditor"
import { ArrowLeft } from "lucide-react"
import { Prisma } from "@prisma/client"

function serializeContent(content: unknown): unknown {
  if (content === null || content === undefined) return content
  if (content instanceof Prisma.Decimal) return Number(content.toString())
  if (Array.isArray(content)) return content.map(serializeContent)
  if (typeof content === "object") {
    const obj = content as Record<string, unknown>
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeContent(value)
    }
    return result
  }
  return content
}

export default async function ContentEditPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/admin/login")
  }

  const { type, id } = await params

  const typeName = type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())

  // If id is "new", it's a create page
  if (id === "new") {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href={`/admin/content/${type}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm font-medium">Back to {typeName}s</span>
              </Link>
            </div>
            <Link href="/admin/dashboard" className="text-xl font-bold text-primary-600">
              32Smiles Admin
            </Link>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <ContentEditor type={type} />
        </div>
      </div>
    )
  }

  // Fetch existing content
  const content = await contentService.getById(id)

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin/content" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back to {typeName}s</span>
            </Link>
          </div>
          <Link href="/admin/dashboard" className="text-xl font-bold text-primary-600">
            32Smiles Admin
          </Link>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ContentEditor type={type} id={id} initialData={(serializeContent(content) as Record<string, unknown>) || undefined} />
      </div>
    </div>
  )
}
