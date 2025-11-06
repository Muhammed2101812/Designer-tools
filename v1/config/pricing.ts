/**
 * Pricing configuration for Design Kit
 * 
 * This file defines the pricing plans, features, and FAQ content
 * for the pricing page. It's separate from Stripe configuration
 * to allow for easy updates to marketing copy without touching
 * payment logic.
 */

export interface PricingPlan {
  id: 'free' | 'premium' | 'pro'
  name: string
  price: number
  period: string
  description: string
  features: string[]
  popular: boolean
  cta: string
  dailyQuota: number
  maxFileSize: string
  batchLimit?: number
  apiAccess?: boolean
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      '10 daily API operations',
      'All client-side tools',
      '10MB max file size',
      'Community support',
    ],
    popular: false,
    cta: 'Get Started',
    dailyQuota: 10,
    maxFileSize: '10MB',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9,
    period: 'month',
    description: 'For professionals',
    features: [
      '500 daily API operations',
      'All tools',
      '50MB max file size',
      'Batch processing (10 files)',
      'Priority support',
    ],
    popular: true,
    cta: 'Upgrade to Premium',
    dailyQuota: 500,
    maxFileSize: '50MB',
    batchLimit: 10,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    period: 'month',
    description: 'For teams and agencies',
    features: [
      '2000 daily API operations',
      'All tools',
      '100MB max file size',
      'Batch processing (50 files)',
      'REST API access',
      'Dedicated support',
    ],
    popular: false,
    cta: 'Upgrade to Pro',
    dailyQuota: 2000,
    maxFileSize: '100MB',
    batchLimit: 50,
    apiAccess: true,
  },
]

export interface FAQItem {
  question: string
  answer: string
}

export const PRICING_FAQ: FAQItem[] = [
  {
    question: 'Can I cancel my plan anytime?',
    answer: 'Yes, you can cancel your plan at any time. When you cancel, you\'ll continue to have access to premium features until the end of your current billing period.',
  },
  {
    question: 'How does the daily quota reset work?',
    answer: 'Your daily API quota resets automatically every day at midnight UTC. This ensures you have a fresh allocation of operations each day.',
  },
  {
    question: 'What happens when I change plans?',
    answer: 'When you upgrade, new features are activated immediately and the price difference is prorated. When you downgrade, you keep premium features until the end of your current billing period.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes, we offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied, contact our support team for a full refund.',
  },
  {
    question: 'What are client-side vs API-powered tools?',
    answer: 'Client-side tools process files entirely in your browser for maximum privacy and don\'t count against your quota. API-powered tools use advanced AI processing on our servers and count against your daily quota.',
  },
  {
    question: 'Is there a free trial for paid plans?',
    answer: 'The Free plan serves as our trial - you can test all client-side tools and 10 API operations daily. Upgrade anytime to unlock higher quotas and additional features.',
  },
]

/**
 * Get plan configuration by ID
 */
export function getPlanById(id: string): PricingPlan | undefined {
  return PRICING_PLANS.find(plan => plan.id === id)
}

/**
 * Get the next higher plan for upgrade suggestions
 */
export function getNextPlan(currentPlan: string): PricingPlan | undefined {
  if (currentPlan === 'free') return getPlanById('premium')
  if (currentPlan === 'premium') return getPlanById('pro')
  return undefined
}

/**
 * Check if a plan is higher than another
 */
export function isPlanHigher(planA: string, planB: string): boolean {
  const planOrder = { free: 0, premium: 1, pro: 2 }
  return planOrder[planA as keyof typeof planOrder] > planOrder[planB as keyof typeof planOrder]
}