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
      return `Error: "${filePath}" is a binary file (${ext}). Reading binary files is not supported.`
    }

    return await fs.readFile(filePath, "utf-8")
  }
}
