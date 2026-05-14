import fs from "fs/promises"
import path from "path"
import fg from "fast-glob"

export const grepTool = {
  name: "grep",
  description: "Search for a pattern (string or regex) in files. Returns matching lines with file paths and line numbers.",
  parameters: {
    type: "object",
    properties: {
      pattern: { type: "string", description: "Search pattern (string or regex)" },
      dir: { type: "string", description: "Directory to search in (default: current dir)" },
      glob: { type: "string", description: "File glob filter, e.g. '**/*.js' (default: all files)" },
      ignoreCase: { type: "boolean", description: "Case-insensitive search (default: false)" }
    },
    required: ["pattern"]
  },
  isReadOnly: true,
  async execute({ pattern, dir = ".", glob: globPattern = "**/*", ignoreCase = false }) {
    const files = await fg(globPattern, {
      cwd: dir,
      dot: true,
      ignore: ["**/node_modules/**", "**/.git/**"]
    })

    const regex = new RegExp(pattern, ignoreCase ? "i" : "")
    const results = []

    for (const file of files) {
      const filePath = path.join(dir, file)
      let content
      try {
        content = await fs.readFile(filePath, "utf-8")
      } catch {
        continue
      }

      const lines = content.split("\n")
      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
          results.push(`${file}:${i + 1}: ${lines[i]}`)
        }
      }
    }

    if (results.length === 0) return "No matches found."
    const LIMIT = 200
    const truncated = results.length > LIMIT
    return results.slice(0, LIMIT).join("\n") + (truncated ? `\n[... ${results.length - LIMIT} more matches omitted]` : "")
  }
}
