const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const fs = require('fs')
const path = require('path')

const app = express()
const server = http.createServer(app)
// Production CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000"
console.log('🌐 CORS Origin:', corsOrigin)
console.log('🚀 Environment:', process.env.NODE_ENV || 'development')

const io = socketIo(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true
  }
})

app.use(cors({
  origin: corsOrigin,
  credentials: true
}))
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connections: connectedUsers ? connectedUsers.size : 0,
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3001
  })
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'BlockRTC Backend Server',
    status: 'running',
    endpoints: {
      health: '/health',
      debug_users: '/debug/users',
      debug_messages: '/debug/messages/:userId'
    }
  })
})

// Debug endpoint to check connected users
app.get('/debug/users', (req, res) => {
  const users = Array.from(connectedUsers.values())
  res.json({
    connectedUsers: users,
    totalConnections: connectedUsers.size,
    socketIds: Array.from(connectedUsers.keys())
  })
})

// Debug endpoint to check messages
app.get('/debug/messages/:userId', (req, res) => {
  const userId = req.params.userId
  const userMessages = messages.get(userId) || []
  res.json({
    userId,
    messageCount: userMessages.length,
    messages: userMessages
  })
})

// Test message endpoint
app.post('/debug/test-message', (req, res) => {
  const { sender, receiver, content } = req.body
  
  const testMessage = {
    id: `test_${Date.now()}`,
    sender,
    receiver,
    content: content || 'Test message from API',
    timestamp: new Date(),
    type: 'text'
  }
  
  console.log('🧪 Test message via API:', testMessage)
  
  const receiverSocketId = Array.from(connectedUsers.entries())
    .find(([socketId, userId]) => userId === receiver)?.[0]
  
  if (receiverSocketId) {
    io.to(receiverSocketId).emit('receiveMessage', testMessage)
    res.json({ success: true, message: 'Test message sent', testMessage })
  } else {
    res.json({ 
      success: false, 
      message: 'Receiver not found', 
      connectedUsers: Array.from(connectedUsers.values())
    })
  }
})

// Store connected users and messages
const connectedUsers = new Map()
const messages = new Map() // userId -> messages array
const userContacts = new Map() // userId -> contacts array

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir)
}

// Load stored data
const loadData = () => {
  try {
    const messagesFile = path.join(dataDir, 'messages.json')
    const contactsFile = path.join(dataDir, 'contacts.json')

    if (fs.existsSync(messagesFile)) {
      const data = JSON.parse(fs.readFileSync(messagesFile, 'utf8'))
      Object.entries(data).forEach(([userId, userMessages]) => {
        messages.set(userId, userMessages)
      })
    }

    if (fs.existsSync(contactsFile)) {
      const data = JSON.parse(fs.readFileSync(contactsFile, 'utf8'))
      Object.entries(data).forEach(([userId, contacts]) => {
        userContacts.set(userId, contacts)
      })
    }
  } catch (error) {
    console.error('Error loading data:', error)
  }
}

// Save data to files
const saveData = () => {
  try {
    const messagesData = Object.fromEntries(messages)
    const contactsData = Object.fromEntries(userContacts)

    fs.writeFileSync(
      path.join(dataDir, 'messages.json'),
      JSON.stringify(messagesData, null, 2)
    )

    fs.writeFileSync(
      path.join(dataDir, 'contacts.json'),
      JSON.stringify(contactsData, null, 2)
    )
  } catch (error) {
    console.error('Error saving data:', error)
  }
}

// Load data on startup
loadData()

