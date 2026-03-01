import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useThemeStore } from '../../store/useThemeStore'
import { cn } from '../../lib/cn'
import requestService from '../../services/request'
import reportService from '../../services/report'
import AdminRequestOverviewCard from './components/request/AdminRequestOverviewCard'
import AdminRequestActionCard from './components/request/AdminRequestActionCard'
import { buildRequestDetailEntries } from './components/request/requestHelpers'

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
    return buildRequestDetailEntries(requestType, requestDetail)
  }, [requestType, requestDetail])

  const handleApprove = async () => {
    const note = responseText.trim()
    if (requestType !== 'REPORT' && !note) {
      toast.error('Response is required.')
      return
    }
    try {
      setActionLoading(true)
      if (requestType === 'REPORT') {
        await reportService.handleReport(requestId, 'APPROVE', note || null)
      } else {
        await requestService.approveRequest(requestId, note)
      }
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
    const note = responseText.trim()
    if (requestType !== 'REPORT' && !note) {
      toast.error('Response is required.')
      return
    }
    try {
      setActionLoading(true)
      if (requestType === 'REPORT') {
        await reportService.handleReport(requestId, 'REJECT', note || null)
      } else {
        await requestService.rejectRequest(requestId, note)
      }
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
          <AdminRequestOverviewCard detail={detail} isDark={isDark} />
          <AdminRequestActionCard
            detailEntries={detailEntries}
            isDark={isDark}
            responseText={responseText}
            setResponseText={setResponseText}
            requestType={requestType}
            isPending={isPending}
            actionLoading={actionLoading}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </div>
      )}
    </div>
  )
}
