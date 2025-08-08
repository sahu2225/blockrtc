import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSocket } from './SocketContext'
import { useWallet } from './WalletContext'
import { WebRTCManager, P2PMessage } from '../utils/webrtc'
import { SecureStorage, EncryptionManager } from '../utils/encryption'

interface P2PContextType {
  connections: Map<string, WebRTCManager>
  sendP2PMessage: (targetAddress: string, content: string, type?: 'text' | 'audio' | 'video') => Promise<boolean>
  messages: P2PMessage[]
  connectionStates: Map<string, string>
  initializeP2PConnection: (targetAddress: string) => Promise<void>
  startP2PCall: (targetAddress: string, video?: boolean) => Promise<void>
}

const P2PContext = createContext<P2PContextType | undefined>(undefined)

export function P2PProvider({ children }: { children: ReactNode }) {
  const [connections, setConnections] = useState<Map<string, WebRTCManager>>(new Map())
  const [messages, setMessages] = useState<P2PMessage[]>([])
  const [connectionStates, setConnectionStates] = useState<Map<string, string>>(new Map())
  const { socket } = useSocket()
  const { account, isAuthenticated } = useWallet()
  
  // Initialize secure storage with error handling
  const [secureStorage] = useState(() => {
    try {
      return new SecureStorage()
    } catch (error) {
      console.error('Failed to initialize secure storage:', error)
      return null
    }
  })

  useEffect(() => {
    console.log('P2P Context effect:', { socket: !!socket, account, isAuthenticated })
    if (socket && account && isAuthenticated) {
      console.log('Initializing P2P context...')
      setupSignalingHandlers()
      loadStoredMessages()
      initializeEncryption()
    }
  }, [socket, account, isAuthenticated])

  const initializeEncryption = async () => {
    try {
      // Get or create encryption signature
      let signature = localStorage.getItem(`encryption_sig_${account}`)
      if (!signature) {
        // In a real app, you'd get this from wallet signing
        signature = `signature_${account}_${Date.now()}`
        localStorage.setItem(`encryption_sig_${account}`, signature)
      }

      const encryption = EncryptionManager.getInstance()
      await encryption.initializeKey(account!, signature)
    } catch (error) {
      console.error('Failed to initialize encryption:', error)
    }
  }

  const loadStoredMessages = async () => {
    try {
      if (secureStorage && account) {
        const storedMessages = await secureStorage.getItem<P2PMessage[]>(`p2p_messages_${account}`)
        if (storedMessages) {
          setMessages(storedMessages)
        }
      } else {
        // Fallback to regular localStorage
        const stored = localStorage.getItem(`p2p_messages_${account}`)
        if (stored) {
          const parsedMessages = JSON.parse(stored)
          setMessages(parsedMessages)
        }
      }
    } catch (error) {
      console.error('Failed to load stored messages:', error)
      // Try fallback
      try {
        const stored = localStorage.getItem(`p2p_messages_${account}`)
        if (stored) {
          const parsedMessages = JSON.parse(stored)
          setMessages(parsedMessages)
        }
      } catch (fallbackError) {
        console.error('Fallback load also failed:', fallbackError)
      }
    }
  }

  const saveMessages = async (newMessages: P2PMessage[]) => {
    try {
      if (secureStorage && account) {
        await secureStorage.setItem(`p2p_messages_${account}`, newMessages)
      } else {
        // Fallback to regular localStorage if secure storage fails
        localStorage.setItem(`p2p_messages_${account}`, JSON.stringify(newMessages))
      }
    } catch (error) {
      console.error('Failed to save messages:', error)
      // Fallback to regular localStorage
      try {
        localStorage.setItem(`p2p_messages_${account}`, JSON.stringify(newMessages))
      } catch (fallbackError) {
        console.error('Fallback save also failed:', fallbackError)
      }
    }
  }

  const setupSignalingHandlers = () => {
    if (!socket) return

    // Handle WebRTC offers
    socket.on('webrtc-offer', async (data: any) => {
      console.log('Received WebRTC offer from:', data.sender)
      const connection = getOrCreateConnection(data.sender)
      await connection.handleOffer(data.offer, data.sender)
    })

    // Handle WebRTC answers
    socket.on('webrtc-answer', async (data: any) => {
      console.log('Received WebRTC answer from:', data.sender)
      const connection = connections.get(data.sender)
      if (connection) {
        await connection.handleAnswer(data.answer)
      }
    })

    // Handle ICE candidates
    socket.on('webrtc-ice-candidate', async (data: any) => {
      console.log('Received ICE candidate from:', data.sender)
      const connection = connections.get(data.sender)
      if (connection) {
        await connection.handleIceCandidate(data.candidate)
      }
    })

    // Handle call offers
    socket.on('webrtc-call-offer', async (data: any) => {
      console.log('Received call offer from:', data.sender)
      // Handle incoming call UI here
    })
  }

  const getOrCreateConnection = (targetAddress: string): WebRTCManager => {
    let connection = connections.get(targetAddress)
    
    if (!connection) {
      console.log('Creating new WebRTC connection for:', targetAddress)
      connection = new WebRTCManager(socket, account!)
      
      // Set up message handler
      connection.onMessage((message: P2PMessage) => {
        console.log('Received P2P message:', message)
        setMessages(prev => {
          const updated = [...prev, message]
          saveMessages(updated)
          return updated
        })
      })

      // Set up connection state handler
      connection.onConnectionState((state: string) => {
        console.log(`P2P connection to ${targetAddress} state:`, state)
        setConnectionStates(prev => new Map(prev.set(targetAddress, state)))
        
        // If connection failed, we might want to retry or clean up
        if (state === 'failed' || state === 'closed') {
          console.log('Connection failed/closed, cleaning up...')
          // Don't immediately remove - let user decide to retry
        }
      })

      setConnections(prev => new Map(prev.set(targetAddress, connection!)))
    } else {
      // Check if existing connection is in a failed state and needs reset
      const currentState = connection.getConnectionState()
      if (currentState === 'failed' || currentState === 'closed') {
        console.log('Resetting failed connection for:', targetAddress)
        connection.reset()
      }
    }

    return connection
  }

  const initializeP2PConnection = async (targetAddress: string): Promise<void> => {
    try {
      console.log('Initializing P2P connection to:', targetAddress)
      const connection = getOrCreateConnection(targetAddress)
      
      // Set initial state
      setConnectionStates(prev => new Map(prev.set(targetAddress, 'connecting')))
      
      await connection.initiateConnection(targetAddress)
    } catch (error) {
      console.error('Failed to initialize P2P connection:', error)
      setConnectionStates(prev => new Map(prev.set(targetAddress, 'failed')))
      throw error
    }
  }

  const sendP2PMessage = async (
    targetAddress: string, 
    content: string, 
    type: 'text' | 'audio' | 'video' = 'text'
  ): Promise<boolean> => {
    try {
      let connection = connections.get(targetAddress)
      let retryCount = 0
      const maxRetries = 2

      while (retryCount <= maxRetries) {
        if (!connection || connection.getConnectionState() !== 'connected') {
          console.log(`Attempt ${retryCount + 1} to establish P2P connection`)
          
          try {
            await initializeP2PConnection(targetAddress)
            
            // Wait for connection to establish (reduced timeout)
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            connection = connections.get(targetAddress)
          } catch (connectionError) {
            console.error('Connection attempt failed:', connectionError)
            retryCount++
            
            if (retryCount <= maxRetries) {
              console.log('Retrying connection...')
              await new Promise(resolve => setTimeout(resolve, 500))
              continue
            } else {
              console.error('Max retries reached, giving up')
              return false
            }
          }
        }

        if (connection && connection.getConnectionState() === 'connected') {
          const message: P2PMessage = {
            id: `${Date.now()}_${Math.random()}`,
            type,
            content,
            timestamp: Date.now(),
            sender: account!
          }

          const success = connection.sendMessage(message)
          
          if (success) {
            // Add to local messages
            setMessages(prev => {
              const updated = [...prev, message]
              saveMessages(updated)
              return updated
            })
            return true
          }
        }

        retryCount++
        if (retryCount <= maxRetries) {
          console.log('Message send failed, retrying...')
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }

      console.error('Failed to send P2P message after all retries')
      return false
    } catch (error) {
      console.error('Error sending P2P message:', error)
      return false
    }
  }

  const startP2PCall = async (targetAddress: string, video: boolean = false): Promise<void> => {
    const connection = getOrCreateConnection(targetAddress)
    await connection.startCall(video)
  }

  return (
    <P2PContext.Provider value={{
      connections,
      sendP2PMessage,
      messages,
      connectionStates,
      initializeP2PConnection,
      startP2PCall
    }}>
      {children}
    </P2PContext.Provider>
  )
}

export function useP2P() {
  const context = useContext(P2PContext)
  if (context === undefined) {
    throw new Error('useP2P must be used within a P2PProvider')
  }
  return context
}