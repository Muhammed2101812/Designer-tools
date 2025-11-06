'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createBrowserClient } from '@/lib/supabase/client'
import { Loader2, MessageSquare, Star, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Feedback {
  id: string
  category: string
  rating: number | null
  subject: string
  message: string
  status: string
  created_at: string
  updated_at: string
  admin_notes: string | null
  feedback_attachments: Array<{
    id: string
    file_url: string
    file_name: string
  }>
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  bug: { label: 'Bug Report', icon: '🐛' },
  feature_request: { label: 'Feature Request', icon: '✨' },
  improvement: { label: 'Improvement', icon: '🚀' },
  question: { label: 'Question', icon: '❓' },
  general: { label: 'General', icon: '💬' },
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }
> = {
  open: { label: 'Open', variant: 'default', icon: Clock },
  in_progress: { label: 'In Progress', variant: 'secondary', icon: Clock },
  resolved: { label: 'Resolved', variant: 'outline', icon: CheckCircle2 },
  closed: { label: 'Closed', variant: 'outline', icon: CheckCircle2 },
  wont_fix: { label: "Won't Fix", variant: 'destructive', icon: XCircle },
}

export function FeedbackHistory() {
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const supabase = createBrowserClient()

  useEffect(() => {
    loadFeedback()
  }, [])

  async function loadFeedback() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('feedback')
        .select('*, feedback_attachments(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setFeedback(data || [])
    } catch (error) {
      console.error('Error loading feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (feedback.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback History
          </CardTitle>
          <CardDescription>Your submitted feedback and requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">You haven't submitted any feedback yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Click the feedback button to share your thoughts!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Feedback History
        </CardTitle>
        <CardDescription>
          You've submitted {feedback.length} feedback{feedback.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {feedback.map((item) => {
            const categoryInfo = CATEGORY_LABELS[item.category] || {
              label: item.category,
              icon: '📝',
            }
            const statusInfo = STATUS_CONFIG[item.status] || {
              label: item.status,
              variant: 'outline' as const,
              icon: Clock,
            }
            const StatusIcon = statusInfo.icon

            return (
              <div
                key={item.id}
                className="border rounded-lg p-4 space-y-3 hover:bg-accent/5 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{categoryInfo.icon}</span>
                      <h3 className="font-semibold truncate">{item.subject}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>{categoryInfo.label}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Rating */}
                    {item.rating && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    )}

                    {/* Status */}
                    <Badge variant={statusInfo.variant} className="gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>

                {/* Message */}
                <p className="text-sm text-muted-foreground line-clamp-2">{item.message}</p>

                {/* Attachments */}
                {item.feedback_attachments && item.feedback_attachments.length > 0 && (
                  <div className="flex gap-2">
                    {item.feedback_attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        📎 {attachment.file_name}
                      </a>
                    ))}
                  </div>
                )}

                {/* Admin Notes */}
                {item.admin_notes && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium mb-1">Admin Response:</p>
                    <p className="text-sm text-muted-foreground">{item.admin_notes}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
