import express from "express"
import { WebSocketServer } from "ws"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import { createWSServer } from "./ws.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Serve static files from GUI
app.use(express.static(join(__dirname, "../gui/dist")))

// Fallback for SPA routing
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "../gui/dist/index.html"))
})

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

// WebSocket server
const wss = new WebSocketServer({ server })
createWSServer(wss)
