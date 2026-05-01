// Tipos simplificados para el flujo unificado

export interface UnifiedOutput {
  // Compartido
  summary: string | null
  alert: string | null
  glossary: Array<{ term: string; meaning: string }> | null
  error?: string

  // Modo entender
  keyPoints: string[] | null
  actions: string[] | null

  // Modo responder
  reply: string | null
  replyReason: string | null
}

// Historial
export interface HistoryEntry {
  id: string
  mode: string
  inputSnippet: string
  output: UnifiedOutput
  timestamp: number
}

// Legacy types for backwards compatibility with history
export type HistoryItem = HistoryEntry
