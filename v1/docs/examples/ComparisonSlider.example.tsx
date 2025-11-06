/**
 * ComparisonSlider Component Examples
 * 
 * This file demonstrates various usage patterns for the ComparisonSlider component.
 */

import { ComparisonSlider } from './ComparisonSlider'

// Example 1: Basic usage
export function BasicUsage() {
  return (
    <ComparisonSlider
      beforeImage="/images/before.jpg"
      afterImage="/images/after.jpg"
    />
  )
}

// Example 2: Custom labels
export function CustomLabels() {
  return (
    <ComparisonSlider
      beforeImage="/images/original.jpg"
      afterImage="/images/compressed.jpg"
      beforeLabel="Original (5MB)"
      afterLabel="Compressed (500KB)"
    />
  )
}

// Example 3: Different initial position
export function DifferentInitialPosition() {
  return (
    <ComparisonSlider
      beforeImage="/images/before.jpg"
      afterImage="/images/after.jpg"
      initialPosition={75}
      beforeLabel="Low Quality"
      afterLabel="High Quality"
    />
  )
}

// Example 4: With data URLs (from canvas)
export function WithDataURLs() {
  // Simulated data URLs from canvas processing
  const beforeDataUrl = 'data:image/png;base64,...'
  const afterDataUrl = 'data:image/png;base64,...'
  
  return (
    <ComparisonSlider
      beforeImage={beforeDataUrl}
      afterImage={afterDataUrl}
      beforeLabel="Original"
      afterLabel="Upscaled 2x"
    />
  )
}

// Example 5: In background remover tool
export function InBackgroundRemover() {
  const originalImage = '/images/photo-with-bg.jpg'
  const processedImage = '/images/photo-no-bg.png'
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Result</h2>
      
      <ComparisonSlider
        beforeImage={originalImage}
        afterImage={processedImage}
        beforeLabel="With Background"
        afterLabel="Background Removed"
        beforeAlt="Original photo with background"
        afterAlt="Photo with background removed"
      />
      
      <p className="text-sm text-muted-foreground text-center">
        Drag the slider or use arrow keys to compare
      </p>
    </div>
  )
}

// Example 6: In image upscaler tool
export function InImageUpscaler() {
  const lowResImage = '/images/low-res.jpg'
  const highResImage = '/images/high-res.jpg'
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Upscaled Result</h2>
        <span className="text-sm text-muted-foreground">4x Enhancement</span>
      </div>
      
      <ComparisonSlider
        beforeImage={lowResImage}
        afterImage={highResImage}
        beforeLabel="Original (512x512)"
        afterLabel="Upscaled (2048x2048)"
        initialPosition={50}
      />
      
      <div className="flex gap-2">
        <button className="flex-1 px-4 py-2 border rounded-md">
          Download Original
        </button>
        <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md">
          Download Upscaled
        </button>
      </div>
    </div>
  )
}

// Example 7: Multiple comparisons
export function MultipleComparisons() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-2">Compression Quality: Low</h3>
        <ComparisonSlider
          beforeImage="/images/original.jpg"
          afterImage="/images/compressed-low.jpg"
          beforeLabel="Original"
          afterLabel="Low Quality"
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Compression Quality: Medium</h3>
        <ComparisonSlider
          beforeImage="/images/original.jpg"
          afterImage="/images/compressed-medium.jpg"
          beforeLabel="Original"
          afterLabel="Medium Quality"
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Compression Quality: High</h3>
        <ComparisonSlider
          beforeImage="/images/original.jpg"
          afterImage="/images/compressed-high.jpg"
          beforeLabel="Original"
          afterLabel="High Quality"
        />
      </div>
    </div>
  )
}

// Example 8: Responsive sizing
export function ResponsiveSizing() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ComparisonSlider
        beforeImage="/images/before-1.jpg"
        afterImage="/images/after-1.jpg"
        beforeLabel="Before"
        afterLabel="After"
      />
      
      <ComparisonSlider
        beforeImage="/images/before-2.jpg"
        afterImage="/images/after-2.jpg"
        beforeLabel="Before"
        afterLabel="After"
      />
    </div>
  )
}
