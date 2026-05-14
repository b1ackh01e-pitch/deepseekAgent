export const BINARY_EXTS = new Set([
  // исполняемые и библиотеки
  ".exe", ".dll", ".so", ".dylib", ".bin", ".elf", ".com",
  // архивы
  ".zip", ".tar", ".gz", ".bz2", ".xz", ".7z", ".rar", ".tgz",
  // скомпилированные
  ".class", ".pyc", ".pyo", ".pyd", ".o", ".a", ".wasm",
  // медиа
  ".mp3", ".mp4", ".avi", ".mov", ".mkv", ".wav", ".flac", ".ogg", ".webm",
  // изображения
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".ico", ".tiff",
  // документы (бинарные форматы)
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  // шрифты
  ".ttf", ".otf", ".woff", ".woff2",
  // базы данных
  ".db", ".sqlite", ".sqlite3", ".mdb",
  // прочее
  ".map",
])
