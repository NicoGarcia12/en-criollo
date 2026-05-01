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
import { History, Trash2, BookOpen, MessageSquareReply, RotateCcw } from "lucide-react"
import { useLocale } from "@/lib/i18n/locale-context"
import type { HistoryEntry } from "./types"

type Props = {
  items: HistoryEntry[]
  onSelect: (item: HistoryEntry) => void
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
          {items.length > 0 && (
            <span className="bg-primary text-primary-foreground ml-0.5 inline-flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold">
              {items.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-border border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <History className="size-4" aria-hidden />
            {t("history.title")}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {items.length > 0 ? `${items.length} / 5` : t("history.empty")}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-muted-foreground px-4 py-12 text-center text-sm">
              {t("history.empty")}
            </div>
          ) : (
            items.map((item) => (
              <article key={item.id} className="border-border bg-card rounded-lg border p-3">
                <header className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    {item.mode === "understand" ? (
                      <BookOpen className="size-3.5" aria-hidden style={{ color: "var(--neon)" }} />
                    ) : (
                      <MessageSquareReply
                        className="size-3.5"
                        aria-hidden
                        style={{ color: "var(--neon)" }}
                      />
                    )}
                    <span>
                      {item.mode === "understand" ? t("uf.mode.understand") : t("uf.mode.reply")}
                    </span>
                  </div>
                  <time className="text-muted-foreground text-[10px] tabular-nums">
                    {new Date(item.timestamp).toLocaleString(locale, {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </header>
                <p className="text-muted-foreground mb-2 line-clamp-2 text-xs leading-relaxed">
                  {item.inputSnippet}…
                </p>
                <footer className="flex items-center gap-1">
                  {/* Botón restaurar: pre-carga el formulario con los valores de esta entrada */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground h-6 gap-1 px-2 text-xs"
                    onClick={() => {
                      onSelect(item)
                      setOpen(false) // Cerramos el panel al seleccionar
                    }}
                  >
                    <RotateCcw className="size-3" aria-hidden />
                    {t("history.restore")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive h-6 gap-1 px-2 text-xs"
                    onClick={() => onRemove(item.id)}
                  >
                    <Trash2 className="size-3" aria-hidden />
                  </Button>
                </footer>
              </article>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-border border-t p-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-muted-foreground hover:text-destructive w-full gap-1.5 text-xs"
            >
              <Trash2 className="size-3.5" aria-hidden />
              {t("history.clear")}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
