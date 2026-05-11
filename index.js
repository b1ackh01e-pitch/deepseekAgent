#!/usr/bin/env node
import "dotenv/config"
import readline from "readline"
import { agentLoop } from "./src/agent.js"
import { loadConfig } from "./src/config.js"
import { enableThinking } from "./src/thinking.js"
import { createWorktree, removeWorktree, isInWorktree } from "./src/worktree.js"
import { disconnectMcp } from "./src/mcp.js"
import { printBanner, c } from "./src/ui.js"
import { setOutputFormat, isJson } from "./src/output.js"
import { handleCommand } from "./src/commands.js"

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
  if (isInWorktree()) await removeWorktree()
  await disconnectMcp()
  console.log(c.dim("\nBye."))
  process.exit(0)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
function ask(prompt) { return new Promise(resolve => rl.question(prompt, resolve)) }

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
