import { useEffect, useRef, useState } from 'react'
import { useSocket } from '../context/SocketContext'

interface AudioCallProps {
  isActive: boolean
  onEndCall: () => void
  remoteUser: string
}

export default function AudioCall({ isActive, onEndCall, remoteUser }: AudioCallProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const [isOnHold, setIsOnHold] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(false)
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'hold'>('connecting')
  const { socket } = useSocket()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isActive) {
      startCall()
      // Start call timer
      intervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive])

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      })
      
      setLocalStream(stream)
      setIsConnected(true)
      setCallStatus('connected')

      // Simulate connection delay
      setTimeout(() => {
        setCallStatus('connected')
      }, 2000)
      
    } catch (error) {
      console.error('Error accessing microphone:', error)
      alert('Could not access microphone. Please check your permissions.')
      onEndCall()
    }
  }

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const toggleHold = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      
      if (isOnHold) {
        // Resume call
        if (audioTrack) audioTrack.enabled = !isMuted
        setCallStatus('connected')
      } else {
        // Put on hold
        if (audioTrack) audioTrack.enabled = false
        setCallStatus('hold')
      }
      
      setIsOnHold(!isOnHold)
      
      // Notify other user about hold status
      if (socket) {
        socket.emit('callHold', { 
          target: remoteUser, 
          isOnHold: !isOnHold 
        })
      }
    }
  }

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn)
    // In a real implementation, you would change audio output device
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getStatusText = () => {
    switch (callStatus) {
      case 'connecting':
        return 'Connecting...'
      case 'connected':
        return 'Connected'
      case 'hold':
        return 'Call on Hold'
      default:
        return 'Audio Call'
    }
  }

  const getStatusColor = () => {
    switch (callStatus) {
      case 'connecting':
        return 'text-yellow-500'
      case 'connected':
        return 'text-green-500'
      case 'hold':
        return 'text-orange-500'
      default:
        return 'text-gray-500'
    }
  }

  if (!isActive) return null

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl border border-white/20">
        {/* User Avatar with Pulse Animation */}
        <div className="mb-8 relative">
          <div className={`w-40 h-40 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl relative ${
            callStatus === 'connected' && !isOnHold ? 'animate-pulse' : ''
          }`}>
            {/* Ripple Effect */}
            {callStatus === 'connected' && !isOnHold && (
              <>
                <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></div>
                <div className="absolute inset-2 rounded-full bg-purple-400 animate-ping opacity-30 animation-delay-200"></div>
              </>
            )}
            <span className="text-5xl font-bold text-white z-10 relative">
              {remoteUser.slice(2, 4).toUpperCase()}
            </span>
          </div>
          
          {/* Status Indicator */}
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            callStatus === 'connected' ? 'bg-green-100 text-green-800' :
            callStatus === 'hold' ? 'bg-orange-100 text-orange-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              callStatus === 'connected' ? 'bg-green-500 animate-pulse' :
              callStatus === 'hold' ? 'bg-orange-500' :
              'bg-yellow-500 animate-pulse'
            }`}></div>
            {getStatusText()}
          </div>
        </div>

        {/* Contact Info */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {formatAddress(remoteUser)}
          </h2>
          <p className="text-lg font-mono text-gray-600 bg-gray-100 rounded-xl py-2 px-4 inline-block">
            {formatDuration(callDuration)}
          </p>
        </div>

        {/* Audio Visualization */}
        <div className="mb-8">
          <div className="flex justify-center items-end space-x-1 h-12">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className={`w-1.5 rounded-full transition-all duration-300 ${
                  isOnHold 
                    ? 'h-2 bg-orange-300'
                    : !isMuted && callStatus === 'connected'
                    ? 'bg-gradient-to-t from-blue-500 to-purple-500 animate-bounce'
                    : 'h-2 bg-gray-300'
                }`}
                style={{
                  height: !isMuted && callStatus === 'connected' ? `${Math.random() * 40 + 8}px` : '8px',
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.6s'
                }}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-3">
            {isOnHold ? 'Call paused' : isMuted ? 'Microphone muted' : 'Audio active'}
          </p>
        </div>

        {/* Call Controls */}
        <div className="flex justify-center items-center space-x-4 mb-6">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`group relative p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg ${
              isMuted 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-gray-200'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMuted ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              )}
            </svg>
            {isMuted && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>}
          </button>

          {/* Hold Button */}
          <button
            onClick={toggleHold}
            className={`group relative p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg ${
              isOnHold 
                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-gray-200'
            }`}
            title={isOnHold ? 'Resume call' : 'Hold call'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOnHold ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M15 14h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            {isOnHold && <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-600 rounded-full animate-pulse"></div>}
          </button>

          {/* Speaker Button */}
          <button
            onClick={toggleSpeaker}
            className={`group relative p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg ${
              isSpeakerOn 
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 shadow-gray-200'
            }`}
            title={isSpeakerOn ? 'Turn off speaker' : 'Turn on speaker'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            {isSpeakerOn && <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>}
          </button>

          {/* End Call Button */}
          <button
            onClick={onEndCall}
            className="group relative p-5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg shadow-red-200"
            title="End Call"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l1.664 1.664M21 21l-1.5-1.5m-5.485-1.242L12 17l-1.5 1.5m-5.485-1.242L3 21l18-18" />
            </svg>
          </button>
        </div>

        {/* Call Status Footer */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>End-to-end encrypted</span>
          </div>
        </div>
      </div>
    </div>
  )
}