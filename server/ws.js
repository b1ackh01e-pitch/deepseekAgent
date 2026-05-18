import { agentLoop } from "../src/agent.js"
import { setOutputFormat, emit, setWs } from "../src/output.js"
import { setPermissionHandler } from "../src/permissions.js"
import { createPermissionHandler, resolvePermission } from "./permissions-ws.js"
import { readdir, stat } from "fs/promises"
import { join, chdir } from "path"

let currentWs = null
let changedFiles = []

async function buildFileTree(dir, basePath = "") {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    const tree = []
    
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      
      const fullPath = join(dir, entry.name)
      const relativePath = basePath ? join(basePath, entry.name) : entry.name
      
      if (entry.isDirectory()) {
        tree.push({
          name: entry.name,
          type: 'directory',
          path: relativePath,
          children: await buildFileTree(fullPath, relativePath)
        })
      } else {
        tree.push({
          name: entry.name,
          type: 'file',
          path: relativePath
        })
      }
    }
    
    return tree
  } catch (err) {
    return []
  }
}

export function createWSServer(wss) {
  wss.on("connection", async (ws) => {
    currentWs = ws
    changedFiles = []

    // Send file tree on connection
    const fileTree = await buildFileTree(process.cwd())
    ws.send(JSON.stringify({ type: "file_tree", tree: fileTree, cwd: process.cwd() }))

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
    setWs(ws)

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
    case "approve_all":
      // Approve all pending changes
      changedFiles = []
      ws.send(JSON.stringify({ type: "changed_files", files: changedFiles }))
      break
    case "reject_all":
      // Reject all pending changes
      changedFiles = []
      ws.send(JSON.stringify({ type: "changed_files", files: changedFiles }))
      break
    case "change_directory":
      try {
        chdir(message.directory)
        const newFileTree = await buildFileTree(process.cwd())
        ws.send(JSON.stringify({ type: "file_tree", tree: newFileTree, cwd: process.cwd() }))
      } catch (err) {
        ws.send(JSON.stringify({ type: "error", message: `Failed to change directory: ${err.message}` }))
      }
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
