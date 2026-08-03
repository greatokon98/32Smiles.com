import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import TemplateManager from "./template-manager"

export const dynamic = "force-dynamic"

export default async function TemplatesPage() {
  const session = await auth()
  if (!session?.user) redirect("/admin/login")

  const templates = await prisma.promptTemplate.findMany({
    orderBy: { name: "asc" },
  })

  const serialized = templates.map((t) => ({
    ...t,
    variables: (t.variables as string[] | null) ?? [],
    defaultParams: (t.defaultParams as Record<string, unknown> | null) ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }))

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/admin/dashboard" className="text-xl font-bold text-primary-600">
            32Smiles Admin
          </a>
          <span className="text-sm text-gray-500">Prompt Templates</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <TemplateManager initialTemplates={serialized} />
      </div>
    </div>
  )
}
