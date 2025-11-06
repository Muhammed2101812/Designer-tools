'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { FAQItem } from '@/config/pricing'

interface PricingFAQProps {
  faqs: FAQItem[]
}

interface FAQItemProps {
  faq: FAQItem
  isOpen: boolean
  onToggle: () => void
}

function FAQItemComponent({ faq, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border rounded-lg">
      <button
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <span className="font-semibold">{faq.question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <p className="text-muted-foreground leading-relaxed">
            {faq.answer}
          </p>
        </div>
      )}
    </div>
  )
}

export function PricingFAQ({ faqs }: PricingFAQProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())
  
  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }
  
  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <FAQItemComponent
          key={index}
          faq={faq}
          isOpen={openItems.has(index)}
          onToggle={() => toggleItem(index)}
        />
      ))}
    </div>
  )
}