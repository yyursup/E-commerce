import React from 'react'
import { HiOutlineExclamationCircle, HiOutlineRefresh, HiOutlineArrowLeft } from 'react-icons/hi'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    } else {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-3xl border border-rose-500/20 bg-rose-500/5 p-8 text-center space-y-4 shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 ring-8 ring-rose-500/5">
              <HiOutlineExclamationCircle className="h-8 w-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                Đã xảy ra lỗi hiển thị
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 leading-relaxed">
                {this.state.error?.message || 'Không thể hiển thị nội dung phần này. Vui lòng thử tải lại hoặc liên hệ hỗ trợ kỹ thuật.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-stone-700 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-slate-700 transition-all shadow-sm"
              >
                <HiOutlineArrowLeft className="h-4 w-4" />
                <span>Quay lại</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 transition-all"
              >
                <HiOutlineRefresh className="h-4 w-4" />
                <span>Tải lại</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
