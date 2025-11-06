# Shared Components

This directory contains reusable components that are shared across multiple tool pages.

## ToolWrapper

The `ToolWrapper` component provides a consistent layout and navigation structure for all tool pages in the Design Kit application.

### Features

- ✅ Consistent header with title, description, and optional icon
- ✅ Back navigation button to tools grid
- ✅ Optional info modal for tool instructions
- ✅ Privacy notice footer for client-side tools
- ✅ Fully responsive layout (mobile, tablet, desktop)
- ✅ TypeScript interfaces with full type safety
- ✅ Accessibility features (ARIA labels, keyboard navigation)

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | Required | The title of the tool displayed at the top |
| `description` | `string` | Required | A brief description of what the tool does |
| `icon` | `React.ReactNode` | Optional | Icon component or element to display next to the title |
| `children` | `React.ReactNode` | Required | The main content of the tool |
| `showBackButton` | `boolean` | `true` | Whether to show the back navigation button |
| `infoContent` | `React.ReactNode` | Optional | Content to display in the info modal. If provided, an info button will be shown |
| `className` | `string` | Optional | Additional CSS classes for the wrapper container |
| `isClientSide` | `boolean` | `true` | Whether this is a client-side tool (shows privacy notice) |

### Usage Examples

#### Basic Usage

```tsx
import { ToolWrapper } from '@/components/shared'

export default function MyToolPage() {
  return (
    <ToolWrapper
      title="Color Picker"
      description="Extract colors from any image by clicking on it"
    >
      <div className="p-4">
        {/* Your tool content goes here */}
      </div>
    </ToolWrapper>
  )
}
```

#### With Icon and Info Modal

```tsx
import { Palette } from 'lucide-react'
import { ToolWrapper } from '@/components/shared'

export default function ColorPickerPage() {
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
              <li>Copy the color value in your preferred format</li>
            </ol>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Your tool content */}
      </div>
    </ToolWrapper>
  )
}
```

#### API-Powered Tool (No Privacy Notice)

```tsx
import { ToolWrapper } from '@/components/shared'

export default function BackgroundRemoverPage() {
  return (
    <ToolWrapper
      title="Background Remover"
      description="Remove backgrounds from images using AI"
      isClientSide={false}
    >
      <div className="p-4">
        {/* API tool content - no privacy notice shown */}
      </div>
    </ToolWrapper>
  )
}
```

#### Without Back Button

```tsx
import { ToolWrapper } from '@/components/shared'

export default function StandaloneToolPage() {
  return (
    <ToolWrapper
      title="Gradient Generator"
      description="Create beautiful CSS gradients"
      showBackButton={false}
    >
      <div className="p-4">
        {/* Standalone tool content */}
      </div>
    </ToolWrapper>
  )
}
```

### Responsive Behavior

The ToolWrapper component is fully responsive and adapts to different screen sizes:

- **Mobile (< 640px)**: 
  - Back button shows only icon
  - Title and description stack vertically
  - Reduced padding and spacing

- **Tablet (640px - 1024px)**:
  - Back button shows icon + text
  - Comfortable spacing
  - Optimized for touch interactions

- **Desktop (> 1024px)**:
  - Full layout with maximum width container
  - Larger text sizes
  - Optimal spacing for mouse interactions

### Accessibility

The component includes several accessibility features:

- Semantic HTML structure
- ARIA labels for icon buttons
- Keyboard navigation support
- Screen reader friendly
- Focus indicators on interactive elements
- Proper heading hierarchy

### Privacy Notice

For client-side tools (`isClientSide={true}`), a privacy notice is automatically displayed in the footer:

> 🔒 All processing happens in your browser. Your files never leave your device.

This reassures users that their files are processed locally and never uploaded to a server.

### Styling

The component uses Tailwind CSS classes and follows the Design Kit design system. You can customize the appearance by:

1. Passing additional classes via the `className` prop
2. Styling the children content
3. Customizing the theme in `tailwind.config.ts`

### Requirements Satisfied

This component satisfies the following requirements from the Design Kit MVP specification:

- **Requirement 14.1**: Tool pages use ToolWrapper component with title, description, and icon
- **Requirement 14.5**: Privacy notice footer for client-side tools
- **Requirement 9.1-9.5**: Responsive design for mobile, tablet, and desktop
- **Requirement 12.1-12.5**: Accessibility compliance (keyboard navigation, ARIA labels, screen reader support)

### Related Components

- `FileUploader` - Component for handling file uploads with drag-and-drop
- `DownloadButton` - Component for downloading processed files (coming soon)
- `UsageIndicator` - Component for showing API usage (coming soon)

---

## FileUploader

The `FileUploader` component provides a drag-and-drop file upload interface with comprehensive validation and user feedback.

### Features

