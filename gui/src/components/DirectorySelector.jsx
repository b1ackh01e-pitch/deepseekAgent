import { useState } from 'react'
import { FolderOpen } from 'lucide-react'

export default function DirectorySelector({ currentDir, onChange }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleChange = (e) => {
    const newDir = e.target.value
    onChange?.(newDir)
  }

  return (
    <div className="p-2 border-b border-gray-800">
      <div className="flex items-center gap-2">
        <FolderOpen size={14} className="text-purple-400" />
        <input
          type="text"
          value={currentDir || process.cwd()}
          onChange={handleChange}
          className="flex-1 bg-transparent text-xs text-gray-300 border-none focus:outline-none focus:ring-0"
          placeholder="Working directory..."
        />
      </div>
    </div>
  )
}
