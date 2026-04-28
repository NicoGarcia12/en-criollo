export type UnderstandOutput = {
  plainExplanation: string
  keyPoints: string[]
  actions: string[]
  warnings: string[]
  suggestedReply: string | null
}

export type ReplyOutput = {
  interpretation: string
  probableIntent: string
  recommendedReply: string
  shortReply: string
  firmReply: string
  whyItWorks: string
}
