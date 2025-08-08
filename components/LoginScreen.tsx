import { useState } from 'react'
import { useWallet } from '../context/WalletContext'

export default function LoginScreen() {
  const { connectWallet, isConnected, isAuthenticated } = useWallet()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await connectWallet()
    } catch (error) {
      console.error('Connection failed:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className="max-w-md w-full text-center p-8">
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-3">Welcome to Chat</h1>
          <p className="text-blue-200 text-lg">
            {isConnected && !isAuthenticated 
              ? "Authenticating your wallet..." 
              : "Connect your MetaMask wallet to start chatting"
            }
          </p>
        </div>
        
        {!isConnected ? (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 transform hover:scale-105 shadow-lg shadow-blue-600/30"
          >
            {isConnecting ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>Connect Wallet</span>
              </>
            )}
          </button>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-blue-300 text-lg font-medium">Please sign the message...</p>
          </div>
        )}
        
        <div className="mt-12 text-blue-300 text-sm">
          <p className="mb-2">🔒 Secure Connection</p>
          <p>MetaMask wallet required for authentication</p>
          <p>Your data is encrypted and secure</p>
        </div>
      </div>
    </div>
  )
}
