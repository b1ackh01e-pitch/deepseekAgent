const todos = []
let nextId = 1

const STATUS_ICON = { pending: "○", in_progress: "◑", done: "●" }

function getTodo(id) {
  return todos.find(t => t.id === id)
}

function isBlocked(todo) {
  return (todo.blockedBy ?? []).some(depId => {
    const dep = getTodo(depId)
    return dep && dep.status !== "done"
  })
}

export const todoWriteTool = {
  name: "todo_write",
  description: "Manage task list. Track progress on multi-step work. Actions: add, update, delete. Tasks can block each other via blockedBy/blocks.",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["add", "update", "delete"] },
      id: { type: "number", description: "Task ID (for update/delete)" },
      text: { type: "string", description: "Task description (for add/update)" },
      status: { type: "string", enum: ["pending", "in_progress", "done"], description: "New status (for update)" },
      blockedBy: { type: "array", items: { type: "number" }, description: "IDs of tasks that must be done first" },
      blocks: { type: "array", items: { type: "number" }, description: "IDs of tasks this task blocks" }
    },
    required: ["action"]
  },
  isReadOnly: false,
  async execute({ action, id, text, status, blockedBy, blocks }) {
    if (action === "add") {
      const todo = { id: nextId++, text, status: "pending", blockedBy: blockedBy ?? [], blocks: blocks ?? [] }
      todos.push(todo)
      // Прописываем обратные зависимости
      for (const depId of todo.blocks) {
        const dep = getTodo(depId)
        if (dep && !dep.blockedBy.includes(todo.id)) dep.blockedBy.push(todo.id)
      }
      return `Added task #${todo.id}: ${text}`
    }

    if (action === "update") {
      const todo = getTodo(id)
      if (!todo) return `Task #${id} not found`
      if (text) todo.text = text
      if (status) {
        if (status === "in_progress" && isBlocked(todo)) {
          const blocking = todo.blockedBy.filter(depId => getTodo(depId)?.status !== "done")
          return `Cannot start #${id} — blocked by: ${blocking.join(", ")}`
        }
        todo.status = status
      }
      if (blockedBy) todo.blockedBy = blockedBy
      if (blocks) todo.blocks = blocks
      return `Updated task #${id}`
    }

    if (action === "delete") {
      const idx = todos.findIndex(t => t.id === id)
      if (idx === -1) return `Task #${id} not found`
      todos.splice(idx, 1)
      return `Deleted task #${id}`
    }

    return "Unknown action"
  }
}

export const todoReadTool = {
  name: "todo_read",
  description: "Read the current task list with statuses and dependencies.",
  parameters: { type: "object", properties: {} },
  isReadOnly: true,
  async execute() {
    if (todos.length === 0) return "No tasks."
    return todos.map(t => {
      const icon = STATUS_ICON[t.status] ?? "?"
      const blocked = isBlocked(t) ? " [BLOCKED]" : ""
      const deps = t.blockedBy.length ? ` (needs: #${t.blockedBy.join(", #")})` : ""
      return `${icon} #${t.id} ${t.text}${blocked}${deps}`
    }).join("\n")
  }
}
