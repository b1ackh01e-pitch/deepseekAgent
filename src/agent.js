import OpenAI from "openai"
import { readTool } from "./tools/read.js"
import { bashTool } from "./tools/bash.js"
import { writeTool } from "./tools/write.js"
import { editTool } from "./tools/edit.js"
import { globTool } from "./tools/glob.js"
import { grepTool } from "./tools/grep.js"
import { webSearchTool } from "./tools/web_search.js"
import { todoWriteTool, todoReadTool } from "./tools/todo.js"
import { taskTool, taskResultTool, initTaskTool } from "./tools/task.js"
import { loadMemory } from "./memory.js"
import { loadMcpTools } from "./mcp.js"
import { checkPermission } from "./permissions.js"
import { runHooks } from "./hooks.js"
import { compactIfNeeded } from "./compactor.js"
import { getModel, printReasoning } from "./thinking.js"
import { getConfig } from "./config.js"
import { c } from "./ui.js"
import { print, emit } from "./output.js"
import {
  getMessages, setMessages, pushMessage,
  createCheckpoint, incrementTurn
} from "./session.js"

let client = null

function getClient() {
  if (!client) client = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: process.env.DEEPSEEK_API_KEY
  })
  return client
}

let _initialized = false
let TOOLS = []

async function initialize() {
  if (_initialized) return
  _initialized = true

  const mcpTools = await loadMcpTools()
  const { disallowedTools } = getConfig()

  TOOLS = [
    readTool, bashTool, writeTool, editTool,
    globTool, grepTool, webSearchTool,
    todoWriteTool, todoReadTool,
    taskTool, taskResultTool,
    ...mcpTools
  ].filter(t => !disallowedTools.includes(t.name))

  initTaskTool(agentLoop)
}

let _openAITools = null
function buildOpenAITools() {
  if (!_openAITools) {
    _openAITools = TOOLS.map(t => ({
      type: "function",
      function: { name: t.name, description: t.description, parameters: t.parameters }
    }))
  }
  return _openAITools
}

async function executeTool(name, args) {
  const tool = TOOLS.find(t => t.name === name)
  if (!tool) return `Unknown tool: ${name}`

  const allowed = await runHooks("PreToolUse", { tool: name, args })
  if (!allowed) return `Blocked by PreToolUse hook`

  if (!tool.isReadOnly) {
    const perm = await checkPermission(name, args)
    if (!perm.allowed) return `Rejected: ${perm.reason}`
  }

  let result
  try {
    result = await tool.execute(args)
  } catch (err) {
    result = `Error: ${err.message}`
  }

  await runHooks("PostToolUse", { tool: name, args, result: String(result).slice(0, 500) })
  return result
}

function formatToolCall(name, args) {
  switch (name) {
    case "read_file":    return `Read ${args.path}`
    case "write_file":   return `Write ${args.path}`
    case "edit_file":    return `Edit ${args.path}`
    case "bash":         return `Bash ${(args.command ?? "").slice(0, 72)}`
    case "glob":         return `Glob ${args.pattern}${args.cwd ? ` in ${args.cwd}` : ""}`
    case "grep":         return `Grep "${args.pattern}"${args.dir ? ` in ${args.dir}` : ""}`
    case "web_search":   return `Search "${args.query}"`
    case "todo_read":    return `Todo read`
    case "todo_write":   return `Todo write`
    case "task":         return `Task ${(args.description ?? args.parallel?.join(", ") ?? "").slice(0, 60)}`
    default:             return `${name} ${JSON.stringify(args).slice(0, 60)}`
  }
}

function formatToolResult(name, args, result) {
  // write_file и edit_file уже вывели diff сами — ничего не добавляем
  if (name === "write_file" || name === "edit_file") return null

  if (name === "read_file") {
    const lines = result.split("\n").length
    return `${lines} строк, ${result.length} символов`
  }

  if (name === "glob") {
    const files = result.split("\n").filter(Boolean)
    return files.length ? `${files.length} файлов` : "нет совпадений"
  }

  if (name === "grep") {
    if (result === "No matches found.") return "нет совпадений"
    const count = result.split("\n").filter(Boolean).length
    return `${count} совпадений`
  }

  if (name === "web_search") {
    return result.slice(0, 120) + (result.length > 120 ? "…" : "")
  }

  // bash и остальные — показываем вывод как есть (он уже обрезан в bash.js)
  const trimmed = result.trim()
  if (!trimmed) return null
  const lines = trimmed.split("\n")
  return lines.length > 1
    ? lines.slice(0, 8).join("\n  ") + (lines.length > 8 ? `\n  … ещё ${lines.length - 8} строк` : "")
    : trimmed
}

