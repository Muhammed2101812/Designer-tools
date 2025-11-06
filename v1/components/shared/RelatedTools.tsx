'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { TOOLS, getToolsByCategory, type ToolConfig } from '@/config/tools'
import { cn } from '@/lib/utils/cn'

export interface RelatedToolsProps {
  currentToolId: string
  maxTools?: number
  className?: string
}

/**
 * Get related tools based on the current tool
 * Priority: Same category > Same type > Other available tools
 */
function getRelatedTools(currentToolId: string, maxTools: number = 3): ToolConfig[] {
  const currentTool = TOOLS.find((tool) => tool.id === currentToolId)
  if (!currentTool) return []

  // Get tools from the same category (excluding current tool)
  const sameCategoryTools = getToolsByCategory(currentTool.category).filter(
    (tool) => tool.id !== currentToolId && tool.isAvailable
  )

  // If we have enough from the same category, return them
  if (sameCategoryTools.length >= maxTools) {
    return sameCategoryTools.slice(0, maxTools)
  }

  // Otherwise, add tools from other categories with the same type
  const sameTypeTools = TOOLS.filter(
    (tool) =>
      tool.id !== currentToolId &&
      tool.isAvailable &&
      tool.type === currentTool.type &&
      tool.category !== currentTool.category
  )

  const relatedTools = [...sameCategoryTools, ...sameTypeTools]

  // If still not enough, add any other available tools
  if (relatedTools.length < maxTools) {
    const otherTools = TOOLS.filter(
      (tool) =>
        tool.id !== currentToolId &&
        tool.isAvailable &&
        !relatedTools.some((rt) => rt.id === tool.id)
    )
    relatedTools.push(...otherTools)
  }

  return relatedTools.slice(0, maxTools)
}

export function RelatedTools({ currentToolId, maxTools = 3, className }: RelatedToolsProps) {
  const relatedTools = getRelatedTools(currentToolId, maxTools)

  if (relatedTools.length === 0) {
    return null
  }

  return (
    <section className={cn('py-8 border-t', className)}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight mb-2">Related Tools</h2>
        <p className="text-muted-foreground">
          Explore more tools that might be useful for your workflow
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {relatedTools.map((tool) => {
          const Icon = tool.icon
          return (
            <Card
              key={tool.id}
              className="group relative transition-all hover:shadow-lg hover:border-primary/50 hover:scale-[1.02]"
            >
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-all group-hover:bg-primary/20 group-hover:scale-110">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{tool.name}</CardTitle>
                  <Badge
                    variant={tool.type === 'client-side' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {tool.type === 'client-side' ? 'Client-Side' : 'API-Powered'}
                  </Badge>
                </div>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href={tool.path}>
                    Try Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-6 text-center">
        <Button asChild variant="ghost">
          <Link href="/#tools">
            View All Tools
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
