// Tipos simplificados para el flujo unificado

export interface UnifiedOutput {
  // Compartido
  summary: string | null
  alert: string | null
  glossary: Array<{ term: string; meaning: string }> | null
  error?: string
  errorCode?: "rate_limit"

  // Modo entender
  keyPoints: string[] | null
  actions: string[] | null

  // Modo responder
  reply: string | null
  replyReason: string | null
}

// Historial
// Contiene todos los campos del formulario para poder restaurar el estado completo
export interface HistoryEntry {
  id: string
  mode: string
  inputSnippet: string
  output: UnifiedOutput
  timestamp: number
  // Campos del formulario para restauración completa del estado
  text: string
  sender?: string
  simplicity?: string
  objective?: string
  tone?: string
  format?: string
  goal?: string
  signature?: string
  priorContext?: string
}

// Legacy types for backwards compatibility with history
export type HistoryItem = HistoryEntry
