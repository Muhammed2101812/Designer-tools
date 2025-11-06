'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Crown, Zap, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UpgradeDialogProps {
  /**
   * Whether the dialog is open
   */
  open: boolean
  
  /**
   * Callback when dialog should be closed
   */
  onOpenChange: (open: boolean) => void
  
  /**
   * Current user plan
   */
  currentPlan?: 'free' | 'premium' | 'pro'
  
  /**
   * Current usage count
   */
  currentUsage?: number
  
  /**
   * Daily limit for current plan
   */
  dailyLimit?: number
  
  /**
   * Custom title for the dialog
   */
  title?: string
  
  /**
   * Custom description for the dialog
   */
  description?: string
}

/**
 * UpgradeDialog shows plan options when user hits quota limits
 * or wants to upgrade their current plan for more features.
 */
export function UpgradeDialog({
  open,
  onOpenChange,
  currentPlan = 'free',
  currentUsage = 0,
  dailyLimit = 10,
  title,
  description,
}: UpgradeDialogProps) {
  const router = useRouter()
  
  const isOutOfQuota = currentUsage >= dailyLimit
  
  const defaultTitle = isOutOfQuota 
    ? 'Daily Quota Exceeded' 
    : 'Upgrade Your Plan'
    
  const defaultDescription = isOutOfQuota
    ? `You've used all ${dailyLimit} of your daily API operations. Upgrade to continue using our tools.`
    : 'Get more API operations and unlock additional features with a premium plan.'
  
  const plans = [
    {
      id: 'premium',
      name: 'Premium',
      price: '$9',
      period: 'month',
      dailyOps: '500',
      maxFileSize: '50MB',
      batchProcessing: '10 files',
      features: [
        '500 daily API operations',
        'All tools included',
        '50MB max file size',
        'Batch processing (10 files)',
        'Priority support',
      ],
      icon: Crown,
      popular: true,
      disabled: currentPlan === 'premium' || currentPlan === 'pro',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$29',
      period: 'month',
      dailyOps: '2000',
      maxFileSize: '100MB',
      batchProcessing: '50 files',
      features: [
        '2000 daily API operations',
        'All tools included',
        '100MB max file size',
        'Batch processing (50 files)',
        'REST API access',
        'Custom support',
      ],
      icon: Zap,
      popular: false,
      disabled: currentPlan === 'pro',
    },
  ]
  
  const handleUpgrade = (planId: string) => {
    onOpenChange(false)
    router.push(`/pricing?plan=${planId}`)
  }
  
  const handleViewPricing = () => {
    onOpenChange(false)
    router.push('/pricing')
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {title || defaultTitle}
          </DialogTitle>
          <DialogDescription className="text-base">
            {description || defaultDescription}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4 md:grid-cols-2">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isCurrent = currentPlan === plan.id
            
            return (
              <div
                key={plan.id}
                className={`relative rounded-lg border p-6 ${
                  plan.popular 
                    ? 'border-primary shadow-md' 
                    : 'border-border'
                } ${
                  plan.disabled 
                    ? 'opacity-60' 
                    : ''
                }`}
              >
                {plan.popular && (
                  <Badge 
                    className="absolute -top-2 left-4 bg-primary text-primary-foreground"
                  >
                    Most Popular
                  </Badge>
                )}
                
                {isCurrent && (
                  <Badge 
                    variant="secondary"
                    className="absolute -top-2 right-4"
                  >
                    Current Plan
                  </Badge>
                )}
                
                <div className="space-y-4">
                  {/* Plan Header */}
                  <div className="flex items-center gap-3">
                    <Icon className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">{plan.price}</span>
                        <span className="text-sm text-muted-foreground">
                          /{plan.period}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Key Stats */}
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Daily Operations:</span>
                      <span className="font-medium">{plan.dailyOps}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max File Size:</span>
                      <span className="font-medium">{plan.maxFileSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Batch Processing:</span>
                      <span className="font-medium">{plan.batchProcessing}</span>
                    </div>
                  </div>
                  
                  {/* Features List */}
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* Action Button */}
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={plan.disabled}
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Maybe Later
          </Button>
          <Button
            variant="outline"
            onClick={handleViewPricing}
            className="gap-2"
          >
            View All Plans & Features
          </Button>
        </DialogFooter>
        
        {isOutOfQuota && (
          <div className="mt-4 rounded-md bg-blue-50 dark:bg-blue-950/20 p-3 text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium">💡 Good to know:</p>
            <p>Your quota will reset at midnight UTC. You can also upgrade now to continue using our tools immediately.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}