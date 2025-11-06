'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Copy, Download, Check } from 'lucide-react'
import { toast } from '@/lib/hooks/use-toast'

interface CSSCodeDisplayProps {
  cssCode: string
  onDownloadPNG: () => void
}

export default function CSSCodeDisplay({ cssCode, onDownloadPNG }: CSSCodeDisplayProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopyCSS = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cssCode)
      setCopied(true)
      
      toast({
        title: 'CSS Copied',
        description: 'Gradient CSS code copied to clipboard',
      })

      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy CSS code to clipboard',
        variant: 'destructive',
      })
    }
  }, [cssCode])

  return (
    <div className="border rounded-lg bg-card p-4">
      <h3 className="text-lg font-semibold mb-3">CSS Code</h3>

      <div className="space-y-3">
        {/* CSS Code Display */}
        <div className="relative">
          <pre className="p-3 bg-muted rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
            {cssCode}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleCopyCSS}
            className="flex-1"
            variant="outline"
            size="sm"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy CSS
              </>
            )}
          </Button>

          <Button
            onClick={onDownloadPNG}
            className="flex-1"
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PNG
          </Button>
        </div>

        {/* Usage Example */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Usage example:</p>
          <pre className="p-2 bg-muted/50 rounded text-xs font-mono overflow-x-auto">
{`.my-element {
  ${cssCode}
}`}
          </pre>
        </div>
      </div>
    </div>
  )
}
