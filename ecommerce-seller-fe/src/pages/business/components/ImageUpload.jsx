import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { HiOutlineX, HiOutlinePhotograph, HiOutlineCloudUpload } from 'react-icons/hi'
import { useThemeStore } from '../../../store/useThemeStore'
import { cn } from '../../../lib/cn'
import productImageService from '../../../services/productImage'
import toast from 'react-hot-toast'

export default function ImageUpload({ onUpload, existingImages = [], onRemove }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  // Initialize with existing images (convert strings to objects)
  const [previewUrls, setPreviewUrls] = useState(() => 
    existingImages.map((img) => 
      typeof img === 'string' 
        ? { url: img, preview: img, uploading: false }
        : img
    )
  )
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFileSelect = async (files) => {
    const fileArray = Array.from(files)
    
    // Validate files
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    
    const validFiles = fileArray.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File ${file.name} không đúng định dạng. Chỉ chấp nhận JPG, PNG, WEBP`)
        return false
      }
      if (file.size > maxSize) {
        toast.error(`File ${file.name} quá lớn. Kích thước tối đa là 5MB`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // Create preview URLs
    const newPreviewUrls = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
    }))
    
    setPreviewUrls([...previewUrls, ...newPreviewUrls])

    // Upload files
    try {
      setUploading(true)
      const uploadPromises = validFiles.map(async (file, index) => {
        try {
          const response = await productImageService.uploadImage(file)
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: 100,
          }))
          return response.imageUrl
        } catch (error) {
          console.error('Error uploading file:', file.name, error)
          toast.error(`Lỗi khi upload ${file.name}`)
          // Remove failed preview
          setPreviewUrls((prev) =>
            prev.filter((p) => p.file?.name !== file.name)
          )
          return null
        }
      })

      const uploadedUrls = (await Promise.all(uploadPromises)).filter(Boolean)
      
      if (uploadedUrls.length > 0) {
        // Remove uploading previews and add uploaded URLs
        setPreviewUrls((prev) => {
          // Keep existing non-uploading items
          const existing = prev.filter((item) => !item.uploading)
          // Add new uploaded URLs
          const newItems = uploadedUrls.map((url) => ({
            url,
            preview: url,
            uploading: false,
          }))
          return [...existing, ...newItems]
        })

        // Call onUpload with new URLs
        onUpload?.(uploadedUrls)
        toast.success(`Đã upload ${uploadedUrls.length} ảnh thành công`)
      }
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Lỗi khi upload ảnh')
    } finally {
      setUploading(false)
      setUploadProgress({})
    }
  }

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const handleRemoveImage = async (index, imageUrl) => {
    // Get the actual URL (could be from item.url, item.preview, or direct string)
    const actualUrl = typeof imageUrl === 'string' 
      ? imageUrl 
      : imageUrl?.url || imageUrl?.preview || imageUrl

    // Remove from preview
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index)
    setPreviewUrls(newPreviewUrls)

    // If it's an uploaded image (has URL and not a blob), delete from server
    if (actualUrl && !actualUrl.startsWith('blob:')) {
      try {
        await productImageService.deleteImage(actualUrl)
        toast.success('Đã xóa ảnh')
      } catch (error) {
        console.error('Error deleting image:', error)
        toast.error('Lỗi khi xóa ảnh')
      }
    }

    // Call onRemove callback
    onRemove?.(actualUrl)
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-lg border-2 border-dashed p-6 transition-colors',
          dragActive
            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10'
            : isDark
              ? 'border-slate-700 bg-slate-800/50'
              : 'border-stone-300 bg-stone-50',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleInputChange}
          className="hidden"
          disabled={uploading}
        />

        <div className="flex flex-col items-center justify-center text-center">
          <HiOutlineCloudUpload
            className={cn(
              'mb-4 h-12 w-12',
              isDark ? 'text-slate-500' : 'text-stone-400',
            )}
          />
          <p
            className={cn(
              'mb-2 text-sm font-medium',
              isDark ? 'text-slate-300' : 'text-stone-700',
            )}
          >
            Kéo thả ảnh vào đây hoặc{' '}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={cn(
                'font-semibold underline transition-colors',
                uploading
                  ? 'cursor-not-allowed opacity-50'
                  : isDark
                    ? 'text-amber-400 hover:text-amber-300'
                    : 'text-amber-600 hover:text-amber-700',
              )}
            >
              chọn file
            </button>
          </p>
          <p
            className={cn(
              'text-xs',
              isDark ? 'text-slate-500' : 'text-stone-500',
            )}
          >
            JPG, PNG, WEBP tối đa 5MB
          </p>
        </div>

        {uploading && (
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-slate-700">
              <motion.div
                className="h-full bg-amber-500"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p
              className={cn(
                'mt-2 text-center text-xs',
                isDark ? 'text-slate-400' : 'text-stone-600',
              )}
            >
              Đang upload...
            </p>
          </div>
        )}
      </div>

      {/* Preview Grid */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {previewUrls.map((item, index) => {
            const imageUrl = typeof item === 'string' 
              ? item 
              : item.url || item.preview || item
            const isUploading = typeof item === 'object' && item.uploading

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative aspect-square overflow-hidden rounded-lg border"
              >
                <img
                  src={imageUrl}
                  alt={`Preview ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleRemoveImage(index, imageUrl)}
                  disabled={isUploading}
                  className={cn(
                    'absolute right-2 top-2 rounded-full p-1.5 transition-all',
                    isUploading
                      ? 'cursor-not-allowed opacity-50'
                      : 'bg-red-500 text-white opacity-0 hover:bg-red-600 group-hover:opacity-100',
                  )}
                >
                  <HiOutlineX className="h-4 w-4" />
                </button>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
