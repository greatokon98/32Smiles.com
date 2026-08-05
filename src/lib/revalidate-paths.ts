import { revalidatePath } from "next/cache"

export const ALL_PUBLIC_PATHS = [
  "/",
  "/about",
  "/appointment",
  "/contact",
  "/faq",
  "/insurance",
  "/team",
  "/team/[slug]",
  "/services",
  "/services/[slug]",
  "/blog",
  "/blog/[slug]",
  "/education/patient",
  "/education/patient/[slug]",
  "/education/professional",
  "/education/professional/[slug]",
  "/gallery",
  "/products",
  "/products/[slug]",
] as const

export async function revalidateAllPublicPaths() {
  for (const path of ALL_PUBLIC_PATHS) {
    await revalidatePath(path)
  }
}

export async function revalidateContentPaths(
  type?: string | null,
  slug?: string | null,
) {
  switch (type) {
    case "BLOG_POST":
      await revalidatePath("/blog")
      if (slug) await revalidatePath(`/blog/${slug}`)
      break
    case "SERVICE":
      await revalidatePath("/services")
      if (slug) await revalidatePath(`/services/${slug}`)
      break
    case "PRODUCT":
      await revalidatePath("/products")
      if (slug) await revalidatePath(`/products/${slug}`)
      break
    case "EDUCATION_PATIENT":
      await revalidatePath("/education/patient")
      if (slug) await revalidatePath(`/education/patient/${slug}`)
      break
    case "EDUCATION_PROFESSIONAL":
      await revalidatePath("/education/professional")
      if (slug) await revalidatePath(`/education/professional/${slug}`)
      break
    case "GALLERY_ITEM":
      await revalidatePath("/gallery")
      break
    case "TEAM_MEMBER":
      await revalidatePath("/team")
      await revalidatePath("/about")
      if (slug) await revalidatePath(`/team/${slug}`)
      break
    case "FAQ":
    case "FAQ_PATIENT_EDUCATION":
    case "FAQ_STANDALONE":
      await revalidatePath("/faq")
      break
    case "TESTIMONIAL":
      await revalidatePath("/")
      break
    default:
      await revalidatePath("/")
  }
}
