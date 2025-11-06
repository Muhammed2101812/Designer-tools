'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { TOOLS, TOOL_CATEGORIES, getToolsByCategory } from '@/config/tools'

export function ToolsNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const imageProcessingTools = getToolsByCategory('image-processing')
  const generatorTools = getToolsByCategory('generators')

  const isToolActive = TOOLS.some((tool) => pathname?.startsWith(tool.path))

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            isToolActive ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          Tools
          <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="start">
        {/* Image Processing Tools */}
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{TOOL_CATEGORIES['image-processing'].name}</span>
          <Badge variant="secondary" className="text-xs">
            Client-Side
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {imageProcessingTools.map((tool) => {
            const Icon = tool.icon
            const isActive = pathname === tool.path
            return (
              <DropdownMenuItem
                key={tool.id}
                asChild
                disabled={!tool.isAvailable}
                className={cn(
                  'cursor-pointer',
                  isActive && 'bg-accent',
                  !tool.isAvailable && 'opacity-50'
                )}
              >
                <Link
                  href={tool.isAvailable ? tool.path : '#'}
                  onClick={() => tool.isAvailable && setOpen(false)}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{tool.name}</span>
                      {!tool.isAvailable && (
                        <Badge variant="outline" className="text-xs">
                          Soon
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Generator Tools */}
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{TOOL_CATEGORIES['generators'].name}</span>
          <Badge variant="secondary" className="text-xs">
            Client-Side
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {generatorTools.map((tool) => {
            const Icon = tool.icon
            const isActive = pathname === tool.path
            return (
              <DropdownMenuItem
                key={tool.id}
                asChild
                disabled={!tool.isAvailable}
                className={cn(
                  'cursor-pointer',
                  isActive && 'bg-accent',
                  !tool.isAvailable && 'opacity-50'
                )}
              >
                <Link
                  href={tool.isAvailable ? tool.path : '#'}
                  onClick={() => tool.isAvailable && setOpen(false)}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{tool.name}</span>
                      {!tool.isAvailable && (
                        <Badge variant="outline" className="text-xs">
                          Soon
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            href="/#tools"
            onClick={() => setOpen(false)}
            className="text-sm font-medium text-primary"
          >
            View All Tools →
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
