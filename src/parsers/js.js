// Парсер JS/JSX/TS/TSX файлов
// Поддерживает: function, export function, class methods, arrow functions,
// const/let/var assignments, export default

import { strip, esc } from "./utils.js"

const JS_KW = "if|for|while|switch|catch|else|return|typeof|instanceof|new|delete|void|throw"
const EXPORT_PREFIX = "(?:export\\s+(?:default\\s+)?)?"

export default {
  extensions: [".js", ".jsx", ".ts", ".tsx", ".mjs"],

  outline(lines) {
    const results = []
    const patterns = [
      // function foo( / export function foo( / export async function foo(
      new RegExp(`^\\s*${EXPORT_PREFIX}(?:async\\s+)?function\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*\\(`),
      // const foo = function( / export const foo = function(
      new RegExp(`^\\s*${EXPORT_PREFIX}(?:const|let|var)\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*=\\s*(?:async\\s+)?function\\s*\\(`),
      // const foo = (...) => / export const foo = async (...) =>
      new RegExp(`^\\s*${EXPORT_PREFIX}(?:const|let|var)\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*=\\s*(?:async\\s+)?\\([^)]*\\)\\s*=>`),
      // const foo = async ( — multiline arrow (no => on same line, but async+( is a strong signal)
      new RegExp(`^\\s*${EXPORT_PREFIX}(?:const|let|var)\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*=\\s*async\\s+\\(`),
      // class method: foo() { / async foo() { (not keyword, not export/const/let/var)
      new RegExp(`^\\s*(?:async\\s+)?(?!(?:${JS_KW}|export|const|let|var|import|from)\\b)([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*\\([^)]*\\)\\s*\\{`),
      // class arrow property: foo = (...) =>
      /^\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/
    ]

    const seen = new Set()
    for (let i = 0; i < lines.length; i++) {
      if (seen.has(i)) continue
      const clean = strip(lines[i])
      for (const p of patterns) {
        const m = clean.match(p)
        if (m) {
          seen.add(i)
          results.push({ name: m[m.length - 1] + "()", line: i + 1 })
          break
        }
      }
    }
    return results
  },

  findMethodStart(lines, methodName) {
    const m = esc(methodName)
    const patterns = [
      // function declarations
      new RegExp(`${EXPORT_PREFIX}(?:async\\s+)?function\\s+${m}\\s*\\(`),
      // const/let/var assignments with function keyword
      new RegExp(`${EXPORT_PREFIX}(?:const|let|var)\\s+${m}\\s*=\\s*(?:async\\s+)?function\\s*\\(`),
      // arrow function assignments
      new RegExp(`${EXPORT_PREFIX}(?:const|let|var)\\s+${m}\\s*=\\s*(?:async\\s+)?\\(`),
      // foo = function / foo: function / foo = async (
      new RegExp(`(?!(?:${JS_KW})\\b)(${m})\\s*[=:]\\s*(async\\s+)?(function|\\()`, ""),
      // class method: foo() {
      new RegExp(`(?:async\\s+)?(?!(?:${JS_KW})\\b)(${m})\\s*\\([^)]*\\)\\s*\\{`),
      // arrow: foo = async (
      new RegExp(`(${m})\\s*=\\s*(?:async\\s+)?\\(`)
    ]
    for (let i = 0; i < lines.length; i++) {
      const clean = strip(lines[i])
      for (const p of patterns) {
        if (p.test(clean) && clean.includes(methodName)) return i + 1
      }
    }
    return null
  }
}
