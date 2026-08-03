import { Metadata } from "next"
import { SearchResults } from "./search-results"

export const dynamic = "force-dynamic"

type Props = {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams
  const query = params.q

  if (!query) {
    return {
      title: "Search | 32Smiles Dental Clinic",
      description: "Search across services, blog posts, products, and team members at 32Smiles Dental Clinic.",
    }
  }

  return {
    title: `Search: ${query} | 32Smiles Dental Clinic`,
    description: `Search results for "${query}" across 32Smiles Dental Clinic website.`,
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams
  const query = params.q || ""
  const type = params.type || "ALL"

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {query ? `Results for "${query}"` : "Search"}
          </h1>
          <p className="text-gray-500">
            Find services, articles, products, and more
          </p>
        </div>

        <SearchResults initialQuery={query} initialType={type} />
      </div>
    </div>
  )
}
