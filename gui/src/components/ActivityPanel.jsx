import { Terminal, FileEdit, Search, GitBranch } from 'lucide-react'

export default function ActivityPanel({ activities }) {
  const getIcon = (type) => {
    switch (type) {
      case 'bash': return <Terminal size={14} />
      case 'read_file':
      case 'write_file':
      case 'edit_file': return <FileEdit size={14} />
      case 'web_search': return <Search size={14} />
      case 'glob':
      case 'grep': return <GitBranch size={14} />
      default: return <Terminal size={14} />
    }
  }

  const getColor = (type) => {
    switch (type) {
      case 'bash': return 'text-cyan-400'
      case 'read_file': return 'text-blue-400'
      case 'write_file': return 'text-green-400'
      case 'edit_file': return 'text-yellow-400'
      case 'web_search': return 'text-purple-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="bg-gray-900 border-r border-gray-800 h-full overflow-y-auto">
      <div className="p-2 border-b border-gray-800">
        <h3 className="text-xs font-semibold text-gray-400 uppercase">Activity</h3>
      </div>
      <div className="p-2 space-y-2">
        {activities?.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">No activity yet</div>
        ) : (
          activities.map((activity, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm">
              <div className={`mt-0.5 ${getColor(activity.type)}`}>
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-gray-300 font-medium">{activity.type}</div>
                <div className="text-gray-500 text-xs truncate">{activity.description}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
