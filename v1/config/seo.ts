import { Metadata } from 'next'

export const siteConfig = {
  name: 'Design Kit',
  title: 'Design Kit - Professional Design Tools Suite',
  description: 'Privacy-first browser-based image processing and design tools. Process images, extract colors, remove backgrounds, and more—all in your browser.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://designkit.com',
  ogImage: '/og-image.png',
  keywords: [
    'design tools',
    'image processing',
    'browser-based tools',
    'privacy-first design',
    'color picker',
    'background remover',
    'image resizer',
    'image compressor',
    'gradient generator',
    'QR code generator',
    'mockup generator',
    'image cropper',
    'format converter',
    'image upscaler',
    'client-side processing',
    'online design tools',
    'free design tools',
    'professional design suite',
  ],
  authors: [
    {
      name: 'Design Kit Team',
      url: 'https://designkit.com',
    },
  ],
  creator: 'Design Kit',
  publisher: 'Design Kit',
  category: 'Design Tools',
}

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: siteConfig.authors,
  creator: siteConfig.creator,
  publisher: siteConfig.publisher,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: '@designkit',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo/logo-icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/logo/logo-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
  manifest: '/site.webmanifest',
}

// Tool page SEO helper
export function generateToolMetadata(tool: {
  name: string
  description: string
  path: string
}): Metadata {
  const title = `${tool.name} - Free Online Tool`
  const description = `${tool.description} Process images securely in your browser with our free ${tool.name.toLowerCase()}.`
  const url = `${siteConfig.url}${tool.path}`

  return {
    title,
    description,
    keywords: [
      ...siteConfig.keywords,
      tool.name.toLowerCase(),
      `online ${tool.name.toLowerCase()}`,
      `free ${tool.name.toLowerCase()}`,
    ],
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: [
        {
          url: siteConfig.ogImage,
          width: 1200,
          height: 630,
          alt: tool.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [siteConfig.ogImage],
    },
    alternates: {
      canonical: url,
    },
  }
}
