import { Bot, MessageCircle, RefreshCw, Send } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import {
  classifyGeminiError,
  createSalesGeminiClient,
  getGeminiApiKey,
  getGeminiModel,
  runSalesChatTurn,
} from '@/assistant/salesChat'
import type { StatsOrder } from '@/engine/stats'
import { useOrders } from '@/hooks/useOrders'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { OrderDto } from '@/types/api'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  toolsCalled?: string[]
  error?: boolean
}

function toStatsOrders(orders: OrderDto[]): StatsOrder[] {
  return orders.map((o) => ({
    id: o.id,
    createdAt: o.createdAt,
    paymentMethod: o.paymentMethod,
    couponCode: o.couponCode,
    lines: o.lines,
    totals: o.totals,
  }))
}

type SalesChatSheetProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SalesChatSheet({ open, onOpenChange }: SalesChatSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const sheetOpen = isControlled ? open : internalOpen
  const setSheetOpen = isControlled ? onOpenChange! : setInternalOpen

  const { data: orders = [] } = useOrders()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi! Ask me about order counts, revenue, coupons, or best-selling options.',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const apiKey = getGeminiApiKey()
  const missingKey = !apiKey

  const abortInFlight = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
  }, [])

  useEffect(() => {
    if (!sheetOpen) abortInFlight()
  }, [sheetOpen, abortInFlight])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    if (missingKey) {
      setError(
        'Add VITE_GEMINI_API_KEY to .env.local (see .env.example). The shop still works without chat.',
      )
      return
    }

    setError(null)
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmed,
    }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)
    abortInFlight()
    const ac = new AbortController()
    abortRef.current = ac

    const prior = messages
      .filter((m) => !m.error && m.id !== 'welcome')
      .map((m) => ({ role: m.role, text: m.text }))

    try {
      const client = createSalesGeminiClient(apiKey!)
      const statsOrders = toStatsOrders(orders)
      const result = await runSalesChatTurn(
        client,
        statsOrders,
        trimmed,
        prior.slice(-8),
        ac.signal,
      )
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: result.text,
          toolsCalled: result.toolsCalled,
        },
      ])
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      const classified = classifyGeminiError(err)
      setError(classified.message)
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  const retryLast = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUser) void send(lastUser.text)
  }

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-primary/25 bg-primary/5 text-foreground shadow-sm hover:bg-primary/10"
        >
          <MessageCircle data-icon="inline-start" className="text-primary" />
          Sales chat
        </Button>
      </SheetTrigger>
      <SheetContent
        showCloseButton
        className={cn(
          'flex h-full w-full flex-col gap-0 border-l-primary/20 p-0',
          'bg-linear-to-b from-primary/10 via-popover to-popover',
          'shadow-xl shadow-primary/10 sm:max-w-md',
        )}
      >
        <SheetHeader
          className={cn(
            'shrink-0 gap-3 border-b border-border/70 bg-card/40 p-0',
            'px-5 pt-5 pr-14 pb-4',
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <Bot className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 space-y-0.5 text-left">
              <SheetTitle className="text-base leading-tight">
                Sales assistant
              </SheetTitle>
              <SheetDescription className="text-xs leading-snug">
                {getGeminiModel()} · tools over live orders
              </SheetDescription>
            </div>
          </div>
          {missingKey ? (
            <p
              role="status"
              className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed"
            >
              No API key yet. Copy <code className="font-mono">.env.example</code>{' '}
              to <code className="font-mono">.env.local</code> and set{' '}
              <code className="font-mono">VITE_GEMINI_API_KEY</code>. Builder and
              checkout work without chat.
            </p>
          ) : null}
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col bg-muted/20">
          <ScrollArea className="h-full flex-1">
            <div className="px-5 py-5">
              <ul className="flex flex-col gap-4" role="log" aria-live="polite">
                {messages.map((msg) => (
                  <li
                    key={msg.id}
                    className={cn(
                      'flex w-full min-w-0 flex-col gap-1',
                      msg.role === 'user' ? 'items-end' : 'items-start',
                    )}
                  >
                    <span
                      className={cn(
                        'px-1 text-[0.65rem] font-medium tracking-wide uppercase',
                        msg.role === 'user'
                          ? 'text-primary/80'
                          : 'text-muted-foreground',
                      )}
                    >
                      {msg.role === 'user' ? 'You' : 'Assistant'}
                    </span>
                    <div
                      className={cn(
                        'max-w-[min(100%,calc(100%-1rem))] wrap-break-word rounded-2xl px-4 py-3 text-sm leading-relaxed [overflow-wrap:anywhere] shadow-sm',
                        msg.role === 'user'
                          ? 'rounded-br-md bg-primary text-primary-foreground'
                          : msg.error
                            ? 'rounded-bl-md border border-destructive/40 bg-destructive/10'
                            : 'rounded-bl-md border border-border/60 bg-card',
                      )}
                    >
                      {msg.text}
                    </div>
                    {msg.toolsCalled && msg.toolsCalled.length > 0 ? (
                      <div className="flex max-w-full flex-wrap gap-1 px-1">
                        {msg.toolsCalled.map((tool) => (
                          <Badge
                            key={tool}
                            variant="outline"
                            className="font-mono text-[0.6rem]"
                          >
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
                {loading ? (
                  <li className="text-xs text-muted-foreground">Thinking…</li>
                ) : null}
              </ul>
            </div>
          </ScrollArea>
        </div>

        <SheetFooter
          className={cn(
            'mt-0 shrink-0 flex-col items-stretch gap-2',
            'border-t border-border/70 bg-card/50 p-0 px-5 py-4',
          )}
        >
          {error ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs">
              <span className="min-w-0 flex-1 leading-relaxed [overflow-wrap:anywhere]">
                {error}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0 gap-1"
                onClick={retryLast}
              >
                <RefreshCw className="size-3" aria-hidden />
                Retry
              </Button>
            </div>
          ) : null}
          <div className="flex flex-row items-center gap-2.5">
            <Input
              placeholder={
                missingKey ? 'Set Gemini key to chat…' : 'Ask a question…'
              }
              value={input}
              disabled={loading || missingKey}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void send(input)
                }
              }}
              className="h-10 flex-1 rounded-xl border-border/80 bg-background px-3.5 shadow-sm"
            />
            <Button
              type="button"
              size="icon"
              disabled={loading || missingKey || !input.trim()}
              className="size-10 shrink-0 rounded-xl shadow-sm"
              onClick={() => void send(input)}
            >
              <Send aria-hidden />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}