# WhatsApp Clone with MetaMask Authentication

A modern WhatsApp clone built with Next.js, featuring MetaMask wallet authentication, real-time chat, and video calling capabilities.

## Features

- 🔐 **MetaMask Authentication**: Sign in using your Ethereum wallet
- 🌐 **P2P Architecture**: Direct peer-to-peer communication via WebRTC
- 🔒 **Local Encrypted Storage**: Messages stored locally with AES-256 encryption
- 💬 **Real-time Chat**: Direct P2P messaging with server fallback
- 🎤 **Voice Messages**: Record and send audio messages
- 📞 **Audio Calls**: P2P audio calling with WebRTC
- 📹 **Video Calls**: P2P video calling with WebRTC
- 👥 **Contact Management**: Add contacts by wallet address
- 🟢 **Connection Status**: See P2P connection states in real-time
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **P2P Communication**: WebRTC for direct peer-to-peer connections
- **Signaling Server**: Node.js, Express, Socket.io (connection setup only)
- **Encryption**: Web Crypto API with AES-256-GCM
- **Authentication**: MetaMask (Ethereum wallet)
- **Storage**: Local encrypted storage (IndexedDB/localStorage)
- **Styling**: Tailwind CSS with beautiful gradient design

## Prerequisites

- Node.js 18+ installed
- MetaMask browser extension
- Modern web browser with WebRTC support

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd whatsapp-metamask-clone
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install server dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

## Running the Application

1. **Start the Socket.io server**
   ```bash
   cd server
   npm run dev
   ```
   The server will run on `http://localhost:3001`

2. **Start the Next.js frontend** (in a new terminal)
   ```bash
   npm run dev
   ```
   The app will run on `http://localhost:3000`

3. **Open your browser** and navigate to `http://localhost:3000`

## Usage

1. **Connect MetaMask**: Click "Connect MetaMask Wallet" and approve the connection
2. **Add Contacts**: Click the "+" button in the sidebar to add contacts by wallet address
3. **Start Chatting**: Select a contact and start sending messages
4. **Voice Messages**: Click the microphone icon to record voice messages
5. **Video Calls**: Click the video icon to start a video call (requires both users to be online)

## Project Structure

```
├── components/          # React components
│   ├── ChatApp.tsx     # Main chat application
│   ├── ChatWindow.tsx  # Chat interface
│   ├── LoginScreen.tsx # MetaMask login
│   ├── Sidebar.tsx     # Contacts sidebar
│   └── VideoCall.tsx   # Video call interface
├── context/            # React contexts
│   ├── SocketContext.tsx # Socket.io context
│   └── WalletContext.tsx # MetaMask wallet context
├── pages/              # Next.js pages
│   ├── _app.tsx       # App wrapper
│   └── index.tsx      # Home page
├── server/             # Backend server
│   ├── server.js      # Socket.io server
│   └── package.json   # Server dependencies
├── styles/             # CSS styles
│   └── globals.css    # Global styles
└── types/              # TypeScript types
    └── global.d.ts    # Global type definitions
```

## Features in Detail

### MetaMask Authentication
- Secure wallet-based authentication
- No traditional username/password required
- Uses Ethereum addresses as unique identifiers

### P2P Architecture
- **Direct Communication**: Messages sent directly between peers via WebRTC
- **Signaling Server**: Only used for initial connection setup (WebRTC offer/answer/ICE)
- **No Message Routing**: Server never sees or stores message content
- **Local Storage**: All messages stored locally on each device
- **End-to-End Encryption**: Messages encrypted with user's wallet-derived key

### Real-time Chat
- Direct P2P message delivery via WebRTC data channels
- Fallback to server relay if P2P connection fails
- Message history stored locally with encryption
- Connection status indicators (P2P/Server mode)
- Message timestamps

### Voice Messages
- Browser-based audio recording
- Playback controls in chat
- Audio message indicators

### Audio Calling
- Real-time audio calls between users
- Mute/unmute functionality
- Call duration timer
- Visual audio indicators
- Quick call button in chat input

### Video Calling
- WebRTC-ready infrastructure
- Call initiation and acceptance flow
- Video controls (mute, camera toggle)
- Picture-in-picture local video

## Development Notes

### WebRTC Integration
The video calling feature includes a complete UI and signaling infrastructure. To add full WebRTC functionality:

1. Install a WebRTC library like `simple-peer`
2. Implement peer connection logic in `VideoCall.tsx`
3. Handle WebRTC signaling events in the Socket.io server

### Database Integration
Currently, the app stores data in memory. For production:

1. Add a database (MongoDB, PostgreSQL, etc.)
2. Store user profiles, chat history, and contacts
3. Implement message persistence

### Security Considerations
- Validate wallet signatures for enhanced security
- Implement rate limiting for messages
- Add content moderation features
- Use HTTPS in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## 🎯 Testing Cross-Wallet Messaging

To test messaging between different wallets:

1. **Use different browsers** (Chrome and Edge) for each wallet
2. **Connect different MetaMask accounts** in each browser
3. **Add contacts** using the exact wallet addresses
4. **Send messages** and check both browsers
5. **Check browser console** for debug logs
6. **Monitor server terminal** for connection logs

## 🐛 Troubleshooting

If messages aren't being delivered between wallets:

1. **Check browser console** for connection errors and debug logs
2. **Check server terminal** for message delivery logs
3. **Open debug.html** to verify users are connected to server
4. **Ensure wallet addresses are exact** (copy-paste recommended)
5. **Try refreshing both browsers** to reconnect sockets
6. **Check that both users are online** in the contacts list

### Debug Tools

- **debug.html**: Open this file to check server status and connected users
- **Browser Console**: Shows socket connection and message logs
- **Server Terminal**: Shows message routing and user connections
- **Debug Endpoints**: 
  - `http://localhost:3001/debug/users` - Check connected users
  - `http://localhost:3001/debug/messages/[wallet-address]` - Check user messages