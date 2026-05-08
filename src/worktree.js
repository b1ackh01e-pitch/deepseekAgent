import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import { c } from "./ui.js"

const execAsync = promisify(exec)

let _worktreePath = null
let _worktreeBranch = null

export async function createWorktree(baseName = "agent") {
  const branch = `${baseName}-${Date.now()}`
  const worktreePath = path.join(process.cwd(), ".agent", "worktrees", branch)

  try {
    await execAsync(`git worktree add -b ${branch} "${worktreePath}"`)
    _worktreePath = worktreePath
    _worktreeBranch = branch
    process.stdout.write(c.dim(`[worktree] Created branch "${branch}" at ${worktreePath}\n`))
    return { path: worktreePath, branch }
  } catch (err) {
    throw new Error(`Failed to create worktree: ${err.message}`)
  }
}

export async function removeWorktree() {
  if (!_worktreePath) return
  try {
    await execAsync(`git worktree remove "${_worktreePath}" --force`)
    await execAsync(`git branch -D ${_worktreeBranch}`)
    process.stdout.write(c.dim(`[worktree] Removed branch "${_worktreeBranch}"\n`))
  } catch (err) {
    process.stdout.write(c.red(`[worktree] Cleanup failed: ${err.message}\n`))
  }
  _worktreePath = null
  _worktreeBranch = null
}

export function getWorktreePath() { return _worktreePath }
export function isInWorktree() { return _worktreePath !== null }
