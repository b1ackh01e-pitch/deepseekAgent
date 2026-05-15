// Инструменты оптимизатора — экономят токены при работе с кодом
// Вместо чтения целых файлов: outline + точечное чтение методов

import { outline, definition, codeContext, getSupportedLang } from "../optimizer.js"

export const codeOutlineTool = {
  name: "code_outline",
  description:
    "List all functions, methods, and classes in a file with line numbers. " +
    "Returns only names and line numbers — much more efficient than reading the entire file. " +
    "Use this first to explore file structure, then code_definition to read specific methods. " +
    "Supported: PHP, JS/JSX/TS/TSX, Go, CSS/SCSS. " +
    "For unsupported file types use read_file instead.",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Path to the file" }
    },
    required: ["path"]
  },
  isReadOnly: true,
  async execute({ path: filePath }) {
    if (!getSupportedLang(filePath)) {
      return `File type not supported by optimizer. Use read_file to read "${filePath}".`
    }

    const results = await outline(filePath)
    if (!results || results.length === 0) return "No functions/methods found."
    return results.map(r => `${r.name.padEnd(40)} line ${r.line}`).join("\n")
  }
}

export const codeDefinitionTool = {
  name: "code_definition",
  description:
    "Extract a specific function or method body from a file by name. " +
    "Returns only that function's code with 3 lines of context above — much more efficient than reading the entire file. " +
    "For CSS/SCSS files, extracts a selector block by selector name. " +
    "Use after code_outline to read specific functions. " +
    "Supported: PHP, JS/JSX/TS/TSX, Go, CSS/SCSS. " +
    "For unsupported file types use read_file instead.",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Path to the file" },
      name: { type: "string", description: "Function/method name to extract (or CSS selector for .scss/.css files)" }
    },
    required: ["path", "name"]
  },
  isReadOnly: true,
  async execute({ path: filePath, name: targetName }) {
    if (!getSupportedLang(filePath)) {
      return `File type not supported by optimizer. Use read_file to read "${filePath}".`
    }

    const result = await definition(filePath, targetName)
    if (!result) return `Could not extract definition. Use read_file to read "${filePath}".`
    if (!result.found) return `Method not found: ${targetName}`

    let output = ""
    if (result.context) {
      output += `=== context (lines ${result.contextStart}-${result.startLine - 1}) ===\n${result.context}\n`
    }
    output += `=== method (lines ${result.startLine}-${result.endLine}) ===\n${result.body}`
    return output
  }
}

export const codeContextTool = {
  name: "code_context",
  description:
    "Show N lines around a specific line number in a file. " +
    "The target line is marked with '>>>'. " +
    "Useful for investigating errors and stack traces at specific line numbers. " +
    "Works with any file type.",
  parameters: {
    type: "object",
    properties: {
      path: { type: "string", description: "Path to the file" },
      line: { type: "integer", description: "Center line number" },
      radius: { type: "integer", description: "Number of lines above and below (default: 10)" }
    },
    required: ["path", "line"]
  },
  isReadOnly: true,
  async execute({ path: filePath, line, radius = 10 }) {
    const result = await codeContext(filePath, line, radius)
    return `=== ${filePath} lines ${result.from}-${result.to} ===\n${result.content}`
  }
}
