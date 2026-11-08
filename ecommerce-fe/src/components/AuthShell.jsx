import { Link } from 'react-router-dom'
import { useThemeStore } from '../store/useThemeStore'
import { cn } from '../lib/cn'

const FACTS = [
  ['THANH TOÁN', 'VNPay hoặc ví E-Commerce'],
  ['KÝ QUỸ', 'Tiền giữ đến khi bạn nhận hàng'],
  ['VẬN CHUYỂN', 'Giao Hàng Nhanh toàn quốc'],
]

// Split layout shared by login, register and password recovery.
export default function AuthShell({ children }) {
  const isDark = useThemeStore((s) => s.theme) === 'dark'
  return (
    <div className={cn('flex min-h-[calc(100vh-9rem)] flex-wrap', isDark ? 'bg-slate-950' : 'bg-white')}>
      <section aria-hidden="true" className="relative hidden flex-[1_1_520px] flex-col justify-between gap-10 overflow-hidden bg-stone-950 p-10 text-white lg:flex">
        <Link to="/" tabIndex={-1} className="font-display text-2xl font-extrabold tracking-[-0.04em] text-white">
          E-Commerce<span className="text-amber-500">.</span>
        </Link>
        <p className="max-w-md font-display text-4xl font-bold leading-[1.08] tracking-[-0.03em]">
          Giỏ hàng, đơn hàng và địa chỉ của bạn ở một chỗ.
        </p>
        <dl className="grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-lg bg-stone-800">
          {FACTS.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1.5 bg-stone-900 p-4">
              <dt className="font-mono text-[11px] text-stone-400">{k}</dt>
              <dd className="text-sm font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <span className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full border-[28px] border-amber-500/90" />
      </section>
      <main className="flex flex-[1_1_480px] items-center justify-center px-4 py-12 sm:px-6">{children}</main>
    </div>
  )
}
