export type Locale = "es"

export const LOCALES: Locale[] = ["es"]

export const DICT = {
  es: {
    "app.tagline": "Palabras claras, decisiones mejores.",
    "app.title": "Entendé lo importante.",
    "app.titleAccent": "Respondé mejor.",
    "app.subtitle":
      "Recibís un mensaje, lo entendés de verdad y respondés mejor: dos funcionalidades diferenciadas que trabajan juntas para mejorar tu comunicación.",
    "app.start": "Empezar",
    "app.badge": "Mini herramienta con IA",
    "footer.disclaimer": "EnCriollo no reemplaza asesoramiento legal, médico o financiero.",
    "footer.made": "Hecho por Nicolás García · Referencia conceptual: Zero to Agent.",

    // Unified form
    "uf.text.label": "Tu texto",
    "uf.text.placeholder": "Pegá acá el texto que recibiste…",
    "uf.text.hint": "Cuanto más completo, mejor.",
    "uf.mode.label": "¿Qué querés hacer?",
    "uf.mode.placeholder": "Elegí una opción",
    "uf.mode.understand": "Entenderlo",
    "uf.mode.reply": "Responderlo",
    "uf.sender.label": "¿De quién viene?",
    "uf.sender.other.placeholder": "Especificá quién (ej: vecino, inquilino…)",
    "uf.simplicity.label": "Nivel de detalle",
    "uf.objective.label": "Tu pregunta",
    "uf.objective.placeholder": "¿Qué querés saber específicamente?",
    "uf.tone.label": "Tono",
    "uf.format.label": "Formato",
    "uf.goal.label": "¿Qué querés lograr?",
    "uf.goal.placeholder": "Ej: que me den más tiempo, decir que no…",
    "uf.signature.label": "Tu nombre",
    "uf.signature.placeholder": "Para firmar la respuesta",
    "uf.context.toggle": "Agregar contexto previo",
    "uf.context.placeholder": "¿Qué pasó antes de este mensaje?",
    "uf.submit.understand": "Explicámelo",
    "uf.submit.reply": "Ayudame a responder",
    "uf.submit.loading": "Pensando…",
    "uf.clear": "Limpiar",
    optional: "opcional",

    // Sender options
    "sender.unknown": "No sé / general",
    "sender.bank": "Banco / financiera",
    "sender.lawyer": "Abogado / legal",
    "sender.hr": "RR.HH. / empresa",
    "sender.gov": "Gobierno / impuestos",
    "sender.platform": "Plataforma / app",
    "sender.medical": "Médico / clínica",
    "sender.work": "Trabajo",
    "sender.client": "Cliente",
    "sender.boss": "Jefe",
    "sender.family": "Familia",
    "sender.partner": "Pareja",
    "sender.friend": "Amigo",
    "sender.other": "Otro",

    // Simplicity
    "simplicity.simple": "Simple y directo",
    "simplicity.detailed": "Detallado",
    "simplicity.very_detailed": "Muy detallado",

    // Tone
    "tone.formal": "Formal",
    "tone.friendly": "Amable",
    "tone.firm": "Firme",
    "tone.warm": "Cariñoso",
    "tone.professional": "Profesional",
    "tone.cold": "Frío / distante",

    // Format
    "format.whatsapp": "WhatsApp",
    "format.email": "Email",
    "format.sms": "SMS / texto breve",
    "format.linkedin": "LinkedIn",
    "format.letter": "Carta formal",

    // Results
    "result.summary": "Resumen",
    "result.keypoints": "Lo importante",
    "result.actions": "Qué tenés que hacer",
    "result.reply": "Tu respuesta",
    "result.glossary": "Glosario",
    "result.alert": "Alerta",
    copy: "Copiar",
    copied: "Copiado",

    // History
    "history.title": "Últimos 5 pedidos",
    "history.empty": "Sin análisis guardados.",
    "history.clear": "Borrar",
    "history.restore": "Restaurar",

    // Common
    "common.chars": "caracteres",
    "common.charLimit": "Máximo {n} caracteres",
    "common.copy": "Copiar",
    "common.copied": "Copiado",
    "common.error.generic": "No se pudo copiar",
    "common.error.network": "No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.",
    "common.error.server": "Algo salió mal al procesar tu pedido.",
    "common.error.invalidResponse": "La respuesta del servidor llegó en un formato inválido.",
    "locale.label": "Idioma",
  },
} as const

export type DictKey = keyof (typeof DICT)["es"]

export function t(locale: Locale, key: DictKey, vars?: Record<string, string | number>) {
  const raw = DICT[locale][key] ?? DICT.es[key] ?? key
  if (!vars) return raw
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    raw as string,
  )
}
