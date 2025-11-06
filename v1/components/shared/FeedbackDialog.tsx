'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { createBrowserClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Star, Upload, X } from 'lucide-react'
import { trackFeedbackSubmit } from '@/lib/analytics/track'

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FeedbackCategory = 'bug' | 'feature_request' | 'improvement' | 'question' | 'general'

const CATEGORIES: { value: FeedbackCategory; label: string; description: string }[] = [
  { value: 'bug', label: '🐛 Bug Report', description: 'Report a problem or error' },
  { value: 'feature_request', label: '✨ Feature Request', description: 'Suggest a new feature' },
  { value: 'improvement', label: '🚀 Improvement', description: 'Suggest an enhancement' },
  { value: 'question', label: '❓ Question', description: 'Ask a question' },
  { value: 'general', label: '💬 General Feedback', description: 'Share your thoughts' },
]

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState<FeedbackCategory>('general')
  const [rating, setRating] = useState<number>(0)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)

  function handleScreenshotChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive',
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 5MB',
        variant: 'destructive',
      })
      return
    }

    setScreenshot(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setScreenshotPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  function removeScreenshot() {
    setScreenshot(null)
    setScreenshotPreview(null)
  }

  async function uploadScreenshot(feedbackId: string): Promise<string | null> {
    if (!screenshot || !user) return null

    try {
      const fileExt = screenshot.name.split('.').pop()
      const fileName = `${feedbackId}-${Date.now()}.${fileExt}`
      const filePath = `feedback/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('feedback-attachments')
        .upload(filePath, screenshot)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('feedback-attachments').getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Screenshot upload error:', error)
      return null
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!subject.trim() || !message.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide both subject and message',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      // Create feedback
      const { data: feedback, error: feedbackError } = await supabase
        .from('feedback')
        .insert({
          user_id: user?.id || null,
          category,
          rating: rating > 0 ? rating : null,
          subject: subject.trim(),
          message: message.trim(),
          page_url: window.location.href,
          user_agent: navigator.userAgent,
        })
        .select()
        .single()

      if (feedbackError) throw feedbackError

      // Upload screenshot if provided
      if (screenshot && feedback) {
        const screenshotUrl = await uploadScreenshot(feedback.id)

        if (screenshotUrl) {
          await supabase.from('feedback_attachments').insert({
            feedback_id: feedback.id,
            file_name: screenshot.name,
            file_url: screenshotUrl,
            file_size: screenshot.size,
            file_type: screenshot.type,
          })
        }
      }

      // Track analytics
      trackFeedbackSubmit(rating, category)

      toast({
        title: 'Feedback submitted!',
        description: 'Thank you for your feedback. We\'ll review it soon.',
      })

      // Reset form
      setCategory('general')
      setRating(0)
      setSubject('')
      setMessage('')
      setScreenshot(null)
      setScreenshotPreview(null)
      onOpenChange(false)
    } catch (error) {
      console.error('Feedback submission error:', error)
      toast({
        title: 'Submission failed',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve Design Kit by sharing your thoughts, reporting bugs, or suggesting
            features.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">What would you like to share?</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as FeedbackCategory)}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex flex-col">
                      <span>{cat.label}</span>
                      <span className="text-xs text-muted-foreground">{cat.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>How satisfied are you? (optional)</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-none text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <button
                  type="button"
                  onClick={() => setRating(0)}
                  className="ml-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your feedback"
              disabled={loading}
              required
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">{subject.length}/200</p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide details about your feedback..."
              disabled={loading}
              required
              rows={6}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">{message.length}/2000</p>
          </div>

          {/* Screenshot */}
          <div className="space-y-2">
            <Label htmlFor="screenshot">Screenshot (optional)</Label>
            {!screenshotPreview ? (
              <div className="flex items-center gap-4">
                <Input
                  id="screenshot"
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  disabled={loading}
                  className="cursor-pointer"
                />
              </div>
            ) : (
              <div className="relative">
                <img
                  src={screenshotPreview}
                  alt="Screenshot preview"
                  className="w-full h-48 object-contain border rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={removeScreenshot}
                  className="absolute top-2 right-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Max 5MB. PNG, JPG, or WebP.</p>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {user ? 'Submitted as ' + user.email : 'Submitted anonymously'}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Feedback
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
