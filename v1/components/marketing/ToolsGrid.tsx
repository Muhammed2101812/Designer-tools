'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight } from 'lucide-react'
import { TOOLS, getToolsByCategory, TOOL_CATEGORIES } from '@/config/tools'
import { preloadToolPage } from '@/lib/utils/dynamicToolImports'

const imageProcessingTools = getToolsByCategory('image-processing')
const generatorTools = getToolsByCategory('generators')

const ToolCard = ({ tool }: { tool: typeof TOOLS[0] }) => {
  const Icon = tool.icon
  
  // Preload tool page on hover for faster navigation
  const handleMouseEnter = () => {
    if (tool.isAvailable) {
      preloadToolPage(tool.id)
    }
  }
  
  return (
    <Card 
      key={tool.id} 
      className={`group relative transition-all ${
        tool.isAvailable 
          ? 'hover:shadow-lg hover:border-primary/50 hover:scale-[1.02]' 
          : 'opacity-60'
      }`}
      onMouseEnter={handleMouseEnter}
    >
      <CardHeader>
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-all group-hover:bg-primary/20 group-hover:scale-110">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {tool.name}
            {!tool.isAvailable && (
              <span className="text-xs font-normal text-muted-foreground">
                (Soon)
              </span>
            )}
          </CardTitle>
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
        {tool.isAvailable ? (
          <Button asChild variant="outline" className="w-full">
            <Link href={tool.path} prefetch={false}>
              Try Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button disabled variant="outline" className="w-full">
            Coming Soon
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function ToolsGrid() {
  return (
    <section id="tools" className="scroll-mt-20 py-20 md:py-32">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            All Tools
          </h2>
          <p className="text-lg text-muted-foreground">
            Professional design tools for every need
          </p>
        </div>

        {/* Image Processing Tools */}
        <div className="mb-16">
          <div className="mb-6">
            <h3 className="mb-2 text-2xl font-bold tracking-tight">
              {TOOL_CATEGORIES['image-processing'].name}
            </h3>
            <p className="text-muted-foreground">
              {TOOL_CATEGORIES['image-processing'].description}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {imageProcessingTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>

        {/* Generator Tools */}
        <div className="mb-16">
          <div className="mb-6">
            <h3 className="mb-2 text-2xl font-bold tracking-tight">
              {TOOL_CATEGORIES['generators'].name}
            </h3>
            <p className="text-muted-foreground">
              {TOOL_CATEGORIES['generators'].description}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {generatorTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
