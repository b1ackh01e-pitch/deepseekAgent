# DeepSeek Agent

Терминальный AI-агент на базе [DeepSeek API](https://platform.deepseek.com/) — аналог Claude Code, но с открытым исходным кодом и минимальными зависимостями.

Агент читает файлы, пишет и редактирует код, выполняет команды, ищет по файлам, делает веб-поиск и умеет запускать параллельные подзадачи — всё из терминала.

## Быстрый старт

```bash
git clone https://github.com/skydeex/deepseekAgent.git
cd deepseekAgent
npm install
npm install -g .          # зарегистрировать команду agent глобально
cp .env.example .env
# вставить DEEPSEEK_API_KEY в .env
agent
```

Получить API-ключ: [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)

## Требования

- Node.js >= 18
- DeepSeek API ключ

## Запуск

```bash
agent                                          # обычный режим
agent --think                                  # режим размышлений (deepseek-reasoner)
agent --worktree                               # git-изоляция в отдельном worktree
agent --output-format=json "промпт"           # CI/скрипты — вывод в JSON
```

## Slash-команды

Вводятся прямо в чат:

| Команда | Описание |
|---|---|
| `/help` | Список всех команд |
| `/clear` | Сбросить контекст (= `/reset`, `/new`) |
| `/compact` | Принудительно сжать контекст через LLM |
| `/context` | Прогресс-бар заполненности контекста (= `/usage`) |
| `/export [файл]` | Сохранить историю в файл |
| `/recap` | Краткое резюме текущей сессии |
| `/btw <вопрос>` | Вопрос к модели без добавления в историю |
| `/diff` | Показать `git diff HEAD` |
| `/rewind` | Откат к одному из чекпоинтов (= `/undo`, `/checkpoint`) |
| `/review [фокус]` | Передать `git diff HEAD` агенту для код-ревью |
| `/security-review` | Ревью на уязвимости (SQLi, XSS, command injection и др.) |
| `/simplify [фокус]` | Три параллельных агента: DRY, качество кода, производительность |
| `/batch <задача>` | Агент декомпозирует задачу и запускает подзадачи параллельно |
| `/loop [N] <промпт>` | Запускать промпт каждые N секунд/минут/часов; повторный `/loop` останавливает |
| `/resume` | Восстановить предыдущую сессию (сессия сохраняется автоматически при выходе) |
| `/model` | Информация о текущей модели |

## Инструменты агента

| Инструмент | Описание |
|---|---|
| `read_file` | Читает файл, поддерживает изображения (PNG/JPG/GIF/WEBP) |
| `write_file` | Создаёт или перезаписывает файл |
| `edit_file` | Точечная замена строки с показом diff перед записью |
| `glob` | Поиск файлов по паттерну (`src/**/*.js`) |
| `grep` | Поиск по содержимому файлов с поддержкой regex |
| `bash` | Выполнение shell-команд (с sandbox по умолчанию) |
| `web_search` | Поиск через DuckDuckGo без API-ключа |
| `todo_write` / `todo_read` | Список задач с зависимостями внутри сессии |
| `task` | Запуск подагентов: синхронно, параллельно или в фоне |

## Конфигурация

Создаётся автоматически при первом запуске в `.agent/settings.json`:

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
  "language": "Russian"
}
```

| Поле | Описание |
|---|---|
| `alwaysAllow` | Инструменты без запроса подтверждения |
| `neverAllow` | Инструменты, которые всегда блокируются |
| `disallowedTools` | Инструменты, скрытые от модели полностью |
| `dangerouslyDisableSandbox` | Снять ограничения sandbox в bash |
| `mcpServers` | Подключение MCP-серверов |
| `language` | Язык ответов агента (например `"Russian"`, `"English"`). Если не задан — агент подстраивается под язык пользователя |

## Память (AGENT.md)

Агент автоматически читает эти файлы и добавляет в системный промпт:

| Файл | Назначение |
|---|---|
| `~/.agent/AGENT.md` | Глобальные настройки для всех проектов |
| `.agent/AGENT.md` | Настройки текущего проекта |
| `AGENT.md` | Инструкции в корне репозитория |

## MCP-серверы

Любой MCP-сервер подключается через `.agent/settings.json`:

```json
"mcpServers": {
  "fs": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
  }
}
```

Инструменты сервера регистрируются автоматически как `mcp__fs__<tool>`.

## Хуки

Shell-команды, запускаемые на события агента (`.agent/hooks.json`):

```json
{
  "PreToolUse": [{ "command": "cat >> agent.log" }],
  "PostToolUse": [],
  "UserPromptSubmit": [],
  "PreCompact": [],
  "Stop": []
}
```

`PreToolUse` может заблокировать выполнение инструмента (exit code != 0).

## Смена модели

По умолчанию используется DeepSeek. В `src/agent.js` можно поменять `baseURL`, в `.agent/settings.json` — `model`:

```
DeepSeek (по умолчанию)  baseURL: https://api.deepseek.com      model: deepseek-chat
OpenAI                   без baseURL                             model: gpt-4o
Ollama (локально)        baseURL: http://localhost:11434/v1      model: qwen2.5-coder
Groq                     baseURL: https://api.groq.com/openai/v1 model: llama-3.3-70b-versatile
```

## JSON-режим (CI/скрипты)

```bash
agent --output-format=json "что делает index.js?"
echo "напиши hello world" | agent --output-format=json
```

Каждое событие — отдельная строка JSON:

```json
{ "type": "text", "text": "фрагмент ответа" }
{ "type": "tool_call", "tool": "bash", "args": { "command": "ls" } }
{ "type": "tool_result", "tool": "bash", "result": "file1.js\nfile2.js" }
```

## Зависимости

| Пакет | Зачем |
|---|---|
| `openai` | Клиент DeepSeek API (OpenAI-совместимый) |
| `@modelcontextprotocol/sdk` | MCP-клиент |
| `fast-glob` | Поиск файлов в `glob` и `grep` |
| `dotenv` | Загрузка `.env` |

## Лицензия

[Смотри LICENSE](./LICENSE) — только личное использование.
