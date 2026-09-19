import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { HiOutlineX } from 'react-icons/hi'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  const sizeClass = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
    '2xl': 'max-w-4xl',
  }[size] || 'max-w-2xl'

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={cn(
                  'w-full transform rounded-2xl border shadow-2xl transition-all',
                  sizeClass,
                  isDark
                    ? 'border-slate-700 bg-slate-900'
                    : 'border-stone-200 bg-white',
                )}
              >
                <div className="flex items-center justify-between border-b px-6 py-4 dark:border-slate-700">
                  <Dialog.Title
                    className={cn(
                      'text-lg font-semibold',
                      isDark ? 'text-white' : 'text-stone-900',
                    )}
                  >
                    {title}
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className={cn(
                      'rounded-lg p-2 transition',
                      isDark
                        ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700',
                    )}
                  >
                    <HiOutlineX className="h-5 w-5" />
                  </button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto p-6">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

/* Promo/Offer modal content component */
export function PromoModalContent({ image, title, description, code, ctaText, onCta, isClaimed = false, loading = false, disabled = false }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  return (
    <div className="space-y-4">
      {image && (
        <div className="relative overflow-hidden rounded-2xl shadow-md group">
          <img
            src={image}
            alt=""
            className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          {code && (
            <div className="absolute bottom-3 left-3 bg-amber-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-xl text-xs font-black tracking-wider shadow">
              MÃ: {code}
            </div>
          )}
        </div>
      )}
      <div className="space-y-1.5">
        <h3 className={cn('text-xl font-bold tracking-tight', isDark ? 'text-white' : 'text-stone-900')}>
          {title}
        </h3>
        <p className={cn('text-sm leading-relaxed', isDark ? 'text-slate-400' : 'text-stone-600')}>
          {description}
        </p>
      </div>

      {code && (
        <div className={cn(
          'flex items-center justify-between p-3 rounded-xl border border-dashed',
          isDark ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' : 'border-amber-500/50 bg-amber-50 text-amber-800'
        )}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium">Mã Voucher:</span>
            <span className="font-mono font-bold text-sm tracking-wider uppercase px-2 py-0.5 rounded bg-amber-500 text-white shadow-sm">
              {code}
            </span>
          </div>
          <span className="text-[11px] font-medium opacity-80">
            {isClaimed ? '✓ Đã có trong ví' : 'Áp dụng toàn sàn'}
          </span>
        </div>
      )}

      {ctaText && (
        <button
          type="button"
          onClick={onCta}
          disabled={loading || disabled}
          className={cn(
            'w-full rounded-xl py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2',
            isClaimed
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25',
            (loading || disabled) && 'opacity-60 cursor-not-allowed active:scale-100'
          )}
        >
          {loading && (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent" />
          )}
          {ctaText}
        </button>
      )}
    </div>
  )
}
