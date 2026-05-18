import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ToolCallCard from './ToolCallCard.jsx'

export default function Chat({ messages }) {
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg, idx) => (
        <div key={idx} className="flex flex-col">
          {msg.role === 'user' && (
            <div className="self-end bg-purple-600 text-white px-4 py-2 rounded-lg max-w-2xl">
              {msg.content}
            </div>
          )}
          {msg.role === 'assistant' && (
            <div className="self-start bg-gray-800 text-gray-100 px-4 py-2 rounded-lg max-w-2xl">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="bg-gray-700 px-1 py-0.5 rounded" {...props}>
                        {children}
                      </code>
                    )
                  }
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          )}
          {msg.role === 'tool_call' && (
            <ToolCallCard tool={msg.tool} args={msg.args} />
          )}
          {msg.role === 'tool_result' && (
            <div className="self-start bg-gray-900 text-gray-300 px-4 py-2 rounded-lg max-w-2xl text-sm font-mono">
              <div className="text-gray-500 mb-1">Result:</div>
              <pre className="whitespace-pre-wrap">{msg.result}</pre>
            </div>
          )}
          {msg.role === 'error' && (
            <div className="self-start bg-red-900/50 text-red-300 px-4 py-2 rounded-lg max-w-2xl">
              Error: {msg.message}
            </div>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}
