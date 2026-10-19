import { HiOutlinePaperAirplane } from 'react-icons/hi'
import { cn } from '../../lib/cn'

function formatPrice(value) {
  if (value == null) return ''
  const n = Number(value)
  if (Number.isNaN(n)) return ''
  return new Intl.NumberFormat('vi-VN').format(n) + ' đ'
}

export default function ChatBotTab({
  botMessages,
  botInputValue,
  setBotInputValue,
  botLoading,
  botError,
  handleBotSend,
  setQuickBuyProductId,
  botContainerRef,
  botInputRef,
  isDark,
}) {
  return (
    <>
      <div ref={botContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {botMessages.length === 0 && (
          <p className={cn('py-8 text-center text-sm', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Hãy hỏi Trợ lý AI về sản phẩm, giá, voucher hoặc đơn hàng của bạn.
          </p>
        )}

        {botMessages.map((msg, idx) => (
          <div
            key={msg.id}
            className={cn('flex', msg.type === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                msg.type === 'user'
                  ? 'rounded-tr-xs bg-amber-500 text-white'
                  : isDark
                    ? 'rounded-tl-xs bg-slate-800 text-slate-100 border border-slate-700'
                    : 'rounded-tl-xs bg-stone-100 text-stone-900 border border-stone-200',
              )}
            >
              <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
              {msg.productCards && msg.productCards.length > 0 && (
                <div className="mt-3 space-y-2">
                  {msg.productCards.slice(0, 4).map((card) => (
                    <div key={card.id} className="flex items-stretch gap-1">
                      <a
                        href={card.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'flex min-w-0 flex-1 gap-2 rounded-xl border p-2 text-left transition hover:opacity-90',
                          isDark ? 'border-slate-700 bg-slate-750' : 'border-stone-200 bg-white',
                        )}
                      >
                        {card.thumbnailUrl && (
                          <img
                            src={card.thumbnailUrl}
                            alt=""
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">{card.name}</p>
                          <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                            {formatPrice(card.basePrice)}
                          </p>
                        </div>
                      </a>
                      <button
                        type="button"
                        onClick={() => setQuickBuyProductId(card.id)}
                        className="shrink-0 rounded-xl bg-amber-500 px-2 text-xs font-semibold text-white hover:bg-amber-600"
                      >
                        Mua ngay
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {msg.paymentUrl && (
                <a
                  href={msg.paymentUrl}
                  className="mt-3 block rounded-xl bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Thanh toán VNPay
                </a>
              )}
              {idx === botMessages.length - 1 && msg.choices?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {msg.choices.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      disabled={botLoading}
                      onClick={() => handleBotSend(choice)}
                      className="rounded-full border border-amber-500 px-3 py-1 text-xs text-amber-600 hover:bg-amber-50 disabled:opacity-50 dark:text-amber-400 dark:hover:bg-slate-700"
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {botLoading && botMessages.length > 0 && (
          <p className={cn('text-xs italic', isDark ? 'text-slate-400' : 'text-stone-500')}>
            Trợ lý AI đang trả lời...
          </p>
        )}

        {botError && <p className="text-xs text-rose-500">{botError}</p>}
      </div>

      <div
        className={cn(
          'border-t p-3 shrink-0',
          isDark ? 'border-slate-800 bg-slate-850' : 'border-stone-200 bg-stone-50',
        )}
      >
        <div className="flex gap-2">
          <input
            ref={botInputRef}
            type="text"
            value={botInputValue}
            onChange={(e) => setBotInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleBotSend()}
            placeholder={
              botMessages.length === 0
                ? 'Hỏi AI, ví dụ: tư vấn điện thoại dưới 10 triệu'
                : 'Nhập tin nhắn...'
            }
            disabled={botLoading}
            className={cn(
              'flex-1 rounded-xl border px-3.5 py-2 text-sm outline-none transition focus:ring-2 focus:ring-amber-500/20',
              isDark
                ? 'border-slate-700 bg-slate-800 text-white placeholder:opacity-50'
                : 'border-stone-300 bg-white text-stone-900 placeholder:opacity-50',
            )}
          />
          <button
            type="button"
            onClick={() => handleBotSend()}
            disabled={!botInputValue.trim() || botLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white transition hover:bg-amber-600 disabled:opacity-40"
          >
            <HiOutlinePaperAirplane className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  )
}
