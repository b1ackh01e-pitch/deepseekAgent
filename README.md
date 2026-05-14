# DeepSeek Agent

A terminal AI agent powered by [DeepSeek API](https://platform.deepseek.com/) — an open-source alternative to Claude Code with minimal dependencies.

Reads files, writes and edits code, runs shell commands, searches the codebase, performs web search, and can spawn parallel sub-agents — all from the terminal.

[Русская документация](./README.ru.md)

## Quick Start

```bash
git clone https://github.com/skydeex/deepseekAgent.git
cd deepseekAgent
npm install
npm install -g .          # register the 'agent' command globally
copy .env.example .env   # Windows
# cp .env.example .env  # Linux / macOS
# add your DEEPSEEK_API_KEY to .env
agent
```

Get an API key: [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)

## Update

```bash
agent update
```

## Tip: Save Tokens on Large Codebases

For large projects, consider using [claudeSearch](https://github.com/skydeex/claudeSearch) alongside the agent. Instead of reading entire files, it provides precise low-token access to your codebase via structural search (dependency graph), text search, and semantic search. Saves up to 60–70% of tokens compared to full-file reads.

## Requirements

- Node.js >= 18
- DeepSeek API key

## Usage

```bash
agent                                          # normal mode
agent --think                                  # extended thinking (deepseek-reasoner)
agent --worktree                               # git-isolated worktree
agent --output-format=json "prompt"           # CI / scripting — JSON output
```

## Slash Commands

Type directly in the chat:

| Command | Description |
|---|---|
| `/help` | List all commands |
| `/clear` | Reset context (= `/reset`, `/new`) |
| `/compact` | Manually compact context via LLM |
| `/context` | Context usage progress bar (= `/usage`) |
| `/export [file]` | Save conversation history to a file |
| `/recap` | Brief summary of the current session |
| `/btw <question>` | Ask the model without adding to history |
| `/diff` | Show `git diff HEAD` |
| `/rewind` | Roll back to a checkpoint (= `/undo`, `/checkpoint`) |
| `/review [focus]` | Send `git diff HEAD` to the agent for code review |
| `/security-review` | Review for vulnerabilities (SQLi, XSS, command injection, etc.) |
| `/simplify [focus]` | Three parallel agents: DRY, code quality, performance |
| `/batch <task>` | Agent decomposes the task and runs subtasks in parallel |
| `/loop [N] <prompt>` | Run prompt every N seconds/minutes/hours; repeat `/loop` to stop |
| `/resume` | Restore previous session (auto-saved on exit) |
| `/model` | Info about the current model |

## Tools

| Tool | Description |
|---|---|
| `read_file` | Reads a text file. Binary files (exe, zip, png, mp4, etc.) are blocked automatically |
| `write_file` | Creates or overwrites a file. Shows colored diff: removed lines on dark red, added on green |
| `edit_file` | Exact string replacement. Shows diff with 3 lines of context around the change |
| `glob` | Find files by pattern (`src/**/*.js`). Binary files excluded |
| `grep` | Search file contents with regex support. Binary files skipped, limit 200 matches |
| `bash` | Run shell commands (sandboxed by default). Output truncated at 8,000 chars |
| `web_search` | DuckDuckGo search, no API key required |
| `todo_write` / `todo_read` | Task list with dependencies within a session |
| `task` | Spawn sub-agents: sync, parallel, or background |

## Permissions

Tools with side effects (`write_file`, `edit_file`, `bash`) require confirmation before running.

**For file operations** (`write_file`, `edit_file`):
```
┌ [?] write_file → /project/src/utils.js
└ [y/Enter] once  [d] remember folder "/project/src"  [N] deny:
```
- `Enter` or `y` — allow once
- `d` — save folder to `.agent/settings.json`, won't ask again on next runs

**For bash and other tools**:
```
┌ [?] bash: {"command":"npm install"}
└ [y/Enter] once  [a] remember for this project  [N] deny:
```
- `a` — add tool to `alwaysAllow` in `.agent/settings.json`, won't ask again

Permissions are saved in `.agent/settings.json` of the current project:
```json
{
  "alwaysAllow": ["read_file", "glob", "grep", "todo_read", "bash"],
  "approvedDirs": ["src", "tests"]
}
```

## Configuration

Auto-created on first run at `.agent/settings.json`:

```json
{
  "model": "deepseek-chat",
  "thinkingModel": "deepseek-reasoner",
  "contextLimit": 60000,
  "alwaysAllow": ["read_file", "glob", "grep", "todo_read"],
  "neverAllow": [],
  "disallowedTools": [],
  "dangerouslyDisableSandbox": false,
  "mcpServers": {},
  "language": null
}
```

| Field | Description |
|---|---|
| `alwaysAllow` | Tools that run without confirmation |
| `neverAllow` | Tools that are always blocked |
| `disallowedTools` | Tools hidden from the model entirely |
| `dangerouslyDisableSandbox` | Remove bash sandbox restrictions |
| `mcpServers` | Connect MCP servers |
| `language` | Response language (e.g. `"Russian"`, `"English"`). If null — agent follows the user's language |

## Memory (AGENT.md)

The agent automatically reads these files and injects them into the system prompt:

| File | Purpose |
|---|---|
| `~/.agent/AGENT.md` | Global instructions for all projects |
| `.agent/AGENT.md` | Instructions for the current project |
| `AGENT.md` | Instructions in the repository root |

## MCP Servers

Connect any MCP server via `.agent/settings.json`:

```json
"mcpServers": {
  "fs": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
  }
}
```

Server tools are registered automatically as `mcp__fs__<tool>`.

## Hooks

Shell commands triggered on agent events (`.agent/hooks.json`):

```json
{
  "PreToolUse": [{ "command": "cat >> agent.log" }],
  "PostToolUse": [],
  "UserPromptSubmit": [],
  "PreCompact": [],
  "Stop": []
}
```

`PreToolUse` can block tool execution (exit code != 0).

## Switching Models

DeepSeek is used by default. Change `baseURL` in `src/agent.js` and `model` in `.agent/settings.json`:

```
DeepSeek (default)  baseURL: https://api.deepseek.com      model: deepseek-chat
OpenAI              no baseURL                              model: gpt-4o
Ollama (local)      baseURL: http://localhost:11434/v1      model: qwen2.5-coder
Groq                baseURL: https://api.groq.com/openai/v1 model: llama-3.3-70b-versatile
```

## JSON Mode (CI / Scripting)

```bash
agent --output-format=json "what does index.js do?"
echo "write hello world" | agent --output-format=json
```

Each event is a separate JSON line:

```json
{ "type": "text", "text": "response fragment" }
{ "type": "tool_call", "tool": "bash", "args": { "command": "ls" } }
{ "type": "tool_result", "tool": "bash", "result": "file1.js\nfile2.js" }
```

## Dependencies

| Package | Purpose |
|---|---|
| `openai` | DeepSeek API client (OpenAI-compatible) |
| `@modelcontextprotocol/sdk` | MCP client |
| `fast-glob` | File search in `glob` and `grep` |
| `dotenv` | `.env` loading |

## License

[See LICENSE](./LICENSE) — personal use only.
