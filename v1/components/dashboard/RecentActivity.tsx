'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle } from 'lucide-react'

interface ActivityItem {
  tool_name: string
  created_at: string
  success: boolean
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Az önce'
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} saat önce`
    return date.toLocaleDateString('tr-TR')
  }
  
  const getToolDisplayName = (toolName: string) => {
    const toolNames: Record<string, string> = {
      'color-picker': 'Renk Seçici',
      'image-cropper': 'Görsel Kırpma',
      'image-resizer': 'Görsel Boyutlandırma',
      'format-converter': 'Format Dönüştürücü',
      'qr-generator': 'QR Kod Üretici',
      'gradient-generator': 'Gradyan Üretici',
      'image-compressor': 'Görsel Sıkıştırma',
      'background-remover': 'Arka Plan Silme',
      'image-upscaler': 'Görsel Büyütme',
      'mockup-generator': 'Mockup Üretici',
    }
    return toolNames[toolName] || toolName
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Son Aktiviteler</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Henüz aktivite bulunmuyor
            </p>
          ) : (
            activities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {activity.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {getToolDisplayName(activity.tool_name)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(activity.created_at)}
                    </p>
                  </div>
                </div>
                <Badge variant={activity.success ? 'default' : 'destructive'}>
                  {activity.success ? 'Başarılı' : 'Hata'}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}