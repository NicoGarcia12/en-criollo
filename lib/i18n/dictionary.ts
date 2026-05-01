export type Locale = "es" | "en"

export const LOCALES: Locale[] = ["es", "en"]

export const DICT = {
  es: {
    "app.tagline": "Entendé. Respondé. Sin vueltas.",
    "app.title": "Entendé lo importante.",
    "app.titleAccent": "Respondé mejor.",
    "app.subtitle":
      "Pegá un texto difícil y te decimos qué significa y qué hacer. O pegá un mensaje incómodo y te ayudamos a responder sin quedar mal.",
    "app.start": "Empezar",
    "app.badge": "Mini herramienta con IA",
    "footer.disclaimer": "EnCriollo no reemplaza asesoramiento legal, médico o financiero.",
    "footer.made": "Hecho con cariño y un poco de IA.",

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
    "history.title": "Historial",
    "history.empty": "Sin análisis guardados.",
    "history.clear": "Borrar",

    // Common
    "common.chars": "caracteres",
    "common.charLimit": "Máximo {n} caracteres",
  },
  en: {
    "app.tagline": "Understand. Reply. No fluff.",
    "app.title": "Get what matters.",
    "app.titleAccent": "Reply better.",
    "app.subtitle":
      "Paste a tough text and we'll tell you what it means and what to do. Or paste an awkward message and we'll help you reply without burning bridges.",
    "app.start": "Start",
    "app.badge": "Tiny AI tool",
    "footer.disclaimer": "EnCriollo is not a substitute for legal, medical, or financial advice.",
    "footer.made": "Made with care and a bit of AI.",

    // Unified form
    "uf.text.label": "Your text",
    "uf.text.placeholder": "Paste the text you received…",
    "uf.text.hint": "More complete = better results.",
    "uf.mode.label": "What do you want to do?",
    "uf.mode.placeholder": "Choose an option",
    "uf.mode.understand": "Understand it",
    "uf.mode.reply": "Reply to it",
    "uf.sender.label": "Who is it from?",
    "uf.sender.other.placeholder": "Specify who (e.g. neighbor, landlord…)",
    "uf.simplicity.label": "Detail level",
    "uf.objective.label": "Your question",
    "uf.objective.placeholder": "What do you specifically want to know?",
    "uf.tone.label": "Tone",
    "uf.format.label": "Format",
    "uf.goal.label": "What do you want to achieve?",
    "uf.goal.placeholder": "E.g. get more time, say no politely…",
    "uf.signature.label": "Your name",
    "uf.signature.placeholder": "To sign off the reply",
    "uf.context.toggle": "Add prior context",
    "uf.context.placeholder": "What happened before this message?",
    "uf.submit.understand": "Explain it to me",
    "uf.submit.reply": "Help me reply",
    "uf.submit.loading": "Thinking…",
    "uf.clear": "Clear",
    optional: "optional",

    // Sender options
    "sender.unknown": "Not sure / general",
    "sender.bank": "Bank / financial",
    "sender.lawyer": "Lawyer / legal",
    "sender.hr": "HR / employer",
    "sender.gov": "Government / taxes",
    "sender.platform": "Platform / app",
    "sender.medical": "Doctor / clinic",
    "sender.work": "Work",
    "sender.client": "Client",
    "sender.boss": "Boss",
    "sender.family": "Family",
    "sender.partner": "Partner",
    "sender.friend": "Friend",
    "sender.other": "Other",

    // Simplicity
    "simplicity.simple": "Simple and direct",
    "simplicity.detailed": "Detailed",
    "simplicity.very_detailed": "Very detailed",

    // Tone
    "tone.formal": "Formal",
    "tone.friendly": "Friendly",
    "tone.firm": "Firm",
    "tone.warm": "Warm",
    "tone.professional": "Professional",
    "tone.cold": "Cold / distant",

    // Format
    "format.whatsapp": "WhatsApp",
    "format.email": "Email",
    "format.sms": "SMS / short text",
    "format.linkedin": "LinkedIn",
    "format.letter": "Formal letter",

    // Results
    "result.summary": "Summary",
    "result.keypoints": "Key points",
    "result.actions": "What to do",
    "result.reply": "Your reply",
    "result.glossary": "Glossary",
    "result.alert": "Alert",
    copy: "Copy",
    copied: "Copied",

    // History
    "history.title": "History",
    "history.empty": "No saved analyses.",
    "history.clear": "Clear",

    // Common
    "common.chars": "characters",
    "common.charLimit": "Max {n} characters",
  },
} as const

export type DictKey = keyof (typeof DICT)["es"]

export function t(locale: Locale, key: DictKey, vars?: Record<string, string | number>) {
  const raw = DICT[locale][key] ?? DICT.es[key] ?? key
  if (!vars) return raw
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, String(v)), raw as string)
}
