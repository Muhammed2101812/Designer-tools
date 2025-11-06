# Responsive Design Guide

This guide provides best practices and patterns for implementing responsive design in the Design Kit application.

## Quick Start

### 1. Use Responsive Utilities

```typescript
import { useIsMobile, useIsTablet, useIsDesktop } from '@/lib/utils/responsive'

function MyComponent() {
  const isMobile = useIsMobile()
  
  return (
    <div className={isMobile ? 'flex-col' : 'flex-row'}>
      {/* Content */}
    </div>
  )
}
```

### 2. Apply Responsive Classes

```tsx
<div className="px-4 sm:px-6 lg:px-8">
  <h1 className="text-2xl sm:text-3xl lg:text-4xl">
    Responsive Heading
  </h1>
</div>
```

### 3. Use Touch-Optimized Components

```tsx
import { Button } from '@/components/ui/button'

// Buttons automatically have touch-optimized sizes
<Button size="default">
  Click Me
</Button>
```

## Breakpoints

| Name | Min Width | Max Width | Typical Devices |
|------|-----------|-----------|-----------------|
| Mobile | 320px | 639px | Phones |
| Tablet | 640px | 1023px | Tablets, small laptops |
| Desktop | 1024px | 1279px | Laptops, desktops |
| Wide | 1280px+ | - | Large desktops |

## Layout Patterns

### Two-Column Layout (Canvas + Sidebar)

```tsx
<div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-6">
  {/* Canvas - full width on mobile, 2/3 on desktop */}
  <div className="lg:col-span-2 order-1">
    <Canvas />
  </div>

  {/* Sidebar - stacked below on mobile, sidebar on desktop */}
  <div className="space-y-4 order-2">
    <Controls />
  </div>
</div>
```

### Responsive Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id}>{item.content}</Card>
  ))}
</div>
```

### Responsive Stack

```tsx
<div className="flex flex-col sm:flex-row gap-3">
  <Button className="flex-1">Primary</Button>
  <Button className="flex-1" variant="outline">Secondary</Button>
</div>
```

## Touch Optimization

### Touch Target Sizes

All interactive elements should meet WCAG 2.1 Level AAA guidelines (44x44px minimum):

```tsx
// ✅ Good - meets touch target size
<Button size="default">Click Me</Button>

// ✅ Good - icon button with proper size
<Button size="icon">
  <Icon className="h-5 w-5" />
</Button>

// ❌ Bad - too small for touch
<button className="h-6 w-6">X</button>
```

### Touch Gestures

```tsx
import { getPointerPosition } from '@/lib/utils/responsive'

function TouchCanvas() {
  const handleInteraction = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const position = getPointerPosition(e, canvas)
    // Use position.x and position.y
  }
  
  return (
    <canvas
      onMouseDown={handleInteraction}
      onTouchStart={handleInteraction}
      className="touch-none" // Prevent default touch behaviors
    />
  )
}
```

### Prevent Touch Scroll

```tsx
import { preventTouchScroll } from '@/lib/utils/responsive'

useEffect(() => {
  const element = canvasRef.current
  if (!element) return
  
  const cleanup = preventTouchScroll(element)
  return cleanup
}, [])
```

## Mobile-Specific Components

### Bottom Sheet (Mobile) vs Dialog (Desktop)

```tsx
import { useIsMobile } from '@/lib/utils/responsive'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { BottomSheet } from '@/components/ui/bottom-sheet'

function ResponsiveModal() {
  const isMobile = useIsMobile()
  const [isOpen, setIsOpen] = useState(false)
  
  const content = <div>Modal content</div>
  
  if (isMobile) {
    return (
      <BottomSheet
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Options"
      >
        {content}
      </BottomSheet>
    )
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        {content}
      </DialogContent>
    </Dialog>
  )
}
```

### Responsive Canvas

```tsx
import { ResponsiveCanvas } from '@/components/shared/ResponsiveCanvas'

function ImageTool() {
  return (
    <ResponsiveCanvas
      width={2000}
      height={1500}
      optimizeForMobile={true}
      onCanvasReady={(canvas, ctx) => {
        // Canvas is ready and optimized for device
      }}
    />
  )
}
```

## Performance Optimization

### Canvas Size Optimization

```tsx
import { getOptimalCanvasSize } from '@/lib/utils/responsive'

function processImage(width: number, height: number) {
  // Automatically scales down on mobile
  const optimal = getOptimalCanvasSize(width, height)
  
  const canvas = document.createElement('canvas')
  canvas.width = optimal.width
  canvas.height = optimal.height
  
  // Process with optimized dimensions
}
```

### Debounce Resize Events

```tsx
import { debounce } from '@/lib/utils/responsive'

