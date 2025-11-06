import { validateFile, formatFileSize, getAcceptedTypesLabel } from '../fileValidation'

describe('fileValidation', () => {
  describe('validateFile', () => {
    it('should validate file type correctly', () => {
      const pngFile = new File(['content'], 'test.png', { type: 'image/png' })
      const result = validateFile(pngFile, { accept: 'image/png,image/jpeg' })
      
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject invalid file type', () => {
      const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const result = validateFile(pdfFile, { accept: 'image/png,image/jpeg' })
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid file type')
    })

    it('should validate file size correctly', () => {
      // Create a 5MB file
      const largeContent = new Array(5 * 1024 * 1024).fill('a').join('')
      const file = new File([largeContent], 'large.png', { type: 'image/png' })
      
      const result = validateFile(file, { maxSize: 10 })
      
      expect(result.valid).toBe(true)
    })

    it('should reject file exceeding max size', () => {
      // Create a 15MB file
      const largeContent = new Array(15 * 1024 * 1024).fill('a').join('')
      const file = new File([largeContent], 'large.png', { type: 'image/png' })
      
      const result = validateFile(file, { maxSize: 10 })
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('exceeds')
    })

    it('should handle wildcard MIME types', () => {
      const jpgFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      const result = validateFile(jpgFile, { accept: 'image/*' })
      
      expect(result.valid).toBe(true)
    })

    it('should validate file extensions', () => {
      const pngFile = new File(['content'], 'test.png', { type: 'image/png' })
      const result = validateFile(pngFile, { accept: '.png,.jpg' })
      
      expect(result.valid).toBe(true)
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(500)).toBe('500.00 Bytes')
    })

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.00 KB')
      expect(formatFileSize(1536)).toBe('1.50 KB')
    })

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB')
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe('2.50 MB')
    })

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB')
    })
  })

  describe('getAcceptedTypesLabel', () => {
    it('should return "All files" for undefined accept', () => {
      expect(getAcceptedTypesLabel()).toBe('All files')
    })

    it('should format MIME types correctly', () => {
      expect(getAcceptedTypesLabel('image/png,image/jpeg')).toBe('PNG, JPEG')
    })

    it('should format extensions correctly', () => {
      expect(getAcceptedTypesLabel('.png,.jpg,.webp')).toBe('PNG, JPG, WEBP')
    })

    it('should handle wildcard MIME types', () => {
      expect(getAcceptedTypesLabel('image/*')).toBe('IMAGE')
    })

    it('should handle mixed types', () => {
      expect(getAcceptedTypesLabel('image/png,.pdf')).toBe('PNG, PDF')
    })
  })
})
