import { spawnSync, execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const [, , tool, ...toolArgs] = process.argv

if (!tool || (tool !== "prettier" && tool !== "eslint")) {
  console.error("Usage: node scripts/run-on-tracked.mjs <prettier|eslint> [...args]")
  process.exit(1)
}

const repoRoot = process.cwd()
const tracked = execFileSync("git", ["ls-files", ":(exclude).opencode/**"], {
  cwd: repoRoot,
  encoding: "utf8",
})
  .split("\n")
  .map((entry) => entry.trim())
  .filter(Boolean)
  .filter((entry) => fs.existsSync(path.join(repoRoot, entry)))

const eslintExtensions = new Set([".js", ".mjs", ".cjs", ".jsx", ".ts", ".mts", ".cts", ".tsx"])

const files =
  tool === "eslint" ? tracked.filter((file) => eslintExtensions.has(path.extname(file))) : tracked

if (files.length === 0) {
  console.log(`No tracked files to process for ${tool}.`)
  process.exit(0)
}

const baseArgs = tool === "prettier" ? ["--ignore-unknown"] : ["--no-warn-ignored"]
const result = spawnSync(tool, [...baseArgs, ...toolArgs, ...files], {
  cwd: repoRoot,
  stdio: "inherit",
  shell: process.platform === "win32",
})

if (result.error) {
  console.error(result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
