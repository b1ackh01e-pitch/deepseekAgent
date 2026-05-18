import { agentLoop } from "../src/agent.js"
import { setOutputFormat, emit } from "../src/output.js"
import { setPermissionHandler } from "../src/permissions.js"
import { createPermissionHandler, resolvePermission } from "./permissions-ws.js"

let currentWs = null

export function createWSServer(wss) {
  wss.on("connection", (ws) => {
    currentWs = ws

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString())
        await handleMessage(message, ws)
      } catch (err) {
        ws.send(JSON.stringify({ type: "error", message: err.message }))
      }
    })

    ws.on("close", () => {
      currentWs = null
    })

    // Set up WebSocket mode for output
    setOutputFormat("ws")
    emit.setWs(ws)

    // Set up permission handler
    setPermissionHandler(createPermissionHandler(ws))
  })
}

async function handleMessage(message, ws) {
  switch (message.type) {
    case "message":
      await handleUserMessage(message.text, ws)
      break
    case "command":
      handleCommand(message.text, ws)
      break
    case "permission":
      resolvePermission(message.answer)
      break
    default:
      ws.send(JSON.stringify({ type: "error", message: "Unknown message type" }))
  }
}

async function handleUserMessage(text, ws) {
  try {
    ws.send(JSON.stringify({ type: "status", status: "thinking" }))
    const response = await agentLoop(text)
    ws.send(JSON.stringify({ type: "done", response }))
  } catch (err) {
    ws.send(JSON.stringify({ type: "error", message: err.message }))
  }
}

function handleCommand(text, ws) {
  switch (text) {
    case "/clear":
      // Clear session logic would go here
      ws.send(JSON.stringify({ type: "cleared" }))
      break
    default:
      ws.send(JSON.stringify({ type: "error", message: "Unknown command" }))
  }
}
