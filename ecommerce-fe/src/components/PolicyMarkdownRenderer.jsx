import { useMemo } from 'react'
import { cn } from '../lib/cn'

export default function PolicyMarkdownRenderer({ content, isDark = false, className = '' }) {
  const elements = useMemo(() => {
    if (!content) return null

    const lines = content.split('\n')
    const rendered = []
    let inTable = false
    let tableRows = []
    let inCodeBlock = false
    let codeBlockLines = []

    const formatInline = (text) => {
      if (!text) return ''
      const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g)
      return parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong
              key={idx}
              className={cn('font-bold', isDark ? 'text-white' : 'text-stone-900')}
            >
              {part.slice(2, -2)}
            </strong>
          )
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code
              key={idx}
              className={cn(
                'rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold',
                isDark
                  ? 'bg-slate-800 text-amber-400 border border-slate-700/60'
                  : 'bg-stone-200/70 text-amber-800 border border-stone-300/60'
              )}
            >
              {part.slice(1, -1)}
            </code>
          )
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <em key={idx} className="italic opacity-90">
              {part.slice(1, -1)}
            </em>
          )
        }
        return part
      })
    }

    const flushTable = (key) => {
      if (tableRows.length > 0) {
        const headerRow = tableRows[0]
        const bodyRows = tableRows.slice(1).filter((row) => {
          return !row.every((cell) => /^[-:\s]+$/.test(cell))
        })

        rendered.push(
          <div
            key={`table-${key}`}
            className={cn(
              'my-5 overflow-x-auto rounded-2xl border shadow-xs',
              isDark ? 'border-slate-800 bg-slate-900/60' : 'border-stone-200 bg-white'
            )}
          >
            <table className="w-full min-w-[500px] text-left text-xs sm:text-sm">
              <thead
                className={cn(
                  'border-b uppercase font-bold text-[11px] tracking-wider',
                  isDark
                    ? 'border-slate-800 bg-slate-950/70 text-slate-300'
                    : 'border-stone-200 bg-stone-50 text-stone-700'
                )}
              >
                <tr>
                  {headerRow.map((col, idx) => (
                    <th key={idx} className="px-4 py-3">
                      {col.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={cn('divide-y', isDark ? 'divide-slate-800' : 'divide-stone-100')}>
                {bodyRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className={cn(
                      'transition-colors',
                      isDark ? 'hover:bg-slate-800/40' : 'hover:bg-amber-50/40'
                    )}
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={cn(
                          'px-4 py-2.5 leading-relaxed',
                          isDark ? 'text-slate-300' : 'text-stone-700'
                        )}
                      >
                        {formatInline(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        tableRows = []
      }
      inTable = false
    }

    const flushCodeBlock = (key) => {
      if (codeBlockLines.length > 0) {
        rendered.push(
          <div
            key={`code-block-${key}`}
            className={cn(
              'my-4 rounded-2xl border overflow-hidden font-mono text-xs shadow-inner',
              isDark ? 'border-slate-800 bg-slate-950 text-amber-300' : 'border-stone-300 bg-stone-900 text-amber-300'
            )}
          >
            <div className="flex items-center justify-between px-4 py-1.5 bg-black/40 border-b border-white/10 text-[10px] text-stone-400">
              <span>Định dạng dữ liệu / Quy chuẩn kỹ thuật</span>
            </div>
            <pre className="p-4 overflow-x-auto leading-relaxed">
              <code>{codeBlockLines.join('\n')}</code>
            </pre>
          </div>
        )
        codeBlockLines = []
      }
      inCodeBlock = false
    }

    lines.forEach((line, index) => {
      const trimmed = line.trim()

      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock(index)
        } else {
          if (inTable) flushTable(index)
          inCodeBlock = true
        }
        return
      }

      if (inCodeBlock) {
        codeBlockLines.push(line)
        return
      }

      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true
        const cols = trimmed
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim())
        tableRows.push(cols)
        return
      } else if (inTable) {
        flushTable(index)
      }

      if (!trimmed) {
        rendered.push(<div key={`empty-${index}`} className="h-2.5" />)
        return
      }

      if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
        rendered.push(
          <hr
            key={`hr-${index}`}
            className={cn('my-6 border-t', isDark ? 'border-slate-800' : 'border-stone-200')}
          />
        )
        return
      }

      if (trimmed.startsWith('# ')) {
        rendered.push(
          <h1
            key={`h1-${index}`}
            className="mt-7 mb-3 text-lg sm:text-2xl font-black text-amber-500 border-b border-amber-500/20 pb-2.5 flex items-center gap-2"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
            {trimmed.replace('# ', '')}
          </h1>
        )
        return
      }

      if (trimmed.startsWith('## ')) {
        rendered.push(
          <h2
            key={`h2-${index}`}
            className={cn(
              'mt-6 mb-2.5 text-base sm:text-xl font-bold flex items-center gap-2',
              isDark ? 'text-slate-100' : 'text-stone-900'
            )}
          >
            <span className="h-1.5 w-1.5 rounded-sm bg-amber-500 shrink-0" />
            {trimmed.replace('## ', '')}
          </h2>
        )
        return
      }

      if (trimmed.startsWith('### ')) {
        rendered.push(
          <h3
            key={`h3-${index}`}
            className="mt-4 mb-2 text-sm sm:text-base font-semibold text-amber-600 dark:text-amber-400"
          >
            {trimmed.replace('### ', '')}
          </h3>
        )
        return
      }

      if (trimmed.startsWith('> ')) {
        rendered.push(
          <blockquote
            key={`quote-${index}`}
            className={cn(
              'my-3.5 border-l-4 border-amber-500 rounded-r-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-xs',
              isDark
                ? 'bg-amber-500/10 text-amber-200 border-amber-500'
                : 'bg-amber-50 text-amber-900 border-amber-500'
            )}
          >
            {formatInline(trimmed.replace('> ', ''))}
          </blockquote>
        )
        return
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        rendered.push(
          <li
            key={`li-${index}`}
            className={cn(
              'ml-5 list-disc text-xs sm:text-sm leading-relaxed my-1',
              isDark ? 'text-slate-300' : 'text-stone-700'
            )}
          >
            {formatInline(trimmed.slice(2))}
          </li>
        )
        return
      }

      if (/^\d+\.\s/.test(trimmed)) {
        const match = trimmed.match(/^\d+\.\s/)
        rendered.push(
          <li
            key={`num-${index}`}
            className={cn(
              'ml-5 list-decimal text-xs sm:text-sm leading-relaxed my-1 font-medium',
              isDark ? 'text-slate-300' : 'text-stone-700'
            )}
          >
            {formatInline(trimmed.slice(match[0].length))}
          </li>
        )
        return
      }

      rendered.push(
        <p
          key={`p-${index}`}
          className={cn(
            'my-2 text-xs sm:text-sm leading-relaxed',
            isDark ? 'text-slate-300' : 'text-stone-700'
          )}
        >
          {formatInline(trimmed)}
        </p>
      )
    })

    if (inTable) flushTable(lines.length)
    if (inCodeBlock) flushCodeBlock(lines.length)

    return rendered
  }, [content, isDark])

  return <div className={cn('space-y-1', className)}>{elements}</div>
}

