"use client"

import { useEffect } from "react"
import { siteConfig } from "@/config/site"

interface SEOHeadProps {
  title?: string
  description?: string
  canonical?: string
  ogImage?: string
  ogType?: "website" | "article"
  ogTitle?: string
  ogDescription?: string
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  noIndex?: boolean
  noFollow?: boolean
}

function setCanonical(href: string) {
  if (!href) return

  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null

  if (!link) {
    link = document.createElement("link")
    link.setAttribute("rel", "canonical")
    document.head.appendChild(link)
  }

  link.setAttribute("href", href)
}

export function SEOHead({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  ogTitle,
  ogDescription,
  twitterTitle,
  twitterDescription,
  twitterImage,
  noIndex,
  noFollow,
}: SEOHeadProps) {
  useEffect(() => {
    const baseUrl = siteConfig.url
    const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name
    const desc = description || siteConfig.description
    const imageUrl = ogImage || siteConfig.url + "/images/og-default.jpg"

    // Open Graph
    setMetaProperty("og:title", ogTitle || fullTitle)
    setMetaProperty("og:description", ogDescription || desc)
    setMetaProperty("og:type", ogType)
    setMetaProperty("og:url", canonical || baseUrl)
    setMetaProperty("og:site_name", siteConfig.name)
    setMetaProperty("og:locale", "en_US")
    if (imageUrl) setMetaProperty("og:image", imageUrl)

    // Twitter Card
    setMetaName("twitter:card", "summary_large_image")
    setMetaName("twitter:title", twitterTitle || ogTitle || fullTitle)
    setMetaName("twitter:description", twitterDescription || ogDescription || desc)
    if (twitterImage || imageUrl) setMetaName("twitter:image", twitterImage || imageUrl)

    // Canonical
    if (canonical) setCanonical(canonical)

    // Robots
    const robotsContent = [
      noIndex ? "noindex" : "index",
      noFollow ? "nofollow" : "follow",
    ].join(", ")
    setMetaName("robots", robotsContent)
  }, [
    title,
    description,
    canonical,
    ogImage,
    ogType,
    ogTitle,
    ogDescription,
    twitterTitle,
    twitterDescription,
    twitterImage,
    noIndex,
    noFollow,
  ])

  return null
}

function setMetaProperty(property: string, content: string) {
  setMetaElement(property, content, "property")
}

function setMetaName(name: string, content: string) {
  setMetaElement(name, content, "name")
}

function setMetaElement(key: string, content: string, attribute: "property" | "name") {
  if (!content) return

  let element = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null

  if (!element) {
    element = document.createElement("meta")
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.setAttribute("content", content)
}
