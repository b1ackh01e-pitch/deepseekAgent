import fs from "fs/promises"
import path from "path"
import os from "os"

async function readIfExists(filePath) {
  try {
    return await fs.readFile(filePath, "utf-8")
  } catch {
    return null
  }
}

export async function loadMemory() {
  const sections = []

  // Глобальная память (~/.agent/AGENT.md)
  const globalPath = path.join(os.homedir(), ".agent", "AGENT.md")
  const global = await readIfExists(globalPath)
  if (global) sections.push(`# Global Memory (${globalPath})\n${global}`)

  // Проектная память (.claude/AGENT.md)
  const projectPath = path.join(process.cwd(), ".agent", "AGENT.md")
  const project = await readIfExists(projectPath)
  if (project) sections.push(`# Project Memory (${projectPath})\n${project}`)

  // AGENT.md в корне проекта
  const rootPath = path.join(process.cwd(), "AGENT.md")
  const root = await readIfExists(rootPath)
  if (root) sections.push(`# Project Instructions (${rootPath})\n${root}`)

  return sections.join("\n\n---\n\n")
}
