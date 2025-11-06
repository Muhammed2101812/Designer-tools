'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PricingPlan } from '@/config/pricing'

interface PricingCardProps {
  plan: PricingPlan
  currentPlan: string
  isLoggedIn: boolean
}

export function PricingCard({
  plan,
  currentPlan,
  isLoggedIn,
}: PricingCardProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  const isCurrent = currentPlan === plan.id
  const isDowngrade = isLoggedIn && plan.id === 'free' && currentPlan !== 'free'
  
  const getButtonText = () => {
    if (isCurrent) return 'Current Plan'
    if (isDowngrade) return 'Downgrade'
    if (!isLoggedIn && plan.id === 'free') return 'Get Started'
    if (!isLoggedIn) return 'Sign Up'
    return plan.cta
  }
  
  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      router.push('/signup')
      return
    }
    
    if (plan.id === 'free' || isCurrent) {
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.id }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }
      
      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setLoading(false)
    }
  }
  
  return (
    <Card className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            Most Popular
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-2xl font-bold">{plan.name}</h3>
          {isCurrent && (
            <Badge variant="secondary">Current</Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm">{plan.description}</p>
        <div className="mt-4">
          <span className="text-4xl font-bold">
            ${plan.price}
          </span>
          <span className="text-muted-foreground">
            /{plan.period}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter>
        <Button
          className="w-full"
          variant={plan.popular ? 'default' : 'outline'}
          onClick={handleSubscribe}
          disabled={loading || (isCurrent && !isDowngrade)}
        >
          {loading ? 'Loading...' : getButtonText()}
        </Button>
      </CardFooter>
    </Card>
  )
}