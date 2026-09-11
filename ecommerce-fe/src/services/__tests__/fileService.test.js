import { describe, it, expect, vi, beforeEach } from 'vitest'
import fileService from '../fileService'
import api from '../../lib/axios'

vi.mock('../../lib/axios', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('fileService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uploads file with default folder "licenses"', async () => {
    const mockFile = new File(['dummy-content'], 'test-license.png', { type: 'image/png' })
    const mockResponse = {
      data: {
        fileName: 'uuid_test-license.png',
        url: 'http://localhost:9000/ecommerce/licenses/uuid_test-license.png',
        size: 1024,
        contentType: 'image/png',
      },
    }

    api.post.mockResolvedValueOnce(mockResponse)

    const result = await fileService.uploadFile(mockFile)

    expect(api.post).toHaveBeenCalledTimes(1)
    const [endpoint, formData, config] = api.post.mock.calls[0]
    expect(endpoint).toBe('/files/upload')
    expect(formData).toBeInstanceOf(FormData)
    expect(formData.get('file')).toBe(mockFile)
    expect(config.params).toEqual({ folder: 'licenses' })
    expect(config.headers['Content-Type']).toBe('multipart/form-data')
    expect(result).toEqual(mockResponse.data)
  })

  it('uploads file with custom folder', async () => {
    const mockFile = new File(['avatar-content'], 'avatar.jpg', { type: 'image/jpeg' })
    const mockResponse = {
      data: {
        fileName: 'uuid_avatar.jpg',
        url: 'http://localhost:9000/ecommerce/avatars/uuid_avatar.jpg',
      },
    }

    api.post.mockResolvedValueOnce(mockResponse)

    const result = await fileService.uploadFile(mockFile, 'avatars')

    expect(api.post.mock.calls[0][2].params).toEqual({ folder: 'avatars' })
    expect(result).toEqual(mockResponse.data)
  })

  it('throws response error data when upload fails with response', async () => {
    const mockFile = new File(['error'], 'error.png', { type: 'image/png' })
    const errorResponse = {
      response: {
        data: {
          message: 'File size exceeds 10MB limit',
        },
      },
    }

    api.post.mockRejectedValueOnce(errorResponse)

    await expect(fileService.uploadFile(mockFile)).rejects.toEqual({
      message: 'File size exceeds 10MB limit',
    })
  })
})
