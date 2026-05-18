import { File, Check, X } from 'lucide-react'

export default function ChangedFiles({ changedFiles, onApproveAll, onRejectAll }) {
  return (
    <div className="bg-gray-900 border-l border-gray-800 h-full overflow-y-auto">
      <div className="p-2 border-b border-gray-800">
        <h3 className="text-xs font-semibold text-gray-400 uppercase">Changed Files</h3>
      </div>
      <div className="p-2 space-y-2">
        {changedFiles?.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">No changes</div>
        ) : (
          <>
            <div className="flex gap-2 mb-2">
              <button
                onClick={onApproveAll}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded flex items-center justify-center gap-1"
              >
                <Check size={12} />
                Approve All
              </button>
              <button
                onClick={onRejectAll}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded flex items-center justify-center gap-1"
              >
                <X size={12} />
                Reject All
              </button>
            </div>
            {changedFiles.map((file, idx) => (
              <div key={idx} className="bg-gray-800 rounded p-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <File size={14} />
                  <span className="truncate">{file.path}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {file.type === 'write' ? 'New file' : file.type === 'edit' ? 'Modified' : 'Deleted'}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
