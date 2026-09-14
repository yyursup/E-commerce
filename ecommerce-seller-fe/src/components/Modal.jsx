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
  }[size]

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
export function PromoModalContent({ image, title, description, ctaText, onCta }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'

  return (
    <div className="space-y-4">
      {image && (
        <div className="overflow-hidden rounded-xl">
          <img
            src={image}
            alt=""
            className="h-48 w-full object-cover"
          />
        </div>
      )}
      <h3 className={cn('text-xl font-bold', isDark ? 'text-white' : 'text-stone-900')}>
        {title}
      </h3>
      <p className={cn('text-sm', isDark ? 'text-slate-400' : 'text-stone-600')}>
        {description}
      </p>
      {ctaText && (
        <button
          type="button"
          onClick={onCta}
          className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
        >
          {ctaText}
        </button>
      )}
    </div>
  )
}
