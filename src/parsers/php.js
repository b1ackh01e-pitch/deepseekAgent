// Парсер PHP-файлов
// Добавить новый язык: скопировать этот файл, изменить extensions + паттерны

import { strip, esc } from "./utils.js"

export default {
  extensions: [".php"],

  // Все методы/функции файла с номерами строк
  outline(lines) {
    const results = []
    const pattern = /(?:public|protected|private|static|\s)+function\s+(\w+)\s*\(/
    for (let i = 0; i < lines.length; i++) {
      const clean = strip(lines[i])
      const m = clean.match(pattern)
      if (m) results.push({ name: m[1] + "()", line: i + 1 })
    }
    return results
  },

  // Найти строку начала метода
  findMethodStart(lines, methodName) {
    const pattern = new RegExp(`function\\s+${esc(methodName)}\\s*\\(`)
    for (let i = 0; i < lines.length; i++) {
      const clean = strip(lines[i])
      if (pattern.test(clean) && clean.includes(methodName)) return i + 1
    }
    return null
  }
}
