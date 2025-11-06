# Shared Tool Components

This directory contains reusable components used across all tools in the Design Kit application.

## Components

### UsageIndicator

Displays remaining API quota for authenticated users with a progress bar, numerical count, and upgrade CTA.

**Features:**
- Color-coded progress bar (green > 50%, yellow 20-50%, red < 20%)
- Numerical display of remaining quota
- Warning messages when quota is low
- Upgrade CTA for non-Pro users
- Compact mode for inline display
- Real-time updates after tool usage

**Usage:**
```tsx
import { UsageIndicator } from '@/components/shared'

<UsageIndicator
  currentUsage={8}
  dailyLimit={10}
  planName="free"
  onUpgradeClick={() => router.push('/pricing')}
/>
```

**Props:**
- `currentUsage` (number): Current usage count for the day
- `dailyLimit` (number): Daily limit for the user's plan
- `planName` ('free' | 'premium' | 'pro'): User's plan name
- `onUpgradeClick` (function, optional): Callback when upgrade button is clicked
- `compact` (boolean, optional): Show compact version
- `className` (string, optional): Additional CSS classes

---

### DownloadButton

Handles file downloads with progress indication and success feedback.

**Features:**
- Supports Blob objects and data URL strings
- Download progress indication
- Success feedback with toast notification
- Keyboard accessible
- Multiple file format support
- Icon-only mode

**Usage:**
```tsx
import { DownloadButton } from '@/components/shared'

<DownloadButton
  fileName="processed-image.png"
  fileData={imageBlob}
  fileType="image/png"
  onDownloadComplete={() => console.log('Downloaded!')}
/>
```

**Props:**
- `fileName` (string): Name of the file to download (including extension)
- `fileData` (Blob | string): File data as Blob or data URL string
- `fileType` (string): MIME type of the file
- `disabled` (boolean, optional): Whether the button is disabled
- `variant` (string, optional): Button variant ('default', 'outline', 'secondary', 'ghost')
- `size` (string, optional): Button size ('default', 'sm', 'lg', 'icon')
- `iconOnly` (boolean, optional): Show icon only (no text)
- `onDownloadStart` (function, optional): Callback when download starts
- `onDownloadComplete` (function, optional): Callback when download completes
- `className` (string, optional): Additional CSS classes

---

### ProcessingOverlay

Shows a loading state during API operations with optional progress bar and cancel functionality.

**Features:**
- Full-screen overlay with backdrop
- Indeterminate spinner or progress indicator
- Status message updates
- Optional cancel button
- Keyboard support (Escape to cancel)
- Prevents body scroll when active
- Dynamic progress messages

**Usage:**
```tsx
import { ProcessingOverlay } from '@/components/shared'

<ProcessingOverlay
  isProcessing={isProcessing}
  progress={progress}
  message="Removing background..."
  onCancel={handleCancel}
/>
```

**Props:**
- `isProcessing` (boolean): Whether the overlay is visible
- `progress` (number, optional): Progress percentage (0-100)
- `message` (string, optional): Status message to display
- `onCancel` (function, optional): Callback when cancel button is clicked
- `showBackdrop` (boolean, optional): Whether to show a backdrop blur effect
- `className` (string, optional): Additional CSS classes

---

### ComparisonSlider

Provides a side-by-side image comparison with a draggable slider.

**Features:**
- Draggable vertical slider
- Mouse, touch, and keyboard support
- Customizable labels
- Smooth animations
- Accessible with ARIA attributes
- Keyboard navigation (Arrow keys, Home, End)
- Touch-optimized for mobile

**Usage:**
```tsx
import { ComparisonSlider } from '@/components/shared'

<ComparisonSlider
  beforeImage="/images/before.jpg"
  afterImage="/images/after.jpg"
  beforeLabel="Original"
  afterLabel="Processed"
/>
```

**Props:**
- `beforeImage` (string): URL or data URL of the "before" image
- `afterImage` (string): URL or data URL of the "after" image
- `beforeLabel` (string, optional): Label for the before image (default: "Before")
- `afterLabel` (string, optional): Label for the after image (default: "After")
- `initialPosition` (number, optional): Initial slider position 0-100 (default: 50)
- `beforeAlt` (string, optional): Alt text for before image
- `afterAlt` (string, optional): Alt text for after image
- `className` (string, optional): Additional CSS classes

**Keyboard Controls:**
- `Arrow Left/Right`: Move slider by 1%
- `Shift + Arrow Left/Right`: Move slider by 10%
- `Home`: Move slider to start (0%)
- `End`: Move slider to end (100%)

---

## Accessibility

All components follow WCAG 2.1 Level AA guidelines:

- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **ARIA Labels**: Proper ARIA attributes for screen readers
- **Focus Management**: Visible focus indicators and logical tab order
- **Color Contrast**: Meets 4.5:1 contrast ratio for normal text
- **Screen Reader Support**: Status announcements and descriptive labels

## Examples

See the `.example.tsx` files for each component for detailed usage examples:

- `UsageIndicator.example.tsx`
- `DownloadButton.example.tsx`
- `ProcessingOverlay.example.tsx`
- `ComparisonSlider.example.tsx`

## Testing

All components include:
- Unit tests for core functionality
- Accessibility tests with axe-core
- Keyboard navigation tests
- Touch interaction tests (for ComparisonSlider)

Run tests with:
```bash
npm test components/shared
```

## Design Patterns

### State Management
Components use React hooks (useState, useCallback, useRef) for local state management. They don't depend on global state stores.

### Event Handling
- Mouse and touch events are handled separately for better mobile support
- Keyboard events follow standard accessibility patterns
- Event listeners are properly cleaned up in useEffect

### Performance
- Components use React.memo where appropriate
- Callbacks are memoized with useCallback
- Heavy operations are debounced or throttled

### Error Handling
- Components handle edge cases gracefully
- Error states are communicated to users via toast notifications
- Failed operations don't leave the UI in a broken state

## Integration with Tools

These components are designed to work seamlessly with all tool pages:

```tsx
// Example: Background Remover Tool
import {
  ToolWrapper,
  UsageIndicator,
  ProcessingOverlay,
  ComparisonSlider,
  DownloadButton,
} from '@/components/shared'

export default function BackgroundRemoverPage() {
  return (
    <ToolWrapper
      title="Background Remover"
      description="Remove backgrounds from images with AI"
      isClientSide={false}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main content */}
        <div className="lg:col-span-3">
          {result && (
            <>
              <ComparisonSlider
                beforeImage={originalImage}
                afterImage={result}
                beforeLabel="With Background"
                afterLabel="Background Removed"
              />
              
              <DownloadButton
                fileName="no-background.png"
                fileData={result}
                fileType="image/png"
              />
            </>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <UsageIndicator
            currentUsage={currentUsage}
            dailyLimit={dailyLimit}
            planName={planName}
          />
        </div>
      </div>
      
      <ProcessingOverlay
        isProcessing={isProcessing}
        progress={progress}
        message="Removing background..."
        onCancel={handleCancel}
      />
    </ToolWrapper>
  )
}
```

## Contributing

When adding new shared components:

1. Follow the existing component structure
2. Include TypeScript types for all props
3. Add comprehensive JSDoc comments
4. Create example file showing usage patterns
5. Ensure WCAG 2.1 Level AA compliance
6. Add unit and accessibility tests
7. Update this README with component documentation
