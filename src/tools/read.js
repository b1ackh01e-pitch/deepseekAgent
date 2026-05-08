import fs from "fs/promises"
import path from "path"

const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"])
const IMAGE_MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp"
}

export const readTool = {
  name: "read_file",
  description: "Read the contents of a file. Supports text files and images (PNG, JPG, GIF, WEBP).",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Absolute or relative path to the file" }
    },
    required: ["path"]
  },
  isReadOnly: true,
  async execute({ path: filePath }) {
    const ext = path.extname(filePath).toLowerCase()

    if (IMAGE_EXTS.has(ext)) {
      const data = await fs.readFile(filePath)
      const base64 = data.toString("base64")
      const mediaType = IMAGE_MIME[ext]
      // Возвращаем специальный маркер — agent.js распознает и сформирует image block
      return JSON.stringify({ __type: "image", mediaType, base64 })
    }

    return await fs.readFile(filePath, "utf-8")
  }
}
