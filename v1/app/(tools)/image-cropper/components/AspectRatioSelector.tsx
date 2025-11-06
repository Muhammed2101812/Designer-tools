'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { Maximize2, Square, Monitor, Film } from 'lucide-react'
import type { AspectRatio } from '../page'

export interface AspectRatioSelectorProps {
  selectedRatio: AspectRatio
  onRatioChange: (ratio: AspectRatio) => void
}

interface RatioOption {
  value: AspectRatio
  label: string
  icon: React.ReactNode
  description: string
}

const ratioOptions: RatioOption[] = [
  {
    value: 'free',
    label: 'Free',
    icon: <Maximize2 className="h-4 w-4" />,
    description: 'No constraints',
  },
  {
    value: '1:1',
    label: '1:1',
    icon: <Square className="h-4 w-4" />,
    description: 'Square (Instagram)',
  },
  {
    value: '4:3',
    label: '4:3',
    icon: <Monitor className="h-4 w-4" />,
    description: 'Standard',
  },
  {
    value: '16:9',
    label: '16:9',
    icon: <Film className="h-4 w-4" />,
    description: 'Widescreen',
  },
]

export function AspectRatioSelector({
  selectedRatio,
  onRatioChange,
}: AspectRatioSelectorProps) {
  return (
    <div className="p-4 border rounded-lg bg-card space-y-3">
      <Label className="text-base font-semibold">Aspect Ratio</Label>
      
      <div className="grid grid-cols-2 gap-2">
        {ratioOptions.map((option) => (
          <Button
            key={option.value}
            variant={selectedRatio === option.value ? 'default' : 'outline'}
            className={cn(
              'h-auto flex-col items-start p-3 gap-1',
              selectedRatio === option.value && 'ring-2 ring-primary ring-offset-2'
            )}
            onClick={() => onRatioChange(option.value)}
            aria-label={`Select ${option.label} aspect ratio - ${option.description}`}
            aria-pressed={selectedRatio === option.value}
          >
            <div className="flex items-center gap-2 w-full">
              {option.icon}
              <span className="font-semibold">{option.label}</span>
            </div>
            <span className="text-xs opacity-80 font-normal">
              {option.description}
            </span>
          </Button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {selectedRatio === 'free'
          ? 'Crop area can be resized freely without constraints'
          : `Crop area will maintain ${selectedRatio} aspect ratio`}
      </p>
    </div>
  )
}

export default AspectRatioSelector
