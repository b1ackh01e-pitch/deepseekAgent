import { useAgent } from './hooks/useAgent'
import Chat from './components/Chat'
import MessageInput from './components/MessageInput'
import PermissionModal from './components/PermissionModal'
import { Brain, Wifi, WifiOff } from 'lucide-react'

function App() {
  const { messages, isConnected, isThinking, pendingPermission, sendMessage, answerPermission } = useAgent()

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

      {/* Chat Area */}
      <Chat messages={messages} />

      {/* Thinking Indicator */}
      {isThinking && (
        <div className="px-4 py-2 text-gray-400 text-sm flex items-center gap-2">
          <div className="animate-pulse">Agent is thinking...</div>
        </div>
      )}

      {/* Input Area */}
      <MessageInput onSend={sendMessage} disabled={isThinking || !isConnected} />

      {/* Permission Modal */}
      <PermissionModal permission={pendingPermission} onAnswer={answerPermission} />
    </div>
  )
}

export default App
