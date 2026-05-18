// Парсер CSS/SCSS/SASS/LESS файлов
// Поддерживает: селекторы верхнего уровня, извлечение блока по селектору

import { esc } from "./utils.js"

export default {
  extensions: [".css", ".scss", ".sass", ".less"],

  // rawBrackets: true — не убирать строки при подсчёте {}
  // (в CSS нет строковых литералов с {})
  rawBrackets: true,

  // Селекторы верхнего уровня (depth=0)
  outline(lines) {
    const results = []
    let depth = 0
    for (let i = 0; i < lines.length; i++) {
      const open = (lines[i].match(/\{/g) || []).length
      const close = (lines[i].match(/\}/g) || []).length
      if (depth === 0 && open > 0) {
        const m = lines[i].match(/^\s*([^\/\*@][^{]+)\{/)
        if (m) results.push({ name: m[1].trim(), line: i + 1 })
      }
      depth += open - close
    }
    return results
  },

  // Найти строку начала селектора
  findMethodStart(lines, selector) {
    const needle = esc(selector.replace(/^[.#&]/, ""))
    const r1 = new RegExp(`[.#&\\s]?${needle}\\s*[{,&]`)
    const r2 = new RegExp(`${esc(selector)}\\s*[{,]`)
    for (let i = 0; i < lines.length; i++) {
      if (r1.test(lines[i]) || r2.test(lines[i])) return i + 1
    }
    return null
  }
}
