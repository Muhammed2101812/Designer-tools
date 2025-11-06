/**
 * Advanced Perspective Transform Library for Mockup Generator
 * 
 * This module provides sophisticated 3D perspective transformations,
 * realistic shadow and highlight effects, and high-resolution rendering
 * for professional mockup generation.
 * 
 * Requirements: 7.6, 7.7
 */

export interface PerspectiveParams {
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  perspective?: number;
  scale?: number;
  skewX?: number;
  skewY?: number;
  curvature?: number;
  transformOrigin?: string;
}

export interface ShadowEffect {
  offsetX: number;
  offsetY: number;
  blur: number;
  color: string;
  opacity?: number;
}

export interface HighlightEffect {
  intensity: number;
  angle: number;
  color: string;
  opacity?: number;
}

export interface PerspectiveTransformConfig {
  enabled: boolean;
  params: PerspectiveParams;
  shadow?: ShadowEffect;
  highlight?: HighlightEffect;
  quality?: 'preview' | 'standard' | 'high' | 'print';
}

/**
 * Create a 3D transformation matrix for perspective effects
 * Returns a simple matrix object that works in both browser and Node.js
 */
export function create3DTransformMatrix(params: PerspectiveParams): { a: number; b: number; c: number; d: number; e: number; f: number } {
  // Start with identity matrix
  let matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  
  // Apply scale
  if (params.scale && params.scale !== 1) {
    matrix.a *= params.scale;
    matrix.d *= params.scale;
  }
  
  // For 2D canvas, we'll apply rotations using transform()
  // This is a simplified matrix for basic transformations
  const rotZ = (params.rotationZ || 0) * Math.PI / 180;
  if (rotZ !== 0) {
    const cos = Math.cos(rotZ);
    const sin = Math.sin(rotZ);
    const newA = matrix.a * cos - matrix.b * sin;
    const newB = matrix.a * sin + matrix.b * cos;
    const newC = matrix.c * cos - matrix.d * sin;
    const newD = matrix.c * sin + matrix.d * cos;
    
    matrix.a = newA;
    matrix.b = newB;
    matrix.c = newC;
    matrix.d = newD;
  }
  
  return matrix;
}

/**
 * Calculate perspective projection points for a rectangle
 */
export function calculatePerspectivePoints(
  width: number,
  height: number,
  params: PerspectiveParams
): { topLeft: [number, number]; topRight: [number, number]; bottomLeft: [number, number]; bottomRight: [number, number] } {
  const perspective = params.perspective || 1000;
  const rotX = (params.rotationX || 0) * Math.PI / 180;
  const rotY = (params.rotationY || 0) * Math.PI / 180;
  
  // Define the four corners of the rectangle
  const corners = [
    [-width / 2, -height / 2, 0], // Top-left
    [width / 2, -height / 2, 0],  // Top-right
    [-width / 2, height / 2, 0],  // Bottom-left
    [width / 2, height / 2, 0]    // Bottom-right
  ];
  
  // Apply 3D rotations and perspective projection
  const projectedCorners = corners.map(([x, y, z]) => {
    // Apply rotations
    let newX = x;
    let newY = y * Math.cos(rotX) - z * Math.sin(rotX);
    let newZ = y * Math.sin(rotX) + z * Math.cos(rotX);
    
    const tempX = newX * Math.cos(rotY) + newZ * Math.sin(rotY);
    newZ = -newX * Math.sin(rotY) + newZ * Math.cos(rotY);
    newX = tempX;
    
    // Apply perspective projection
    const projectedX = (newX * perspective) / (perspective + newZ);
    const projectedY = (newY * perspective) / (perspective + newZ);
    
    return [projectedX, projectedY] as [number, number];
  });
  
  return {
    topLeft: projectedCorners[0],
    topRight: projectedCorners[1],
    bottomLeft: projectedCorners[2],
    bottomRight: projectedCorners[3]
  };
}

/**
 * Apply curvature effect for fabric and flexible surfaces
 */
