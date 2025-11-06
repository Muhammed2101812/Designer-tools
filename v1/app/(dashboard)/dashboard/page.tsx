import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { QuotaCard } from '@/components/dashboard/QuotaCard'
import { PlanCard } from '@/components/dashboard/PlanCard'
import { UsageChart } from '@/components/dashboard/UsageChart'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { PersonalStats } from '@/components/dashboard/PersonalStats'
import { WelcomeEmailTrigger } from '@/components/dashboard/WelcomeEmailTrigger'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

// Route segment config for performance
export const dynamic = 'force-dynamic'
export const revalidate = 60 // Revalidate every 60 seconds

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]
  const sevenDaysAgoISO = sevenDaysAgo.toISOString()

  // ⚡ OPTIMIZATION: Parallel queries - fetch all data at once
  const [
    profileResult,
    dailyLimitResult,
    weeklyUsageResult,
    toolUsageResult,
  ] = await Promise.all([
    // 1. Profile
    supabase
      .from('profiles')
      .select('plan, full_name')
      .eq('id', user.id)
      .maybeSingle(),

    // 2. Daily limit
    supabase
      .from('daily_limits')
      .select('api_tools_count')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle(),

    // 3. Weekly usage
    supabase
      .from('daily_limits')
      .select('date, api_tools_count')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgoStr)
      .order('date', { ascending: true }),

    // 4. Tool usage (combined query for efficiency)
    supabase
      .from('tool_usage')
      .select('tool_name, created_at, success, is_api_tool')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgoISO)
      .order('created_at', { ascending: false })
      .limit(100), // Fetch more for processing
  ])

  const profile = profileResult.data
  const dailyLimit = dailyLimitResult.data
  const weeklyUsage = weeklyUsageResult.data
  const allToolUsage = toolUsageResult.data || []

  // Fetch subscription only if needed
  let subscriptionStatus = null
  if (profile?.plan && profile.plan !== 'free') {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .in('status', ['active', 'canceled', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    subscriptionStatus = subscription?.status || null
  }

  // Process data client-side for better performance
  const topTools = allToolUsage.filter(t => t.is_api_tool)
  const recentActivity = allToolUsage.slice(0, 10)
  const totalUsage = allToolUsage.length
  const weeklyActivity = allToolUsage

  // ⚡ Process all data in memory (faster than multiple DB queries)
  const toolDisplayNames: Record<string, string> = {
    'background-remover': 'Arka Plan Silme',
    'image-upscaler': 'Görsel Büyütme',
    'image-compressor': 'Görsel Sıkıştırma',
    'mockup-generator': 'Mockup Üretici',
  }

  // Weekly activity
  const weeklyActivityByDay: Record<string, number> = {}
  const dateRange = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - 6 + i)
    return date.toISOString().split('T')[0]
  })

  dateRange.forEach(date => {
    weeklyActivityByDay[date] = 0
  })

  weeklyActivity?.forEach(activity => {
    const date = activity.created_at.split('T')[0]
    if (weeklyActivityByDay[date] !== undefined) {
      weeklyActivityByDay[date] += 1
    }
  })

  const weeklyActivityData = Object.entries(weeklyActivityByDay).map(([date, count]) => ({
    date,
    count
  }))

  // Most used tool
  const toolUsageCounts: Record<string, number> = {}
  topTools?.forEach(tool => {
    toolUsageCounts[tool.tool_name] = (toolUsageCounts[tool.tool_name] || 0) + 1
  })

  const mostUsedTool = Object.keys(toolUsageCounts).length > 0
    ? Object.entries(toolUsageCounts)
        .sort(([,a], [,b]) => b - a)[0]
        .map(([toolName, count]) => ({
          name: toolName,
          displayName: toolDisplayNames[toolName] || toolName,
          count
        }))[0]
    : null

  const plan = profile?.plan || 'free'
  const currentUsage = dailyLimit?.api_tools_count || 0
  const dailyLimitValue = plan === 'free' ? 10 : plan === 'premium' ? 500 : 2000
  const usagePercentage = (currentUsage / dailyLimitValue) * 100
  
  return (
    <div className="container py-8">
      <WelcomeEmailTrigger />
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Hoş geldin, {profile?.full_name || user?.email?.split('@')[0] || 'Kullanıcı'}
        </h1>
        <p className="text-muted-foreground">
          İşte bugünkü kullanım özetin
        </p>
      </div>
      
      {/* Kota uyarısı */}
      {usagePercentage > 80 && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Kota Uyarısı</AlertTitle>
          <AlertDescription>
            Günlük kotanızın %{usagePercentage.toFixed(0)}&apos;ini kullandınız.
            Daha fazla işlem için planınızı yükseltin.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Personal Stats Section */}
      <PersonalStats 
        totalUsage={totalUsage || 0}
        mostUsedTool={mostUsedTool}
        weeklyActivity={weeklyActivityData}
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <QuotaCard
          currentUsage={currentUsage}
          dailyLimit={dailyLimitValue}
          plan={plan}
        />
        
        <PlanCard plan={plan} subscriptionStatus={subscriptionStatus} />
        
        {/* En çok kullanılan araçlar */}
        <div className="bg-card text-card-foreground rounded-lg border p-6">
          <h3 className="font-semibold mb-4">En Çok Kullanılan Araçlar</h3>
          {topTools && topTools.length > 0 ? (
            <div className="space-y-2">
              {Array.from(new Set(topTools.map(t => t.tool_name))).slice(0, 5).map((toolName, index) => {
                const count = topTools.filter(t => t.tool_name === toolName).length
                return (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{toolDisplayNames[toolName] || toolName}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Henüz araç kullanımı bulunmuyor
            </p>
          )}
        </div>
      </div>
      
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <UsageChart data={weeklyUsage || []} />
        <RecentActivity activities={recentActivity || []} />
      </div>
    </div>
  )
}
