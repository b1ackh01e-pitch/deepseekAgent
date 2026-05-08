// Режим вывода: "text" (по умолчанию) или "json"
let _format = "text"

export function setOutputFormat(format) { _format = format }
export function getOutputFormat() { return _format }
export function isJson() { return _format === "json" }

export function emit(type, data) {
  if (_format === "json") {
    process.stdout.write(JSON.stringify({ type, ...data }) + "\n")
  }
}

// Обёртка для process.stdout.write — в json-режиме подавляет прямой вывод
export function print(text) {
  if (_format !== "json") process.stdout.write(text)
}
