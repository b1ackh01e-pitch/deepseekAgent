import fs from "fs/promises"
import path from "path"
import { BINARY_EXTS } from "../binary.js"

export const readTool = {
  name: "read_file",
  description: "Read the contents of a text file.",
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

    if (BINARY_EXTS.has(ext)) {
      return `Error: "${filePath}" is a binary file (${ext}). Use bash to inspect it if needed.`
    }

    const buf = await fs.readFile(filePath)

    // Определяем кодировку по BOM
    if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
      // UTF-8 BOM — убираем BOM и читаем как UTF-8
      return buf.slice(3).toString("utf-8")
    }
    if (buf[0] === 0xFF && buf[1] === 0xFE) {
      // UTF-16 LE
      return buf.slice(2).toString("utf16le")
    }
    if (buf[0] === 0xFE && buf[1] === 0xFF) {
      // UTF-16 BE
      return buf.slice(2).swap16().toString("utf16le")
    }

    // Пробуем UTF-8; если есть невалидные байты — предупреждаем
    const text = buf.toString("utf-8")
    if (text.includes("\uFFFD")) {
      return `Warning: "${filePath}" contains non-UTF-8 bytes, some characters may be garbled.\n\n${text}`
    }
    return text
  }
}
