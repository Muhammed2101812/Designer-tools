# Documentation Components Guide

This guide explains how to use the documentation components created for Design Kit tools.

## Table of Contents

1. [FAQ Component](#faq-component)
2. [ControlTooltip Component](#controltooltip-component)
3. [ToolDocumentation Component](#tooldocumentation-component)
4. [Best Practices](#best-practices)

---

## FAQ Component

### Basic Usage

```tsx
import { FAQ } from '@/components/shared/FAQ'

// Use with default questions
<FAQ />

// Use with custom questions
<FAQ
  items={[
    {
      question: 'How do I use this tool?',
      answer: 'Follow these steps...',
      category: 'general'
    }
  ]}
  title="Tool-Specific FAQ"
  showCategories={true}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `FAQItem[]` | Default FAQ items | Array of FAQ items |
| `title` | `string` | "Frequently Asked Questions" | Section title |
| `description` | `string` | - | Optional description |
| `showCategories` | `boolean` | `false` | Show category filters |
| `className` | `string` | - | Additional CSS classes |

### FAQItem Interface

```tsx
interface FAQItem {
  question: string
  answer: string | React.ReactNode
  category?: 'general' | 'client-side' | 'api-powered' | 'pricing' | 'technical'
}
```

---

## ControlTooltip Component

### Basic Usage

```tsx
import { ControlTooltip, LabelWithTooltip } from '@/components/shared/ControlTooltip'

// Wrap any control
<ControlTooltip content="Adjust the quality of the output image">
  <Slider value={quality} onChange={setQuality} />
</ControlTooltip>

// Standalone help icon
<div className="flex items-center gap-2">
  <Label>Quality</Label>
  <ControlTooltip content="Higher quality means larger file size" />
</div>

// Label with integrated tooltip
<LabelWithTooltip
  label="Quality"
  tooltip="Higher quality means larger file size"
  htmlFor="quality-slider"
  required={true}
/>
```

### ControlTooltip Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string \| React.ReactNode` | - | Tooltip content |
| `children` | `React.ReactNode` | - | Element to wrap |
| `side` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'` | Tooltip position |
| `showIcon` | `boolean` | `true` when no children | Show help icon |
| `className` | `string` | - | Additional CSS classes |
| `delayDuration` | `number` | `200` | Delay before showing (ms) |

### LabelWithTooltip Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Label text |
| `tooltip` | `string \| React.ReactNode` | - | Tooltip content |
| `htmlFor` | `string` | - | ID of form element |
| `required` | `boolean` | `false` | Show required indicator |
| `className` | `string` | - | Additional CSS classes |

---

## ToolDocumentation Component

### Basic Usage

```tsx
import { ToolDocumentation } from '@/components/shared/ToolDocumentation'

<ToolDocumentation
  steps={[
    'Upload an image (PNG, JPG, or WEBP format)',
    'Adjust the quality slider',
    'Click "Compress Image" to process',
    'Download the compressed result'
  ]}
  features={[
    'Smart compression with quality presets',
    'Real-time file size comparison',
    'Compression ratio display',
    '100% client-side processing'
  ]}
  keyboardShortcuts={[
    { keys: 'Ctrl+S', description: 'Download result' },
    { keys: 'Escape', description: 'Cancel operation' },
    { keys: '+/-', description: 'Zoom in/out' }
  ]}
  tips={[
    'Start with Medium preset for most use cases',
    'Use Low quality for web thumbnails',
    'Compare before/after to find the right balance'
  ]}
  performanceTips={[
    'Smaller images process faster',
    'Close other tabs to free up memory',
    'Use a modern browser for best performance'
  ]}
  troubleshooting={[
    {
      issue: 'Image processing is slow',
      solution: 'Try reducing the image size first or use a more powerful device'
    }
  ]}
  examples={[
    {
      title: 'Web Optimization',
      description: 'Compress images for faster website loading'
    }
  ]}
  isClientSide={true}
  quotaInfo={{
    free: 10,
    premium: 500,
    pro: 2000
  }}
/>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `steps` | `string[]` | Step-by-step instructions |
| `features` | `string[]` | Key features list |
| `tips` | `string[]` | Helpful tips |
| `keyboardShortcuts` | `Array<{keys: string, description: string}>` | Keyboard shortcuts |
| `privacyInfo` | `string \| React.ReactNode` | Privacy information |
| `performanceTips` | `string[]` | Performance optimization tips |
| `troubleshooting` | `Array<{issue: string, solution: string}>` | Common issues |
| `examples` | `Array<{title: string, description: string}>` | Example use cases |
| `isClientSide` | `boolean` | Whether tool is client-side |
| `quotaInfo` | `{free: number, premium: number, pro: number}` | API quota limits |

---

## Best Practices

### 1. Writing Clear Instructions

**Do:**
- Use action verbs (Upload, Click, Adjust)
- Be specific about file formats and limits
- Include expected outcomes
- Number steps sequentially

**Don't:**
- Use vague language ("maybe", "might")
- Assume prior knowledge
- Skip important details
- Use technical jargon without explanation

### 2. Creating Helpful Tooltips

**Do:**
- Keep tooltips concise (1-2 sentences)
- Explain the "why" not just the "what"
- Use plain language
- Include relevant units or ranges

**Don't:**
- Repeat the label text
- Write paragraphs in tooltips
- Use tooltips for critical information
- Forget to test on mobile

### 3. Writing FAQ Items

**Do:**
- Use questions users actually ask
- Provide complete answers
- Link to related resources
- Categorize appropriately

**Don't:**
- Use marketing language
- Avoid difficult questions
- Provide outdated information
- Forget to update when features change

### 4. Documenting Keyboard Shortcuts

**Do:**
- Use standard notation (Ctrl+S, not CTRL+s)
- Group related shortcuts
- Explain what each shortcut does
- Test shortcuts on different platforms

**Don't:**
- Document shortcuts that don't work
- Use platform-specific shortcuts without alternatives
- Forget to mention modifier keys
- Assume users know common shortcuts

### 5. Privacy and Security Information

**Do:**
- Be transparent about data handling
- Explain client-side vs server-side processing
- Mention data retention policies
- Provide links to privacy policy

**Don't:**
- Use legal jargon
- Hide important information
- Make false claims
- Forget to update when practices change

---

## Examples by Tool Type

### Client-Side Tool Example

```tsx
<ToolWrapper
  title="Image Resizer"
  description="Resize images with quality preservation"
  icon={<Maximize2 className="h-6 w-6" />}
  isClientSide={true}
  infoContent={
    <ToolDocumentation
      steps={[
        'Upload an image (PNG, JPG, or WEBP format, max 10MB)',
        'Enter your desired width and/or height in pixels',
        'Toggle aspect ratio lock to maintain proportions',
        'Click "Resize Image" to process',
        'Download the result in the original format'
      ]}
      features={[
        'Maintain aspect ratio option',
        'High-quality bicubic interpolation',
        'Before/after comparison',
        'Original format preservation',
        '100% client-side - your images never leave your browser'
      ]}
      tips={[
        'Keep aspect ratio locked to avoid distortion',
        'Enter just width or height to auto-calculate the other',
        'Upscaling may reduce quality - use Image Upscaler for AI enhancement'
      ]}
      isClientSide={true}
    />
  }
>
  {/* Tool content */}
</ToolWrapper>
```

### API-Powered Tool Example

```tsx
<ToolWrapper
  title="Background Remover"
  description="Remove image backgrounds with AI"
  icon={<Eraser className="h-6 w-6" />}
  isClientSide={false}
  infoContent={
    <ToolDocumentation
      steps={[
        'Sign in to your account',
        'Upload an image (PNG, JPG, or WEBP format, max 12MB)',
        'Click "Remove Background" to process',
        'Compare before and after with the slider',
        'Download the transparent PNG result'
      ]}
      features={[
        'AI-powered background removal',
        'High-quality edge detection',
        'Transparent PNG output',
        'Before/after comparison slider',
        'Works with people, products, and objects'
      ]}
      tips={[
        'Use high-contrast images for best results',
        'Ensure the subject is clearly visible',
        'Works best with single subjects',
        'Download as PNG to preserve transparency'
      ]}
      isClientSide={false}
      quotaInfo={{
        free: 10,
        premium: 500,
        pro: 2000
      }}
    />
  }
>
  {/* Tool content */}
</ToolWrapper>
```

---

## Adding Tooltips to Existing Controls

### Before

```tsx
<div className="space-y-2">
  <Label htmlFor="quality">Quality</Label>
  <Slider
    id="quality"
    value={quality}
    onChange={setQuality}
    min={0}
    max={100}
  />
</div>
```

### After

```tsx
<div className="space-y-2">
  <LabelWithTooltip
    label="Quality"
    tooltip="Higher quality produces larger files but better image fidelity. Recommended: 80-90 for most uses."
    htmlFor="quality"
  />
  <Slider
    id="quality"
    value={quality}
    onChange={setQuality}
    min={0}
    max={100}
  />
</div>
```

---

## Accessibility Considerations

### Keyboard Navigation
- All tooltips are keyboard accessible
- Tab to focus, Space/Enter to activate
- Escape to close

### Screen Readers
- Tooltips have proper ARIA labels
- Help icons have descriptive labels
- Content is announced when focused

### Visual Design
- High contrast text
- Clear focus indicators
- Sufficient touch targets (44x44px minimum)
- Responsive on all screen sizes

---

## Testing Checklist

- [ ] All tooltips display correctly
- [ ] Keyboard navigation works
- [ ] Screen reader announces content
- [ ] Mobile touch targets are adequate
- [ ] FAQ categories filter correctly
- [ ] Links in documentation work
- [ ] Privacy notices are visible
- [ ] Keyboard shortcuts are accurate
- [ ] Examples are relevant and clear
- [ ] No spelling or grammar errors

---

## Need Help?

If you have questions about using these components or need to add new documentation features, please:

1. Check the component source code for detailed JSDoc comments
2. Review existing tool implementations for examples
3. Consult the Design Kit documentation at `/faq`
4. Contact the development team

---

## Version History

- **v1.0.0** (2024) - Initial documentation components
  - FAQ component with category filtering
  - ControlTooltip for inline help
  - ToolDocumentation for comprehensive guides
  - Dedicated FAQ page
