/**
 * Color conversion utilities for the Color Picker tool
 */

/**
 * Converts RGB values to HEX format
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns HEX color string (e.g., "#3B82F6")
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16).padStart(2, '0')
    return hex
  }
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
}

/**
 * Converts RGB values to HSL format
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns HSL object with h (0-360), s (0-100), l (0-100)
 */
export function rgbToHsl(
  r: number,
  g: number,
  b: number
): { h: number; s: number; l: number } {
  // Normalize RGB values to 0-1 range
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  let l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

/**
 * Formats RGB values as a CSS rgb() string
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns RGB string (e.g., "rgb(59, 130, 246)")
 */
export function formatRgb(r: number, g: number, b: number): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
}

/**
 * Formats HSL values as a CSS hsl() string
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns HSL string (e.g., "hsl(217, 91%, 60%)")
 */
export function formatHsl(h: number, s: number, l: number): string {
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`
}

/**
 * Extracts color data from canvas at specific coordinates
 * @param canvas - HTML Canvas element
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns Color object with hex, rgb, hsl, and timestamp, or null if extraction fails
 */
export function extractColorFromCanvas(
  canvas: HTMLCanvasElement,
  x: number,
  y: number
): { hex: string; rgb: { r: number; g: number; b: number }; hsl: { h: number; s: number; l: number }; timestamp: number } | null {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  
  if (!ctx) {
    return null
  }

  // Check if coordinates are within canvas bounds
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
    return null
  }

  try {
    // Extract pixel data at the clicked position
    const imageData = ctx.getImageData(x, y, 1, 1)
    const [r, g, b] = imageData.data

    // Convert to different formats
    const hex = rgbToHex(r, g, b)
    const hsl = rgbToHsl(r, g, b)

    return {
      hex,
      rgb: { r, g, b },
      hsl,
      timestamp: Date.now(),
    }
  } catch (error) {
    console.error('Error extracting color:', error)
    return null
  }
}