useEffect(() => {
  const handleResize = debounce(() => {
    // Handle resize
  }, 250)
  
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```

### Throttle Scroll/Touch Events

```tsx
import { throttle } from '@/lib/utils/responsive'

useEffect(() => {
  const handleScroll = throttle(() => {
    // Handle scroll
  }, 100)
  
  window.addEventListener('scroll', handleScroll)
  return () => window.removeEventListener('scroll', handleScroll)
}, [])
```

## Typography

### Responsive Text Sizes

```tsx
import { RESPONSIVE_TEXT } from '@/lib/utils/responsive'

<h1 className={RESPONSIVE_TEXT.h1}>Main Heading</h1>
<h2 className={RESPONSIVE_TEXT.h2}>Subheading</h2>
<p className={RESPONSIVE_TEXT.body}>Body text</p>
<small className={RESPONSIVE_TEXT.small}>Small text</small>
```

### Custom Responsive Text

```tsx
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
  Responsive Heading
</h1>
```

## Spacing

### Responsive Padding

```tsx
import { RESPONSIVE_SPACING } from '@/lib/utils/responsive'

<div className={RESPONSIVE_SPACING.container}>
  <section className={RESPONSIVE_SPACING.section}>
    <div className={RESPONSIVE_SPACING.gap}>
      {/* Content */}
    </div>
  </section>
</div>
```

### Custom Responsive Spacing

```tsx
<div className="p-4 sm:p-6 lg:p-8">
  <div className="space-y-4 sm:space-y-6 lg:space-y-8">
    {/* Content */}
  </div>
</div>
```

## Images

### Responsive Images

```tsx
<img
  src="/image.jpg"
  alt="Description"
  className="w-full h-auto max-w-full"
  loading="lazy"
/>
```

### Responsive Background Images

```tsx
<div className="
  bg-cover bg-center
  h-48 sm:h-64 lg:h-96
  bg-[url('/mobile.jpg')]
  sm:bg-[url('/tablet.jpg')]
  lg:bg-[url('/desktop.jpg')]
">
  {/* Content */}
</div>
```

## Forms

### Responsive Form Layouts

```tsx
<form className="space-y-4">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <Input placeholder="First Name" />
    <Input placeholder="Last Name" />
  </div>
  
  <Input placeholder="Email" className="w-full" />
  
  <div className="flex flex-col sm:flex-row gap-3">
    <Button type="submit" className="flex-1">Submit</Button>
    <Button type="button" variant="outline" className="flex-1">Cancel</Button>
  </div>
</form>
```

## Testing

### Manual Testing Checklist

- [ ] Test on mobile (320px - 767px)
- [ ] Test on tablet (768px - 1023px)
- [ ] Test on desktop (1024px+)
- [ ] Test touch interactions on mobile
- [ ] Test keyboard navigation on desktop
- [ ] Test orientation changes (portrait/landscape)
- [ ] Test with browser zoom (100%, 150%, 200%)
- [ ] Test with different font sizes
- [ ] Verify no horizontal scrolling
- [ ] Verify all content is accessible

### Automated Testing

```typescript
import { render } from '@testing-library/react'
import { useIsMobile } from '@/lib/utils/responsive'

// Mock window.innerWidth for tests
beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375, // Mobile width
  })
})

test('renders mobile layout', () => {
  const { container } = render(<MyComponent />)
  // Assert mobile-specific behavior
})
```

## Common Patterns

### Hide/Show Based on Screen Size

```tsx
{/* Show only on mobile */}
<div className="block lg:hidden">
  Mobile content
</div>

{/* Show only on desktop */}
<div className="hidden lg:block">
  Desktop content
</div>

{/* Show on tablet and up */}
<div className="hidden sm:block">
  Tablet and desktop content
</div>
```

### Responsive Flex Direction

```tsx
<div className="flex flex-col sm:flex-row gap-4">
  <div className="flex-1">Column 1</div>
  <div className="flex-1">Column 2</div>
</div>
```

### Responsive Order

```tsx
<div className="flex flex-col lg:flex-row">
  <div className="order-2 lg:order-1">First on desktop, second on mobile</div>
  <div className="order-1 lg:order-2">Second on desktop, first on mobile</div>
</div>
```

## Best Practices

1. **Mobile-First**: Start with mobile styles, then add larger breakpoints
2. **Touch Targets**: Ensure all interactive elements are at least 44x44px
3. **Performance**: Optimize canvas and image sizes for mobile
4. **Testing**: Test on real devices, not just browser DevTools
5. **Accessibility**: Ensure keyboard navigation works on all screen sizes
6. **Consistency**: Use the same breakpoints and patterns across the app
7. **Progressive Enhancement**: Core functionality should work on all devices
8. **Avoid Fixed Widths**: Use relative units (%, rem, em) instead of px
9. **Test Orientation**: Verify both portrait and landscape modes
10. **Consider Bandwidth**: Optimize assets for mobile networks

## Resources

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [WCAG 2.1 Touch Target Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [MDN Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [Web.dev Responsive Design](https://web.dev/responsive-web-design-basics/)
