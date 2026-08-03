"use client"

import { clinicInfo } from "@/lib/clinic-info"

// ─── Types ────────────────────────────────────────────────────

type OrganizationSchema = {
  "@type": "Organization" | "DentalClinic"
  name: string
  url: string
  logo: string
  description: string
  address: Record<string, unknown>
  contactPoint: Record<string, unknown>
  sameAs: string[]
}

type LocalBusinessSchema = {
  "@type": "LocalBusiness" | "MedicalBusiness" | "MedicalClinic"
  "@context": "https://schema.org"
  name: string
  description: string
  url: string
  telephone: string
  email: string
  address: {
    "@type": "PostalAddress"
    streetAddress: string
    addressLocality: string
    addressRegion: string
    addressCountry: string
    postalCode: string
  }
  geo: {
    "@type": "GeoCoordinates"
    latitude: number
    longitude: number
  }
  openingHoursSpecification: Array<{
    "@type": "OpeningHoursSpecification"
    dayOfWeek: string | string[]
    opens: string
    closes: string
  }>
  image: string
  logo: string
  priceRange?: string
}

type BreadcrumbItem = {
  name: string
  url: string
}

type BreadcrumbListSchema = {
  "@type": "BreadcrumbList"
  itemListElement: Array<{
    "@type": "ListItem"
    position: number
    name: string
    item: string
  }>
}

type FAQItem = {
  question: string
  answer: string
}

type FAQPageSchema = {
  "@type": "FAQPage"
  mainEntity: Array<{
    "@type": "Question"
    name: string
    acceptedAnswer: {
      "@type": "Answer"
      text: string
    }
  }>
}

type ArticleSchema = {
  "@type": "Article" | "BlogPosting"
  headline: string
  description: string
  image?: string
  datePublished: string
  dateModified?: string
  author: {
    "@type": "Organization" | "Person"
    name: string
  }
  publisher: {
    "@type": "Organization"
    name: string
    logo: {
      "@type": "ImageObject"
      url: string
    }
  }
  mainEntityOfPage: {
    "@type": "WebPage"
    "@id": string
  }
}

type SchemaType =
  | "Organization"
  | "LocalBusiness"
  | "MedicalClinic"
  | "BreadcrumbList"
  | "FAQPage"
  | "Article"
  | "BlogPosting"

interface JsonLdProps {
  type: SchemaType
  data?: Record<string, unknown>
  breadcrumbs?: BreadcrumbItem[]
  faqs?: FAQItem[]
  article?: {
    title: string
    description: string
    image?: string
    datePublished: string
    dateModified?: string
    author?: string
    slug: string
  }
}

// ─── Schema Builders ──────────────────────────────────────────

function buildOrganizationSchema(): OrganizationSchema {
  return {
    "@type": "DentalClinic",
    name: clinicInfo.name,
    url: clinicInfo.url,
    logo: clinicInfo.logo,
    description: clinicInfo.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: clinicInfo.address.street,
      addressLocality: clinicInfo.address.locality,
      addressRegion: clinicInfo.address.region,
      addressCountry: clinicInfo.address.country,
      postalCode: clinicInfo.address.postalCode,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: clinicInfo.phone,
      contactType: "customer service",
      availableLanguage: ["English"],
    },
    sameAs: Object.values(clinicInfo.social).filter(Boolean),
  }
}

function buildLocalBusinessSchema(): LocalBusinessSchema {
  return {
    "@type": "MedicalClinic",
    "@context": "https://schema.org",
    name: clinicInfo.name,
    description: clinicInfo.description,
    url: clinicInfo.url,
    telephone: clinicInfo.phone,
    email: clinicInfo.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: clinicInfo.address.street,
      addressLocality: clinicInfo.address.locality,
      addressRegion: clinicInfo.address.region,
      addressCountry: clinicInfo.address.country,
      postalCode: clinicInfo.address.postalCode,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: clinicInfo.geo.latitude,
      longitude: clinicInfo.geo.longitude,
    },
    openingHoursSpecification: clinicInfo.openingHoursSpecification.map((spec) => ({
      "@type": "OpeningHoursSpecification" as const,
      dayOfWeek: [...spec.dayOfWeek],
      opens: spec.opens,
      closes: spec.closes,
    })),
    image: clinicInfo.image,
    logo: clinicInfo.logo,
    priceRange: "$$",
  }
}

function buildBreadcrumbSchema(items: BreadcrumbItem[]): BreadcrumbListSchema {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

function buildFAQSchema(faqs: FAQItem[]): FAQPageSchema {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }
}

function buildArticleSchema(
  article: NonNullable<JsonLdProps["article"]>,
): ArticleSchema {
  return {
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    ...(article.image && { image: article.image }),
    datePublished: article.datePublished,
    ...(article.dateModified && { dateModified: article.dateModified }),
    author: {
      "@type": "Organization",
      name: article.author || clinicInfo.name,
    },
    publisher: {
      "@type": "Organization",
      name: clinicInfo.name,
      logo: {
        "@type": "ImageObject",
        url: clinicInfo.logo,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${clinicInfo.url}/blog/${article.slug}`,
    },
  }
}

// ─── Component ────────────────────────────────────────────────

export function JsonLd({ type, data, breadcrumbs, faqs, article }: JsonLdProps) {
  let schema: Record<string, unknown>

  switch (type) {
    case "Organization":
      schema = { "@context": "https://schema.org", ...buildOrganizationSchema() }
      break
    case "LocalBusiness":
    case "MedicalClinic":
      schema = buildLocalBusinessSchema()
      break
    case "BreadcrumbList":
      if (!breadcrumbs) return null
      schema = { "@context": "https://schema.org", ...buildBreadcrumbSchema(breadcrumbs) }
      break
    case "FAQPage":
      if (!faqs) return null
      schema = { "@context": "https://schema.org", ...buildFAQSchema(faqs) }
      break
    case "Article":
    case "BlogPosting":
      if (!article) return null
      schema = { "@context": "https://schema.org", ...buildArticleSchema(article) }
      break
    default:
      return null
  }

  if (data) {
    schema = { ...schema, ...data }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// ─── Preset Combinations ──────────────────────────────────────

export function ClinicJsonLd() {
  return (
    <>
      <JsonLd type="Organization" />
      <JsonLd type="MedicalClinic" />
    </>
  )
}

export function ServiceJsonLd({
  name,
  description,
  breadcrumbs,
}: {
  name: string
  description: string
  url: string
  breadcrumbs: BreadcrumbItem[]
}) {
  return (
    <>
      <JsonLd
        type="LocalBusiness"
        data={{
          medicalSpecialty: "Dentistry",
          availableService: {
            "@type": "MedicalProcedure",
            name,
            description,
            procedureType: "http://schema.org/SurgicalProcedure",
          },
        }}
      />
      <JsonLd type="BreadcrumbList" breadcrumbs={breadcrumbs} />
    </>
  )
}

export function BlogPostJsonLd({
  title,
  description,
  image,
  datePublished,
  dateModified,
  author,
  slug,
  breadcrumbs,
}: NonNullable<JsonLdProps["article"]> & { breadcrumbs: BreadcrumbItem[] }) {
  return (
    <>
      <JsonLd
        type="Article"
        article={{ title, description, image, datePublished, dateModified, author, slug }}
      />
      <JsonLd type="BreadcrumbList" breadcrumbs={breadcrumbs} />
    </>
  )
}

export function FAQJsonLd({ faqs }: { faqs: FAQItem[] }) {
  return <JsonLd type="FAQPage" faqs={faqs} />
}
