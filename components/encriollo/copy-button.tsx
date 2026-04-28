"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useLocale } from "@/lib/i18n/locale-context"

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const { t } = useLocale()
  const [copied, setCopied] = useState(false)
  const finalLabel = label ?? t("common.copy")

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(t("common.copied"))
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast.error(t("common.error.generic"))
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-1.5 h-8 bg-card"
      aria-label={finalLabel}
    >
      {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      {copied ? t("common.copied") : finalLabel}
    </Button>
  )
}
