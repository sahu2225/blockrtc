import { useEffect, useState } from 'react'
import { useWallet } from '../context/WalletContext'
import LoginScreen from '../components/LoginScreen'
import ChatApp from '../components/ChatApp'

export default function Home() {
  const { account, isConnected, isAuthenticated } = useWallet()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {!isConnected || !isAuthenticated ? <LoginScreen /> : <ChatApp />}
    </div>
  )
}