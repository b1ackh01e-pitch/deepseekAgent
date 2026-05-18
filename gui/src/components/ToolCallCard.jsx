import { useState } from 'react'
import { ChevronDown, ChevronRight, Terminal, FileText, Search, GitBranch } from 'lucide-react'

export default function ToolCallCard({ tool, args }) {
  const [expanded, setExpanded] = useState(false)

  const getIcon = () => {
    switch (tool) {
      case 'bash': return <Terminal size={16} />
      case 'read_file':
      case 'write_file':
      case 'edit_file': return <FileText size={16} />
      case 'web_search': return <Search size={16} />
      case 'glob':
      case 'grep': return <GitBranch size={16} />
      default: return <Terminal size={16} />
    }
  }

  const formatArgs = () => {
    if (tool === 'bash') return args.command || ''
    if (tool === 'read_file') return args.path || ''
    if (tool === 'write_file') return args.path || ''
    if (tool === 'edit_file') return args.path || ''
    if (tool === 'web_search') return args.query || ''
    if (tool === 'glob') return args.pattern || ''
    if (tool === 'grep') return args.pattern || ''
    return JSON.stringify(args).slice(0, 100)
  }

  return (
    <div className="self-start bg-gray-900 border border-gray-700 rounded-lg max-w-2xl">
      <div 
        className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-800"
        onClick={() => setExpanded(!expanded)}
      >
        {getIcon()}
        <span className="text-cyan-400 font-medium">{tool}</span>
        <span className="text-gray-400 text-sm truncate">{formatArgs()}</span>
        {expanded ? <ChevronDown size={16} className="ml-auto" /> : <ChevronRight size={16} className="ml-auto" />}
      </div>
      {expanded && (
        <div className="px-4 pb-2">
          <pre className="text-xs text-gray-300 font-mono bg-gray-800 p-2 rounded overflow-x-auto">
            {JSON.stringify(args, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
