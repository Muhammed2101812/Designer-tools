# Mockup Template Metadata System

This directory contains the complete template metadata system for the Mockup Generator tool, implementing requirements 7.2 and 7.3.

## Overview

The template metadata system provides:
- **Template Loading**: Load individual templates or groups of templates
- **Category Management**: Organize templates by category (device, print, apparel)
- **Metadata Validation**: Ensure template metadata completeness and correctness
- **API Integration**: RESTful API for template access
- **Client/Server Support**: Works in both browser and Node.js environments

## Requirements Implementation

### Requirement 7.2: Template Metadata
✅ **JSON metadata files** with design area coordinates, perspective transform parameters, and category information

### Requirement 7.3: Category Grouping
✅ **Template categorization** by device, print, and apparel with proper grouping functionality

## File Structure

```
lib/mockup/
├── templates.ts              # Core template loading and management
├── templates-client.ts       # Client-side utilities
├── metadata-manager.ts       # Metadata validation and management
├── __tests__/
│   └── templates.test.ts     # Comprehensive test suite
└── README.md                 # This documentation
```

## Core Components

### 1. Template Interface

```typescript
interface MockupTemplate {
  id: string                    // Unique template identifier
  name: string                  // Display name
  category: 'device' | 'print' | 'apparel'  // Template category
  width: number                 // Template canvas width
  height: number                // Template canvas height
  designArea: DesignArea        // Area where user content is placed
  perspectiveTransform: PerspectiveTransform  // 3D transform settings
  description: string           // Template description
  aspectRatio?: number          // Calculated aspect ratio
  tags?: string[]              // Optional tags for search
}
```

### 2. Design Area Definition

```typescript
interface DesignArea {
  x: number        // X coordinate of design area
  y: number        // Y coordinate of design area
  width: number    // Width of design area
  height: number   // Height of design area
}
```

### 3. Perspective Transform

```typescript
interface PerspectiveTransform {
  enabled: boolean
  params: {
    rotationX?: number      // X-axis rotation in degrees
    rotationY?: number      // Y-axis rotation in degrees
    rotationZ?: number      // Z-axis rotation in degrees
    perspective?: number    // Perspective distance
    scale?: number          // Scale factor
    skewX?: number         // X-axis skew
    skewY?: number         // Y-axis skew
    curvature?: number     // Surface curvature
    transformOrigin?: string // Transform origin point
  }
}
```

## Usage Examples

### Loading Templates

```typescript
import { loadTemplate, loadTemplatesByCategory, loadTemplatesGroupedByCategory } from '@/lib/mockup/templates'

// Load individual template
const template = await loadTemplate('iphone-14-pro')

// Load templates by category
const deviceTemplates = await loadTemplatesByCategory('device')

// Load all templates grouped by category
const groupedTemplates = await loadTemplatesGroupedByCategory()
```

### Client-Side Usage

```typescript
import { loadTemplates, loadTemplatesGrouped } from '@/lib/mockup/templates-client'

// Load templates with options
const { templates } = await loadTemplates({
  category: 'device',
  validate: true
})

// Load grouped templates for UI
const groups = await loadTemplatesGrouped()
```

### Template Validation

```typescript
import { validateTemplateMetadata, validateTemplateMetadataComprehensive } from '@/lib/mockup/templates'

// Basic validation
const isValid = validateTemplateMetadata(template)

// Comprehensive validation with detailed results
const result = validateTemplateMetadataComprehensive(template)
console.log(result.errors)    // Array of error messages
console.log(result.warnings)  // Array of warning messages
```

### Creating Template Metadata

```typescript
import { createTemplateMetadata } from '@/lib/mockup/metadata-manager'

const template = createTemplateMetadata({
  id: 'my-template',
  name: 'My Custom Template',
  category: 'device',
  width: 800,
  height: 600,
  designArea: { x: 100, y: 100, width: 600, height: 400 },
  description: 'Custom template description',
  perspectiveTransform: {
    enabled: true,
    params: { rotationX: 5, rotationY: -2 }
  }
})
```

## API Endpoints

### GET /api/mockup/templates

Load templates with flexible filtering:

```bash
# Get all templates
GET /api/mockup/templates

# Get templates by category
GET /api/mockup/templates?category=device

# Get templates grouped by category
GET /api/mockup/templates?grouped=true

# Search templates
GET /api/mockup/templates?search=iphone

# Get template statistics
GET /api/mockup/templates?stats=true
```

### GET /api/mockup/templates/[id]

Load individual template with metadata:

```bash
# Get template by ID
GET /api/mockup/templates/iphone-14-pro

# Get template with validation
GET /api/mockup/templates/iphone-14-pro?validate=true

# Get template with PNG image URL
GET /api/mockup/templates/iphone-14-pro?format=png
```

## Template Categories

### Device Templates (5 templates)
- **iphone-14-pro**: iPhone 14 Pro with Dynamic Island
- **android-phone**: Modern Android smartphone
- **ipad-air**: iPad Air with modern design
- **ipad-pro**: iPad Pro for professional presentations
- **macbook-pro**: MacBook Pro with realistic perspective

### Print Templates (5 templates)
- **business-card**: Professional business card
- **poster-a4**: A4 poster with paper texture
- **poster-a3**: A3 poster for larger formats
- **flyer**: Marketing flyer template
- **banner**: Web banner with perspective

### Apparel & Product Templates (5 templates)
- **t-shirt-front**: T-shirt with fabric texture
- **hoodie-front**: Hoodie with fabric curvature
- **cap**: Baseball cap with curved surface
- **mug**: Coffee mug with realistic perspective
- **tote-bag**: Tote bag for eco-friendly merchandise

## Validation Rules

### Required Fields
- `id`: Non-empty string
- `name`: Non-empty string
- `category`: Must be 'device', 'print', or 'apparel'
- `width`: Positive number
- `height`: Positive number
- `designArea`: Valid design area object
- `perspectiveTransform`: Valid transform object
- `description`: Non-empty string

### Design Area Validation
- Coordinates must be non-negative
- Dimensions must be positive
- Design area must fit within template bounds
- Reasonable aspect ratio (0.1 to 10)
- Appropriate size relative to template (10-80% of template area)

### Perspective Transform Validation
- `enabled` must be boolean
- Rotation values should be within -180 to 180 degrees
- Perspective value should be within 100 to 5000
- Transform parameters should be reasonable

## Error Handling

The system provides comprehensive error handling:

```typescript
// Template loading errors
const template = await loadTemplate('invalid-id')
if (!template) {
  console.log('Template not found')
}

// Validation errors
const result = validateTemplateMetadataComprehensive(template)
if (!result.isValid) {
  console.log('Validation errors:', result.errors)
  console.log('Warnings:', result.warnings)
}
```

## Performance Considerations

- Templates are loaded on-demand to reduce initial bundle size
- Metadata validation is optional and can be skipped for performance
- Client-side caching is recommended for frequently accessed templates
- API responses include appropriate cache headers

## Testing

Comprehensive test suite covers:
- Template loading functionality
- Metadata validation
- Category management
- Error handling
- API integration
- Client-side utilities

Run tests:
```bash
npm test lib/mockup/__tests__/templates.test.ts
```

## Future Enhancements

Potential improvements:
- Template thumbnail generation
- Advanced search with filters
- Template versioning
- Custom template upload
- Template analytics and usage tracking
- Batch template operations
- Template preview generation