let _agentLoop = null

export function initTaskTool(agentLoop) {
  _agentLoop = agentLoop
}

// Фоновые задачи: id → { promise, result, done }
const backgroundTasks = new Map()
let bgNextId = 1

export const taskTool = {
  name: "task",
  description: "Spawn a subagent for an independent subtask. Use parallel[] to run multiple tasks at once. Use background:true to run without waiting — get result later with task_result.",
  parameters: {
    type: "object",
    properties: {
      description: { type: "string", description: "What the subagent should do" },
      parallel: {
        type: "array",
        items: { type: "string" },
        description: "Run multiple subtasks in parallel, each item is a task description"
      },
      background: { type: "boolean", description: "If true, start task without waiting for result. Returns a task_id." }
    }
  },
  isReadOnly: false,
  async execute({ description, parallel, background }) {
    if (!_agentLoop) return "Task tool not initialized"

    // Параллельный режим
    if (parallel && parallel.length > 0) {
      const results = await Promise.all(parallel.map(desc => _agentLoop(desc)))
      return results.map((r, i) => `[Task ${i + 1}]: ${r}`).join("\n\n")
    }

    if (!description) return "Provide either description or parallel array"

    // Фоновый режим
    if (background) {
      const taskId = bgNextId++
      const entry = { done: false, result: null }
      entry.promise = _agentLoop(description).then(result => {
        entry.done = true
        entry.result = result
      })
      backgroundTasks.set(taskId, entry)
      return `Background task started. task_id: ${taskId}. Use task_result to check status.`
    }

    // Обычный синхронный режим
    return await _agentLoop(description)
  }
}

export const taskResultTool = {
  name: "task_result",
  description: "Get the result of a background task by its task_id.",
  parameters: {
    type: "object",
    properties: {
      task_id: { type: "number", description: "ID returned by task with background:true" }
    },
    required: ["task_id"]
  },
  isReadOnly: true,
  async execute({ task_id }) {
    const entry = backgroundTasks.get(task_id)
    if (!entry) return `No background task with id ${task_id}`
    if (!entry.done) return `Task ${task_id} is still running...`
    backgroundTasks.delete(task_id)
    return entry.result
  }
}
