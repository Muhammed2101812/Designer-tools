'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, Keyboard, Lightbulb, Shield, Zap } from 'lucide-react'

export interface ToolDocumentationProps {
  /**
   * Step-by-step instructions for using the tool
   */
  steps?: string[]
  
  /**
   * List of key features
   */
  features?: string[]
  
  /**
   * Helpful tips for using the tool
   */
  tips?: string[]
  
  /**
   * Keyboard shortcuts available in the tool
   */
  keyboardShortcuts?: Array<{
    keys: string
    description: string
  }>
  
  /**
   * Privacy and security information
   */
  privacyInfo?: string | React.ReactNode
  
  /**
   * Performance tips and optimization advice
   */
  performanceTips?: string[]
  
  /**
   * Common issues and troubleshooting
   */
  troubleshooting?: Array<{
    issue: string
    solution: string
  }>
  
  /**
   * Example use cases
   */
  examples?: Array<{
    title: string
    description: string
  }>
  
  /**
   * Whether this is a client-side tool
   * @default true
   */
  isClientSide?: boolean
  
  /**
   * Quota information for API-powered tools
   */
  quotaInfo?: {
    free: number
    premium: number
    pro: number
  }
}

/**
 * ToolDocumentation - A comprehensive documentation component for tool pages
 * 
 * This component provides a tabbed interface with all the information users need
 * to effectively use a tool, including instructions, features, tips, shortcuts, and more.
 */
export function ToolDocumentation({
  steps,
  features,
  tips,
  keyboardShortcuts,
  privacyInfo,
  performanceTips,
  troubleshooting,
  examples,
  isClientSide = true,
  quotaInfo,
}: ToolDocumentationProps) {
  return (
    <Tabs defaultValue="instructions" className="w-full">
      <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
        <TabsTrigger value="instructions">Instructions</TabsTrigger>
        <TabsTrigger value="features">Features</TabsTrigger>
        {keyboardShortcuts && keyboardShortcuts.length > 0 && (
          <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
        )}
        <TabsTrigger value="tips">Tips & Help</TabsTrigger>
      </TabsList>

      {/* Instructions Tab */}
      <TabsContent value="instructions" className="space-y-4">
        {steps && steps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                How to Use
              </CardTitle>
              <CardDescription>
                Follow these steps to get started with this tool
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                {steps.map((step, index) => (
                  <li key={index} className="text-muted-foreground">
                    {step}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {examples && examples.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Example Use Cases</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {examples.map((example, index) => (
                <div key={index} className="space-y-1">
                  <h4 className="text-sm font-semibold">{example.title}</h4>
                  <p className="text-sm text-muted-foreground">{example.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Features Tab */}
      <TabsContent value="features" className="space-y-4">
        {features && features.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Key Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">✓</span>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {privacyInfo && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              {typeof privacyInfo === 'string' ? (
                <p className="text-sm">{privacyInfo}</p>
              ) : (
                privacyInfo
              )}
            </AlertDescription>
          </Alert>
        )}

        {!isClientSide && quotaInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Quota Usage</CardTitle>
              <CardDescription>
                This tool counts against your daily API quota
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Free Plan:</span>
                <Badge variant="secondary">{quotaInfo.free} operations/day</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Premium Plan:</span>
                <Badge variant="secondary">{quotaInfo.premium} operations/day</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pro Plan:</span>
                <Badge variant="secondary">{quotaInfo.pro} operations/day</Badge>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Quota resets daily at midnight UTC
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* Shortcuts Tab */}
      {keyboardShortcuts && keyboardShortcuts.length > 0 && (
        <TabsContent value="shortcuts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Keyboard Shortcuts
              </CardTitle>
              <CardDescription>
                Use these shortcuts to work faster
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {keyboardShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">
                      {shortcut.description}
                    </span>
                    <kbd className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      )}

      {/* Tips & Help Tab */}
      <TabsContent value="tips" className="space-y-4">
        {tips && tips.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Pro Tips
              </CardTitle>
              <CardDescription>
                Get the most out of this tool
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">💡</span>
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {performanceTips && performanceTips.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Performance Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {performanceTips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">⚡</span>
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {troubleshooting && troubleshooting.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting</CardTitle>
              <CardDescription>
                Common issues and how to fix them
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {troubleshooting.map((item, index) => (
                <div key={index} className="space-y-1">
                  <h4 className="text-sm font-semibold">Problem: {item.issue}</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong>Solution:</strong> {item.solution}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  )
}
