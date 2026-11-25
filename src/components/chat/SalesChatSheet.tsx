import { Bot, MessageCircle, Send } from 'lucide-react'
import { useState } from 'react'

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

const MOCK_MESSAGES = [
  { id: '1', role: 'assistant' as const, text: 'Hi! I can help with sales stats.' },
  { id: '2', role: 'user' as const, text: 'How many orders today?' },
  {
    id: '3',
    role: 'assistant' as const,
    text: 'Placeholder reply — wire Gemini later.',
  },
]

type SalesChatSheetProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function SalesChatSheet({ open, onOpenChange }: SalesChatSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const sheetOpen = isControlled ? open : internalOpen
  const setSheetOpen = isControlled ? onOpenChange! : setInternalOpen

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
                Powered by Gemini (placeholder)
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col bg-muted/20">
          <ScrollArea className="h-full flex-1">
            <div className="px-5 py-5">
              <p className="mb-5 text-center text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
                Today
              </p>
              <ul className="flex flex-col gap-4" role="log" aria-live="polite">
                {MOCK_MESSAGES.map((msg) => (
                  <li
                    key={msg.id}
                    className={cn(
                      'flex flex-col gap-1',
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
                        'max-w-[min(100%,17.5rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                        msg.role === 'user'
                          ? 'rounded-br-md bg-primary text-primary-foreground'
                          : 'rounded-bl-md border border-border/60 bg-card',
                      )}
                    >
                      {msg.text}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="h-2" aria-hidden />
            </div>
          </ScrollArea>
        </div>

        <SheetFooter
          className={cn(
            'mt-0 shrink-0 flex-row items-center gap-2.5',
            'border-t border-border/70 bg-card/50 p-0 px-5 py-4',
          )}
        >
          <Input
            placeholder="Ask a question…"
            disabled
            className="h-10 flex-1 rounded-xl border-border/80 bg-background px-3.5 shadow-sm"
          />
          <Button
            type="button"
            size="icon"
            disabled
            className="size-10 shrink-0 rounded-xl shadow-sm"
          >
            <Send aria-hidden />
            <span className="sr-only">Send</span>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}