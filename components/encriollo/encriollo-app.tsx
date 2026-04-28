"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BookOpen, MessageSquareReply } from "lucide-react"
import { useLocale } from "@/lib/i18n/locale-context"
import { UnderstandForm } from "./understand-form"
import { ReplyForm } from "./reply-form"
import { UnderstandResult } from "./understand-result"
import { ReplyResult } from "./reply-result"
import { HistoryPanel } from "./history-panel"
import { useHistory } from "./history-store"
import type { UnderstandOutput, ReplyOutput, HistoryItem } from "./types"

export function EnCriolloApp() {
  const { t } = useLocale()
  const [tab, setTab] = useState<"entender" | "responder">("entender")
  const [understandResult, setUnderstandResult] = useState<UnderstandOutput | null>(null)
  const [replyResult, setReplyResult] = useState<ReplyOutput | null>(null)
  const { items, add, remove, clear } = useHistory()

  function handleUnderstandResult(result: UnderstandOutput, inputPreview: string) {
    setUnderstandResult(result)
    add({ mode: "entender", inputPreview, result })
  }

  function handleReplyResult(result: ReplyOutput, inputPreview: string) {
    setReplyResult(result)
    add({ mode: "responder", inputPreview, result })
  }

  function handleSelectHistory(item: HistoryItem) {
    if (item.mode === "entender") {
      setTab("entender")
      setUnderstandResult(item.result)
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    } else {
      setTab("responder")
      setReplyResult(item.result)
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
        <div className="p-3 sm:p-4 border-b border-border flex items-center gap-2">
          <TabsList className="grid grid-cols-2 flex-1 h-11 bg-secondary">
            <TabsTrigger value="entender" className="gap-2 data-[state=active]:bg-card">
              <BookOpen className="size-4" aria-hidden />
              {t("tab.understand")}
            </TabsTrigger>
            <TabsTrigger value="responder" className="gap-2 data-[state=active]:bg-card">
              <MessageSquareReply className="size-4" aria-hidden />
              {t("tab.reply")}
            </TabsTrigger>
          </TabsList>
          <HistoryPanel items={items} onSelect={handleSelectHistory} onRemove={remove} onClear={clear} />
        </div>

        <TabsContent value="entender" className="m-0 p-4 sm:p-6 space-y-6">
          <UnderstandForm
            onResult={handleUnderstandResult}
            onReset={() => setUnderstandResult(null)}
            hasResult={!!understandResult}
          />
          {understandResult && <UnderstandResult data={understandResult} />}
        </TabsContent>

        <TabsContent value="responder" className="m-0 p-4 sm:p-6 space-y-6">
          <ReplyForm
            onResult={handleReplyResult}
            onReset={() => setReplyResult(null)}
            hasResult={!!replyResult}
          />
          {replyResult && <ReplyResult data={replyResult} />}
        </TabsContent>
      </Tabs>
    </div>
  )
}
