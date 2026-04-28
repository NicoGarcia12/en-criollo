export type ProblematicIntent = {
  detected: boolean
  type: "normal" | "manipulacion" | "agresivo" | "estafa"
  explanation: string
  suggestion: string
}

export type GlossaryItem = {
  term: string
  meaning: string
}

export type UnderstandOutput = {
  // Primary block (in user's locale)
  summary: string
  toneAnalysis: string
  keyPoints: string[]
  actions: string[]
  warnings: string[]
  glossary: GlossaryItem[]
  questionsToAsk: string[]
  suggestedReply: string | null

  // Bilingual (filled if input language !== user locale)
  inputLanguage: string
  needsBilingual: boolean
  alternateSummary: string | null
  alternateSuggestedReply: string | null
  alternateLanguageLabel: string | null

  // Problematic intent
  problematicIntent: ProblematicIntent
}

export type ReplyOutput = {
  // Context
  interpretation: string
  probableIntent: string

  // Primary reply (in user's locale)
  reply: string
  draftBullets: string[]
  whyItWorks: string

  // Bilingual (filled if recipient language !== user locale)
  inputLanguage: string
  needsBilingual: boolean
  alternateReply: string | null
  alternateDraftBullets: string[] | null
  alternateLanguageLabel: string | null

  // Problematic intent in received message
  problematicIntent: ProblematicIntent
}

export type HistoryItem =
  | { id: string; mode: "entender"; createdAt: number; inputPreview: string; result: UnderstandOutput }
  | { id: string; mode: "responder"; createdAt: number; inputPreview: string; result: ReplyOutput }
