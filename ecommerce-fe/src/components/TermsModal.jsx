import { useState, useEffect, useMemo } from 'react'
import Modal from './Modal'
import {
  HiOutlineShieldCheck,
  HiOutlineScale,
  HiOutlineTruck,
  HiOutlineCash,
  HiOutlineLockClosed,
  HiOutlineCheckCircle,
  HiOutlineExternalLink,
  HiOutlineCalendar,
  HiOutlineTag,
} from 'react-icons/hi'
import { Link } from 'react-router-dom'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import policyService from '../services/policy'

const TABS = [
  { id: 'general', key: 'TERMS_OF_SERVICE', label: 'Điều Khoản Chung', icon: HiOutlineScale },
  { id: 'escrow', key: 'ESCROW_PAYMENT_PROTECTION', label: 'Ký Quỹ Escrow', icon: HiOutlineShieldCheck },
  { id: 'returns', key: 'RETURN_REFUND_POLICY', label: 'Khiếu Nại & Đổi Trả', icon: HiOutlineTruck },
  { id: 'seller', key: 'SELLER_OPERATING_REGULATIONS', label: 'Quy Chế Người Bán', icon: HiOutlineCash },
  { id: 'privacy', key: 'PRIVACY_POLICY', label: 'Bảo Mật Dữ Liệu', icon: HiOutlineLockClosed },
]

export default function TermsModal({ open, onClose, onAccept }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [activeTab, setActiveTab] = useState('general')
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(false)

  // Fetch dynamic policies when modal opens
  useEffect(() => {
    if (!open) return
    let isMounted = true

    const loadPolicies = async () => {
      try {
        setLoading(true)
        const data = await policyService.getActivePolicies()
        if (isMounted && Array.isArray(data)) {
          setPolicies(data)
        }
      } catch (err) {
        console.warn('Lỗi khi tải chính sách động cho TermsModal:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadPolicies()
    return () => {
      isMounted = false
    }
  }, [open])

  // Get current active policy
  const currentTabObj = TABS.find((t) => t.id === activeTab) || TABS[0]
  const currentPolicy = useMemo(() => {
    return policies.find((p) => p.policyKey === currentTabObj.key) || null
  }, [policies, currentTabObj.key])

  // Simple Markdown renderer
  const renderContent = (content) => {
    if (!content) return null

    return content.split('\n').map((line, idx) => {
      const trimmed = line.trim()
      if (!trimmed) return <div key={idx} className="h-2" />

      if (trimmed.startsWith('# ')) {
        return (
          <h3 key={idx} className="mt-4 mb-2 text-base font-bold text-amber-500">
            {trimmed.replace('# ', '')}
          </h3>
        )
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h4 key={idx} className="mt-3 mb-1 text-sm font-bold text-slate-200">
            {trimmed.replace('## ', '')}
          </h4>
        )
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h5 key={idx} className="mt-2 mb-1 text-xs font-semibold text-amber-400">
            {trimmed.replace('### ', '')}
          </h5>
        )
      }
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote key={idx} className="my-2 border-l-4 border-amber-500 bg-amber-500/10 px-3 py-2 rounded-r-lg text-xs text-amber-300">
            {trimmed.replace('> ', '')}
          </blockquote>
        )
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs leading-relaxed text-slate-300 my-0.5">
            {trimmed.slice(2)}
          </li>
        )
      }
      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <li key={idx} className="ml-4 list-decimal text-xs leading-relaxed text-slate-300 my-0.5">
            {trimmed.replace(/^\d+\.\s/, '')}
          </li>
        )
      }
      return (
        <p key={idx} className="my-1.5 text-xs text-slate-300 leading-relaxed">
          {trimmed}
        </p>
      )
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Điều Khoản Dịch Vụ & Chính Sách Vận Hành Sàn E-commerce"
      size="2xl"
    >
      <div className="flex flex-col h-[70vh]">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-slate-800 px-6 py-3 overflow-x-auto shrink-0 bg-stone-50/50 dark:bg-slate-900/50">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                    : 'text-stone-600 dark:text-slate-400 hover:bg-stone-200/50 dark:hover:bg-slate-800'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-sm text-stone-700 dark:text-slate-300 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-stone-400">Đang tải chính sách cập nhật mới nhất từ hệ thống...</div>
          ) : currentPolicy ? (
            <div className="space-y-4">
              {/* Header Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-white">
                    {currentPolicy.title}
                  </h3>
                  <span className="font-mono text-[10px] text-amber-500 font-bold">{currentPolicy.policyKey}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-stone-400">
                  <span className="rounded bg-stone-100 dark:bg-slate-800 px-2 py-0.5 font-bold">
                    v{currentPolicy.version || '1.0'}
                  </span>
                  {currentPolicy.effectiveDate && (
                    <span className="flex items-center gap-1">
                      <HiOutlineCalendar className="h-3 w-3" />
                      {new Date(currentPolicy.effectiveDate).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
              </div>

              {/* Summary */}
              {currentPolicy.summary && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3.5 text-xs text-amber-700 dark:text-amber-300">
                  <span className="font-bold flex items-center gap-1.5 mb-1">
                    <HiOutlineTag className="h-3.5 w-3.5" /> Tóm tắt điều khoản:
                  </span>
                  {currentPolicy.summary}
                </div>
              )}

              {/* Content Body */}
              <div className="text-xs leading-relaxed">
                {renderContent(currentPolicy.content)}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4">
              <h4 className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                <HiOutlineScale className="h-5 w-5" /> 1. Chấp Thuận Điều Khoản Dịch Vụ
              </h4>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                Chào mừng bạn đến với Sàn Thương Mại Điện Tử Chuyên Ngành Đồ Điện Tử & Thiết Bị Công Nghệ E-commerce. Khi tạo tài khoản hoặc sử dụng dịch vụ trên hệ thống, bạn cam kết rằng đã đọc, hiểu và đồng ý hoàn toàn với toàn bộ quy chế và điều khoản hoạt động của chúng tôi.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-stone-200 dark:border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 bg-stone-50/50 dark:bg-slate-900/50">
          <Link
            to="/policy"
            onClick={onClose}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <HiOutlineExternalLink className="h-4 w-4" />
            Xem toàn bộ trung tâm chính sách nền tảng
          </Link>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 transition"
            >
              Đóng
            </button>
            {onAccept && (
              <button
                type="button"
                onClick={() => {
                  onAccept()
                  onClose()
                }}
                className="flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-1.5"
              >
                <HiOutlineCheckCircle className="h-4 w-4" />
                Tôi đã đọc & đồng ý
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
