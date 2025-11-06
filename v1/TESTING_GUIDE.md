# Manual Testing Guide - Quick Start

## Prerequisites

Before starting manual testing, ensure you have:

1. **Development Environment Running**
   ```bash
   npm run dev
   ```
   Application should be accessible at `http://localhost:3000`

2. **Test Browsers Installed**
   - Chrome (latest)
   - Firefox (latest)
   - Safari (macOS/iOS)
   - Edge (latest)

3. **Mobile Devices Available**
   - iOS device (iPhone/iPad) or iOS Simulator
   - Android device or Android Emulator

4. **Screen Reader Software**
   - Windows: NVDA (free) - https://www.nvaccess.org/download/
   - macOS: VoiceOver (built-in)
   - iOS: VoiceOver (built-in)
   - Android: TalkBack (built-in)

5. **Test Assets**
   - Sample images (various sizes: small <1MB, medium 2-5MB, large 8-10MB)
   - Different formats (PNG, JPG, WEBP)
   - Different orientations (portrait, landscape, square)

## Quick Testing Workflow

### 1. Browser Compatibility (30-45 minutes per browser)

**Chrome Testing:**
```bash
# Open in Chrome
# Test all features systematically
# Document any issues
```

**Firefox Testing:**
```bash
# Open in Firefox
# Test all features systematically
# Compare behavior with Chrome
```

**Safari Testing:**
```bash
# Open in Safari (macOS)
# Pay special attention to:
# - Canvas rendering
# - Clipboard API
# - File upload
```

**Edge Testing:**
```bash
# Open in Edge
# Test all features systematically
# Should behave similar to Chrome (Chromium-based)
```

### 2. Mobile Testing (45-60 minutes per platform)

**iOS Testing:**
```bash
# Option 1: Physical Device
# - Open Safari on iPhone/iPad
# - Navigate to local network IP (e.g., http://192.168.1.x:3000)

# Option 2: iOS Simulator (Xcode required)
# - Open Xcode
# - Launch iOS Simulator
# - Open Safari
# - Navigate to localhost:3000
```

**Android Testing:**
```bash
# Option 1: Physical Device
# - Enable USB debugging
# - Connect device
# - Open Chrome
# - Navigate to local network IP

# Option 2: Android Emulator
# - Open Android Studio
# - Launch emulator
# - Open Chrome
# - Navigate to 10.0.2.2:3000 (emulator localhost)
```

### 3. Keyboard Navigation Testing (20-30 minutes)

**Steps:**
1. Close your mouse or don't use it
2. Use only keyboard to navigate
3. Tab through all interactive elements
4. Test all keyboard shortcuts
5. Ensure no keyboard traps
6. Verify focus indicators visible

**Key Combinations to Test:**
- `Tab` - Move forward
- `Shift + Tab` - Move backward
- `Enter` - Activate buttons/links
- `Space` - Activate buttons/checkboxes
- `Escape` - Close modals/menus
- `+` - Zoom in (Color Picker)
- `-` - Zoom out (Color Picker)
- `0` - Reset zoom (Color Picker)

### 4. Screen Reader Testing (30-45 minutes)

**NVDA (Windows):**
```bash
# 1. Install NVDA
# 2. Start NVDA (Ctrl + Alt + N)
# 3. Navigate with:
#    - Down Arrow: Next element
#    - Up Arrow: Previous element
#    - H: Next heading
#    - Tab: Next interactive element
# 4. Listen to announcements
# 5. Verify all content accessible
```

**VoiceOver (macOS):**
```bash
# 1. Enable VoiceOver (Cmd + F5)
# 2. Navigate with:
#    - VO + Right Arrow: Next element
#    - VO + Left Arrow: Previous element
#    - VO + H: Next heading
#    - Tab: Next interactive element
# 3. Listen to announcements
# 4. Verify all content accessible
```

### 5. Responsive Design Testing (20-30 minutes)

**Using Browser DevTools:**
```bash
# Chrome/Firefox/Edge:
# 1. Open DevTools (F12)
# 2. Click device toolbar icon (Ctrl + Shift + M)
# 3. Test these viewport sizes:
#    - 320px (iPhone SE)
#    - 375px (iPhone 12/13)
#    - 414px (iPhone 12 Pro Max)
#    - 768px (iPad)
#    - 1024px (iPad Pro)
#    - 1280px (Desktop)
#    - 1920px (Large Desktop)
# 4. Test both portrait and landscape
# 5. Check for:
#    - No horizontal scrolling
#    - Readable text
#    - Touch-friendly buttons
#    - Proper stacking
```