- ✅ Drag and drop functionality with visual feedback
- ✅ Click to browse file selection
- ✅ File type validation (MIME types and extensions)
- ✅ File size validation with configurable limits
- ✅ Single or multiple file selection
- ✅ Selected file display with name, size, and clear button
- ✅ Inline error messages for validation failures
- ✅ Accessible keyboard navigation
- ✅ Disabled state support
- ✅ Privacy-first (files handled client-side only)

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onFileSelect` | `(files: File \| File[]) => void` | Required | Callback when file(s) are selected and validated |
| `accept` | `string` | Optional | Accepted file types (MIME types or extensions). Example: `"image/png,image/jpeg,.pdf"` |
| `maxSize` | `number` | `10` | Maximum file size in megabytes |
| `description` | `string` | Optional | Description text shown in the upload area |
| `multiple` | `boolean` | `false` | Whether to allow multiple file selection |
| `className` | `string` | Optional | Additional CSS classes for the container |
| `disabled` | `boolean` | `false` | Disabled state |

### Usage Examples

#### Basic Image Upload

```tsx
import { FileUploader } from '@/components/shared/FileUploader'

export default function MyComponent() {
  const handleFileSelect = (file: File | File[]) => {
    const selectedFile = Array.isArray(file) ? file[0] : file
    console.log('Selected file:', selectedFile)
  }

  return (
    <FileUploader
      onFileSelect={handleFileSelect}
      accept="image/png,image/jpeg,image/webp"
      maxSize={10}
      description="Upload an image to get started"
    />
  )
}
```

#### Multiple Files Upload

```tsx
import { FileUploader } from '@/components/shared/FileUploader'

export default function MultipleFilesExample() {
  const handleFileSelect = (files: File | File[]) => {
    const fileArray = Array.isArray(files) ? files : [files]
    console.log('Selected files:', fileArray)
  }

  return (
    <FileUploader
      onFileSelect={handleFileSelect}
      accept="image/*"
      maxSize={5}
      multiple
      description="Select multiple images"
    />
  )
}
```

#### With Image Preview

```tsx
import { useState } from 'react'
import { FileUploader } from '@/components/shared/FileUploader'

export default function ImagePreviewExample() {
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileSelect = (file: File | File[]) => {
    const selectedFile = Array.isArray(file) ? file[0] : file
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  return (
    <div className="space-y-4">
      <FileUploader
        onFileSelect={handleFileSelect}
        accept="image/png,image/jpeg,image/webp"
        maxSize={10}
        description="Upload an image to see preview"
      />
      
      {preview && (
        <img src={preview} alt="Preview" className="max-w-full h-auto rounded" />
      )}
    </div>
  )
}
```

See `FileUploader.example.tsx` for more comprehensive examples.

### File Type Validation

The `accept` prop supports both MIME types and file extensions:

**MIME Types:**
```tsx
accept="image/png,image/jpeg,image/webp"  // Specific image types
accept="image/*"                           // All image types
accept="video/*"                           // All video types
accept="application/pdf"                   // PDF files
```

**File Extensions:**
```tsx
accept=".png,.jpg,.jpeg"                   // Specific extensions
accept=".pdf,.doc,.docx"                   // Document types
```

**Mixed:**
```tsx
accept="image/*,.pdf"                      // Images and PDFs
```

### Validation Behavior

The component validates files before calling `onFileSelect`:

1. **File Type**: Checks against the `accept` prop
2. **File Size**: Ensures file doesn't exceed `maxSize` (in MB)
3. **Error Display**: Shows inline error message if validation fails
4. **Success**: Calls `onFileSelect` only with valid files

### Visual States

**Default State:**
- Dashed border with upload icon
- "Click to upload or drag and drop" text
- File type and size information

**Drag Active State:**
- Primary colored border
- Light background tint
- "Drop your file here" text

**File Selected State:**
- Shows file name and size
- Clear button to remove file
- "Choose Different File" button (single mode)
- "Clear All" button (multiple mode)

**Error State:**
- Red error message below upload area
- Specific error description

**Disabled State:**
- Reduced opacity
- No hover effects
- Upload functionality disabled

### Accessibility

The component includes comprehensive accessibility features:

- Hidden file input with proper `aria-label`
- Keyboard navigation support (Enter/Space to open file dialog)
- Screen reader announcements for errors
- Focus indicators on interactive elements
- Semantic HTML structure

### File Size Formatting

The component automatically formats file sizes in a human-readable format:
- Bytes
- KB (Kilobytes)
- MB (Megabytes)
- GB (Gigabytes)

Example: `2.45 MB`

### Utility Functions

The FileUploader uses utility functions from `lib/utils/fileValidation.ts`:

- `validateFile()` - Validates a file against options
- `formatFileSize()` - Formats bytes to human-readable size
- `getAcceptedTypesLabel()` - Converts accept string to readable label

### Requirements Satisfied

This component satisfies the following requirements from the Design Kit MVP specification:

- **Requirement 14.2**: FileUploader component with drag-and-drop functionality
- **Requirement 14.3**: File type and size validation
- **Requirement 14.4**: Visual feedback and error handling
- **Requirement 6.6**: File validation (type, size)
- **Requirement 10.1**: Error handling with user-friendly messages
- **Requirement 12.1-12.5**: Accessibility compliance

### Best Practices

1. **Always validate files**: The component handles validation, but you should also validate on the server for API tools
2. **Provide clear descriptions**: Help users understand what files are accepted
3. **Set appropriate size limits**: Balance user needs with performance
4. **Handle errors gracefully**: The component shows errors, but you may want to log them
5. **Privacy-first**: Files are only handled client-side unless you explicitly upload them
