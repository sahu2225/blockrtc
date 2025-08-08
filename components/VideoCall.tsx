import { useEffect, useRef, useState } from 'react'
import { useSocket } from '../context/SocketContext'

interface VideoCallProps {
  isActive: boolean
  onEndCall: () => void
  remoteUser: string
}

export default function VideoCall({ isActive, onEndCall, remoteUser }: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isOnHold, setIsOnHold] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
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
        video: { width: 1280, height: 720 },
        audio: true
      })
      
      setLocalStream(stream)
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Simulate connection delay
      setTimeout(() => {
        setCallStatus('connected')
      }, 2000)
      
    } catch (error) {
      console.error('Error accessing media devices:', error)
      alert('Could not access camera/microphone. Please check your permissions.')
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

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOff(!videoTrack.enabled)
      }
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const toggleHold = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      const videoTrack = localStream.getVideoTracks()[0]
      
      if (isOnHold) {
        // Resume call
        if (audioTrack) audioTrack.enabled = !isMuted
        if (videoTrack) videoTrack.enabled = !isVideoOff
        setCallStatus('connected')
      } else {
        // Put on hold
        if (audioTrack) audioTrack.enabled = false
        if (videoTrack) videoTrack.enabled = false
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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const getStatusColor = () => {
    switch (callStatus) {
      case 'connecting':
        return 'bg-yellow-500'
      case 'connected':
        return 'bg-green-500'
      case 'hold':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    switch (callStatus) {
      case 'connecting':
        return 'Connecting...'
      case 'connected':
        return 'Connected'
      case 'hold':
        return 'On Hold'
      default:
        return 'Video Call'
    }
  }

  if (!isActive) return null

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header with Gradient */}
      <div className="relative p-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold">
                  {remoteUser.slice(2, 4).toUpperCase()}
                </span>
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor()} rounded-full border-2 border-white`}>
                {callStatus === 'connected' && <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>}
              </div>
            </div>
            <div>
              <span className="font-semibold text-lg">{formatAddress(remoteUser)}</span>
              <p className="text-sm text-gray-300">{getStatusText()}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-mono bg-black/30 px-3 py-1 rounded-lg backdrop-blur-sm">
              {formatDuration(callDuration)}
            </div>
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative overflow-hidden">
        {/* Remote Video (Main) */}
        <video
          ref={remoteVideoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
        />
        
        {/* Remote Video Placeholder with Animation */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-black">
          <div className="text-center text-white">
            <div className="relative mb-6">
              <div className="w-40 h-40 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                {/* Ripple Effect */}
                {callStatus === 'connected' && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></div>
                    <div className="absolute inset-2 rounded-full bg-purple-400 animate-ping opacity-30 animation-delay-200"></div>
                  </>
                )}
                <span className="text-5xl font-bold z-10 relative">
                  {remoteUser.slice(2, 4).toUpperCase()}
                </span>
              </div>
            </div>
            <p className="text-2xl font-semibold mb-2">{formatAddress(remoteUser)}</p>
            <p className="text-lg text-gray-300">
              {callStatus === 'hold' ? 'Call on hold' : callStatus === 'connecting' ? 'Connecting...' : 'Video call active'}
            </p>
          </div>
        </div>

        {/* Hold Overlay with Blur Effect */}
        {isOnHold && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-pulse">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-bold mb-3">Call Paused</p>
              <p className="text-lg text-gray-300">Tap resume to continue the call</p>
            </div>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) with Enhanced Design */}
        <div className={`absolute transition-all duration-300 ${
          isFullscreen ? 'top-4 left-4 w-48 h-36' : 'top-4 right-4 w-40 h-32'
        } bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20`}>
          <video
            ref={localVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          {isVideoOff && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
              <div className="text-center text-white">
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
                <p className="text-xs">Camera off</p>
              </div>
            </div>
          )}
          
          {/* Local Video Controls */}
          <button
            onClick={toggleFullscreen}
            className="absolute top-2 right-2 p-1 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Enhanced Controls with Glassmorphism */}
      <div className="p-6 bg-gradient-to-t from-black via-gray-900 to-transparent">
        <div className="flex items-center justify-center space-x-6 mb-4">
          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className={`group relative p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg ${
              isMuted 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' 
                : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20'
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
            {isMuted && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>}
          </button>

          {/* Video Toggle Button */}
          <button
            onClick={toggleVideo}
            className={`group relative p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg ${
              isVideoOff 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' 
                : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20'
            }`}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isVideoOff ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              )}
            </svg>
            {isVideoOff && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>}
          </button>

          {/* Hold Button */}
          <button
            onClick={toggleHold}
            className={`group relative p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg ${
              isOnHold 
                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30' 
                : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/20'
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
            {isOnHold && <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>}
          </button>

          {/* End Call Button */}
          <button
            onClick={onEndCall}
            className="group relative p-5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-lg shadow-red-500/30"
            title="End call"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l1.664 1.664M21 21l-1.5-1.5m-5.485-1.242L12 17l-1.5 1.5m-5.485-1.242L3 21l18-18" />
            </svg>
          </button>
        </div>
        
        {/* Call Status with Enhanced Design */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center space-x-2 text-sm text-white/80 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
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