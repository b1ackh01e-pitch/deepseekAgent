# DeepSeek Agent

Терминальный AI-агент — аналог Claude Code, но на DeepSeek API.

Подробная документация для разработчика: **`___.MD`**

---

## Структура

```
index.js          ← точка входа
src/
  agent.js        ← главный agent loop
  config.js       ← настройки (.agent/settings.json)
  memory.js       ← загрузка AGENT.md в system prompt
  permissions.js  ← alwaysAllow / neverAllow / [y/N]
  hooks.js        ← события (.agent/hooks.json)
  compactor.js    ← автосжатие контекста
  mcp.js          ← MCP-серверы
  thinking.js     ← --think флаг (deepseek-reasoner)
  worktree.js     ← --worktree флаг (git isolation)
  output.js       ← --output-format=json режим
  ui.js           ← ANSI-цвета, баннер
  tools/
    read.js       ← файлы + изображения (PNG/JPG/GIF/WEBP)
    write.js      ← запись файлов
    edit.js       ← замена строки + diff
    glob.js       ← поиск файлов (fast-glob)
    grep.js       ← поиск по содержимому
    bash.js       ← shell + sandbox
    web_search.js ← DuckDuckGo поиск
    todo.js       ← задачи с зависимостями (blockedBy)
    task.js       ← subagent / parallel / background
.agent/
  settings.json   ← конфиг
  hooks.json      ← хуки
  AGENT.md        ← память проекта
```

## Соглашения

- Каждый инструмент: `{ name, description, parameters, isReadOnly, execute }` — добавить в `TOOLS` в `agent.js`
- `isReadOnly: false` → проходит через `checkPermission()` перед выполнением
- Инструмент всегда возвращает строку (исключение: изображение — JSON с `__type: "image"`)
- Не использовать `.claude/` и `CLAUDE.md` внутри проекта — заняты Claude Code

## Запуск

```bash
npm start
npm start -- --think       # deepseek-reasoner
npm start -- --worktree    # git isolation
npm start -- --output-format=json "промпт"  # CI режим
```

## Зависимости

`openai`, `@modelcontextprotocol/sdk`, `fast-glob`, `dotenv`. Node >= 18.
