/**
 * Web Worker for heavy image processing operations
 * Offloads CPU-intensive tasks from the main thread
 */

// Import image compression library for worker
importScripts('https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js');

/**
 * Process image compression in worker thread
 */
async function compressImage(imageFile, options) {
  try {
    const compressed = await imageCompression(imageFile, options);
    return {
      success: true,
      data: compressed,
      originalSize: imageFile.size,
      compressedSize: compressed.size,
      compressionRatio: (1 - compressed.size / imageFile.size) * 100
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process image resizing in worker thread
 */
async function resizeImage(imageFile, width, height, quality = 0.92) {
  try {
    const options = {
      maxWidthOrHeight: Math.max(width, height),
      useWebWorker: false, // Already in worker
      quality: quality,
      initialQuality: quality
    };
    
    const resized = await imageCompression(imageFile, options);
    return {
      success: true,
      data: resized,
      originalSize: imageFile.size,
      resizedSize: resized.size
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process color analysis in worker thread
 */
function analyzeColors(imageData) {
  try {
    const data = imageData.data;
    const colorMap = new Map();
    const totalPixels = data.length / 4;
    
    // Sample every 4th pixel for performance
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      // Skip transparent pixels
      if (a < 128) continue;
      
      // Quantize colors to reduce noise
      const qr = Math.round(r / 16) * 16;
      const qg = Math.round(g / 16) * 16;
      const qb = Math.round(b / 16) * 16;
      
      const colorKey = `${qr},${qg},${qb}`;
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
    }
    
    // Get dominant colors
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([color, count]) => {
        const [r, g, b] = color.split(',').map(Number);
        return {
          rgb: { r, g, b },
          hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
          count,
          percentage: (count / (totalPixels / 4)) * 100
        };
      });
    
    return {
      success: true,
      data: {
        dominantColors: sortedColors,
        totalColors: colorMap.size,
        sampledPixels: totalPixels / 4
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process batch operations
 */
async function processBatch(operations) {
  const results = [];
  
  for (const operation of operations) {
    try {
      let result;
      
      switch (operation.type) {
        case 'compress':
          result = await compressImage(operation.file, operation.options);
          break;
        case 'resize':
          result = await resizeImage(operation.file, operation.width, operation.height, operation.quality);
          break;
        case 'analyze':
          result = analyzeColors(operation.imageData);
          break;
        default:
          result = { success: false, error: 'Unknown operation type' };
      }
      
      results.push({
        id: operation.id,
        ...result
      });
    } catch (error) {
      results.push({
        id: operation.id,
        success: false,
        error: error.message
      });
    }
  }
  
  return {
    success: true,
    data: results
  };
}

// Message handler
self.onmessage = async function(e) {
  const { type, data, id } = e.data;
  
  try {
    let result;
    
    switch (type) {
      case 'compress':
        result = await compressImage(data.file, data.options);
        break;
      case 'resize':
        result = await resizeImage(data.file, data.width, data.height, data.quality);
        break;
      case 'analyze':
        result = analyzeColors(data.imageData);
        break;
      case 'batch':
        result = await processBatch(data.operations);
        break;
      default:
        result = { success: false, error: 'Unknown message type' };
    }
    
    self.postMessage({
      id,
      type,
      ...result
    });
  } catch (error) {
    self.postMessage({
      id,
      type,
      success: false,
      error: error.message
    });
  }
};

// Handle worker errors
self.onerror = function(error) {
  console.error('Worker error:', error);
  self.postMessage({
    success: false,
    error: error.message
  });
};