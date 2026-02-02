import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import requestService from '../../services/request'

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString()
}

export default function AdminRequestDetail() {
  const { requestId } = useParams()
  const isDark = useThemeStore((state) => state.theme) === 'dark'

  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [responseText, setResponseText] = useState('')

  const fetchDetail = useCallback(async () => {
    if (!requestId) return
    try {
      setLoading(true)
      const res = await requestService.getRequestDetails(requestId)
      setDetail(res)
    } catch (err) {
      console.error('Request detail error:', err)
      toast.error(err?.message || 'Failed to load request detail.')
    } finally {
      setLoading(false)
    }
  }, [requestId])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  const isPending = detail?.status === 'PENDING'
  const requestType = detail?.type
  const requestDetail = detail?.detail || {}

  const detailEntries = useMemo(() => {
    if (requestType === 'SELLER_REGISTRATION') {
      return [
        ['Shop name', requestDetail.shopName],
        ['Tax code', requestDetail.taxCode],
        ['Address', requestDetail.address],
        ['Phone', requestDetail.shopPhone],
        ['Email', requestDetail.shopEmail],
      ]
    }
    if (requestType === 'REPORT') {
      return [
        ['Target type', requestDetail.targetType],
        ['Target ID', requestDetail.targetId],
        ['Evidence', requestDetail.evidenceUrl],
        ['Moderator note', requestDetail.moderatorNote],
      ]
    }
    return Object.entries(requestDetail || {}).map(([key, value]) => [key, value])
  }, [requestType, requestDetail])

  const handleApprove = async () => {
    if (!responseText.trim()) {
      toast.error('Response is required.')
      return
    }
    try {
      setActionLoading(true)
      await requestService.approveRequest(requestId, responseText.trim())
      toast.success('Request approved.')
      setResponseText('')
      fetchDetail()
    } catch (err) {
      console.error('Approve error:', err)
      toast.error(err?.message || 'Approve failed.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!responseText.trim()) {
      toast.error('Response is required.')
      return
    }
    try {
      setActionLoading(true)
      await requestService.rejectRequest(requestId, responseText.trim())
      toast.success('Request rejected.')
      setResponseText('')
      fetchDetail()
    } catch (err) {
      console.error('Reject error:', err)
      toast.error(err?.message || 'Reject failed.')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link to="/admin/requests" className={cn('text-sm font-semibold', isDark ? 'text-amber-300' : 'text-amber-700')}>
            ← Back to list
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Request detail</h1>
          <p className={cn('text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>{requestId}</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed px-6 py-10 text-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-r-transparent" />
          Loading detail...
        </div>
      )}

      {!loading && detail && (
        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'rounded-2xl border p-6 shadow-sm lg:col-span-2',
              isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
            )}
          >
            <h2 className="text-lg font-semibold">Overview</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Type</p>
                <p className="mt-1 text-sm font-semibold">{detail.type || '-'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Status</p>
                <p className="mt-1 text-sm font-semibold">{detail.status || '-'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Created</p>
                <p className="mt-1 text-sm">{formatDate(detail.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Updated</p>
                <p className="mt-1 text-sm">{formatDate(detail.updatedAt)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Account</p>
                <p className="mt-1 text-sm">{detail.accountId || '-'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Reviewed by</p>
                <p className="mt-1 text-sm">{detail.reviewedBy || '-'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Reviewed at</p>
                <p className="mt-1 text-sm">{formatDate(detail.reviewedAt)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Rejection reason</p>
                <p className="mt-1 text-sm">{detail.rejectionReason || '-'}</p>
              </div>
            </div>

            {detail.coverImageUrl && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Cover</p>
                <div className="mt-2 overflow-hidden rounded-xl border border-stone-200 dark:border-slate-700">
                  <img src={detail.coverImageUrl} alt="cover" className="h-56 w-full object-cover" />
                </div>
              </div>
            )}

            {detail.description && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Description</p>
                <p className="mt-2 text-sm leading-relaxed">{detail.description}</p>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className={cn(
              'rounded-2xl border p-6 shadow-sm',
              isDark ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-white',
            )}
          >
            <h2 className="text-lg font-semibold">Detail</h2>
            <div className="mt-4 space-y-3 text-sm">
              {detailEntries.length === 0 && <p className="text-stone-500 dark:text-slate-400">No detail data.</p>}
              {detailEntries.map(([label, value]) => (
                <div key={label} className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">{label}</p>
                  {label === 'Evidence' && value ? (
                    <a
                      href={value}
                      className={cn('text-sm font-semibold underline', isDark ? 'text-amber-300' : 'text-amber-700')}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open evidence
                    </a>
                  ) : (
                    <p className="text-sm break-all">{value || '-'}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-stone-200 pt-4 text-sm dark:border-slate-700">
              <p className="text-xs uppercase tracking-wide text-stone-500 dark:text-slate-400">Admin action</p>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Enter response / reason"
                rows={3}
                className={cn(
                  'mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none transition',
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-amber-500/60'
                    : 'border-stone-300 bg-white text-stone-800 focus:border-amber-500',
                )}
              />
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={handleApprove}
                  disabled={!isPending || actionLoading}
                  className={cn(
                    'flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition',
                    !isPending || actionLoading
                      ? 'cursor-not-allowed opacity-50'
                      : isDark
                        ? 'bg-emerald-500/80 text-white hover:bg-emerald-500'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700',
                  )}
                >
                  Approve
                </button>
                <button
                  onClick={handleReject}
                  disabled={!isPending || actionLoading}
                  className={cn(
                    'flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition',
                    !isPending || actionLoading
                      ? 'cursor-not-allowed opacity-50'
                      : isDark
                        ? 'bg-red-500/80 text-white hover:bg-red-500'
                        : 'bg-red-600 text-white hover:bg-red-700',
                  )}
                >
                  Reject
                </button>
              </div>
              {!isPending && (
                <p className={cn('mt-2 text-xs', isDark ? 'text-slate-400' : 'text-stone-500')}>
                  This request has already been reviewed.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
