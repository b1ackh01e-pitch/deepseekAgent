import fs from "fs/promises"
import path from "path"

const DEFAULTS = {
  model: "deepseek-chat",
  thinkingModel: "deepseek-reasoner",
  contextLimit: 60000,
  alwaysAllow: ["read_file", "glob", "grep", "todo_read"],
  neverAllow: [],
  disallowedTools: [],
  dangerouslyDisableSandbox: false,
  mcpServers: {},
  language: null
}

let _config = null

export async function loadConfig() {
  if (_config) return _config

  const settingsPath = path.join(process.cwd(), ".agent", "settings.json")
  try {
    const raw = await fs.readFile(settingsPath, "utf-8")
    _config = { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    _config = { ...DEFAULTS }
  }

  return _config
}

export function getConfig() {
  return _config ?? DEFAULTS
}