// Save data every 30 seconds
setInterval(saveData, 30000)

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Handle user joining
  socket.on('join', (userId) => {
    console.log(`Join request from socket ${socket.id} for user ${userId}`)
    
    // Remove any existing connections for this user
    for (const [socketId, existingUserId] of connectedUsers.entries()) {
      if (existingUserId === userId && socketId !== socket.id) {
        connectedUsers.delete(socketId)
        console.log(`Removed duplicate connection for user ${userId}`)
      }
    }

    connectedUsers.set(socket.id, userId)
    socket.userId = userId

    // Send user their stored messages and contacts
    const userMessages = messages.get(userId) || []
    const contacts = userContacts.get(userId) || []

    socket.emit('syncMessages', userMessages)
    socket.emit('syncContacts', contacts)

    // Emit updated online users list
    const onlineUsers = Array.from(connectedUsers.values())
    io.emit('getOnlineUsers', onlineUsers)

    console.log(`✅ User ${userId} joined successfully`)
    console.log(`📊 Currently connected users (${onlineUsers.length}):`, onlineUsers)
    console.log(`🔗 Socket mapping:`, Array.from(connectedUsers.entries()).map(([sid, uid]) => `${sid} -> ${uid.slice(0, 8)}...`))
  })

  // WebRTC Signaling - Handle offers
  socket.on('webrtc-offer', (data) => {
    console.log('WebRTC offer from:', data.sender, 'to:', data.target)
    
    const targetSocketId = Array.from(connectedUsers.entries())
      .find(([socketId, userId]) => userId === data.target)?.[0]
    
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-offer', {
        offer: data.offer,
        sender: data.sender
      })
      console.log('Offer forwarded to target')
    } else {
      console.log('Target not found for offer:', data.target)
    }
  })

  // WebRTC Signaling - Handle answers
  socket.on('webrtc-answer', (data) => {
    console.log('WebRTC answer from:', data.sender, 'to:', data.target)
    
    const targetSocketId = Array.from(connectedUsers.entries())
      .find(([socketId, userId]) => userId === data.target)?.[0]
    
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-answer', {
        answer: data.answer,
        sender: data.sender
      })
      console.log('Answer forwarded to target')
    } else {
      console.log('Target not found for answer:', data.target)
    }
  })

  // Handle regular messages (server-based messaging)
  socket.on('sendMessage', (messageData) => {
    console.log('Message received from:', messageData.sender, 'to:', messageData.receiver)
    console.log('Message content:', messageData.content)
    
    // Find the receiver's socket
    const receiverSocketId = Array.from(connectedUsers.entries())
      .find(([socketId, userId]) => userId === messageData.receiver)?.[0]
    
    if (receiverSocketId) {
      console.log('Forwarding message to receiver socket:', receiverSocketId)
      io.to(receiverSocketId).emit('receiveMessage', messageData)
    } else {
      console.log('Receiver not found online:', messageData.receiver)
      console.log('Currently connected users:', Array.from(connectedUsers.values()))
    }
  })

  // WebRTC Signaling - Handle ICE candidates
  socket.on('webrtc-ice-candidate', (data) => {
    console.log('ICE candidate from:', socket.userId, 'to:', data.target)
    
    const targetSocketId = Array.from(connectedUsers.entries())
      .find(([socketId, userId]) => userId === data.target)?.[0]
    
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-ice-candidate', {
        candidate: data.candidate,
        sender: socket.userId
      })
    }
  })

  // WebRTC Signaling - Handle call offers
  socket.on('webrtc-call-offer', (data) => {
    console.log('WebRTC call offer from:', data.sender, 'to:', data.target)
    
    const targetSocketId = Array.from(connectedUsers.entries())
      .find(([socketId, userId]) => userId === data.target)?.[0]
    
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-call-offer', {
        offer: data.offer,
        sender: data.sender,
        hasVideo: data.hasVideo
      })
    }
  })

  // Helper function to update user contacts
  const updateUserContacts = (userId, contactAddress, message) => {
    const contacts = userContacts.get(userId) || []
    const existingContactIndex = contacts.findIndex(c => c.address === contactAddress)

    if (existingContactIndex >= 0) {
      contacts[existingContactIndex] = {
        ...contacts[existingContactIndex],
        lastMessage: message.content,
        timestamp: message.timestamp
      }
    } else {
      contacts.push({
        address: contactAddress,
        lastMessage: message.content,
        timestamp: message.timestamp
      })
    }

    userContacts.set(userId, contacts)
  }

  // Handle getting user messages
  socket.on('getMessages', (data) => {
    const userMessages = messages.get(data.userId) || []
    socket.emit('userMessages', userMessages)
  })

  // Handle getting user contacts
  socket.on('getContacts', (data) => {
    const contacts = userContacts.get(data.userId) || []
    socket.emit('userContacts', contacts)
  })

  // Handle call initiation
  socket.on('startCall', (callData) => {
    console.log(`📞 ${callData.type} call started from ${callData.caller} to ${callData.receiver}`)

    const receiverSocketId = Array.from(connectedUsers.entries())
      .find(([socketId, userId]) => userId === callData.receiver)?.[0]

    if (receiverSocketId) {
      console.log(`📡 Forwarding call to socket: ${receiverSocketId}`)
      io.to(receiverSocketId).emit('incomingCall', {
        id: socket.id,
        caller: callData.caller,
        type: callData.type
      })
    } else {
      console.log(`❌ Receiver not found for call: ${callData.receiver}`)
      console.log(`📊 Available users:`, Array.from(connectedUsers.values()))
    }
  })

  // Handle call acceptance
  socket.on('acceptCall', (data) => {
    console.log(`✅ Call accepted by ${socket.userId}, notifying caller: ${data.callId}`)
    io.to(data.callId).emit('callAccepted', { type: data.type })
  })

  // Handle call rejection
  socket.on('rejectCall', (data) => {
    console.log(`❌ Call rejected by ${socket.userId}, notifying caller: ${data.callId}`)
    io.to(data.callId).emit('callRejected')
  })

  // Handle call end
  socket.on('endCall', () => {
    console.log(`📴 Call ended by: ${socket.userId}`)
    socket.broadcast.emit('callEnded')
  })

  // Handle call hold
  socket.on('callHold', (data) => {
    console.log('Call hold status changed:', data)
    const targetSocketId = Array.from(connectedUsers.entries())
      .find(([socketId, userId]) => userId === data.target)?.[0]

    if (targetSocketId) {
      io.to(targetSocketId).emit('callHoldChanged', {
        isOnHold: data.isOnHold,
        from: socket.userId
      })
    }
  })

  // Handle WebRTC signaling
  socket.on('offer', (data) => {
    const receiverSocketId = Array.from(connectedUsers.entries())
      .find(([socketId, userId]) => userId === data.receiver)?.[0]

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('offer', {
        offer: data.offer,
        caller: socket.userId
      })
    }
  })

  socket.on('answer', (data) => {
    const callerSocketId = Array.from(connectedUsers.entries())
      .find(([socketId, userId]) => userId === data.caller)?.[0]

    if (callerSocketId) {
      io.to(callerSocketId).emit('answer', {
        answer: data.answer,
        answerer: socket.userId
      })
    }
  })

  socket.on('ice-candidate', (data) => {
    const targetSocketId = Array.from(connectedUsers.entries())
      .find(([socketId, userId]) => userId === data.target)?.[0]

    if (targetSocketId) {
      io.to(targetSocketId).emit('ice-candidate', {
        candidate: data.candidate,
        sender: socket.userId
      })
    }
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    connectedUsers.delete(socket.id)

    // Emit updated online users list
    const onlineUsers = Array.from(connectedUsers.values())
    io.emit('getOnlineUsers', onlineUsers)
  })
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Saving data before shutdown...')
  saveData()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('Saving data before shutdown...')
  saveData()
  process.exit(0)
})

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log('Data will be saved every 30 seconds and on shutdown')
})