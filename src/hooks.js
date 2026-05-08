import fs from "fs/promises"
import path from "path"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

let _hooks = null

async function loadHooks() {
  if (_hooks) return _hooks
  const hooksPath = path.join(process.cwd(), ".agent", "hooks.json")
  try {
    const raw = await fs.readFile(hooksPath, "utf-8")
    _hooks = JSON.parse(raw)
  } catch {
    _hooks = {}
  }
  return _hooks
}

// Запускает хуки для события, передаёт payload через stdin
// Возвращает false если хук заблокировал выполнение (exit code != 0 для PreToolUse)
export async function runHooks(event, payload = {}) {
  const hooks = await loadHooks()
  const list = hooks[event] ?? []
  if (list.length === 0) return true

  const input = JSON.stringify(payload)

  for (const hook of list) {
    try {
      await execAsync(`echo '${input.replace(/'/g, "'\\''")}' | ${hook.command}`, {
        timeout: 10000,
        shell: true
      })
    } catch (err) {
      // Ненулевой exit code в PreToolUse = заблокировать действие
      if (event === "PreToolUse") {
        return false
      }
    }
  }

  return true
}