export async function agentLoop(userMessage) {
  await initialize()
  await runHooks("UserPromptSubmit", { message: userMessage })

  // Инициализируем messages если сессия пустая
  if (getMessages().length === 0) {
    const memory = await loadMemory()
    const { language } = getConfig()
    const systemContent = [
      "You are a helpful coding assistant with access to tools.",
      "Always read a file before editing it.",
      "Use glob to list files and grep to search content — prefer these over bash for any read-only file exploration.",
      "Use todo_write to track multi-step tasks.",
      "Be concise in your responses.",
      "Do not attempt to read binary files (images, archives, executables, media, fonts, databases) unless the user explicitly asks you to inspect them.",
      language
        ? `Always respond in ${language}. Code, commands, variable names, and technical identifiers must remain in English.`
        : "Always respond in the same language the user is writing in. Do not switch languages mid-conversation.",
      memory ? `\n\n${memory}` : ""
    ].join(" ")
    pushMessage({ role: "system", content: systemContent })
  }

  // Создаём чекпоинт перед каждым ходом
  createCheckpoint()
  incrementTurn()

  pushMessage({ role: "user", content: userMessage })

  while (true) {
    let messages = getMessages()
    messages = await compactIfNeeded(messages, getClient())
    setMessages(messages)

    const stream = await getClient().chat.completions.create({
      model: getModel(),
      messages,
      tools: buildOpenAITools(),
      stream: true
    })

    let fullContent = ""
    let toolCalls = []
    let finishReason = null
    let hasReasoning = false

    print(c.green("\nAgent: "))

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta
      finishReason = chunk.choices[0]?.finish_reason ?? finishReason

      if (printReasoning(chunk)) {
        if (!hasReasoning) { print(c.dim("\n[thinking]\n")); hasReasoning = true }
        continue
      }

      if (hasReasoning && delta?.content && !fullContent) {
        print(c.dim("[/thinking]\n") + c.green("Agent: "))
        hasReasoning = false
      }

      if (delta?.content) {
        print(delta.content)
        emit("text", { text: delta.content })
        fullContent += delta.content
      }

      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          if (!toolCalls[tc.index]) {
            toolCalls[tc.index] = { id: "", type: "function", function: { name: "", arguments: "" } }
          }
          if (tc.id) toolCalls[tc.index].id += tc.id
          if (tc.function?.name) toolCalls[tc.index].function.name += tc.function.name
          if (tc.function?.arguments) toolCalls[tc.index].function.arguments += tc.function.arguments
        }
      }
    }

    if (fullContent) print("\n")

    pushMessage({
      role: "assistant",
      content: fullContent || null,
      tool_calls: toolCalls.length ? toolCalls : undefined
    })

    if (finishReason === "stop") {
      await runHooks("Stop", { response: fullContent })
      return fullContent
    }

    if (finishReason === "tool_calls") {
      for (const call of toolCalls) {
        let args
        try { args = JSON.parse(call.function.arguments) } catch { args = {} }

        print(c.cyan("\n● " + formatToolCall(call.function.name, args)) + "\n")
        emit("tool_call", { tool: call.function.name, args })

        const result = await executeTool(call.function.name, args)

        const full = String(result)
        const CONTEXT_LIMIT = 12000
        const toolContent = full.length > CONTEXT_LIMIT
          ? full.slice(0, CONTEXT_LIMIT) + `\n[... truncated, ${full.length - CONTEXT_LIMIT} chars omitted]`
          : full
        const summary = formatToolResult(call.function.name, args, full)
        if (summary) print(c.dim(`  ↳ ${summary}\n`))
        emit("tool_result", { tool: call.function.name, result: full.slice(0, 300) })

        pushMessage({ role: "tool", tool_call_id: call.id, content: toolContent })
      }
    }
  }
}
