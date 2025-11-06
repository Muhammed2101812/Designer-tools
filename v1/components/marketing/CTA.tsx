import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function CTA() {
  return (
    <section className="py-20 md:py-32">
      <div className="container">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 px-8 py-16 text-center md:px-16 md:py-24">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_70%)]" />
          
          <div className="relative z-10">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl md:text-5xl">
              Ready to Transform Your Workflow?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-primary-foreground/90 md:text-xl">
              Join designers who trust Design Kit for fast, private, and professional image processing.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button 
                asChild 
                size="lg" 
                variant="secondary"
                className="w-full sm:w-auto transition-transform hover:scale-105"
              >
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button 
                asChild 
                size="lg" 
                variant="outline"
                className="w-full border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto transition-transform hover:scale-105"
              >
                <Link href="#tools">
                  Explore Tools
                </Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-primary-foreground/80">
              No credit card required • Start using tools immediately
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
