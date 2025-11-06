'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FAQ } from '@/components/shared/FAQ'
import { Breadcrumb } from '@/components/shared/Breadcrumb'

export default function FAQPage() {
  const router = useRouter()

  const handleBack = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Section */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <div className="mb-4">
            <Breadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: 'FAQ', href: '/faq' },
              ]}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
              aria-label="Navigate back to home page"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Back</span>
            </Button>

            {/* Title and Description */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-shrink-0 text-primary" aria-hidden="true">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">
                  Help & FAQ
                </h1>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground">
                Find answers to common questions about Design Kit tools and features
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl mx-auto space-y-8">
          {/* Introduction */}
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-muted-foreground">
              Welcome to the Design Kit FAQ! Here you'll find answers to the most common questions
              about our tools, features, pricing, and technical details. If you can't find what
              you're looking for, feel free to contact our support team.
            </p>
          </div>

          {/* FAQ Component with Categories */}
          <FAQ showCategories={true} />

          {/* Additional Help Section */}
          <div className="rounded-lg border bg-muted/50 p-6 space-y-4">
            <h2 className="text-lg font-semibold">Still have questions?</h2>
            <p className="text-sm text-muted-foreground">
              If you couldn't find the answer you were looking for, we're here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild>
                <a href="mailto:support@designkit.com">Contact Support</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/#tools">Browse Tools</a>
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4 space-y-2">
              <h3 className="font-semibold">Getting Started</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  <a href="/#tools" className="hover:text-primary transition-colors">
                    → Browse all tools
                  </a>
                </li>
                <li>
                  <a href="/pricing" className="hover:text-primary transition-colors">
                    → View pricing plans
                  </a>
                </li>
                <li>
                  <a href="/login" className="hover:text-primary transition-colors">
                    → Sign in to your account
                  </a>
                </li>
              </ul>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <h3 className="font-semibold">Popular Tools</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  <a href="/tools/color-picker" className="hover:text-primary transition-colors">
                    → Color Picker
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
