// Client-side image compression: keeps uploads under Vercel's ~4.5MB request
// body limit while preserving visual quality for large photos.

const MAX_BYTES = 4.2 * 1024 * 1024
const MAX_DIMENSION = 2048

export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file
  if (file.size <= MAX_BYTES) return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    bitmap.close()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const type = file.type === "image/png" ? "image/png" : "image/webp"
  const toBlob = (quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))

  let quality = 0.9
  for (let i = 0; i < 6; i++) {
    const blob = await toBlob(quality)
    if (blob && blob.size <= MAX_BYTES) {
      return new File([blob], file.name, { type })
    }
    quality -= 0.15
  }

  const fallback = await toBlob(0.5)
  if (fallback) return new File([fallback], file.name, { type })
  return file
}
