import { useAgent } from './hooks/useAgent'
import Chat from './components/Chat'
import MessageInput from './components/MessageInput'
import PermissionModal from './components/PermissionModal'
import FileTree from './components/FileTree'
import ActivityPanel from './components/ActivityPanel'
import ChangedFiles from './components/ChangedFiles'
import { Brain, Wifi, WifiOff } from 'lucide-react'

function App() {
  const { 
    messages, 
    isConnected, 
    isThinking, 
    pendingPermission, 
    fileTree,
    activities,
    changedFiles,
    sendMessage, 
    answerPermission,
    approveAllChanges,
    rejectAllChanges
  } = useAgent()

  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-2">
          <Brain className="text-purple-500" size={24} />
          <h1 className="text-xl font-semibold text-white">DeepSeek Agent</h1>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {isConnected ? (
            <div className="flex items-center gap-1 text-green-400">
              <Wifi size={16} />
              Connected
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-400">
              <WifiOff size={16} />
              Disconnected
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - File Tree */}
        <div className="w-64 flex-shrink-0">
          <FileTree files={fileTree} />
        </div>

        {/* Center - Chat */}
        <div className="flex-1 flex flex-col">
          <Chat messages={messages} />
          
          {/* Thinking Indicator */}
          {isThinking && (
            <div className="px-4 py-2 text-gray-400 text-sm flex items-center gap-2">
              <div className="animate-pulse">Agent is thinking...</div>
            </div>
          )}

          {/* Input Area */}
          <MessageInput onSend={sendMessage} disabled={isThinking || !isConnected} />
        </div>

        {/* Right Sidebar - Activity & Changed Files */}
        <div className="w-64 flex-shrink-0 flex flex-col">
          <div className="flex-1">
            <ActivityPanel activities={activities} />
          </div>
          <div className="h-64">
            <ChangedFiles 
              changedFiles={changedFiles} 
              onApproveAll={approveAllChanges}
              onRejectAll={rejectAllChanges}
            />
          </div>
        </div>
      </div>

      {/* Permission Modal */}
      <PermissionModal permission={pendingPermission} onAnswer={answerPermission} />
    </div>
  )
}

export default App
