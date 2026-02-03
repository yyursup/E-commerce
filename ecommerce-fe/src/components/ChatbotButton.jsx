import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineChat, HiX, HiOutlinePaperAirplane, HiOutlineSparkles } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'

// Mock messages for demo
const initialMessages = [
  {
    id: 1,
    type: 'bot',
    text: 'Xin chào! 👋 Tôi là Chatbot AI. Tôi có thể giúp bạn tìm sản phẩm, tư vấn và hỗ trợ đặt hàng. Tính năng đang được phát triển, nhưng bạn có thể thử gửi tin nhắn!',
    timestamp: new Date(),
  },
]

export default function ChatbotButton() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState(initialMessages)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      inputRef.current?.focus()
    }
  }, [isOpen, messages])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleSend = async () => {
    if (!inputValue.trim()) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        text: 'Cảm ơn bạn đã liên hệ! Tính năng Chatbot AI đang được phát triển. Chúng tôi sẽ sớm tích hợp AI để trả lời tự động các câu hỏi của bạn. Hiện tại bạn có thể liên hệ qua email hoặc hotline để được hỗ trợ.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, botResponse])
      setIsTyping(false)
    }, 1500)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Chatbot Button - Fixed bottom right */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        onClick={handleToggle}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 hover:shadow-xl',
          isOpen
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-gradient-to-br from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700',
        )}
        aria-label="Mở chatbot AI"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <HiX className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <HiOutlineChat className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification Badge */}
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-[10px] font-bold text-white shadow-lg"
          >
            <HiOutlineSparkles className="h-3 w-3" />
          </motion.div>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'fixed bottom-24 right-6 z-50 flex h-[500px] w-96 flex-col overflow-hidden rounded-2xl border shadow-2xl',
              isDark
                ? 'border-slate-700 bg-slate-900'
                : 'border-stone-200 bg-white',
            )}
          >
            {/* Header */}
            <div
              className={cn(
                'flex items-center justify-between border-b p-4',
                isDark ? 'border-slate-700 bg-slate-800' : 'border-stone-200 bg-gradient-to-r from-amber-50 to-amber-100',
              )}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg">
                    <HiOutlineSparkles className="h-5 w-5" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-slate-800" />
                </div>
                <div>
                  <h3 className={cn('text-sm font-semibold', isDark ? 'text-white' : 'text-stone-900')}>
                    Chatbot AI
                  </h3>
                  <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-600')}>
                    Đang hoạt động
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn('flex', message.type === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-2.5',
                        message.type === 'user'
                          ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'
                          : isDark
                            ? 'bg-slate-800 text-slate-100'
                            : 'bg-stone-100 text-stone-900',
                      )}
                    >
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      <p
                        className={cn(
                          'mt-1 text-[10px] opacity-70',
                          message.type === 'user' ? 'text-white' : isDark ? 'text-slate-400' : 'text-stone-500',
                        )}
                      >
                        {message.timestamp.toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-2.5',
                        isDark ? 'bg-slate-800' : 'bg-stone-100',
                      )}
                    >
                      <div className="flex gap-1">
                        <motion.div
                          className={cn('h-2 w-2 rounded-full', isDark ? 'bg-slate-400' : 'bg-stone-400')}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div
                          className={cn('h-2 w-2 rounded-full', isDark ? 'bg-slate-400' : 'bg-stone-400')}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div
                          className={cn('h-2 w-2 rounded-full', isDark ? 'bg-slate-400' : 'bg-stone-400')}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div
              className={cn(
                'border-t p-4',
                isDark ? 'border-slate-700 bg-slate-800' : 'border-stone-200 bg-stone-50',
              )}
            >
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập tin nhắn..."
                  className={cn(
                    'flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition-all placeholder:opacity-60 focus:ring-2 focus:ring-amber-500/20',
                    isDark
                      ? 'border-slate-600 bg-slate-700 text-white placeholder:text-slate-400'
                      : 'border-stone-300 bg-white text-stone-900 placeholder:text-stone-400',
                  )}
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed',
                    'bg-gradient-to-br from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 hover:shadow-lg',
                  )}
                >
                  <HiOutlinePaperAirplane className="h-5 w-5" />
                </button>
              </div>
              <p className={cn('mt-2 text-xs text-center', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Tính năng đang phát triển • Powered by AI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
