import tseslint from "typescript-eslint"
import nextConfig from "eslint-config-next"

const config = tseslint.config(
  // Next.js rules (flat config nativo en v15+)
  ...nextConfig,

  // TypeScript strict encima de next
  ...tseslint.configs.recommended,

  {
    rules: {
      // No usar `any` explícito
      "@typescript-eslint/no-explicit-any": "error",
      // Variables declaradas no usadas (salvo prefijo _)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // React 19: no hace falta importar React para JSX
      "react/react-in-jsx-scope": "off",
      // Prefer const siempre
      "prefer-const": "error",
    },
  },

  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "next.config.mjs",
      "postcss.config.mjs",
      "tsconfig.tsbuildinfo",
      // Código generado por shadcn/ui y v0 — no modificar
      "components/ui/**",
      "hooks/**",
    ],
  },
)

export default config
