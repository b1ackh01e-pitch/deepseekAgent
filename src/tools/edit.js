import fs from "fs/promises"
import { renderEditDiff } from "../diff.js"

export const editTool = {
  name: "edit_file",
  description: "Replace an exact string in a file with new content. The old_string must match exactly (including whitespace).",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Path to the file" },
      old_string: { type: "string", description: "Exact string to find and replace" },
      new_string: { type: "string", description: "String to replace it with" }
    },
    required: ["path", "old_string", "new_string"]
  },
  isReadOnly: false,
  async execute({ path: filePath, old_string, new_string }) {
    const original = await fs.readFile(filePath, "utf-8")

    if (!original.includes(old_string)) {
      return `Error: old_string not found in ${filePath}`
    }

    const count = original.split(old_string).length - 1
    if (count > 1) {
      return `Error: old_string found ${count} times — make it more specific to ensure unique match`
    }

    const updated = original.replace(old_string, new_string)
    process.stdout.write(renderEditDiff(original, filePath, old_string, new_string))

    await fs.writeFile(filePath, updated, "utf-8")
    return `Edited ${filePath}`
  }
}
