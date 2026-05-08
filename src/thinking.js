import { getConfig } from "./config.js"
import { c } from "./ui.js"

let _thinkingEnabled = false

export function enableThinking() { _thinkingEnabled = true }
export function isThinkingEnabled() { return _thinkingEnabled }

export function getModel() {
  const { model, thinkingModel } = getConfig()
  return _thinkingEnabled ? thinkingModel : model
}

// deepseek-reasoner возвращает reasoning_content отдельно от content
// Эта функция печатает его в dim-стиле
export function printReasoning(chunk) {
  const delta = chunk.choices[0]?.delta
  if (delta?.reasoning_content) {
    process.stdout.write(c.dim(delta.reasoning_content))
    return true
  }
  return false
}
