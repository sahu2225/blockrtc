import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  sender: string
  receiver: string
  content: string
  timestamp: Date
  type: 'text' | 'audio' | 'video'
}

interface ChatWindowProps {
  contact: string
  messages: Message[]
  onSendMessage: (content: string, type?: 'text' | 'audio' | 'video') => void
  onStartVideoCall: () => void
  onStartAudioCall: () => void
  currentUser: string
  connectionState?: string
  onBack?: () => void
}

export default function ChatWindow({
  contact,
  messages,
  onSendMessage,
  onStartVideoCall,
  onStartAudioCall,
  currentUser,
  connectionState = 'disconnected',
  onBack
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim())
      setNewMessage('')
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex-1 flex flex-col bg-transparent w-full h-full">
      {/* Fixed Header with Contact Info and Call Buttons */}
      <div className="flex-shrink-0 p-6 flex items-center justify-between bg-transparent">
        <div className="flex items-center">
          {onBack && (
            <button onClick={onBack} className="mr-4 text-text-secondary hover:text-text-primary transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <img className="w-12 h-12 rounded-full mr-4" src={`https://i.pravatar.cc/150?u=${contact}`} alt={contact} />
          <div>
            <h2 className="font-semibold text-text-primary">{formatAddress(contact)}</h2>
            <p className="text-sm text-online-green">
              {connectionState === 'connected' ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        
        {/* Audio and Video Call Buttons */}
        <div className="flex items-center space-x-3">
          <button 
            onClick={onStartAudioCall}
            className="p-3 text-text-secondary hover:text-accent-blue hover:bg-blue-50 rounded-xl transition-all duration-200"
            title="Start Audio Call"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          
          <button 
            onClick={onStartVideoCall}
            className="p-3 text-text-secondary hover:text-accent-blue hover:bg-blue-50 rounded-xl transition-all duration-200"
            title="Start Video Call"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          
          <button className="p-3 text-text-secondary hover:text-text-primary rounded-xl transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Scrollable Messages Section */}
      <div className="flex-1 bg-white rounded-2xl shadow-soft mx-6 mb-6 flex flex-col min-h-0">
        <div className="flex-1 p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-text-secondary">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-lg">No messages yet</p>
                <p className="text-sm">Start a conversation with {formatAddress(contact)}</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div key={index} className={`flex mb-4 ${message.sender === currentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-xl max-w-lg ${message.sender === currentUser ? 'bg-accent-blue text-white' : 'bg-gray-100 text-text-primary'}`}>
                    <p className="break-words">{message.content}</p>
                    <p className={`text-xs mt-2 ${message.sender === currentUser ? 'text-blue-200' : 'text-text-secondary'}`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>
      
      {/* Fixed Input Section */}
      <div className="flex-shrink-0 p-6 pt-0">
        <form onSubmit={handleSendMessage} className="flex items-center bg-white rounded-2xl shadow-soft p-2">
          <button type="button" className="p-3 text-text-secondary hover:text-accent-blue transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent focus:outline-none px-4 py-2"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="p-3 bg-accent-blue text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
