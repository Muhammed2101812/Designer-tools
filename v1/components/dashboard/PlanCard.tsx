'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, Zap, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

interface PlanCardProps {
  plan: string
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid' | null
}

export function PlanCard({ plan, subscriptionStatus }: PlanCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const planConfig = {
    free: {
      name: 'Free',
      icon: null,
      color: 'secondary' as const,
      features: ['10 günlük API işlemi', '10MB dosya boyutu'],
    },
    premium: {
      name: 'Premium',
      icon: Crown,
      color: 'default' as const,
      features: ['500 günlük API işlemi', '50MB dosya boyutu', 'Batch işleme'],
    },
    pro: {
      name: 'Pro',
      icon: Zap,
      color: 'destructive' as const,
      features: ['2000 günlük API işlemi', '100MB dosya boyutu', 'REST API erişimi'],
    },
  }
  
  const config = planConfig[plan as keyof typeof planConfig] || planConfig.free
  const Icon = config.icon
  
  // Subscription status badge
  const getStatusBadge = () => {
    if (plan === 'free' || !subscriptionStatus) return null
    
    switch (subscriptionStatus) {
      case 'active':
        return <Badge variant="default" className="ml-2">Aktif</Badge>
      case 'canceled':
        return <Badge variant="secondary" className="ml-2">İptal Edildi</Badge>
      case 'past_due':
        return <Badge variant="destructive" className="ml-2">Ödeme Gecikti</Badge>
      case 'trialing':
        return <Badge variant="default" className="ml-2">Deneme</Badge>
      case 'incomplete':
      case 'incomplete_expired':
        return <Badge variant="destructive" className="ml-2">Tamamlanmadı</Badge>
      case 'unpaid':
        return <Badge variant="destructive" className="ml-2">Ödenmedi</Badge>
      default:
        return null
    }
  }
  
  const handleManageSubscription = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Portal oluşturulamadı')
      }
      
      const { url } = await response.json()
      if (url) {
        window.location.href = url
      } else {
        throw new Error('Portal URL alınamadı')
      }
    } catch (error) {
      console.error('Error creating portal session:', error)
      toast.error('Abonelik yönetimi açılamadı. Lütfen tekrar deneyin.')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Mevcut Plan</span>
          <div className="flex items-center">
            <Badge variant={config.color}>
              {Icon && <Icon className="mr-1 h-3 w-3" />}
              {config.name}
            </Badge>
            {getStatusBadge()}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Subscription status warning */}
        {(subscriptionStatus === 'past_due' || subscriptionStatus === 'unpaid') && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-center text-destructive text-sm">
              <AlertCircle className="mr-2 h-4 w-4" />
              <span>Ödemeniz gecikti. Aboneliğinizi yönetmek için tıklayın.</span>
            </div>
          </div>
        )}
        
        {subscriptionStatus === 'canceled' && (
          <div className="mb-4 p-3 bg-muted border rounded-md">
            <div className="flex items-center text-muted-foreground text-sm">
              <AlertCircle className="mr-2 h-4 w-4" />
              <span>Aboneliğiniz iptal edildi. Dönem sonuna kadar erişiminiz devam eder.</span>
            </div>
          </div>
        )}
        
        {(subscriptionStatus === 'incomplete' || subscriptionStatus === 'incomplete_expired') && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-center text-destructive text-sm">
              <AlertCircle className="mr-2 h-4 w-4" />
              <span>Ödeme tamamlanmadı. Aboneliğinizi yönetmek için tıklayın.</span>
            </div>
          </div>
        )}
        
        <ul className="space-y-2 text-sm">
          {config.features.map((feature, index) => (
            <li key={index} className="flex items-center">
              <span className="mr-2 text-green-500">✓</span>
              {feature}
            </li>
          ))}
        </ul>
        
        <div className="mt-4 space-y-2">
          {plan !== 'free' && (
            <Button 
              variant="outline" 
              className="w-full" 
              size="sm"
              onClick={handleManageSubscription}
              disabled={isLoading}
            >
              {isLoading ? 'Yükleniyor...' : 'Aboneliği Yönet'}
            </Button>
          )}
          
          {plan !== 'pro' && (
            <Button asChild className="w-full" size="sm">
              <Link href="/pricing">
                {plan === 'free' ? 'Planı Yükselt' : 'Pro\'ya Geç'}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}