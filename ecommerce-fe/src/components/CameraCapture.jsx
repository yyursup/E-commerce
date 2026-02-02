import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { HiOutlineCamera, HiOutlineX } from 'react-icons/hi'
import { cn } from '../lib/cn'

export default function CameraCapture({ onCapture, onClose, isDark }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState(null)
  const [countdown, setCountdown] = useState(null)

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setIsStreaming(true)
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsStreaming(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `selfie-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        })
        onCapture(file)
        stopCamera()
      }
    }, 'image/jpeg', 0.9)
  }

  const handleCapture = () => {
    if (!isStreaming) return

    // Countdown before capture
    setCountdown(3)
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          capturePhoto()
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'relative w-full max-w-2xl rounded-2xl overflow-hidden',
          isDark ? 'bg-slate-900' : 'bg-white',
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between p-4 border-b',
          isDark ? 'border-slate-700' : 'border-stone-200',
        )}>
          <h3 className={cn(
            'text-lg font-semibold',
            isDark ? 'text-white' : 'text-stone-900',
          )}>
            Chụp ảnh khuôn mặt
          </h3>
          <button
            onClick={handleClose}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-stone-100 text-stone-600',
            )}
          >
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative bg-black aspect-video">
          {error ? (
            <div className="flex items-center justify-center h-full text-white p-8 text-center">
              <p>{error}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Face guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-64 h-80 border-2 border-amber-400 rounded-2xl">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-white text-sm font-medium">
                    Đưa khuôn mặt vào khung
                  </div>
                </div>
              </div>

              {/* Countdown overlay */}
              {countdown && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-8xl font-bold text-white"
                  >
                    {countdown}
                  </motion.div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Instructions */}
        <div className={cn('p-4 space-y-2', isDark ? 'bg-slate-800' : 'bg-stone-50')}>
          <p className={cn('text-sm', isDark ? 'text-slate-300' : 'text-stone-600')}>
            • Đảm bảo ánh sáng đủ
          </p>
          <p className={cn('text-sm', isDark ? 'text-slate-300' : 'text-stone-600')}>
            • Nhìn thẳng vào camera
          </p>
          <p className={cn('text-sm', isDark ? 'text-slate-300' : 'text-stone-600')}>
            • Không đeo kính râm hoặc khẩu trang
          </p>
        </div>

        {/* Controls */}
        <div className={cn('p-4 border-t flex justify-center', isDark ? 'border-slate-700' : 'border-stone-200')}>
          <button
            onClick={handleCapture}
            disabled={!isStreaming || countdown !== null}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition',
              isStreaming && !countdown
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-gray-400 cursor-not-allowed',
            )}
          >
            <HiOutlineCamera className="h-5 w-5" />
            {countdown ? `Chụp trong ${countdown}...` : 'Chụp ảnh'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
