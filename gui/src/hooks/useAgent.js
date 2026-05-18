import { useState, useEffect, useRef, useCallback } from 'react'

export function useAgent() {
  const [messages, setMessages] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [pendingPermission, setPendingPermission] = useState(null)
  const wsRef = useRef(null)
  const currentMessageRef = useRef('')

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000')
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
    }

    ws.onclose = () => {
      setIsConnected(false)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'text':
          currentMessageRef.current += data.text
          setMessages(prev => {
            const last = prev[prev.length - 1]
            if (last && last.role === 'assistant' && !last.complete) {
              return [...prev.slice(0, -1), { ...last, content: currentMessageRef.current }]
            }
            return [...prev, { role: 'assistant', content: data.text, complete: false }]
          })
          break

        case 'tool_call':
          setMessages(prev => [...prev, { role: 'tool_call', tool: data.tool, args: data.args }])
          break

        case 'tool_result':
          setMessages(prev => [...prev, { role: 'tool_result', tool: data.tool, result: data.result }])
          break

        case 'permission':
          setPendingPermission({ id: data.id, prompt: data.prompt })
          break

        case 'done':
          setMessages(prev => {
            const last = prev[prev.length - 1]
            if (last && last.role === 'assistant') {
              return [...prev.slice(0, -1), { ...last, complete: true }]
            }
            return prev
          })
          setIsThinking(false)
          currentMessageRef.current = ''
          break

        case 'error':
          setMessages(prev => [...prev, { role: 'error', message: data.message }])
          setIsThinking(false)
          break

        case 'status':
          if (data.status === 'thinking') {
            setIsThinking(true)
          }
          break
      }
    }

    return () => {
      ws.close()
    }
  }, [])

  const sendMessage = useCallback((text) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setMessages(prev => [...prev, { role: 'user', content: text }])
      wsRef.current.send(JSON.stringify({ type: 'message', text }))
      currentMessageRef.current = ''
    }
  }, [])

  const sendCommand = useCallback((command) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'command', text: command }))
    }
  }, [])

  const answerPermission = useCallback((answer) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && pendingPermission) {
      wsRef.current.send(JSON.stringify({ type: 'permission', id: pendingPermission.id, answer }))
      setPendingPermission(null)
    }
  }, [pendingPermission])

  return {
    messages,
    isConnected,
    isThinking,
    pendingPermission,
    sendMessage,
    sendCommand,
    answerPermission
  }
}
