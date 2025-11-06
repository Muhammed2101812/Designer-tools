'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Calendar, Target } from 'lucide-react'

interface PersonalStatsProps {
  totalUsage: number
  mostUsedTool: {
    name: string
    displayName: string
    count: number
  } | null
  weeklyActivity: Array<{
    date: string
    count: number
  }>
}

export function PersonalStats({ totalUsage, mostUsedTool, weeklyActivity }: PersonalStatsProps) {
  const totalWeeklyUsage = weeklyActivity.reduce((sum, day) => sum + day.count, 0)
  
  return (
    <div className="grid gap-6 md:grid-cols-3 mb-8">
      {/* Toplam Kullanım */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Kullanım</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsage}</div>
          <p className="text-xs text-muted-foreground">
            Tüm zamanlarda kullanılan araç sayısı
          </p>
        </CardContent>
      </Card>

      {/* En Çok Kullanılan Araç */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Çok Kullanılan</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {mostUsedTool ? (
            <>
              <div className="text-2xl font-bold">{mostUsedTool.displayName}</div>
              <p className="text-xs text-muted-foreground">
                {mostUsedTool.count} kez kullanıldı
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold text-muted-foreground">-</div>
              <p className="text-xs text-muted-foreground">
                Henüz araç kullanımı yok
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Haftalık Aktivite */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bu Hafta</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalWeeklyUsage}</div>
          <p className="text-xs text-muted-foreground">
            Son 7 günde toplam kullanım
          </p>
          
          {/* Haftalık aktivite çubuğu */}
          <div className="mt-3 flex items-end space-x-1 h-8">
            {weeklyActivity.map((day, index) => {
              const maxCount = Math.max(...weeklyActivity.map(d => d.count), 1)
              const height = (day.count / maxCount) * 100
              
              return (
                <div
                  key={index}
                  className="flex-1 bg-primary/20 rounded-sm relative group"
                  style={{ height: `${Math.max(height, 4)}%` }}
                >
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-primary rounded-sm transition-all"
                    style={{ height: `${height}%` }}
                  />
                  
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {new Date(day.date).toLocaleDateString('tr-TR', { 
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short'
                    })}: {day.count}
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Gün etiketleri */}
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            {weeklyActivity.map((day, index) => (
              <span key={index} className="flex-1 text-center">
                {new Date(day.date).toLocaleDateString('tr-TR', { weekday: 'narrow' })}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}