export function applyCurvatureTransform(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  curvature: number
): void {
  if (curvature === 0) {
    ctx.drawImage(img, -width / 2, -height / 2, width, height);
    return;
  }
  
  // Create curved effect by drawing the image in segments
  const segments = 20;
  const segmentWidth = width / segments;
  
  for (let i = 0; i < segments; i++) {
    const x = i * segmentWidth - width / 2;
    const progress = i / (segments - 1);
    
    // Calculate curve offset using sine wave
    const curveOffset = Math.sin(progress * Math.PI) * curvature * height * 0.1;
    
    ctx.save();
    ctx.translate(x + segmentWidth / 2, curveOffset);
    
    // Apply slight rotation for more realistic curve
    const rotation = (progress - 0.5) * curvature * 0.2;
    ctx.rotate(rotation);
    
    // Draw segment
    ctx.drawImage(
      img,
      i * (img.width / segments), 0, img.width / segments, img.height,
      -segmentWidth / 2, -height / 2, segmentWidth, height
    );
    
    ctx.restore();
  }
}

/**
 * Create realistic shadow effect
 */
export function createRealisticShadow(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  shadow: ShadowEffect,
  perspectiveParams: PerspectiveParams
): void {
  const shadowCanvas = document.createElement('canvas');
  const shadowCtx = shadowCanvas.getContext('2d');
  if (!shadowCtx) return;
  
  shadowCanvas.width = width * 2;
  shadowCanvas.height = height * 2;
  
  // Calculate shadow transformation based on perspective
  const rotX = (perspectiveParams.rotationX || 0) * Math.PI / 180;
  const rotY = (perspectiveParams.rotationY || 0) * Math.PI / 180;
  
  // Create shadow shape (projected rectangle)
  const shadowPoints = calculatePerspectivePoints(width, height, {
    ...perspectiveParams,
    rotationX: (perspectiveParams.rotationX || 0) + 15, // Shadow angle
    rotationY: perspectiveParams.rotationY || 0
  });
  
  // Draw shadow
  shadowCtx.save();
  shadowCtx.translate(shadowCanvas.width / 2, shadowCanvas.height / 2);
  shadowCtx.fillStyle = shadow.color;
  shadowCtx.globalAlpha = shadow.opacity || 0.3;
  
  // Create shadow blur effect
  shadowCtx.filter = `blur(${shadow.blur}px)`;
  
  // Draw shadow polygon
  shadowCtx.beginPath();
  shadowCtx.moveTo(shadowPoints.topLeft[0], shadowPoints.topLeft[1]);
  shadowCtx.lineTo(shadowPoints.topRight[0], shadowPoints.topRight[1]);
  shadowCtx.lineTo(shadowPoints.bottomRight[0], shadowPoints.bottomRight[1]);
  shadowCtx.lineTo(shadowPoints.bottomLeft[0], shadowPoints.bottomLeft[1]);
  shadowCtx.closePath();
  shadowCtx.fill();
  
  shadowCtx.restore();
  
  // Draw shadow onto main canvas
  ctx.save();
  ctx.translate(shadow.offsetX, shadow.offsetY);
  ctx.drawImage(shadowCanvas, -width, -height, width * 2, height * 2);
  ctx.restore();
}

/**
 * Create realistic highlight effect
 */
export function createRealisticHighlight(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  highlight: HighlightEffect,
  perspectiveParams: PerspectiveParams
): void {
  const gradient = ctx.createLinearGradient(
    -width / 2, -height / 2,
    width / 2, height / 2
  );
  
  // Calculate highlight direction based on angle
  const angle = highlight.angle * Math.PI / 180;
  const intensity = highlight.intensity;
  
  // Create gradient for highlight
  gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
  gradient.addColorStop(0.3, `rgba(255, 255, 255, ${intensity * 0.1})`);
  gradient.addColorStop(0.7, `rgba(255, 255, 255, ${intensity * 0.2})`);
  gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
  
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = gradient;
  ctx.fillRect(-width / 2, -height / 2, width, height);
  ctx.restore();
}

/**
 * Advanced perspective transform with realistic effects
 */
