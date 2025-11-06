/**
 * Example usage of the ToolWrapper component
 * This file demonstrates how to use ToolWrapper in a tool page
 */

import { Palette } from 'lucide-react'
import { ToolWrapper } from './ToolWrapper'

// Example 1: Basic usage with minimal props
export function BasicToolExample() {
  return (
    <ToolWrapper
      title="Color Picker"
      description="Extract colors from any image by clicking on it"
    >
      <div className="p-4">
        {/* Your tool content goes here */}
        <p>Tool content...</p>
      </div>
    </ToolWrapper>
  )
}

// Example 2: With icon and info modal
export function AdvancedToolExample() {
  return (
    <ToolWrapper
      title="Color Picker"
      description="Extract colors from any image by clicking on it"
      icon={<Palette className="h-6 w-6" />}
      infoContent={
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">How to use:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Upload an image using the file uploader</li>
              <li>Click anywhere on the image to extract the color</li>
              <li>Copy the color value in your preferred format (HEX, RGB, HSL)</li>
              <li>Export your color palette as JSON</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Supported formats:</h3>
            <p className="text-sm">PNG, JPG, WEBP (max 10MB)</p>
          </div>
        </div>
      }
    >
      <div className="p-4">
        {/* Your tool content goes here */}
        <p>Tool content with info modal...</p>
      </div>
    </ToolWrapper>
  )
}

// Example 3: API-powered tool (no privacy notice)
export function APIToolExample() {
  return (
    <ToolWrapper
      title="Background Remover"
      description="Remove backgrounds from images using AI"
      isClientSide={false}
    >
      <div className="p-4">
        {/* Your tool content goes here */}
        <p>API tool content (no privacy notice)...</p>
      </div>
    </ToolWrapper>
  )
}

// Example 4: Without back button
export function StandaloneToolExample() {
  return (
    <ToolWrapper
      title="Gradient Generator"
      description="Create beautiful CSS gradients"
      showBackButton={false}
    >
      <div className="p-4">
        {/* Your tool content goes here */}
        <p>Standalone tool without back button...</p>
      </div>
    </ToolWrapper>
  )
}
