import { useP2P } from '../context/P2PContext'

export default function P2PStatus() {
  const { connections, connectionStates } = useP2P()

  return (
    <div className="glass-morphism rounded-2xl p-4 m-4">
      <h3 className="font-display font-bold text-calm-700 mb-3 flex items-center">
        <div className="w-3 h-3 bg-pastel-blue rounded-full mr-2 animate-soft-pulse"></div>
        P2P Network Status
      </h3>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-calm-600">Architecture:</span>
          <span className="text-pastel-purple font-medium">Peer-to-Peer</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-calm-600">Storage:</span>
          <span className="text-pastel-green font-medium">Local Encrypted</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-calm-600">Active Connections:</span>
          <span className="text-pastel-blue font-medium">{connections.size}</span>
        </div>
        
        {Array.from(connectionStates.entries()).map(([address, state]) => (
          <div key={address} className="flex items-center justify-between text-xs bg-white bg-opacity-20 rounded-lg p-2">
            <span className="text-calm-600 truncate max-w-24">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-1 ${
                state === 'connected' ? 'bg-pastel-green' : 
                state === 'connecting' ? 'bg-pastel-yellow' : 'bg-calm-400'
              }`}></div>
              <span className={`text-xs font-medium ${
                state === 'connected' ? 'text-pastel-green' : 
                state === 'connecting' ? 'text-pastel-yellow' : 'text-calm-500'
              }`}>
                {state}
              </span>
            </div>
          </div>
        ))}
        
        {connections.size === 0 && (
          <div className="text-center text-calm-500 text-xs py-2">
            No P2P connections established
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-3 border-t border-white border-opacity-20">
        <div className="text-xs text-calm-500 text-center">
          🔒 End-to-end encrypted • 🌐 Direct peer connection
        </div>
      </div>
    </div>
  )
}