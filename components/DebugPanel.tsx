import { useSocket } from '../context/SocketContext'
import { useWallet } from '../context/WalletContext'

export default function DebugPanel() {
  const { socket, onlineUsers } = useSocket()
  const { account } = useWallet()

  const sendTestMessage = () => {
    if (socket && account) {
      const testMessage = {
        id: `test_${Date.now()}`,
        sender: account,
        receiver: '0x1234567890123456789012345678901234567890', // Replace with actual test address
        content: 'Test message from debug panel',
        timestamp: new Date(),
        type: 'text'
      }
      
      console.log('Sending test message:', testMessage)
      socket.emit('sendMessage', testMessage)
    }
  }

  const checkConnection = () => {
    console.log('Socket connected:', !!socket)
    console.log('Socket ID:', socket?.id)
    console.log('Current user:', account)
    console.log('Online users:', onlineUsers)
  }

  const testAudioCall = () => {
    if (socket && account) {
      const testReceiver = '0x1234567890123456789012345678901234567890' // Replace with actual test address
      console.log('Testing audio call to:', testReceiver)
      
      socket.emit('startCall', {
        caller: account,
        receiver: testReceiver,
        type: 'audio'
      })
    }
  }

  const testVideoCall = () => {
    if (socket && account) {
      const testReceiver = '0x1234567890123456789012345678901234567890' // Replace with actual test address
      console.log('Testing video call to:', testReceiver)
      
      socket.emit('startCall', {
        caller: account,
        receiver: testReceiver,
        type: 'video'
      })
    }
  }

  return (
    <div className="fixed bottom-4 right-4 glass-morphism rounded-lg p-4 max-w-xs">
      <h3 className="font-bold text-sm mb-2">Debug Panel</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Socket:</strong> {socket ? '✅ Connected' : '❌ Disconnected'}
        </div>
        <div>
          <strong>User:</strong> {account ? `${account.slice(0, 6)}...` : 'None'}
        </div>
        <div>
          <strong>Online:</strong> {onlineUsers.length} users
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <button
          onClick={checkConnection}
          className="w-full text-xs bg-blue-500 text-white px-2 py-1 rounded"
        >
          Check Connection
        </button>
        <button
          onClick={sendTestMessage}
          className="w-full text-xs bg-green-500 text-white px-2 py-1 rounded"
        >
          Send Test Message
        </button>
        <button
          onClick={testAudioCall}
          className="w-full text-xs bg-purple-500 text-white px-2 py-1 rounded"
        >
          Test Audio Call
        </button>
        <button
          onClick={testVideoCall}
          className="w-full text-xs bg-red-500 text-white px-2 py-1 rounded"
        >
          Test Video Call
        </button>
      </div>
    </div>
  )
}