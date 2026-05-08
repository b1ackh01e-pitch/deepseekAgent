import { exec } from "child_process"
import { promisify } from "util"
import { getConfig } from "../config.js"

const execAsync = promisify(exec)

// Sandbox: ограничиваем команды — запрещаем сеть и запись вне cwd
const SANDBOX_BLOCKED = [
  /\bcurl\b/, /\bwget\b/, /\bfetch\b/,           // сетевые утилиты
  /\brm\s+-rf\s+\//, /\bdd\b.*of=\/dev/,          // деструктивные операции
  /\bchmod\s+777/, /\bsudo\b/, /\bsu\b/           // привилегии
]

function sandboxCheck(command) {
  for (const pattern of SANDBOX_BLOCKED) {
    if (pattern.test(command)) {
      return `Sandbox: command blocked by pattern ${pattern}. Set dangerouslyDisableSandbox:true in .agent/settings.json to allow.`
    }
  }
  return null
}

export const bashTool = {
  name: "bash",
  description: "Run a bash/shell command and return stdout and stderr.",
  parameters: {
    type: "object",
    properties: {
      command: { type: "string", description: "The shell command to execute" },
      timeout: { type: "number", description: "Timeout in ms (default: 30000)" }
    },
    required: ["command"]
  },
  isReadOnly: false,
  async execute({ command, timeout = 30000 }) {
    const { dangerouslyDisableSandbox } = getConfig()

    if (!dangerouslyDisableSandbox) {
      const blocked = sandboxCheck(command)
      if (blocked) return blocked
    }

    try {
      const { stdout, stderr } = await execAsync(command, { timeout })
      return stdout + (stderr ? `\nSTDERR: ${stderr}` : "")
    } catch (err) {
      if (err.killed) return `Error: command timed out after ${timeout}ms`
      return `Error: ${err.message}`
    }
  }
}
