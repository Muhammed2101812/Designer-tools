'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { FileIcon, ArrowDown, Loader2 } from 'lucide-react'

export interface CompressionStatsProps {
  originalSize: number
  compressedSize: number | null
  isProcessing: boolean
}

function CompressionStats({
  originalSize,
  compressedSize,
  isProcessing,
}: CompressionStatsProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const compressionRatio = compressedSize
    ? Math.round((1 - compressedSize / originalSize) * 100)
    : 0

  const savingsBytes = compressedSize ? originalSize - compressedSize : 0

  const getCompressionColor = (ratio: number) => {
    if (ratio < 10) return 'text-muted-foreground'
    if (ratio < 30) return 'text-blue-500'
    if (ratio < 50) return 'text-green-500'
    if (ratio < 70) return 'text-orange-500'
    return 'text-red-500'
  }

  const getCompressionLabel = (ratio: number) => {
    if (ratio < 10) return 'Minimal'
    if (ratio < 30) return 'Light'
    if (ratio < 50) return 'Moderate'
    if (ratio < 70) return 'Heavy'
    return 'Maximum'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compression Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Compressing image...</p>
          </div>
        ) : compressedSize ? (
          <>
            {/* File Sizes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Original</span>
                </div>
                <span className="text-sm font-mono">{formatFileSize(originalSize)}</span>
              </div>

              <div className="flex justify-center">
                <ArrowDown className="h-5 w-5 text-primary" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2">
                  <FileIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Compressed</span>
                </div>
                <span className="text-sm font-mono font-semibold">{formatFileSize(compressedSize)}</span>
              </div>
            </div>

            {/* Compression Ratio */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Compression Ratio</span>
                <span className={`text-sm font-bold ${getCompressionColor(compressionRatio)}`}>
                  {compressionRatio}%
                </span>
              </div>
              <Progress value={compressionRatio} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                {getCompressionLabel(compressionRatio)} compression
              </p>
            </div>

            {/* Savings */}
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Space Saved</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatFileSize(savingsBytes)}
              </p>
            </div>

            {/* Quality Note */}
            {compressionRatio > 60 && (
              <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-3">
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  ⚠️ High compression may affect image quality. Compare the preview before downloading.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileIcon className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Adjust quality settings and click &quot;Compress Image&quot; to see stats
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


export default CompressionStats
