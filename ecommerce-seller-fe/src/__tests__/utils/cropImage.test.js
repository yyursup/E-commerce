import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createImage, getCroppedImg } from '../../utils/cropImage'

// jsdom cannot decode images or draw on canvas, so both are faked.
class FakeImage {
  constructor() {
    this.listeners = {}
    this.width = 400
    this.height = 300
  }
  addEventListener(type, fn) {
    this.listeners[type] = fn
  }
  setAttribute(name, value) {
    this[name] = value
  }
  set src(url) {
    this._src = url
    queueMicrotask(() => (url.includes('broken') ? this.listeners.error?.(new Event('error')) : this.listeners.load?.()))
  }
  get src() {
    return this._src
  }
}

const makeCtx = () => ({ translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(), drawImage: vi.fn() })

describe('cropImage', () => {
  let contexts
  let blob

  beforeEach(() => {
    vi.stubGlobal('Image', FakeImage)
    contexts = []
    blob = new Blob(['jpeg'], { type: 'image/jpeg' })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function () {
      const ctx = makeCtx()
      contexts.push({ canvas: this, ctx })
      return ctx
    })
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb(blob))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  describe('createImage', () => {
    it('resolves with the loaded image and requests CORS access', async () => {
      const img = await createImage('https://cdn.example.com/a.jpg')
      expect(img.src).toBe('https://cdn.example.com/a.jpg')
      expect(img.crossOrigin).toBe('anonymous')
    })

    it('rejects when the image fails to load', async () => {
      await expect(createImage('https://cdn.example.com/broken.jpg')).rejects.toBeInstanceOf(Event)
    })
  })

  describe('getCroppedImg', () => {
    const crop = { x: 50, y: 40, width: 200, height: 100 }

    it('returns a JPEG blob of the cropped area', async () => {
      const result = await getCroppedImg('a.jpg', crop)

      expect(result).toBe(blob)
      expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.9)

      const [full, cropped] = contexts
      expect(full.canvas.width).toBe(400)
      expect(full.canvas.height).toBe(300)
      expect(cropped.canvas.width).toBe(200)
      expect(cropped.canvas.height).toBe(100)
      expect(cropped.ctx.drawImage).toHaveBeenCalledWith(full.canvas, 50, 40, 200, 100, 0, 0, 200, 100)
    })

    it('does not rotate or flip by default', async () => {
      await getCroppedImg('a.jpg', crop)
      const { ctx } = contexts[0]
      expect(ctx.rotate).toHaveBeenCalledWith(0)
      expect(ctx.scale).toHaveBeenCalledWith(1, 1)
    })

    it('applies rotation in radians and flips around the image centre', async () => {
      await getCroppedImg('a.jpg', crop, 90, { horizontal: true, vertical: true })
      const { ctx } = contexts[0]
      expect(ctx.translate).toHaveBeenNthCalledWith(1, 200, 150)
      expect(ctx.rotate).toHaveBeenCalledWith(Math.PI / 2)
      expect(ctx.scale).toHaveBeenCalledWith(-1, -1)
      expect(ctx.translate).toHaveBeenNthCalledWith(2, -200, -150)
    })

    it('returns null when the browser has no 2D canvas', async () => {
      HTMLCanvasElement.prototype.getContext.mockReturnValue(null)
      await expect(getCroppedImg('a.jpg', crop)).resolves.toBeNull()
    })
  })
})
