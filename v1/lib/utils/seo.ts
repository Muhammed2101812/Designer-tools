import { Metadata } from 'next'
import { siteConfig } from '@/config/seo'

/**
 * Generate SEO-optimized metadata for pages
 */
export function generatePageMetadata({
  title,
  description,
  path = '',
  keywords = [],
  noIndex = false,
}: {
  title: string
  description: string
  path?: string
  keywords?: string[]
  noIndex?: boolean
}): Metadata {
  const url = `${siteConfig.url}${path}`
  const fullTitle = title.includes(siteConfig.name) ? title : `${title} | ${siteConfig.name}`

  return {
    title: fullTitle,
    description,
    keywords: [...siteConfig.keywords, ...keywords],
    openGraph: {
      title: fullTitle,
      description,
      url,
      type: 'website',
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [siteConfig.ogImage],
    },
    alternates: {
      canonical: url,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
  }
}

/**
 * Generate canonical URL
 */
export function getCanonicalUrl(path: string): string {
  return `${siteConfig.url}${path}`
}

/**
 * Generate Open Graph image URL
 */
export function getOgImageUrl(title?: string): string {
  if (!title) return siteConfig.ogImage

  // If you have a dynamic OG image generator:
  // return `${siteConfig.url}/api/og?title=${encodeURIComponent(title)}`

  return siteConfig.ogImage
}
