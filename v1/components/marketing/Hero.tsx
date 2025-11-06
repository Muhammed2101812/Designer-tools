import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Shield, Zap, Check } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32 lg:py-40">
      {/* Background gradient with animated pattern */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_80%,rgba(120,119,198,0.1),transparent_50%)]" />

      <div className="container">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-1.5 text-sm backdrop-blur-sm animate-fade-in">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Privacy-first design tools</span>
          </div>

          {/* Heading */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl animate-slide-in-from-bottom" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>
            Professional Design Tools
            <span className="block text-primary">In Your Browser</span>
          </h1>

          {/* Description */}
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl md:mb-12 md:text-2xl animate-slide-in-from-bottom" style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}>
            Process images, extract colors, and create designs without uploading files. 
            Your privacy matters—everything happens in your browser.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-slide-in-from-bottom" style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}>
            <Button asChild size="lg" className="w-full sm:w-auto transition-transform hover:scale-105">
              <Link href="#tools">
                Try Free Tools
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto transition-transform hover:scale-105">
              <Link href="/pricing">
                View Pricing
              </Link>
            </Button>
          </div>

          {/* Social Proof */}
          <p className="mt-8 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'backwards' }}>
            No credit card required • Free tools available now
          </p>

          {/* Key Benefits - Quick highlights */}
          <div className="mx-auto mt-16 grid max-w-3xl gap-6 sm:grid-cols-3 animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'backwards' }}>
            <div className="flex flex-col items-center gap-2 rounded-lg border bg-background/50 p-4 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="text-sm font-semibold">100% Private</div>
              <div className="text-xs text-muted-foreground text-center">
                Files never leave your device
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 rounded-lg border bg-background/50 p-4 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="text-sm font-semibold">Instant Results</div>
              <div className="text-xs text-muted-foreground text-center">
                No uploads, no waiting
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 rounded-lg border bg-background/50 p-4 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div className="text-sm font-semibold">Professional Quality</div>
              <div className="text-xs text-muted-foreground text-center">
                Tools pros use daily
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </section>
  )
}
