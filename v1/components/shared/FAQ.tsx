'use client'

import * as React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export interface FAQItem {
  question: string
  answer: string | React.ReactNode
  category?: 'general' | 'client-side' | 'api-powered' | 'pricing' | 'technical'
}

export interface FAQProps {
  /**
   * Array of FAQ items to display
   */
  items?: FAQItem[]
  
  /**
   * Optional title for the FAQ section
   * @default "Frequently Asked Questions"
   */
  title?: string
  
  /**
   * Optional description for the FAQ section
   */
  description?: string
  
  /**
   * Whether to show category filters
   * @default false
   */
  showCategories?: boolean
  
  /**
   * Additional CSS classes
   */
  className?: string
}

// Default FAQ items covering common questions across all tools
const DEFAULT_FAQ_ITEMS: FAQItem[] = [
  {
    question: 'Are my files uploaded to your servers?',
    answer: 'For client-side tools (Color Picker, Image Cropper, Image Resizer, Format Converter, QR Generator, Gradient Generator, and Image Compressor), all processing happens entirely in your browser. Your files never leave your device. For API-powered tools (Background Remover, Image Upscaler), files are temporarily uploaded for processing and immediately deleted after completion.',
    category: 'general',
  },
  {
    question: 'What file formats are supported?',
    answer: 'Most tools support PNG, JPG/JPEG, and WEBP formats. Some tools like the QR Generator and Gradient Generator can export to SVG as well. The maximum file size varies by plan: 10MB for Free, 50MB for Premium, and 100MB for Pro.',
    category: 'general',
  },
  {
    question: 'How do API quotas work?',
    answer: 'API-powered tools (Background Remover and Image Upscaler) count against your daily quota. Free plans get 10 operations per day, Premium gets 500, and Pro gets 2000. Quotas reset daily at midnight UTC. Client-side tools have no quota limits.',
    category: 'api-powered',
  },
  {
    question: 'What happens if I exceed my quota?',
    answer: 'If you reach your daily quota limit, you can either wait until midnight UTC for it to reset, or upgrade to a higher plan for more operations. Failed operations do not count against your quota.',
    category: 'api-powered',
  },
  {
    question: 'Can I use these tools offline?',
    answer: 'Client-side tools can work offline after the initial page load, as all processing happens in your browser. API-powered tools require an internet connection to communicate with our processing servers.',
    category: 'client-side',
  },
  {
    question: 'Why is my image processing slow?',
    answer: 'Processing speed depends on several factors: image size, your device performance, and browser capabilities. For faster processing, try reducing image size first, use a modern browser (Chrome, Firefox, Safari, Edge), and close other tabs to free up memory. API-powered tools may take 30-60 seconds due to AI processing.',
    category: 'technical',
  },
  {
    question: 'What browsers are supported?',
    answer: 'Design Kit works best on modern browsers: Chrome 90+, Firefox 88+, Safari 14+, and Edge 90+. Some features may not work on older browsers. We recommend keeping your browser updated for the best experience.',
    category: 'technical',
  },
  {
    question: 'Can I process multiple images at once?',
    answer: 'Batch processing is available for Premium and Pro plans. Free users can process one image at a time. Premium allows up to 10 images per batch, and Pro allows up to 50 images per batch.',
    category: 'pricing',
  },
  {
    question: 'How do I cancel my subscription?',
    answer: 'You can cancel your subscription anytime from your account settings. Your plan will remain active until the end of your billing period, and you won\'t be charged again. You can also downgrade to the Free plan.',
    category: 'pricing',
  },
  {
    question: 'Is there a refund policy?',
    answer: 'We offer a 14-day money-back guarantee for all paid plans. If you\'re not satisfied, contact our support team within 14 days of your purchase for a full refund.',
    category: 'pricing',
  },
  {
    question: 'Can I use the tools for commercial projects?',
    answer: 'Yes! All plans, including Free, allow commercial use of the tools and the images you create. You retain full ownership of your work.',
    category: 'general',
  },
  {
    question: 'What keyboard shortcuts are available?',
    answer: 'Most tools support common shortcuts: Escape to cancel/reset, Ctrl+S to download, Ctrl+Z to undo, and arrow keys for navigation. Click the info button (i) on any tool page to see tool-specific shortcuts.',
    category: 'technical',
  },
  {
    question: 'How do I report a bug or request a feature?',
    answer: 'We love feedback! You can report bugs or request features through the feedback form in your account settings, or email us directly at support@designkit.com. We review all submissions and prioritize based on user demand.',
    category: 'general',
  },
  {
    question: 'Are there mobile apps available?',
    answer: 'Design Kit is a web application that works on all devices through your browser. We\'ve optimized the interface for mobile devices, so you can use all tools on your phone or tablet without installing an app.',
    category: 'general',
  },
  {
    question: 'What happens to my data if I delete my account?',
    answer: 'When you delete your account, all your personal data is permanently removed from our servers within 30 days. Since we don\'t store your processed images, there\'s no image data to delete.',
    category: 'general',
  },
]

export function FAQ({
  items = DEFAULT_FAQ_ITEMS,
  title = 'Frequently Asked Questions',
  description,
  showCategories = false,
  className,
}: FAQProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all')

  // Filter items by category
  const filteredItems = React.useMemo(() => {
    if (selectedCategory === 'all') {
      return items
    }
    return items.filter((item) => item.category === selectedCategory)
  }, [items, selectedCategory])

  // Get unique categories
  const categories = React.useMemo(() => {
    const cats = new Set(items.map((item) => item.category).filter(Boolean))
    return Array.from(cats)
  }, [items])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Filter */}
        {showCategories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-4 border-b">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category || 'all')}
                className={`px-3 py-1 text-sm rounded-md transition-colors capitalize ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {category?.replace('-', ' ') || 'Other'}
              </button>
            ))}
          </div>
        )}

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="w-full">
          {filteredItems.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {item.question}
              </AccordionTrigger>
              <AccordionContent>
                {typeof item.answer === 'string' ? (
                  <p className="text-sm text-muted-foreground">{item.answer}</p>
                ) : (
                  item.answer
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* No results message */}
        {filteredItems.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No questions found in this category.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
