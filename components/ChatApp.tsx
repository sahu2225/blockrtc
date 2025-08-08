import { useState, useEffect } from 'react'
import { useWallet } from '../context/WalletContext'
import { useSocket } from '../context/SocketContext'
import { useP2P } from '../context/P2PContext'
import Sidebar from './Sidebar'
import ChatWindow from './ChatWindow'
import VideoCall from './VideoCall'
import AudioCall from './AudioCallSimple'
import DebugPanel from './DebugPanel'

interface Message {
  id: string
  sender: string
  receiver: string
  content: string
  timestamp: Date
  type: 'text' | 'audio' | 'video'
}

interface Contact {
  address: string
  lastMessage?: string
  timestamp?: Date
  unreadCount?: number
}

export default function ChatApp() {
  const { account, disconnectWallet } = useWallet()
  const { socket } = useSocket()
  const p2pContext = useP2P()
  const { sendP2PMessage, messages: p2pMessages = [], connectionStates, initializeP2PConnection, startP2PCall } = p2pContext || {
    sendP2PMessage: async () => false,
    messages: [],
    connectionStates: new Map(),
    initializeP2PConnection: async () => { },
    startP2PCall: async () => { }
  }
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [localMessages, setLocalMessages] = useState<Message[]>([])
  const [isVideoCallActive, setIsVideoCallActive] = useState(false)
  const [isAudioCallActive, setIsAudioCallActive] = useState(false)
  const [incomingCall, setIncomingCall] = useState<any>(null)

  // Load data from localStorage on mount
  useEffect(() => {
    loadStoredData()
    console.log('ChatApp initialized with P2P messages:', p2pMessages.length)
  }, [account, p2pMessages])

  const loadStoredData = () => {
    if (!account) return

    // Load contacts
    const storedContacts = localStorage.getItem(`contacts_${account}`)
    if (storedContacts) {
      const parsedContacts = JSON.parse(storedContacts).map((contact: any) => ({
        ...contact,
        timestamp: contact.timestamp ? new Date(contact.timestamp) : undefined
      }))
      setContacts(parsedContacts)
    }

    // Load local messages (server-based messages)
    const storedMessages = localStorage.getItem(`local_messages_${account}`)
    if (storedMessages) {
      const parsedMessages = JSON.parse(storedMessages).map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
      setLocalMessages(parsedMessages)
    }
  }

  const saveLocalMessages = (newMessages: Message[]) => {
    if (account) {
      localStorage.setItem(`local_messages_${account}`, JSON.stringify(newMessages))
    }
  }

  const saveContacts = (newContacts: Contact[]) => {
    if (account) {
      localStorage.setItem(`contacts_${account}`, JSON.stringify(newContacts))
    }
  }

  useEffect(() => {
    if (socket) {
      // Server message handling
      socket.on('receiveMessage', (message: Message) => {
        console.log('Received server message:', message)
        const newMessage = {
          ...message,
          timestamp: new Date(message.timestamp)
        }

        // Add to local messages immediately
        setLocalMessages(prev => {
          // Avoid duplicates
          if (prev.find(m => m.id === newMessage.id)) {
            return prev
          }
          const updated = [...prev, newMessage]
          saveLocalMessages(updated)
          return updated
        })

        updateContactLastMessage(newMessage)
      })

      // Server sync is no longer needed with P2P architecture
      socket.on('syncMessages', (serverMessages: Message[]) => {
        console.log('Server sync received (legacy):', serverMessages.length, 'messages')
        // P2P messages are handled by P2P context
      })

      socket.on('syncContacts', (serverContacts: Contact[]) => {
        if (serverContacts.length > 0) {
          const syncedContacts = serverContacts.map(contact => ({
            ...contact,
            timestamp: contact.timestamp ? new Date(contact.timestamp) : undefined
          }))
          setContacts(syncedContacts)
          saveContacts(syncedContacts)
          console.log(`Synced ${syncedContacts.length} contacts from server`)
        }
      })

      socket.on('incomingCall', (callData) => {
        console.log('Incoming call received:', callData)
        setIncomingCall(callData)
      })

      socket.on('callAccepted', (callData) => {
        console.log('Call accepted:', callData)
        if (callData?.type === 'audio') {
          setIsAudioCallActive(true)
          console.log('Audio call activated')
        } else {
          setIsVideoCallActive(true)
          console.log('Video call activated')
        }
        setIncomingCall(null)
      })

      socket.on('callRejected', () => {
        console.log('Call rejected')
        setIncomingCall(null)
      })

      socket.on('callEnded', () => {
        console.log('Call ended')
        setIsVideoCallActive(false)
        setIsAudioCallActive(false)
        setIncomingCall(null)
      })

      return () => {
        socket.off('receiveMessage')
        socket.off('syncMessages')
        socket.off('syncContacts')
        socket.off('incomingCall')
        socket.off('callAccepted')
        socket.off('callRejected')
        socket.off('callEnded')
      }
    }
  }, [socket])

  const updateContactLastMessage = (message: Message) => {
    setContacts(prev => {
      const existingContact = prev.find(c =>
        c.address === message.sender || c.address === message.receiver
      )
      const contactAddress = message.sender === account ? message.receiver : message.sender

      let updated: Contact[]
      if (existingContact) {
        updated = prev.map(c =>
          c.address === contactAddress
            ? { ...c, lastMessage: message.content, timestamp: message.timestamp }
            : c
        )
      } else {
        updated = [...prev, {
          address: contactAddress,
          lastMessage: message.content,
          timestamp: message.timestamp
        }]
      }

      saveContacts(updated)
      return updated
    })
  }

  const sendMessage = async (content: string, type: 'text' | 'audio' | 'video' = 'text') => {
    if (!selectedContact) {
      console.log('Cannot send message - no contact selected')
      return
    }

    const messageId = `${Date.now()}_${Math.random()}`
    const message: Message = {
      id: messageId,
      sender: account!,
      receiver: selectedContact,
      content,
      timestamp: new Date(),
      type
    }

    console.log('Sending message:', message)

    // Add message to local state immediately for instant UI feedback
    setLocalMessages(prev => {
      const updated = [...prev, message]
      saveLocalMessages(updated)
      return updated
    })
    updateContactLastMessage(message)

    // Try both P2P and server simultaneously for speed
    const p2pPromise = sendP2PMessage(selectedContact, content, type).catch(err => {
      console.log('P2P send failed:', err)
      return false
    })

    // Always send via server as backup (fast)
    if (socket) {
      console.log('Sending message via server:', message)
      socket.emit('sendMessage', message)
      console.log('Message sent via server to:', selectedContact)
    } else {
      console.error('No socket connection available!')
    }

    // Check P2P result but don't wait for it
    p2pPromise.then(success => {
      if (success) {
        console.log('P2P message sent successfully')
      }
    })
  }

  const startVideoCall = async () => {
    if (!selectedContact) return

    console.log('Starting video call to:', selectedContact)

    // Use server-based call signaling (reliable)
    if (socket) {
      socket.emit('startCall', {
        caller: account,
        receiver: selectedContact,
        type: 'video'
      })
      console.log('Video call request sent via server')
    } else {
      console.error('No socket connection for video call')
    }

    // Try P2P call in background (enhancement)
    try {
      await startP2PCall(selectedContact, true)
      console.log('P2P video call initiated')
    } catch (error) {
      console.log('P2P video call failed:', error)
    }
  }

  const startAudioCall = async () => {
    if (!selectedContact) return

    console.log('Starting audio call to:', selectedContact)

    // Use server-based call signaling (reliable)
    if (socket) {
      socket.emit('startCall', {
        caller: account,
        receiver: selectedContact,
        type: 'audio'
      })
      console.log('Audio call request sent via server')
    } else {
      console.error('No socket connection for audio call')
    }

    // Try P2P call in background (enhancement)
    try {
      await startP2PCall(selectedContact, false)
      console.log('P2P audio call initiated')
    } catch (error) {
      console.log('P2P audio call failed:', error)
    }
  }

  const acceptCall = () => {
    if (!socket || !incomingCall) {
      console.error('Cannot accept call - missing socket or call data')
      return
    }

    console.log('Accepting call:', incomingCall)

    socket.emit('acceptCall', {
      callId: incomingCall.id,
      type: incomingCall.type
    })

    // Activate call UI immediately
    if (incomingCall.type === 'audio') {
      setIsAudioCallActive(true)
      console.log('Audio call UI activated')
    } else {
      setIsVideoCallActive(true)
      console.log('Video call UI activated')
    }
    setIncomingCall(null)
  }

  const rejectCall = () => {
    if (!socket || !incomingCall) {
      console.error('Cannot reject call - missing socket or call data')
      return
    }

    console.log('Rejecting call:', incomingCall)
    socket.emit('rejectCall', { callId: incomingCall.id })
    setIncomingCall(null)
  }

  const endCall = () => {
    if (!socket) {
      console.error('Cannot end call - no socket connection')
      return
    }

    console.log('Ending call')
    socket.emit('endCall')
    setIsVideoCallActive(false)
    setIsAudioCallActive(false)
    setIncomingCall(null)
  }

  const addContact = async (address: string) => {
    if (!contacts.find(c => c.address === address)) {
      setContacts(prev => {
        const updated = [...prev, { address }]
        saveContacts(updated)
        return updated
      })

      // Initialize P2P connection
      try {
        await initializeP2PConnection(address)
        console.log('P2P connection initialized for:', address)
      } catch (error) {
        console.log('Failed to initialize P2P connection:', error)
      }
    }
    setSelectedContact(address)
  }

  // Combine P2P messages and local messages, filter by selected contact
  const allMessages = [
    // P2P messages converted to Message format
    ...p2pMessages
      .filter(msg => {
        return (msg.sender === account && selectedContact) ||
          (msg.sender === selectedContact && selectedContact)
      })
      .map(msg => ({
        id: msg.id,
        sender: msg.sender,
        receiver: msg.sender === account ? selectedContact || '' : account || '',
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        type: msg.type as 'text' | 'audio' | 'video'
      })),
    // Local messages (server-based)
    ...localMessages.filter(msg =>
      (msg.sender === account && msg.receiver === selectedContact) ||
      (msg.sender === selectedContact && msg.receiver === account)
    )
  ]

  // Remove duplicates and sort by timestamp
  const filteredMessages = allMessages
    .filter((msg, index, arr) =>
      arr.findIndex(m => m.id === msg.id) === index
    )
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="flex h-screen bg-brand-light">
      <div className="w-full h-full flex app-container overflow-hidden">
        {isMobile ? (
          selectedContact ? (
            <ChatWindow
              contact={selectedContact}
              messages={filteredMessages}
              onSendMessage={sendMessage}
              onStartVideoCall={startVideoCall}
              onStartAudioCall={startAudioCall}
              currentUser={account!}
              connectionState={selectedContact ? connectionStates.get(selectedContact) || 'disconnected' : 'disconnected'}
              onBack={() => setSelectedContact(null)}
            />
          ) : (
            <Sidebar
              contacts={contacts}
              selectedContact={selectedContact}
              onSelectContact={setSelectedContact}
              onAddContact={addContact}
              onDisconnect={disconnectWallet}
              currentUser={account!}
            />
          )
        ) : (
          <>
            <Sidebar
              contacts={contacts}
              selectedContact={selectedContact}
              onSelectContact={setSelectedContact}
              onAddContact={addContact}
              onDisconnect={disconnectWallet}
              currentUser={account!}
            />
            <div className="flex-1 flex flex-col">
              {selectedContact ? (
                <ChatWindow
                  contact={selectedContact}
                  messages={filteredMessages}
                  onSendMessage={sendMessage}
                  onStartVideoCall={startVideoCall}
                  onStartAudioCall={startAudioCall}
                  currentUser={account!}
                  connectionState={selectedContact ? connectionStates.get(selectedContact) || 'disconnected' : 'disconnected'}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-transparent">
                  <div className="text-center">
                    <h2 className="text-2xl font-semibold text-text-primary mb-2">Welcome to BlockRTC</h2>
                    <p className="text-text-secondary">Select a contact to start a conversation</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                {incomingCall.type === 'audio' ? (
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Incoming {incomingCall.type === 'audio' ? 'Audio' : 'Video'} Call
              </h3>
              <div className="h-1 w-16 bg-blue-500 mx-auto mb-4 rounded-full"></div>
              <p className="text-gray-600 text-lg mb-6">
                {incomingCall.caller.slice(0, 6)}...{incomingCall.caller.slice(-4)}
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={rejectCall}
                  className="btn-secondary flex-1 !bg-red-50 !text-red-600 !border-red-200 hover:!bg-red-100"
                >
                  Decline
                </button>
                <button
                  onClick={acceptCall}
                  className="btn-primary flex-1 !bg-green-500 hover:!bg-green-600"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audio Call Component */}
      {isAudioCallActive && (
        <AudioCall
          isActive={isAudioCallActive}
          onEndCall={endCall}
          remoteUser={selectedContact!}
        />
      )}

      {/* Video Call Component */}
      {isVideoCallActive && (
        <VideoCall
          isActive={isVideoCallActive}
          onEndCall={endCall}
          remoteUser={selectedContact!}
        />
      )}

      {/* Debug Panel */}
      <DebugPanel />
    </div>
  )
}
