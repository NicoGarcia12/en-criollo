"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BookOpen, MessageSquareReply } from "lucide-react"
import { UnderstandForm } from "./understand-form"
import { ReplyForm } from "./reply-form"
import { UnderstandResult } from "./understand-result"
import { ReplyResult } from "./reply-result"
import { ModelProvider } from "./model-context"
import { ModelSettings } from "./model-settings"
import type { UnderstandOutput, ReplyOutput } from "./types"

export function EnCriolloApp() {
  const [tab, setTab] = useState<"entender" | "responder">("entender")
  const [understandResult, setUnderstandResult] = useState<UnderstandOutput | null>(null)
  const [replyResult, setReplyResult] = useState<ReplyOutput | null>(null)

  return (
    <ModelProvider>
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
          <div className="p-3 sm:p-4 border-b border-border flex items-center gap-2">
            <TabsList className="grid grid-cols-2 flex-1 h-11 bg-secondary">
              <TabsTrigger value="entender" className="gap-2 data-[state=active]:bg-card">
                <BookOpen className="size-4" aria-hidden />
                Entender
              </TabsTrigger>
              <TabsTrigger value="responder" className="gap-2 data-[state=active]:bg-card">
                <MessageSquareReply className="size-4" aria-hidden />
                Responder
              </TabsTrigger>
            </TabsList>
            <ModelSettings />
          </div>

          <TabsContent value="entender" className="m-0 p-4 sm:p-6 space-y-6">
            <UnderstandForm
              onResult={setUnderstandResult}
              onReset={() => setUnderstandResult(null)}
              hasResult={!!understandResult}
            />
            {understandResult && <UnderstandResult data={understandResult} />}
          </TabsContent>

          <TabsContent value="responder" className="m-0 p-4 sm:p-6 space-y-6">
            <ReplyForm onResult={setReplyResult} onReset={() => setReplyResult(null)} hasResult={!!replyResult} />
            {replyResult && <ReplyResult data={replyResult} />}
          </TabsContent>
        </Tabs>
      </div>
    </ModelProvider>
  )
}
