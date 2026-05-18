// Парсер .astro файлов
// Frontmatter (между первой и второй ---) содержит TypeScript.
// Заменяем --- разделители пустыми строками, сохраняя номера строк,
// затем парсим весь файл как JS/TS (JSX-компоненты в шаблоне тоже подхватятся).

import jsParser from "./js.js"

export default {
  extensions: [".astro"],

  outline(lines) {
    return jsParser.outline(stripFrontmatter(lines))
  },

  findMethodStart(lines, methodName) {
    return jsParser.findMethodStart(stripFrontmatter(lines), methodName)
  }
}

function stripFrontmatter(lines) {
  const result = [...lines]
  let count = 0
  for (let i = 0; i < result.length; i++) {
    if (result[i].trim() === "---") {
      result[i] = ""
      if (++count >= 2) break
    }
  }
  return result
}
