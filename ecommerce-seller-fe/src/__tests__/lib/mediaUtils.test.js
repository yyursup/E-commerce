import { describe, it, expect } from 'vitest'
import { isVideoUrl, isVideoFile } from '../../lib/mediaUtils'

describe('mediaUtils', () => {
  describe('isVideoUrl', () => {
    it.each(['clip.mp4', 'a/b.WEBM', 'x.ogg', 'x.mov', 'x.m4v', 'x.mkv'])('detects %s as video', (url) => {
      expect(isVideoUrl(`https://cdn.example.com/${url}`)).toBe(true)
    })

    it('ignores the query string when checking the extension', () => {
      expect(isVideoUrl('https://cdn.example.com/clip.mp4?token=abc')).toBe(true)
      expect(isVideoUrl('https://cdn.example.com/photo.png?v=clip.mp4')).toBe(false)
    })

    it('detects video folders in storage paths', () => {
      expect(isVideoUrl('https://storage.example.com/video/123')).toBe(true)
      expect(isVideoUrl('https://firebasestorage.example.com/o/video%2F123')).toBe(true)
    })

    it('rejects images and non-string input', () => {
      expect(isVideoUrl('https://cdn.example.com/photo.jpg')).toBe(false)
      expect(isVideoUrl('')).toBe(false)
      expect(isVideoUrl(null)).toBe(false)
      expect(isVideoUrl(42)).toBe(false)
    })
  })

  describe('isVideoFile', () => {
    it('trusts the MIME type first', () => {
      expect(isVideoFile(new File(['x'], 'noext', { type: 'video/mp4' }))).toBe(true)
    })

    it('falls back to the file extension', () => {
      expect(isVideoFile({ name: 'CLIP.MOV' })).toBe(true)
      expect(isVideoFile({ name: 'photo.png', type: 'image/png' })).toBe(false)
    })

    it('rejects a missing file or a file without name and type', () => {
      expect(isVideoFile(null)).toBe(false)
      expect(isVideoFile({})).toBe(false)
    })
  })
})
