import { getConfig } from "./config.js"
import { runHooks } from "./hooks.js"
import { c } from "./ui.js"

// Грубая оценка токенов: ~4 символа = 1 токен
function estimateTokens(messages) {
  const text = messages.map(m => {
    if (typeof m.content === "string") return m.content
    if (Array.isArray(m.content)) return m.content.map(b => b.text ?? "").join("")
    return ""
  }).join("")
  return Math.ceil(text.length / 4)
}

export async function compactIfNeeded(messages, client, force = false) {
  const { contextLimit } = getConfig()
  const tokens = estimateTokens(messages)

  if (!force && tokens < contextLimit * 0.8) return messages

  process.stdout.write(c.dim(`\n[compactor] Context ~${tokens} tokens, compacting...\n`))

  await runHooks("PreCompact", { tokenCount: tokens })

  // Системное сообщение оставляем, суммаризируем остальное
  const system = messages.find(m => m.role === "system")
  const rest = messages.filter(m => m.role !== "system")

  const summaryResponse = await client.chat.completions.create({
    model: getConfig().model,
    messages: [
      {
        role: "system",
        content: "Summarize the following conversation concisely, preserving all important technical details, decisions made, and current task state."
      },
      {
        role: "user",
        content: rest.map(m => `[${m.role}]: ${typeof m.content === "string" ? m.content : JSON.stringify(m.content)}`).join("\n")
      }
    ]
  })

  const summary = summaryResponse.choices[0].message.content
  process.stdout.write(c.dim(`[compactor] Compacted to summary.\n`))

  const compacted = []
  if (system) compacted.push(system)
  compacted.push({ role: "user", content: `[Previous conversation summary]:\n${summary}` })
  compacted.push({ role: "assistant", content: "Understood. I'll continue from where we left off." })

  return compacted
}
