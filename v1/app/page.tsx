import dynamic from 'next/dynamic'
import { Hero } from '@/components/marketing/Hero'
import { OrganizationSchema, WebSiteSchema, WebApplicationSchema } from '@/components/seo/JsonLd'

// Lazy load below-the-fold components with loading states
const Stats = dynamic(() => import('@/components/marketing/Stats').then(mod => ({ default: mod.Stats })), {
  loading: () => <div className="h-64 animate-pulse bg-muted/20" />,
  ssr: true
})

const Features = dynamic(() => import('@/components/marketing/Features').then(mod => ({ default: mod.Features })), {
  loading: () => <div className="h-96 animate-pulse bg-muted/20" />,
  ssr: true
})

const HowItWorks = dynamic(() => import('@/components/marketing/HowItWorks').then(mod => ({ default: mod.HowItWorks })), {
  loading: () => <div className="h-96 animate-pulse bg-muted/20" />,
  ssr: true
})

const ToolsGrid = dynamic(() => import('@/components/marketing/ToolsGrid').then(mod => ({ default: mod.ToolsGrid })), {
  loading: () => <div className="h-96 animate-pulse bg-muted/20" />,
  ssr: true
})

const Testimonials = dynamic(() => import('@/components/marketing/Testimonials').then(mod => ({ default: mod.Testimonials })), {
  loading: () => <div className="h-96 animate-pulse bg-muted/20" />,
  ssr: true
})

const Pricing = dynamic(() => import('@/components/marketing/Pricing').then(mod => ({ default: mod.Pricing })), {
  loading: () => <div className="h-96 animate-pulse bg-muted/20" />,
  ssr: true
})

const FAQ = dynamic(() => import('@/components/marketing/FAQ').then(mod => ({ default: mod.FAQ })), {
  loading: () => <div className="h-96 animate-pulse bg-muted/20" />,
  ssr: true
})

const CTA = dynamic(() => import('@/components/marketing/CTA').then(mod => ({ default: mod.CTA })), {
  loading: () => <div className="h-64 animate-pulse bg-muted/20" />,
  ssr: true
})

export default function Home() {
  return (
    <>
      {/* JSON-LD Schema Markup */}
      <OrganizationSchema />
      <WebSiteSchema />
      <WebApplicationSchema />

      <div className="flex flex-col">
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <ToolsGrid />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </div>
    </>
  )
}
