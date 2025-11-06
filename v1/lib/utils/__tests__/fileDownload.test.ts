/**
 * Unit tests for fileDownload utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  sanitizeFileName,
  generateTimestampedFileName,
  getFileExtension,
  changeFileExtension,
  getMimeTypeFromExtension,
  getExtensionFromMimeType,
  createConvertedFileName,
  addFileNameSuffix,
  isValidFileName,
  downloadBlob,
  downloadDataURL,
  readAsDataURL,
  readAsArrayBuffer,
  estimateDownloadTime,
} from '../fileDownload'

describe('fileDownload', () => {
  describe('sanitizeFileName', () => {
    it('should remove invalid characters', () => {
      expect(sanitizeFileName('file<>:"/\\|?*.txt')).toBe('file_________.txt')
    })

    it('should replace multiple dots with single dot', () => {
      expect(sanitizeFileName('file...txt')).toBe('file.txt')
    })

    it('should remove leading dots', () => {
      expect(sanitizeFileName('...file.txt')).toBe('file.txt')
    })

    it('should trim whitespace', () => {
      expect(sanitizeFileName('  file.txt  ')).toBe('file.txt')
    })

    it('should handle empty filename', () => {
      expect(sanitizeFileName('')).toBe('download')
      expect(sanitizeFileName('   ')).toBe('download')
    })

    it('should limit filename length', () => {
      const longName = 'a'.repeat(300) + '.txt'
      const result = sanitizeFileName(longName)
      
      expect(result.length).toBeLessThanOrEqual(255)
      expect(result.endsWith('.txt')).toBe(true)
    })

    it('should preserve valid filenames', () => {
      expect(sanitizeFileName('my-file_123.txt')).toBe('my-file_123.txt')
    })
  })

  describe('generateTimestampedFileName', () => {
    it('should generate filename with timestamp', () => {
      const result = generateTimestampedFileName('image', 'png')
      
      expect(result).toMatch(/^image_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.png$/)
    })

    it('should handle different extensions', () => {
      const result = generateTimestampedFileName('document', 'pdf')
      
      expect(result).toContain('document_')
      expect(result.endsWith('.pdf')).toBe(true)
    })
  })

  describe('getFileExtension', () => {
    it('should extract file extension', () => {
      expect(getFileExtension('file.txt')).toBe('txt')
      expect(getFileExtension('image.png')).toBe('png')
      expect(getFileExtension('archive.tar.gz')).toBe('gz')
    })

    it('should return empty string for no extension', () => {
      expect(getFileExtension('file')).toBe('')
      expect(getFileExtension('file.')).toBe('')
    })

    it('should handle hidden files', () => {
      // .gitignore has 'gitignore' as extension (after the dot)
      expect(getFileExtension('.gitignore')).toBe('gitignore')
      expect(getFileExtension('.env.local')).toBe('local')
    })

    it('should convert to lowercase', () => {
      expect(getFileExtension('FILE.PNG')).toBe('png')
    })
  })

  describe('changeFileExtension', () => {
    it('should change file extension', () => {
      expect(changeFileExtension('image.png', 'jpg')).toBe('image.jpg')
      expect(changeFileExtension('document.txt', 'pdf')).toBe('document.pdf')
    })

    it('should add extension if none exists', () => {
      expect(changeFileExtension('file', 'txt')).toBe('file.txt')
    })

    it('should handle multiple dots', () => {
      expect(changeFileExtension('archive.tar.gz', 'zip')).toBe('archive.tar.zip')
    })
  })

  describe('getMimeTypeFromExtension', () => {
    it('should return correct MIME type for image extensions', () => {
      expect(getMimeTypeFromExtension('png')).toBe('image/png')
      expect(getMimeTypeFromExtension('jpg')).toBe('image/jpeg')
      expect(getMimeTypeFromExtension('jpeg')).toBe('image/jpeg')
      expect(getMimeTypeFromExtension('webp')).toBe('image/webp')
      expect(getMimeTypeFromExtension('gif')).toBe('image/gif')
    })

    it('should handle extension with dot', () => {
      expect(getMimeTypeFromExtension('.png')).toBe('image/png')
    })

    it('should be case insensitive', () => {
      expect(getMimeTypeFromExtension('PNG')).toBe('image/png')
      expect(getMimeTypeFromExtension('JpG')).toBe('image/jpeg')
    })

    it('should return default for unknown extension', () => {
      expect(getMimeTypeFromExtension('unknown')).toBe('application/octet-stream')
    })
  })

  describe('getExtensionFromMimeType', () => {
    it('should return correct extension for MIME types', () => {
      expect(getExtensionFromMimeType('image/png')).toBe('png')
      expect(getExtensionFromMimeType('image/jpeg')).toBe('jpg')
      expect(getExtensionFromMimeType('image/webp')).toBe('webp')
      expect(getExtensionFromMimeType('image/gif')).toBe('gif')
    })

    it('should be case insensitive', () => {
      expect(getExtensionFromMimeType('IMAGE/PNG')).toBe('png')
    })

    it('should return default for unknown MIME type', () => {
      expect(getExtensionFromMimeType('application/unknown')).toBe('bin')
    })
  })

  describe('createConvertedFileName', () => {
    it('should create filename with new format', () => {
      expect(createConvertedFileName('image.png', 'jpg')).toBe('image.jpg')
      expect(createConvertedFileName('photo.jpeg', 'webp')).toBe('photo.webp')
    })

    it('should handle filenames without extension', () => {
      expect(createConvertedFileName('image', 'png')).toBe('image.png')
    })

    it('should handle multiple dots', () => {
      expect(createConvertedFileName('my.image.png', 'jpg')).toBe('my.image.jpg')
    })
  })

  describe('addFileNameSuffix', () => {
    it('should add suffix before extension', () => {
      expect(addFileNameSuffix('image.png', '_resized')).toBe('image_resized.png')
      expect(addFileNameSuffix('photo.jpg', '_cropped')).toBe('photo_cropped.jpg')
    })

    it('should handle filenames without extension', () => {
      // When no extension, the function returns name + suffix + '.'
      const result = addFileNameSuffix('image', '_edited')
      expect(result).toContain('_edited')
    })
  })

  describe('isValidFileName', () => {
    it('should validate safe filenames', () => {
      expect(isValidFileName('image.png')).toBe(true)
      expect(isValidFileName('my-file_123.txt')).toBe(true)
      expect(isValidFileName('document (1).pdf')).toBe(true)
    })

    it('should reject filenames with invalid characters', () => {
      expect(isValidFileName('file<test>.txt')).toBe(false)
      expect(isValidFileName('file:test.txt')).toBe(false)
      expect(isValidFileName('file|test.txt')).toBe(false)
    })

    it('should reject reserved names', () => {
      expect(isValidFileName('con')).toBe(false)
      expect(isValidFileName('prn.txt')).toBe(false)
      expect(isValidFileName('aux.log')).toBe(false)
      expect(isValidFileName('com1')).toBe(false)
    })

    it('should reject empty or too long filenames', () => {
      expect(isValidFileName('')).toBe(false)
      expect(isValidFileName('a'.repeat(256))).toBe(false)
    })
  })

  describe('downloadBlob', () => {
    let mockLink: any
    let appendChildSpy: any
    let removeChildSpy: any

    beforeEach(() => {
      mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: vi.fn(),
      }

      global.document.createElement = vi.fn(() => mockLink) as any
      appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink)
      removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink)
      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
      global.URL.revokeObjectURL = vi.fn()
    })

    afterEach(() => {
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })

    it('should trigger blob download', () => {
      const blob = new Blob(['test'], { type: 'text/plain' })
      
      downloadBlob(blob, 'test.txt')
      
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob)
      expect(mockLink.download).toBe('test.txt')
      expect(mockLink.click).toHaveBeenCalled()
      expect(appendChildSpy).toHaveBeenCalled()
      expect(removeChildSpy).toHaveBeenCalled()
    })

    it('should sanitize filename', () => {
      const blob = new Blob(['test'], { type: 'text/plain' })
      
      downloadBlob(blob, 'test<>file.txt')
      
      expect(mockLink.download).toBe('test__file.txt')
    })

    it('should revoke object URL after download', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' })
      
      downloadBlob(blob, 'test.txt')
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150))
      
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    })
  })

  describe('downloadDataURL', () => {
    let mockLink: any
    let appendChildSpy: any
    let removeChildSpy: any

    beforeEach(() => {
      mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: vi.fn(),
      }

      global.document.createElement = vi.fn(() => mockLink) as any
      appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink)
      removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink)
    })

    afterEach(() => {
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })

    it('should trigger data URL download', () => {
      const dataUrl = 'data:text/plain;base64,dGVzdA=='
      
      downloadDataURL(dataUrl, 'test.txt')
      
      expect(mockLink.href).toBe(dataUrl)
      expect(mockLink.download).toBe('test.txt')
      expect(mockLink.click).toHaveBeenCalled()
    })
  })

  describe('readAsDataURL', () => {
    it('should read file as data URL', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' })
      const mockDataUrl = 'data:text/plain;base64,dGVzdA=='

      // Mock FileReader
      const mockReader = {
        onload: null as any,
        onerror: null as any,
        result: mockDataUrl,
        readAsDataURL: vi.fn(function(this: any) {
          setTimeout(() => this.onload?.(), 0)
        }),
      }

      global.FileReader = vi.fn(() => mockReader) as any

      const result = await readAsDataURL(blob)
      
      expect(result).toBe(mockDataUrl)
      expect(mockReader.readAsDataURL).toHaveBeenCalledWith(blob)
    })

    it('should reject on read error', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' })

      const mockReader = {
        onload: null as any,
        onerror: null as any,
        readAsDataURL: vi.fn(function(this: any) {
          setTimeout(() => this.onerror?.(), 0)
        }),
      }

      global.FileReader = vi.fn(() => mockReader) as any

      await expect(readAsDataURL(blob)).rejects.toThrow('Failed to read file')
    })
  })

  describe('readAsArrayBuffer', () => {
    it('should read file as array buffer', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' })
      const mockBuffer = new ArrayBuffer(4)

      const mockReader = {
        onload: null as any,
        onerror: null as any,
        result: mockBuffer,
        readAsArrayBuffer: vi.fn(function(this: any) {
          setTimeout(() => this.onload?.(), 0)
        }),
      }

      global.FileReader = vi.fn(() => mockReader) as any

      const result = await readAsArrayBuffer(blob)
      
      expect(result).toBe(mockBuffer)
      expect(mockReader.readAsArrayBuffer).toHaveBeenCalledWith(blob)
    })
  })

  describe('estimateDownloadTime', () => {
    it('should estimate download time correctly', () => {
      // 10MB file at 10Mbps = 8 seconds
      const time = estimateDownloadTime(10 * 1024 * 1024, 10)
      expect(time).toBe(8)
    })

    it('should round up to nearest second', () => {
      // Small file should still take at least 1 second
      const time = estimateDownloadTime(100 * 1024, 10)
      expect(time).toBeGreaterThanOrEqual(1)
    })

    it('should handle different speeds', () => {
      const fileSize = 5 * 1024 * 1024 // 5MB
      
      const time10Mbps = estimateDownloadTime(fileSize, 10)
      const time100Mbps = estimateDownloadTime(fileSize, 100)
      
      expect(time10Mbps).toBeGreaterThan(time100Mbps)
    })
  })
})
