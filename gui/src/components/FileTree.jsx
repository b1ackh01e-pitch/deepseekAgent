import { useState } from 'react'
import { Folder, File, ChevronRight, ChevronDown } from 'lucide-react'

export default function FileTree({ files, onFileSelect }) {
  const [expanded, setExpanded] = useState({})

  const toggleExpand = (path) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }))
  }

  const renderNode = (node, path = '') => {
    if (node.type === 'file') {
      return (
        <div 
          key={path}
          className="flex items-center gap-2 px-2 py-1 hover:bg-gray-800 cursor-pointer text-sm text-gray-300"
          onClick={() => onFileSelect?.(path)}
        >
          <File size={14} />
          <span>{node.name}</span>
        </div>
      )
    }

    const isExpanded = expanded[path]
    return (
      <div key={path}>
        <div 
          className="flex items-center gap-2 px-2 py-1 hover:bg-gray-800 cursor-pointer text-sm text-gray-300"
          onClick={() => toggleExpand(path)}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <Folder size={14} />
          <span>{node.name}</span>
        </div>
        {isExpanded && node.children && (
          <div className="ml-4">
            {node.children.map(child => renderNode(child, `${path}/${child.name}`))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border-r border-gray-800 h-full overflow-y-auto">
      <div className="p-2 border-b border-gray-800">
        <h3 className="text-xs font-semibold text-gray-400 uppercase">Files</h3>
      </div>
      <div className="p-2">
        {files?.map(node => renderNode(node, node.name))}
      </div>
    </div>
  )
}
