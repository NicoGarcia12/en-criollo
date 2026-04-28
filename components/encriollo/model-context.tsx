"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export const DEFAULT_MODEL = "openai/gpt-5-mini"
const STORAGE_KEY = "encriollo:model"

export type ModelPreset = {
  id: string
  label: string
  provider: string
  description: string
  requiresKey?: boolean
}

export const MODEL_PRESETS: ModelPreset[] = [
  {
    id: "openai/gpt-5-mini",
    label: "GPT-5 mini",
    provider: "OpenAI",
    description: "Rápido y económico. Recomendado por defecto.",
  },
  {
    id: "openai/gpt-5",
    label: "GPT-5",
    provider: "OpenAI",
    description: "Más capaz, ideal para textos complejos.",
  },
  {
    id: "anthropic/claude-opus-4.6",
    label: "Claude Opus 4.6",
    provider: "Anthropic",
    description: "Excelente comprensión de contexto largo y matices.",
  },
  {
    id: "anthropic/claude-sonnet-4.5",
    label: "Claude Sonnet 4.5",
    provider: "Anthropic",
    description: "Buen balance entre velocidad y calidad.",
  },
  {
    id: "google/gemini-3-flash",
    label: "Gemini 3 Flash",
    provider: "Google",
    description: "Muy rápido, buena relación costo/desempeño.",
  },
  {
    id: "groq/llama-3.3-70b-versatile",
    label: "Llama 3.3 70B (Groq)",
    provider: "Groq",
    description: "Inferencia ultra rápida. Requiere AI_GATEWAY_API_KEY.",
    requiresKey: true,
  },
  {
    id: "xai/grok-4",
    label: "Grok 4",
    provider: "xAI",
    description: "Modelo de xAI. Requiere AI_GATEWAY_API_KEY.",
    requiresKey: true,
  },
]

type ModelContextValue = {
  model: string
  setModel: (m: string) => void
  isCustom: boolean
  reset: () => void
}

const ModelContext = createContext<ModelContextValue | null>(null)

export function ModelProvider({ children }: { children: ReactNode }) {
  const [model, setModelState] = useState<string>(DEFAULT_MODEL)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved && /^[\w-]+\/[\w.\-:]+$/.test(saved)) {
        setModelState(saved)
      }
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, model)
    } catch {
      // ignore
    }
  }, [model, hydrated])

  function setModel(m: string) {
    const trimmed = m.trim()
    if (trimmed) setModelState(trimmed)
  }

  function reset() {
    setModelState(DEFAULT_MODEL)
  }

  const isCustom = !MODEL_PRESETS.some((p) => p.id === model)

  return <ModelContext.Provider value={{ model, setModel, isCustom, reset }}>{children}</ModelContext.Provider>
}

export function useModel() {
  const ctx = useContext(ModelContext)
  if (!ctx) throw new Error("useModel must be used within ModelProvider")
  return ctx
}
