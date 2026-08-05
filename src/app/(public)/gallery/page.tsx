import { Metadata } from "next"
import prisma from "@/lib/prisma"
import { ContentType, ContentStatus } from "@prisma/client"
import { serializeContent } from "@/lib/utils"
import { siteConfig } from "@/config/site"
import { GalleryGrid } from "./gallery-grid"

function getSetting(settings: { key: string; value: string }[], key: string, fallback: string): string {
  return settings.find((s) => s.key === key)?.value || fallback
}

export const revalidate = 300

export const metadata: Metadata = {
  title: "Gallery",
  description: `Browse our gallery of smile transformations, dental procedures, and our modern clinic at ${siteConfig.name}. See the quality of our work firsthand.`,
  openGraph: {
    title: `Gallery | ${siteConfig.name}`,
    description: `Browse our gallery of smile transformations, dental procedures, and our modern clinic at ${siteConfig.name}. See the quality of our work firsthand.`,
  },
}

export default async function GalleryPage() {
  const settings = await prisma.setting.findMany()
  const fallbackGalleryItems: { id: string; title: string; category: string | null; imageUrl: string; fullImageUrl: string }[] = (() => {
    const defaultItems = JSON.stringify([
      { id: "1", title: "Clinic Interior", category: "clinic", imageUrl: "/images/gallery/1.jpg", fullImageUrl: "/images/gallery/full/1.jpg" },
      { id: "2", title: "Dental Equipment", category: "clinic", imageUrl: "/images/gallery/2.jpg", fullImageUrl: "/images/gallery/full/2.jpg" },
      { id: "3", title: "Smile Transformation", category: "transformations", imageUrl: "/images/gallery/3.jpg", fullImageUrl: "/images/gallery/full/3.jpg" },
      { id: "4", title: "Before & After", category: "transformations", imageUrl: "/images/gallery/4.jpg", fullImageUrl: "/images/gallery/full/4.jpg" },
      { id: "5", title: "Treatment Room", category: "clinic", imageUrl: "/images/gallery/5.jpg", fullImageUrl: "/images/gallery/full/5.jpg" },
      { id: "6", title: "Happy Patient", category: "team", imageUrl: "/images/gallery/6.jpg", fullImageUrl: "/images/gallery/full/6.jpg" },
      { id: "7", title: "Modern Technology", category: "clinic", imageUrl: "/images/gallery/7.jpg", fullImageUrl: "/images/gallery/full/7.jpg" },
      { id: "8", title: "Dental Procedure", category: "transformations", imageUrl: "/images/gallery/8.jpg", fullImageUrl: "/images/gallery/full/8.jpg" },
      { id: "9", title: "Our Clinic", category: "clinic", imageUrl: "/images/gallery/9.jpg", fullImageUrl: "/images/gallery/full/9.jpg" },
    ])
    try { return JSON.parse(getSetting(settings, "gallery_fallback_images", defaultItems)) } catch { return JSON.parse(defaultItems) }
  })()
  const dbItems = await prisma.galleryItem.findMany({
    where: {
      content: {
        type: ContentType.GALLERY_ITEM,
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
      },
    },
    include: {
      content: true,
      imageFile: true,
      fullImageFile: true,
    },
    orderBy: [{ sortOrder: "asc" }, { content: { createdAt: "desc" } }],
  })

  const fallbackAsItems = fallbackGalleryItems.map((item, index) => ({
    id: `fallback-${item.id}`,
    category: item.category,
    sortOrder: 1000 + index,
    caption: item.title,
    altText: item.title,
    content: { title: item.title },
    imageFile: { url: item.imageUrl },
    fullImageFile: { url: item.fullImageUrl },
  }))

  const visibleDbItems = dbItems.filter((item) => item.imageFile?.url || item.fullImageFile?.url)

  function interleave<T, U>(primary: T[], filler: U[]): (T | U)[] {
    if (primary.length === 0) return filler
    const total = primary.length + filler.length
    const positions = new Set(
      primary.map(
        (_, i) => Math.round(((i + 1) * total) / (primary.length + 1)) - 1
      )
    )
    const result: (T | U)[] = []
    const fillerQueue = [...filler]
    let p = 0
    for (let i = 0; i < total; i++) {
      if (positions.has(i)) {
        result.push(primary[p++])
      } else {
        result.push(fillerQueue.length ? fillerQueue.shift()! : primary[p++])
      }
    }
    return result
  }

  const displayItems = interleave(visibleDbItems, fallbackAsItems)

  const categories: string[] = Array.from(
    new Set(displayItems.map((item) => item.category).filter((c): c is string => !!c))
  ).sort()

  return (
    <>
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${getSetting(settings, 'hero_bg_gallery', '/images/bg/bg3.jpg')})` }} />
        <div className="relative container mx-auto px-4 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              Our Work
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">Gallery</h1>
            <p className="text-lg lg:text-xl text-primary-100 leading-relaxed">
              Take a visual tour of {siteConfig.name}. Browse our smile
              transformations, state-of-the-art facilities, and the happy faces
              of our patients.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <GalleryGrid items={serializeContent(displayItems) as any} categories={categories} />
        </div>
      </section>
    </>
  )
}
