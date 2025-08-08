import { useState } from 'react'

interface AudioCallProps {
  isActive: boolean
  onEndCall: () => void
  remoteUser: string
}

export default function AudioCallSimple({ isActive, onEndCall, remoteUser }: AudioCallProps) {
  const [isMuted, setIsMuted] = useState(false)

  if (!isActive) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
        <h2 className="text-xl font-semibold mb-4">Audio Call</h2>
        <p className="mb-4">{remoteUser.slice(0, 6)}...{remoteUser.slice(-4)}</p>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-500'} text-white`}
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
          
          <button
            onClick={onEndCall}
            className="p-3 bg-red-500 text-white rounded-full"
          >
            End Call
          </button>
        </div>
      </div>
    </div>
  )
}