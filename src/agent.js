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

const client = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY
})

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

function buildOpenAITools() {
  return TOOLS.map(t => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }
  }))
}

async function executeTool(name, args) {
  const tool = TOOLS.find(t => t.name === name)
  if (!tool) return `Unknown tool: ${name}`

  // Хук PreToolUse
  const allowed = await runHooks("PreToolUse", { tool: name, args })
  if (!allowed) return `Blocked by PreToolUse hook`

  // Проверка разрешений
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

  // Хук PostToolUse
  await runHooks("PostToolUse", { tool: name, args, result: String(result).slice(0, 500) })

  return result
}

export async function agentLoop(userMessage) {
  await initialize()

  // Хук UserPromptSubmit
  await runHooks("UserPromptSubmit", { message: userMessage })

  const memory = await loadMemory()
  const systemContent = [
    "You are a helpful coding assistant with access to tools.",
    "Always read a file before editing it.",
    "Use grep/glob to explore the codebase before making changes.",
    "Use todo_write to track multi-step tasks.",
    "Be concise in your responses.",
    memory ? `\n\n${memory}` : ""
  ].join(" ")

  let messages = [
    { role: "system", content: systemContent },
    { role: "user", content: userMessage }
  ]

  while (true) {
    // Сжатие контекста если нужно
    messages = await compactIfNeeded(messages, client)

    const stream = await client.chat.completions.create({
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

      // Extended thinking (deepseek-reasoner)
      if (printReasoning(chunk)) {
        if (!hasReasoning) {
          print(c.dim("\n[thinking]\n"))
          hasReasoning = true
        }
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

    messages.push({
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
        try {
          args = JSON.parse(call.function.arguments)
        } catch {
          args = {}
        }

        print(c.cyan(`\n[tool] ${call.function.name} `) + c.dim(JSON.stringify(args)) + "\n")
        emit("tool_call", { tool: call.function.name, args })

        const result = await executeTool(call.function.name, args)

        // Проверяем не вернул ли инструмент изображение
        let toolContent
        try {
          const parsed = JSON.parse(result)
          if (parsed.__type === "image") {
            print(c.dim(`[result] [image ${parsed.mediaType}]\n`))
            emit("tool_result", { tool: call.function.name, result: "[image]" })
            toolContent = [{ type: "image_url", image_url: { url: `data:${parsed.mediaType};base64,${parsed.base64}` } }]
          }
        } catch {}

        if (!toolContent) {
          const preview = String(result).slice(0, 300)
          print(c.dim(`[result] ${preview}${String(result).length > 300 ? "…" : ""}\n`))
          emit("tool_result", { tool: call.function.name, result: preview })
          toolContent = String(result)
        }

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: toolContent
        })
      }
    }
  }
}
