let _messages = []
let _checkpoints = []
let _turnCount = 0

export function getMessages() { return _messages }
export function setMessages(msgs) { _messages = msgs }
export function pushMessage(msg) { _messages.push(msg) }
export function clearMessages() { _messages = []; _turnCount = 0 }
export function getTurnCount() { return _turnCount }
export function incrementTurn() { _turnCount++ }

export function createCheckpoint() {
  const cp = {
    index: _checkpoints.length,
    turn: _turnCount,
    timestamp: Date.now(),
    messages: JSON.parse(JSON.stringify(_messages))
  }
  _checkpoints.push(cp)
  return cp.index
}

export function getCheckpoints() { return _checkpoints }

export function restoreCheckpoint(index) {
  const cp = _checkpoints[index]
  if (!cp) return false
  _messages = JSON.parse(JSON.stringify(cp.messages))
  _turnCount = cp.turn
  // Удаляем чекпоинты после восстановленного
  _checkpoints = _checkpoints.slice(0, index + 1)
  return true
}
