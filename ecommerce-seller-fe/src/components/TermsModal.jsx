import { useState, useEffect, useMemo } from 'react'
import Modal from './Modal'
import HorizontalScrollContainer from './HorizontalScrollContainer'
import {
  HiOutlineCalendar,
  HiOutlineTag,
  HiOutlineExclamationCircle,
  HiOutlineExternalLink,
  HiOutlineCheckCircle,
} from 'react-icons/hi'
import { Link } from 'react-router-dom'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'
import policyService from '../services/policy'
import { getPolicyMeta } from './policyMetaConstants'

export default function TermsModal({ open, onClose, onAccept }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const [policies, setPolicies] = useState([])
  const [activeKey, setActiveKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Fetch dynamic policies strictly from backend API
  const loadPolicies = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await policyService.getActivePolicies()
      if (Array.isArray(data) && data.length > 0) {
        setPolicies(data)
        setActiveKey((prev) => {
          if (prev && data.some((p) => p.policyKey === prev)) return prev
          // Prioritize seller policy tab first
          const sellerP = data.find(
            (p) => p.policyKey === 'SELLER_OPERATING_POLICY' || p.targetAudience === 'SELLER'
          )
          return sellerP ? sellerP.policyKey : data[0].policyKey
        })
      } else {
        setPolicies([])
        setError('Không tìm thấy dữ liệu quy chế người bán từ máy chủ.')
      }
    } catch (err) {
      console.error('Lỗi khi tải chính sách từ backend:', err)
      setPolicies([])
      setError(err?.response?.data?.message || err?.message || 'Không thể kết nối đến máy chủ để tải quy chế người bán.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadPolicies()
    }
  }, [open])

  // Dynamic Tabs generated 100% from backend policies
  const tabs = useMemo(() => {
    return policies.map((p) => {
      const meta = getPolicyMeta(p.policyKey)
      return {
        key: p.policyKey,
        label: meta.label || p.title,
        icon: meta.icon,
        policy: p,
      }
    })
  }, [policies])

  // Current active policy
  const currentPolicy = useMemo(() => {
    if (!activeKey) return policies[0] || null
    return policies.find((p) => p.policyKey === activeKey) || policies[0] || null
  }, [policies, activeKey])

  // Parse inline formatting: **bold**, `code`
  const formatInlineText = (text) => {
    if (!text) return null
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g)
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-bold text-stone-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        )
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={idx}
            className="rounded bg-stone-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-300 border border-stone-200 dark:border-slate-700"
          >
            {part.slice(1, -1)}
          </code>
        )
      }
      return part
    })
  }

  // Markdown renderer with high Light/Dark theme contrast
  const renderContent = (content) => {
    if (!content) return null

    const lines = content.split('\n')
    const elements = []
    let inCodeBlock = false
    let codeBuffer = []

    lines.forEach((line, idx) => {
      const trimmed = line.trim()

      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre
              key={`code-${idx}`}
              className="my-3 p-3.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-100/90 dark:bg-slate-950 font-mono text-[11px] text-stone-800 dark:text-slate-200 overflow-x-auto whitespace-pre leading-relaxed"
            >
              <code>{codeBuffer.join('\n')}</code>
            </pre>
          )
          codeBuffer = []
          inCodeBlock = false
        } else {
          inCodeBlock = true
        }
        return
      }

      if (inCodeBlock) {
        codeBuffer.push(line)
        return
      }

      if (!trimmed) {
        elements.push(<div key={`gap-${idx}`} className="h-2" />)
        return
      }

      if (trimmed.startsWith('# ')) {
        elements.push(
          <h3 key={`h1-${idx}`} className="mt-4 mb-2 text-base font-extrabold text-amber-700 dark:text-amber-400">
            {trimmed.replace('# ', '')}
          </h3>
        )
        return
      }

      if (trimmed.startsWith('## ')) {
        elements.push(
          <h4 key={`h2-${idx}`} className="mt-3.5 mb-1.5 text-sm font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
            {trimmed.replace('## ', '')}
          </h4>
        )
        return
      }

      if (trimmed.startsWith('### ')) {
        elements.push(
          <h5 key={`h3-${idx}`} className="mt-3 mb-1 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
            {trimmed.replace('### ', '')}
          </h5>
        )
        return
      }

      if (trimmed.startsWith('> ')) {
        elements.push(
          <blockquote
            key={`quote-${idx}`}
            className="my-2.5 border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-500/10 px-3.5 py-2 rounded-r-xl text-xs font-medium text-amber-950 dark:text-amber-200"
          >
            {formatInlineText(trimmed.replace('> ', ''))}
          </blockquote>
        )
        return
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <li key={`li-${idx}`} className="ml-4 list-disc text-xs leading-relaxed text-stone-800 dark:text-slate-200 my-0.5">
            {formatInlineText(trimmed.slice(2))}
          </li>
        )
        return
      }

      if (/^\d+\.\s/.test(trimmed)) {
        elements.push(
          <li key={`num-${idx}`} className="ml-4 list-decimal text-xs leading-relaxed text-stone-800 dark:text-slate-200 my-0.5">
            {formatInlineText(trimmed.replace(/^\d+\.\s/, ''))}
          </li>
        )
        return
      }

      elements.push(
        <p key={`p-${idx}`} className="my-1.5 text-xs text-stone-800 dark:text-slate-200 leading-relaxed">
          {formatInlineText(trimmed)}
        </p>
      )
    })

    if (inCodeBlock && codeBuffer.length > 0) {
      elements.push(
        <pre
          key="code-final"
          className="my-3 p-3.5 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-100/90 dark:bg-slate-950 font-mono text-[11px] text-stone-800 dark:text-slate-200 overflow-x-auto whitespace-pre leading-relaxed"
        >
          <code>{codeBuffer.join('\n')}</code>
        </pre>
      )
    }

    return elements
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Quy Chế Hoạt Động & Điều Khoản Dành Cho Người Bán"
      size="2xl"
    >
      <div className="flex flex-col h-[75vh]">
        {/* Navigation Tabs - Generated Dynamically from Backend Policies */}
        {tabs.length > 0 && (
          <div className="border-b border-stone-200 dark:border-slate-800 shrink-0 bg-stone-100/70 dark:bg-slate-900/80">
            <HorizontalScrollContainer
              isDark={isDark}
              className="gap-1.5 px-4 sm:px-6 py-2.5"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = currentPolicy?.policyKey === tab.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveKey(tab.key)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none shrink-0',
                      isActive
                        ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25 font-bold'
                        : 'text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white hover:bg-stone-200/70 dark:hover:bg-slate-800'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-stone-500 dark:text-slate-400')} />
                    {tab.label}
                  </button>
                )
              })}
            </HorizontalScrollContainer>
          </div>
        )}

        {/* Tab Content Body (Scrollable, High Contrast in Both Modes) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-sm text-stone-800 dark:text-slate-200 space-y-4">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-stone-500 dark:text-slate-400">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-amber-500 border-t-transparent" />
              <p className="text-xs font-medium">Đang tải quy chế Kênh Người Bán từ máy chủ...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <HiOutlineExclamationCircle className="h-6 w-6" />
              </div>
              <h4 className="font-bold text-sm text-stone-900 dark:text-white">Không thể tải quy chế người bán</h4>
              <p className="text-xs text-stone-600 dark:text-slate-400 max-w-md mx-auto">{error}</p>
              <button
                type="button"
                onClick={loadPolicies}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition"
              >
                Tải lại dữ liệu
              </button>
            </div>
          ) : currentPolicy ? (
            <div className="space-y-4">
              {/* Header Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                    {currentPolicy.title}
                  </h3>
                  <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                    {currentPolicy.policyKey}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="rounded bg-stone-100 dark:bg-slate-800 px-2 py-0.5 font-bold text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700">
                    Phiên bản {currentPolicy.version || '2.0'}
                  </span>
                  {currentPolicy.effectiveDate && (
                    <span className="flex items-center gap-1 text-stone-500 dark:text-slate-400">
                      <HiOutlineCalendar className="h-3 w-3" />
                      {new Date(currentPolicy.effectiveDate).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
              </div>

              {/* Summary */}
              {currentPolicy.summary && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3.5 text-xs text-stone-800 dark:text-amber-200">
                  <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                    <HiOutlineTag className="h-3.5 w-3.5" /> Tóm tắt điều khoản gian hàng:
                  </span>
                  {currentPolicy.summary}
                </div>
              )}

              {/* Content Body */}
              <div className="text-xs leading-relaxed space-y-1">
                {renderContent(currentPolicy.content)}
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-stone-500 dark:text-slate-400">
              Không có dữ liệu quy chế nào được kích hoạt trên hệ thống.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-stone-200 dark:border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 bg-stone-100/70 dark:bg-slate-900/80">
          <Link
            to="/seller-policy"
            onClick={onClose}
            className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <HiOutlineExternalLink className="h-4 w-4" />
            Xem toàn bộ trung tâm quy chế Kênh Người Bán
          </Link>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:bg-stone-200/60 dark:hover:bg-slate-800 transition"
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
                Tôi đã đọc & đồng ý quy chế
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
