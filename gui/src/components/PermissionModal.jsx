export default function PermissionModal({ permission, onAnswer }) {
  if (!permission) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-yellow-400 mb-4">Permission Required</h3>
        <pre className="text-sm text-gray-300 bg-gray-800 p-3 rounded mb-4 whitespace-pre-wrap">
          {permission.prompt}
        </pre>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onAnswer('y')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Yes, allow once
          </button>
          <button
            onClick={() => onAnswer('d')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Remember directory
          </button>
          <button
            onClick={() => onAnswer('a')}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
          >
            Always allow this tool
          </button>
          <button
            onClick={() => onAnswer('N')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Deny
          </button>
        </div>
      </div>
    </div>
  )
}
