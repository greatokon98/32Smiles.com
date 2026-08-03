import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { promptService } from "@/ai/prompts/service"
import { getAIRegistry } from "@/ai/providers/registry"
import { prisma } from "@/lib/prisma"
import GenerationWizard from "./generation-wizard"
import { Bot, Sparkles } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AIStudioPage() {
  const session = await auth()
  if (!session?.user) redirect("/admin/login")

  const registryPromise = getAIRegistry()
  const [templates, providerStatus, brandVoices] = await Promise.all([
    promptService.list(),
    registryPromise.then((r) => r.getStatus()),
    prisma.brandVoice.findMany({ where: { isActive: true } }),
  ])

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/admin/dashboard" className="text-xl font-bold text-primary-600">
            32Smiles Admin
          </a>
          <span className="text-sm text-gray-500">AI Content Studio</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Sparkles className="h-7 w-7 text-amber-500" />
          AI Content Studio
        </h1>
        <p className="text-gray-500 mb-8">
          Generate, refine, and optimize content with AI assistance
        </p>

        <GenerationWizard
          templates={templates.map((t) => ({
            id: t.id,
            name: t.name,
            slug: t.name.toLowerCase().replace(/\s+/g, "-"),
            category: t.category,
            description: t.description || undefined,
            variables: Array.isArray(t.variables) ? (t.variables as string[]) : [],
          }))}
          providers={providerStatus.map((p) => ({
            name: p.name,
            available: p.available,
            enabled: p.enabled,
            defaultModel: p.defaultModel,
          }))}
          brandVoices={brandVoices.map((bv) => ({
            id: bv.id,
            name: bv.name,
            tone: bv.tone,
          }))}
        />
      </div>
    </div>
  )
}
