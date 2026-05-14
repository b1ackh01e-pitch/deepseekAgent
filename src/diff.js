import { c } from "./ui.js"

const CONTEXT = 3

const DEL = s => `\x1b[48;2;120;45;45m\x1b[97m${s}\x1b[0m`
const ADD = s => `\x1b[48;2;38;98;58m\x1b[97m${s}\x1b[0m`
const gutter = n => c.dim(String(n).padStart(5) + " │ ")
const width = () => Math.max(40, (process.stdout.columns || 80) - 8)
const pad = s => s.padEnd(width())
const header = (filePath, label = "") =>
  c.dim(`\n─── ${filePath}${label} `) + c.dim("─".repeat(Math.max(2, 40 - filePath.length - label.length)))

// Diff для edit_file: знаем точно что на что заменяется
export function renderEditDiff(original, filePath, oldStr, newStr) {
  const lines = original.split("\n")
  const pos = original.indexOf(oldStr)
  const startLine = original.slice(0, pos).split("\n").length - 1
  const oldLines = oldStr.split("\n")
  const newLines = newStr.split("\n")

  const ctxStart = Math.max(0, startLine - CONTEXT)
  const afterStart = startLine + oldLines.length
  const afterEnd = Math.min(lines.length - 1, afterStart + CONTEXT - 1)

  const out = [header(filePath)]

  for (let i = ctxStart; i < startLine; i++) {
    out.push(gutter(i + 1) + lines[i])
  }
  for (const line of oldLines) {
    out.push(DEL(` - ${pad(line)}`))
  }
  for (const line of newLines) {
    out.push(ADD(` + ${pad(line)}`))
  }
  for (let i = afterStart; i <= afterEnd; i++) {
    out.push(gutter(i + 1) + (lines[i] ?? ""))
  }

  return out.join("\n") + "\n"
}

// Diff для write_file: сравниваем старый и новый файл целиком
export function renderWriteDiff(original, content, filePath) {
  const newLines = content.split("\n")

  if (!original) {
    const out = [header(filePath, " (новый файл)")]
    const preview = newLines.slice(0, 20)
    for (const line of preview) {
      out.push(ADD(` + ${pad(line)}`))
    }
    if (newLines.length > 20) {
      out.push(c.dim(`        … ещё ${newLines.length - 20} строк`))
    }
    return out.join("\n") + "\n"
  }

  const oldLines = original.split("\n")

  // Находим первую и последнюю отличающуюся строку
  let first = 0
  while (first < Math.min(oldLines.length, newLines.length) && oldLines[first] === newLines[first]) {
    first++
  }

  let lastOld = oldLines.length - 1
  let lastNew = newLines.length - 1
  while (lastOld > first && lastNew > first && oldLines[lastOld] === newLines[lastNew]) {
    lastOld--
    lastNew--
  }

  // Файл не изменился
  if (first > lastOld && first > lastNew) {
    return c.dim(`\n─── ${filePath} (без изменений)\n`)
  }

  const ctxStart = Math.max(0, first - CONTEXT)
  const ctxEnd = Math.min(newLines.length - 1, lastNew + CONTEXT)
  const out = [header(filePath)]

  for (let i = ctxStart; i < first; i++) {
    out.push(gutter(i + 1) + oldLines[i])
  }
  for (let i = first; i <= lastOld; i++) {
    out.push(DEL(` - ${pad(oldLines[i])}`))
  }
  for (let i = first; i <= lastNew; i++) {
    out.push(ADD(` + ${pad(newLines[i])}`))
  }
  for (let i = lastNew + 1; i <= ctxEnd; i++) {
    out.push(gutter(i + 1) + newLines[i])
  }

  return out.join("\n") + "\n"
}
