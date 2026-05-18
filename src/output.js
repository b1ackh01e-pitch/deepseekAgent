// Режим вывода: "text" (по умолчанию), "json" или "ws"
let _format = "text"
let _ws = null

export function setOutputFormat(format) { _format = format }
export function getOutputFormat() { return _format }
export function isJson() { return _format === "json" }
export function setWs(ws) { _ws = ws }

export function emit(type, data) {
  if (_format === "json") {
    process.stdout.write(JSON.stringify({ type, ...data }) + "\n")
  } else if (_format === "ws" && _ws) {
    _ws.send(JSON.stringify({ type, ...data }))
  }
}

// Обёртка для process.stdout.write — в json-режиме подавляет прямой вывод
export function print(text) {
  if (_format !== "json" && _format !== "ws") process.stdout.write(text)
}
