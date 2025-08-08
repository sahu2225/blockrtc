import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useWallet } from './WalletContext'

interface SocketContextType {
  socket: Socket | null
  onlineUsers: string[]
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const { account, isConnected, isAuthenticated } = useWallet()

  useEffect(() => {
    if (isConnected && isAuthenticated && account) {
      console.log('Connecting socket for user:', account)
      
      const newSocket = io('http://localhost:3001', {
        query: { userId: account }
      })

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id)
        // Join with user ID when connected
        newSocket.emit('join', account)
        console.log('Emitted join event for user:', account)
      })

      newSocket.on('getOnlineUsers', (users: string[]) => {
        console.log('Online users updated:', users)
        setOnlineUsers(users)
      })

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected')
      })

      setSocket(newSocket)

      return () => {
        console.log('Closing socket connection')
        newSocket.close()
      }
    } else {
      // Clear socket if not authenticated
      if (socket) {
        socket.close()
        setSocket(null)
      }
    }
  }, [isConnected, isAuthenticated, account])

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}