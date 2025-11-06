# Accessibility Implementation Guide

This document outlines the accessibility features implemented in Design Kit and provides guidelines for maintaining WCAG 2.1 Level AA compliance.

## Overview

Design Kit is committed to providing an accessible experience for all users, including those using assistive technologies like screen readers, keyboard navigation, and other accessibility tools.

### Compliance Level

**Target:** WCAG 2.1 Level AA

### Key Features

- Full keyboard navigation support
- Screen reader announcements for status updates
- ARIA labels and roles on all interactive elements
- Focus management for modals and overlays
- Color contrast verification (4.5:1 for normal text, 3:1 for large text)
- Skip links for keyboard navigation
- Keyboard shortcuts with documentation

## Keyboard Navigation

### Global Shortcuts

All tools support these common keyboard shortcuts:

| Shortcut | Action |
|----------|--------|
| `Tab` | Move focus to next interactive element |
| `Shift+Tab` | Move focus to previous interactive element |
| `Enter` | Activate focused element |
| `Escape` | Cancel operation or close dialog |
| `Ctrl+S` (⌘S on Mac) | Download/Save result |
| `Ctrl+R` (⌘R on Mac) | Reset tool |

### Tool-Specific Shortcuts

Each tool may have additional shortcuts documented in its info dialog. Access the info dialog by clicking the info icon (ℹ️) in the tool header.

### Skip Links

A "Skip to main content" link appears when you press Tab on any tool page, allowing keyboard users to bypass navigation and jump directly to the tool content.

## Screen Reader Support

### Tested With

- **NVDA** (Windows)
- **JAWS** (Windows)
- **VoiceOver** (macOS, iOS)
- **TalkBack** (Android)

### Announcements

Screen readers will announce:

- File upload success/failure
- Processing status updates
- Operation completion
- Color selections
- Quota updates
- Error messages
- Download availability

### ARIA Labels

All interactive elements include appropriate ARIA labels:

```tsx
// Example: Button with icon
<Button aria-label="Remove file">
  <X className="h-4 w-4" aria-hidden="true" />
</Button>

// Example: Canvas with description
<canvas
  role="img"
  aria-label="Image preview with crop area"
  aria-describedby="crop-instructions"
/>
```

## Focus Management

### Focus Trap

Modals and overlays trap focus to prevent keyboard users from accidentally navigating outside:

```tsx
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'

const modalRef = useRef<HTMLDivElement>(null)

useFocusTrap(modalRef, {
  isActive: isOpen,
  onEscape: handleClose,
})
```

### Focus Restoration

When closing modals, focus is restored to the element that opened the modal:

```tsx
import { useFocusRestoration } from '@/lib/hooks/useFocusTrap'

const { saveFocus, restoreFocus } = useFocusRestoration()

const handleOpen = () => {
  saveFocus()
  setIsOpen(true)
}

const handleClose = () => {
  setIsOpen(false)
  restoreFocus()
}
```

### Visible Focus Indicators

All interactive elements have visible focus indicators that meet WCAG requirements:

- Minimum 2px outline
- High contrast color
- Visible on all backgrounds

## Color Contrast

### Requirements

- **Normal text (< 18pt):** 4.5:1 contrast ratio
- **Large text (≥ 18pt or ≥ 14pt bold):** 3:1 contrast ratio
- **UI components:** 3:1 contrast ratio

### Verification

Use the built-in color contrast checker:

```tsx
import { checkColorContrast } from '@/lib/utils/accessibility'

const result = checkColorContrast('#2563eb', '#ffffff', false)
// { passes: true, ratio: 8.59, level: 'AAA' }
```

### Color Palette

Design Kit uses a carefully selected color palette that meets WCAG AA standards:

```typescript
const ACCESSIBLE_COLORS = {
  primary: '#2563eb',    // Blue - 8.59:1 on white
  secondary: '#64748b',  // Slate - 4.54:1 on white
  success: '#16a34a',    // Green - 4.54:1 on white
  error: '#dc2626',      // Red - 5.90:1 on white
  warning: '#ca8a04',    // Yellow - 4.52:1 on white
}
```

## Implementation Guidelines

### Adding Keyboard Shortcuts

1. Define shortcuts using the `useKeyboardShortcuts` hook:

```tsx
import { useKeyboardShortcuts, COMMON_SHORTCUTS } from '@/lib/hooks/useKeyboardShortcuts'

const shortcuts = [
  {
    ...COMMON_SHORTCUTS.ESCAPE,
    handler: handleCancel,
  },
  {
    key: 's',
    ctrlKey: true,
    description: 'Save result',
    handler: handleSave,
  },
]

useKeyboardShortcuts({ shortcuts })
```

2. Document shortcuts in the tool's info dialog:

```tsx
<ToolWrapper
  keyboardShortcuts={shortcuts}
  infoContent={/* ... */}
/>
```

### Making Announcements

Use the `useAnnouncement` hook for screen reader announcements:

```tsx
import { useAnnouncement, ANNOUNCEMENT_MESSAGES } from '@/lib/hooks/useAnnouncement'

const { announce } = useAnnouncement()

const handleProcess = async () => {
  announce(ANNOUNCEMENT_MESSAGES.PROCESSING)
  await processImage()
  announce(ANNOUNCEMENT_MESSAGES.PROCESSING_COMPLETE, 'assertive')
}
```

### Adding ARIA Labels

Always include ARIA labels for:

1. **Buttons with only icons:**
```tsx
<Button aria-label="Close dialog">
  <X className="h-4 w-4" aria-hidden="true" />
</Button>
```

2. **Interactive regions:**
```tsx
<div role="region" aria-label="Color history">
  {/* content */}
</div>
```

3. **Status updates:**
```tsx
<div role="status" aria-live="polite">
  {statusMessage}
</div>
```

4. **Form inputs:**
```tsx
<input
  type="text"
  aria-label="Image width in pixels"
  aria-describedby="width-hint"
/>
<span id="width-hint" className="text-sm text-muted-foreground">
  Enter a value between 1 and 10000
</span>
```

### Focus Management in Modals

Always trap focus in modals and dialogs:

```tsx
import { useFocusTrap } from '@/lib/hooks/useFocusTrap'

function MyModal({ isOpen, onClose }) {
  const modalRef = useRef<HTMLDivElement>(null)
  
  useFocusTrap(modalRef, {
    isActive: isOpen,
    onEscape: onClose,
    focusFirstElement: true,
    restoreFocus: true,
  })
  
  return (
    <div ref={modalRef} role="dialog" aria-modal="true">
      {/* modal content */}
    </div>
  )
}
```

## Testing Checklist

### Keyboard Navigation

- [ ] All interactive elements are reachable via Tab
- [ ] Tab order is logical and follows visual layout
- [ ] Focus indicators are visible on all elements
- [ ] Escape key closes modals and cancels operations
- [ ] Enter key activates buttons and confirms actions
- [ ] Arrow keys work for sliders and adjustments

### Screen Reader

- [ ] All images have alt text or aria-labels
- [ ] Status updates are announced
- [ ] Error messages are announced
- [ ] Success messages are announced
- [ ] Form validation errors are announced
- [ ] Loading states are announced

### Color Contrast

- [ ] All text meets 4.5:1 contrast ratio (or 3:1 for large text)
- [ ] UI components meet 3:1 contrast ratio
- [ ] Focus indicators are visible on all backgrounds
- [ ] Error states use color + icon/text (not color alone)

### Focus Management

- [ ] Focus is trapped in modals
- [ ] Focus is restored when modals close
- [ ] Focus moves to newly revealed content
- [ ] Skip links work correctly

## Resources

### Tools

- [WAVE Browser Extension](https://wave.webaim.org/extension/) - Accessibility evaluation
- [axe DevTools](https://www.deque.com/axe/devtools/) - Automated accessibility testing
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance and accessibility audits
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/) - Contrast checking

### Documentation

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Articles](https://webaim.org/articles/)

### Testing

Run automated accessibility tests:

```bash
npm run test:a11y
```

Run Lighthouse audit:

```bash
npm run lighthouse
```

## Common Issues and Solutions

### Issue: Focus not visible

**Solution:** Ensure focus styles are defined and not removed:

```css
/* Don't do this */
*:focus {
  outline: none;
}

/* Do this instead */
*:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

### Issue: Screen reader not announcing updates

**Solution:** Use aria-live regions or the announcement utility:

```tsx
// Option 1: aria-live region
<div role="status" aria-live="polite">
  {statusMessage}
</div>

// Option 2: Announcement utility
announce('Processing complete')
```

### Issue: Keyboard trap in modal not working

**Solution:** Ensure modal has focusable elements and focus trap is active:

```tsx
useFocusTrap(modalRef, {
  isActive: isOpen, // Must be true when modal is open
  focusFirstElement: true,
})
```

### Issue: Color contrast failing

**Solution:** Use the contrast checker and adjust colors:

```tsx
const result = checkColorContrast(foreground, background)
if (!result.passes) {
  // Adjust colors or use alternative styling
}
```

## Maintenance

### Regular Audits

- Run automated tests before each release
- Manual testing with screen readers monthly
- User testing with accessibility users quarterly

### Updating Guidelines

This document should be updated when:

- New accessibility features are added
- WCAG guidelines are updated
- User feedback identifies issues
- New tools are implemented

## Contact

For accessibility questions or to report issues:

- Create an issue on GitHub
- Email: accessibility@designkit.com
- Include "Accessibility" in the subject line
