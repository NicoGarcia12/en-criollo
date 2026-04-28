"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { History, Trash2, BookOpen, MessageSquareReply, Eye } from "lucide-react"
import { useLocale } from "@/lib/i18n/locale-context"
import type { HistoryItem } from "./types"

type Props = {
  items: HistoryItem[]
  onSelect: (item: HistoryItem) => void
  onRemove: (id: string) => void
  onClear: () => void
}

export function HistoryPanel({ items, onSelect, onRemove, onClear }: Props) {
  const { t, locale } = useLocale()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-medium">
          <History className="size-3.5" aria-hidden />
          {t("history.title")}
          {items.length > 0 ? (
            <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {items.length}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-base">
            <History className="size-4" aria-hidden />
            {t("history.title")}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {items.length > 0 ? `${items.length} / 5` : t("history.empty")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-12 px-4">{t("history.empty")}</div>
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="rounded-lg border border-border bg-card p-3 hover:border-primary/40 transition-colors"
              >
                <header className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    {item.mode === "entender" ? (
                      <BookOpen className="size-3.5 text-primary" aria-hidden />
                    ) : (
                      <MessageSquareReply className="size-3.5 text-accent-foreground" aria-hidden />
                    )}
                    <span>{item.mode === "entender" ? t("history.entender") : t("history.responder")}</span>
                  </div>
                  <time className="text-[10px] text-muted-foreground tabular-nums">
                    {new Date(item.createdAt).toLocaleString(locale, {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </header>
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-3">
                  {item.inputPreview}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1"
                    onClick={() => {
                      onSelect(item)
                      setOpen(false)
                    }}
                  >
                    <Eye className="size-3" aria-hidden />
                    {t("history.restore")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(item.id)}
                    aria-label={`${t("history.delete")}: ${item.inputPreview.slice(0, 40)}`}
                  >
                    <Trash2 className="size-3" aria-hidden />
                  </Button>
                </div>
              </article>
            ))
          )}
        </div>

        {items.length > 0 ? (
          <div className="border-t border-border p-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="w-full text-xs text-muted-foreground hover:text-destructive gap-1.5"
            >
              <Trash2 className="size-3.5" aria-hidden />
              {t("history.clear")}
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
