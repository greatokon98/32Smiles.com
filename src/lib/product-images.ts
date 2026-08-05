import prisma from "@/lib/prisma"

export const DEFAULT_PRODUCT_IMAGES: Record<string, string> = {
  "professional-toothpaste": "/images/services/1.jpg",
  "electric-toothbrush": "/images/services/2.jpg",
  "dental-floss": "/images/services/3.jpg",
  "mouthwash": "/images/services/b1.jpg",
  "teeth-whitening-kit": "/images/services/single-service.jpg",
  "oral-irrigator": "/images/services/1.jpg",
}

export async function getProductFallbackImages(
  settings?: { key: string; value: string }[],
): Promise<Record<string, string>> {
  const rows =
    settings ??
    (await prisma.setting.findMany({
      select: { key: true, value: true },
    }))
  const raw = rows.find((s) => s.key === "product_fallback_images")?.value
  if (!raw) return { ...DEFAULT_PRODUCT_IMAGES }
  try {
    return JSON.parse(raw) as Record<string, string>
  } catch {
    return { ...DEFAULT_PRODUCT_IMAGES }
  }
}
