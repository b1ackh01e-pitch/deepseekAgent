import path from "path"
import { getConfig } from "./config.js"
import { waitForInput } from "./ui.js"
import { c } from "./ui.js"

// Директории, одобренные на запись в текущей сессии
const _approvedDirs = new Set()
// Инструменты (не файловые), одобренные на всю сессию
const _approvedTools = new Set()

const FILE_TOOLS = new Set(["write_file", "edit_file"])

function getFilePath(toolName, args) {
  if (FILE_TOOLS.has(toolName)) return args.path ?? null
  return null
}

function isDirApproved(filePath) {
  const dir = path.resolve(path.dirname(filePath))
  for (const approved of _approvedDirs) {
    if (dir === approved || dir.startsWith(approved + path.sep)) return true
  }
  return false
}

export async function checkPermission(toolName, args) {
  const { alwaysAllow, neverAllow } = getConfig()

  if (neverAllow.includes(toolName)) {
    return { allowed: false, reason: "neverAllow" }
  }

  if (alwaysAllow.includes(toolName)) {
    return { allowed: true }
  }

  if (_approvedTools.has(toolName)) {
    return { allowed: true }
  }

  const filePath = getFilePath(toolName, args)

  if (filePath && isDirApproved(filePath)) {
    return { allowed: true }
  }

  // Показываем запрос с вариантами
  if (filePath) {
    const dir = path.dirname(path.resolve(filePath))
    process.stdout.write(
      c.yellow(`\n[?] ${toolName} → ${filePath}\n`) +
      c.dim(`    [y] один раз  [d] разрешить папку "${dir}"  [N] отклонить: `)
    )
  } else {
    process.stdout.write(
      c.yellow(`\n[?] ${toolName}(${JSON.stringify(args)})\n`) +
      c.dim(`    [y] один раз  [a] всегда разрешать ${toolName}  [N] отклонить: `)
    )
  }

  const answer = (await waitForInput()).trim().toLowerCase()

  if (answer === "d" && filePath) {
    _approvedDirs.add(path.dirname(path.resolve(filePath)))
    return { allowed: true }
  }

  if (answer === "a" && !filePath) {
    _approvedTools.add(toolName)
    return { allowed: true }
  }

  if (answer === "y") {
    return { allowed: true }
  }

  return { allowed: false, reason: "user rejected" }
}