### 6. Error State Testing (15-20 minutes)

**File Upload Errors:**
```bash
# Test these scenarios:
# 1. Upload file > 10MB
# 2. Upload invalid file type (e.g., .txt, .pdf)
# 3. Upload corrupted image
# 4. Cancel upload mid-process
```

**Form Errors:**
```bash
# Test these scenarios:
# 1. Submit empty form
# 2. Invalid email format
# 3. Password too short
# 4. Mismatched passwords
# 5. Network disconnected
```

**Color Picker Errors:**
```bash
# Test these scenarios:
# 1. Click outside image bounds
# 2. Zoom beyond limits
# 3. Export empty history
# 4. Clear empty history
```

## Testing Tips

### Efficient Testing
1. **Use Checklists**: Print or use digital checklist (MANUAL_TESTING_CHECKLIST.md)
2. **Take Screenshots**: Document issues visually
3. **Record Videos**: Capture complex bugs
4. **Use Browser DevTools**: Monitor console, network, performance
5. **Test Systematically**: Don't skip steps

### Common Issues to Watch For
- Layout shifts during page load
- Broken images or icons
- Misaligned text or buttons
- Overlapping elements
- Cut-off content
- Invisible focus indicators
- Missing error messages
- Slow loading times
- Memory leaks (check DevTools Memory tab)
- Console errors or warnings

### Browser-Specific Issues
- **Safari**: Clipboard API may require user gesture
- **Firefox**: Canvas rendering may differ slightly
- **Mobile Safari**: Viewport height with address bar
- **Android Chrome**: File upload from camera

### Accessibility Issues
- Missing alt text on images
- Poor color contrast
- Missing form labels
- Unclear error messages
- Keyboard traps
- Missing ARIA labels
- Incorrect heading hierarchy

## Reporting Issues

### Issue Template
```markdown
**Title**: Brief description

**Browser/Device**: Chrome 120 / Windows 11

**Steps to Reproduce**:
1. Navigate to Color Picker
2. Upload image
3. Click zoom in button

**Expected Behavior**: 
Canvas should zoom to 1.25x

**Actual Behavior**: 
Canvas does not zoom, console error appears

**Screenshot**: 
[Attach screenshot]

**Severity**: 
[ ] Critical (blocks functionality)
[ ] Major (significant impact)
[ ] Minor (cosmetic or edge case)

**Additional Notes**:
Console shows: "TypeError: Cannot read property..."
```

## Testing Schedule Recommendation

### Day 1: Core Functionality (4-5 hours)
- Browser compatibility (Chrome, Firefox)
- Color Picker complete workflow
- Authentication flows
- Profile page

### Day 2: Mobile & Accessibility (4-5 hours)
- iOS testing
- Android testing
- Keyboard navigation
- Screen reader testing

### Day 3: Edge Cases & Polish (3-4 hours)
- Error states
- Responsive design breakpoints
- Performance testing
- Security & privacy checks
- Dark mode testing

### Day 4: Final Review (2-3 hours)
- Retest critical issues
- Cross-browser verification
- Documentation review
- Sign-off preparation

## Post-Testing

1. **Compile Results**: Fill out MANUAL_TESTING_CHECKLIST.md
2. **Prioritize Issues**: Critical → Major → Minor
3. **Create Issue Tickets**: Document in issue tracker
4. **Share Report**: With development team
5. **Plan Fixes**: Schedule bug fix sprint
6. **Retest**: After fixes implemented

## Resources

- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **NVDA User Guide**: https://www.nvaccess.org/files/nvda/documentation/userGuide.html
- **VoiceOver Guide**: https://support.apple.com/guide/voiceover/welcome/mac
- **Chrome DevTools**: https://developer.chrome.com/docs/devtools/
- **Can I Use**: https://caniuse.com/ (browser compatibility)

## Questions?

If you encounter issues during testing or need clarification:
1. Check browser console for errors
2. Review requirements in design-kit-mvp/requirements.md
3. Consult design document in design-kit-mvp/design.md
4. Ask development team for guidance

---

**Happy Testing! 🧪**
