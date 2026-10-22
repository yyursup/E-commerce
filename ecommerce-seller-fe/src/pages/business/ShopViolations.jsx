import { useState, useEffect } from 'react'
import {
  HiOutlineShieldCheck,
  HiOutlineRefresh,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/useAuthStore'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import shopService from '../../services/shop'

import ShopHealthOverview from './components/violations/ShopHealthOverview'
import ViolationsTable from './components/violations/ViolationsTable'
import ViolationDetailModal from './components/violations/ViolationDetailModal'

// Helper tách và gom tất cả link ảnh từ các nguồn (hỗ trợ nhiều ảnh phân cách bằng dấu phẩy)
export const parseImages = (...sources) => {
  const urls = []
  sources.forEach((src) => {
    if (typeof src === 'string' && src.trim()) {
      src.split(',').forEach((url) => {
        const trimmed = url.trim()
        if (trimmed && !urls.includes(trimmed)) {
          urls.push(trimmed)
        }
      })
    }
  })
  return urls
}

export default function ShopViolations() {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  const { user } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [violations, setViolations] = useState([])
  const [detailViolation, setDetailViolation] = useState(null) // Modal xem chi tiết vi phạm

  // Real-time shop health & violation state from DB
  const [shopHealth, setShopHealth] = useState({
    violationCount: user?.violationCount ?? 0,
    shopStatus: user?.shopStatus || 'ACTIVE',
    disciplineLevel: user?.disciplineLevel || 'NONE',
    bannedUntil: user?.bannedUntil || null,
    suspendedUntil: user?.suspendedUntil || null,
    lastViolationAt: null,
  })

  const violationCount = shopHealth.violationCount
  const shopStatus = shopHealth.shopStatus

  const loadData = async () => {
    try {
      setLoading(true)

      // 1. Fetch live shop health metrics from backend
      try {
        const myShop = await shopService.getMyShop()
        if (myShop) {
          const vCount = myShop.violationCount ?? 0
          const sStatus = myShop.status || 'ACTIVE'
          const dLevel = myShop.disciplineLevel || 'NONE'
          const sUntil = myShop.suspendedUntil || null
          const lastV = myShop.lastViolationAt || null

          setShopHealth({
            violationCount: vCount,
            shopStatus: sStatus,
            disciplineLevel: dLevel,
            suspendedUntil: sUntil,
            lastViolationAt: lastV,
          })

          useAuthStore.getState().updateUser({
            violationCount: vCount,
            shopViolationCount: vCount,
            shopStatus: sStatus,
            disciplineLevel: dLevel,
            suspendedUntil: sUntil,
            shopId: myShop.id || user?.shopId,
          })
        }
      } catch (shopErr) {
        console.warn('Không thể lấy chi tiết điểm uy tín shop:', shopErr)
      }

      // 2. Fetch danh sách vi phạm của Shop
      try {
        const vList = await shopService.getMyViolations()
        setViolations(vList || [])
      } catch (vErr) {
        console.warn('Không thể lấy danh sách vi phạm:', vErr)
        setViolations([])
      }
    } catch (err) {
      console.error('Load data error:', err)
      toast.error('Không thể tải dữ liệu vi phạm.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div
        className={cn(
          'rounded-3xl border p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors',
          isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white'
        )}
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/25">
              <HiOutlineShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className={cn('text-2xl font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
                Điểm Uy Tín Shop
              </h1>
              <p className={cn('text-xs mt-0.5', isDark ? 'text-slate-400' : 'text-stone-500')}>
                Theo dõi điểm uy tín gian hàng, chu kỳ phục hồi điểm và các quyết định xử lý vi phạm của Ban Quản Trị
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className={cn(
              'p-2.5 rounded-2xl border transition-all active:scale-95 disabled:opacity-50',
              isDark
                ? 'border-slate-800 bg-slate-800/80 text-slate-200 hover:bg-slate-800'
                : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
            )}
            title="Tải lại"
          >
            <HiOutlineRefresh className={cn('h-5 w-5', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* 1. Tổng quan Điểm Uy Tín Shop & Banners Kỷ Luật */}
      <ShopHealthOverview
        isDark={isDark}
        shopHealth={shopHealth}
        violationCount={violationCount}
        shopStatus={shopStatus}
      />

      {/* 2. Bảng Danh Sách Hồ Sơ Vi Phạm */}
      <ViolationsTable
        isDark={isDark}
        loading={loading}
        violations={violations}
        onDetail={(v) => setDetailViolation(v)}
        parseImages={parseImages}
      />

      {/* 3. Modal Xem Chi Tiết Báo Cáo Vi Phạm */}
      <ViolationDetailModal
        detailViolation={detailViolation}
        setDetailViolation={setDetailViolation}
        isDark={isDark}
        parseImages={parseImages}
      />
    </div>
  )
}
