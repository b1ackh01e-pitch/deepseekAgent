// Code optimizer — port of claudeSearch (без RAG/SQLite)
// Парсеры лежат в src/parsers/ — легко добавить новый язык
// Позволяет читать outline и отдельные методы вместо целых файлов

import fs from "fs/promises"
import path from "path"
import { getParser, getSupportedExtensions } from "./parsers/index.js"
import { bracketDepth, rawBracketDepth } from "./parsers/utils.js"

// Поддерживается ли файл?
export function getSupportedLang(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return getParser(ext) ? ext : null
}

// Список поддерживаемых расширений (для UI)
export { getSupportedExtensions }

// ─────────────────────────────────────────────
// outline: все функции/методы файла с номерами строк
// ─────────────────────────────────────────────
export async function outline(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const parser = getParser(ext)
  if (!parser) return null

  const content = await fs.readFile(filePath, "utf-8")
  const lines = content.split("\n")
  return parser.outline(lines)
}

// ─────────────────────────────────────────────
// definition: извлечь тело функции/метода
// ─────────────────────────────────────────────
export async function definition(filePath, methodName) {
  const ext = path.extname(filePath).toLowerCase()
  const parser = getParser(ext)
  if (!parser) return null

  const content = await fs.readFile(filePath, "utf-8")
  const lines = content.split("\n")
  const total = lines.length

  // Парсер ищет строку начала
  const startLine = parser.findMethodStart(lines, methodName)
  if (!startLine) return { found: false }

  // Конец блока по балансу {}
  const depthFn = parser.rawBrackets ? rawBracketDepth : bracketDepth
  let depth = 0, endLine = startLine, started = false
  for (let i = startLine - 1; i < total; i++) {
    depth += depthFn(lines[i])
    if (!started && depth > 0) started = true
    if (started && depth <= 0) { endLine = i + 1; break }
  }

  // 3 строки контекста до метода
  const ctxStart = Math.max(1, startLine - 3)
  return {
    found: true,
    startLine,
    endLine,
    contextStart: ctxStart,
    context: lines.slice(ctxStart - 1, startLine - 1).join("\n"),
    body: lines.slice(startLine - 1, endLine).join("\n")
  }
}

// ─────────────────────────────────────────────
// codeContext: N строк вокруг указанной строки
// (не зависит от парсера — работает с любым файлом)
// ─────────────────────────────────────────────
export async function codeContext(filePath, centerLine, radius = 10) {
  const content = await fs.readFile(filePath, "utf-8")
  const lines = content.split("\n")
  const from = Math.max(0, centerLine - radius - 1)
  const to = Math.min(lines.length - 1, centerLine + radius - 1)

  const result = []
  for (let i = from; i <= to; i++) {
    const marker = (i + 1 === centerLine) ? ">>>" : "   "
    result.push(`${marker} ${String(i + 1).padStart(4)}: ${lines[i]}`)
  }

  return { from: from + 1, to: to + 1, content: result.join("\n") }
}
