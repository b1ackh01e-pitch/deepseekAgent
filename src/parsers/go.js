// Парсер Go-файлов
// Поддерживает: func, method с receiver, struct, interface

import { strip, esc } from "./utils.js"

export default {
  extensions: [".go"],

  outline(lines) {
    const results = []
    const patterns = [
      /^func\s+\(\w+\s+\*?(\w+)\)\s+(\w+)\s*\(/,   // method с receiver: func (r *Type) Method(
      /^func\s+(\w+)\s*[\(\[]/                       // top-level функция: func Foo(
    ]

    const seen = new Set()
    for (let i = 0; i < lines.length; i++) {
      if (seen.has(i)) continue
      const clean = strip(lines[i])
      for (const p of patterns) {
        const m = clean.match(p)
        if (m) {
          seen.add(i)
          // method с receiver: два capture-группы -> Type.Method
          const name = m.length === 3 ? `${m[1]}.${m[2]}` : m[1]
          results.push({ name: name + "()", line: i + 1 })
          break
        }
      }
    }
    return results
  },

  findMethodStart(lines, methodName) {
    const m = esc(methodName)
    const patterns = [
      new RegExp(`^func\\s+\\(\\w+\\s+\\*?\\w+\\)\\s+${m}\\s*\\(`),  // method
      new RegExp(`^func\\s+${m}\\s*[\\(\\[]`)                         // function
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
