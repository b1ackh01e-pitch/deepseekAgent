#!/usr/bin/env node
import { createRequire } from "module"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

// Грузим .env из директории самого агента, а не из cwd
const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
require("dotenv").config({ path: join(__dirname, ".env") })

// agent update — обновить агент из репозитория
if (process.argv[2] === "update") {
  const { execSync } = require("child_process")
  console.log("Updating deepseek-agent...")
  try {
    execSync("git pull", { cwd: __dirname, stdio: "inherit" })
    execSync("npm install", { cwd: __dirname, stdio: "inherit" })
    console.log("Done. Restart agent to apply changes.")
  } catch (e) {
    console.error("Update failed:", e.message)
    process.exit(1)
  }
  process.exit(0)
}
import { agentLoop } from "./src/agent.js"
import { loadConfig } from "./src/config.js"
import { enableThinking } from "./src/thinking.js"
import { createWorktree, removeWorktree, isInWorktree } from "./src/worktree.js"
import { disconnectMcp } from "./src/mcp.js"
import { printBanner, c } from "./src/ui.js"
import { setOutputFormat, isJson } from "./src/output.js"
import { handleCommand } from "./src/commands.js"
import { rl, ask } from "./src/rl.js"
import { saveSession } from "./src/session.js"

if (!process.env.DEEPSEEK_API_KEY) {
  console.error(c.red("Error: DEEPSEEK_API_KEY is not set. Copy .env.example to .env and add your key."))
  process.exit(1)
}

const args = process.argv.slice(2)
const useThinking = args.includes("--think")
const useWorktree = args.includes("--worktree")
const outputFormat = args.find(a => a.startsWith("--output-format="))?.split("=")[1] ?? "text"
setOutputFormat(outputFormat)

async function shutdown() {
  await saveSession()
  if (isInWorktree()) await removeWorktree()
  await disconnectMcp()
  console.log(c.dim("\nBye."))
  process.exit(0)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)


async function main() {
  await loadConfig()

  if (useThinking) {
    enableThinking()
    console.log(c.dim("[mode] Extended thinking (deepseek-reasoner)"))
  }

  if (useWorktree) {
    try {
      const wt = await createWorktree()
      process.chdir(wt.path)
      console.log(c.dim(`[worktree] Branch: ${wt.branch}`))
    } catch (err) {
      console.error(c.red(`[worktree] ${err.message}`))
    }
  }

  // json-режим — одиночный запрос без REPL
  if (isJson()) {
    const prompt = args.find(a => !a.startsWith("--"))
    if (prompt) {
      await agentLoop(prompt)
    } else {
      const chunks = []
      for await (const chunk of process.stdin) chunks.push(chunk)
      const input = chunks.join("").trim()
      if (input) await agentLoop(input)
    }
    rl.close()
    await shutdown()
    return
  }

  printBanner()

  while (true) {
    const input = await ask(c.bold("You: "))
    const trimmed = input.trim()
    if (!trimmed || trimmed === "exit" || trimmed === "/exit" || trimmed === "/quit") break

    // Команды начинаются с /
    if (trimmed.startsWith("/")) {
      const handled = await handleCommand(trimmed)
      if (!handled) console.log(c.dim(`Unknown command: ${trimmed.split(" ")[0]}. Type /help for list.\n`))
      continue
    }

    try {
      await agentLoop(trimmed)
      console.log()
    } catch (err) {
      console.error(c.red(`\nError: ${err.message}\n`))
    }
  }

  rl.close()
  await shutdown()
}

main()