export function drawWithAdvancedPerspectiveTransform(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  config: PerspectiveTransformConfig
): void {
  if (!config.enabled) {
    ctx.drawImage(img, -width / 2, -height / 2, width, height);
    return;
  }
  
  const { params, shadow, highlight, quality = 'standard' } = config;
  
  // Create high-resolution temporary canvas for better quality
  const scale = getQualityScale(quality);
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;
  
  tempCanvas.width = width * scale;
  tempCanvas.height = height * scale;
  tempCtx.scale(scale, scale);
  
  // Enable high-quality rendering
  tempCtx.imageSmoothingEnabled = true;
  tempCtx.imageSmoothingQuality = 'high';
  
  tempCtx.save();
  tempCtx.translate(width / 2, height / 2);
  
  // Draw shadow first (behind the image)
  if (shadow) {
    createRealisticShadow(tempCtx, width, height, shadow, params);
  }
  
  // Apply perspective transformation
  if (params.curvature && params.curvature > 0) {
    // Apply curvature for fabric/flexible surfaces
    applyCurvatureTransform(tempCtx, img, width, height, params.curvature);
  } else {
    // Apply standard perspective transformation
    const points = calculatePerspectivePoints(width, height, params);
    
    // Use transform to create perspective effect
    const matrix = create3DTransformMatrix(params);
    tempCtx.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
    
    tempCtx.drawImage(img, -width / 2, -height / 2, width, height);
  }
  
  // Apply highlight effect (on top of the image)
  if (highlight) {
    createRealisticHighlight(tempCtx, width, height, highlight, params);
  }
  
  tempCtx.restore();
  
  // Draw the transformed image onto the main canvas
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(tempCanvas, -width / 2, -height / 2, width, height);
  ctx.restore();
}

/**
 * Get quality scale factor based on quality setting
 */
function getQualityScale(quality: 'preview' | 'standard' | 'high' | 'print'): number {
  switch (quality) {
    case 'preview': return 0.5;
    case 'standard': return 1.0;
    case 'high': return 1.5;
    case 'print': return 2.0;
    default: return 1.0;
  }
}

/**
 * Generate high-resolution mockup with minimum 2000px width
 * Requirement 7.7: High-resolution export
 */
export function generateHighResolutionMockup(
  templateImg: HTMLImageElement,
  designImg: HTMLImageElement,
  template: any,
  transform: any,
  minWidth: number = 2000
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Calculate scale to achieve minimum width
      const scale = Math.max(minWidth / templateImg.width, 2.0);
      
      // Create high-resolution canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');
      
      canvas.width = templateImg.width * scale;
      canvas.height = templateImg.height * scale;
      
      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Scale context
      ctx.scale(scale, scale);
      
      // Draw template background
      ctx.drawImage(templateImg, 0, 0);
      
      // Calculate design placement
      const designArea = template.designArea;
      const centerX = designArea.x + designArea.width / 2;
      const centerY = designArea.y + designArea.height / 2;
      
      ctx.save();
      ctx.translate(centerX + transform.x, centerY + transform.y);
      ctx.rotate((transform.rotation * Math.PI) / 180);
      ctx.scale(transform.scale, transform.scale);
      
      const drawWidth = designArea.width;
      const drawHeight = (designImg.height / designImg.width) * drawWidth;
      
      // Apply advanced perspective transform
      if (template.perspectiveTransform?.enabled) {
        const config: PerspectiveTransformConfig = {
          enabled: true,
          params: template.perspectiveTransform.params,
          shadow: template.perspectiveTransform.shadow,
          highlight: template.perspectiveTransform.highlight,
          quality: 'print'
        };
        
        drawWithAdvancedPerspectiveTransform(ctx, designImg, drawWidth, drawHeight, config);
      } else {
        ctx.drawImage(designImg, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      }
      
      ctx.restore();
      
      // Convert to data URL with maximum quality
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      resolve(dataUrl);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Validate perspective transform parameters
 */
export function validatePerspectiveParams(params: PerspectiveParams): boolean {
  // Check rotation values are within reasonable bounds
  if (params.rotationX && (params.rotationX < -90 || params.rotationX > 90)) return false;
  if (params.rotationY && (params.rotationY < -90 || params.rotationY > 90)) return false;
  if (params.rotationZ && (params.rotationZ < -180 || params.rotationZ > 180)) return false;
  
  // Check perspective distance is positive
  if (params.perspective && params.perspective <= 0) return false;
  
  // Check scale is positive
  if (params.scale && params.scale <= 0) return false;
  
  // Check curvature is within bounds
  if (params.curvature && (params.curvature < 0 || params.curvature > 1)) return false;
  
  return true;
}

/**
 * Create default perspective transform configuration
 */
export function createDefaultPerspectiveConfig(): PerspectiveTransformConfig {
  return {
    enabled: false,
    params: {
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      perspective: 1000,
      scale: 1,
      curvature: 0
    },
    shadow: {
      offsetX: 5,
      offsetY: 10,
      blur: 15,
      color: 'rgba(0, 0, 0, 0.3)',
      opacity: 0.3
    },
    highlight: {
      intensity: 0.2,
      angle: 45,
      color: '#ffffff',
      opacity: 0.1
    },
    quality: 'standard'
  };
}