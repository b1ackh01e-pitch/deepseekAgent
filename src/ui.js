// ANSI color helpers — без внешних зависимостей
export const c = {
  green:  s => `\x1b[32m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  cyan:   s => `\x1b[36m${s}\x1b[0m`,
  red:    s => `\x1b[31m${s}\x1b[0m`,
  dim:    s => `\x1b[2m${s}\x1b[0m`,
  bold:   s => `\x1b[1m${s}\x1b[0m`,
}

export async function waitForInput() {
  const { ask } = await import("./rl.js")
  return ask("")
}

export function printBanner() {
  console.log(c.bold(c.cyan("╔═══════════════════════════╗")))
  console.log(c.bold(c.cyan("║    DeepSeek Agent v0.1    ║")))
  console.log(c.bold(c.cyan("╚═══════════════════════════╝")))
  console.log(c.dim("Type your task. Type 'exit' to quit.\n"))
}
