import { getConfig } from "./config.js"
import { waitForInput } from "./ui.js"
import { c } from "./ui.js"

export async function checkPermission(toolName, args) {
  const { alwaysAllow, neverAllow } = getConfig()

  if (neverAllow.includes(toolName)) {
    return { allowed: false, reason: "neverAllow" }
  }

  if (alwaysAllow.includes(toolName)) {
    return { allowed: true }
  }

  // Запрашиваем подтверждение у пользователя
  process.stdout.write(c.yellow(`\n[?] Run ${toolName}(${JSON.stringify(args, null, 2)}) ? [y/N] `))
  const answer = await waitForInput()

  if (answer.trim().toLowerCase() === "y") {
    return { allowed: true }
  }

  return { allowed: false, reason: "user rejected" }
}
