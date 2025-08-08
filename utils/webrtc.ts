// WebRTC P2P Connection Manager
export interface P2PMessage {
  id: string;
  type: 'text' | 'audio' | 'video' | 'file';
  content: string;
  timestamp: number;
  sender: string;
}

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  private onMessageCallback: ((message: P2PMessage) => void) | null = null;
  private onConnectionStateCallback: ((state: string) => void) | null = null;
  private socket: any = null;
  private localAddress: string = '';
  private remoteAddress: string = '';
  private isInitiator: boolean = false;
  private connectionState: string = 'new';
  private pendingCandidates: RTCIceCandidateInit[] = [];

  constructor(socket: any, localAddress: string) {
    this.socket = socket;
    this.localAddress = localAddress;
    this.setupPeerConnection();
  }

  private setupPeerConnection() {
    // STUN servers for NAT traversal
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.socket) {
        this.socket.emit('ice-candidate', {
          candidate: event.candidate,
          target: this.remoteAddress
        });
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState || 'disconnected';
      console.log('P2P Connection state:', state);
      this.onConnectionStateCallback?.(state);
    };

    // Handle incoming data channel
    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      this.setupDataChannel(channel);
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      // Handle remote audio/video stream
    };
  }

  private setupDataChannel(channel: RTCDataChannel) {
    this.dataChannel = channel;

    channel.onopen = () => {
      console.log('P2P Data channel opened');
      this.onConnectionStateCallback?.('connected');
    };

    channel.onclose = () => {
      console.log('P2P Data channel closed');
      this.onConnectionStateCallback?.('disconnected');
    };

    channel.onmessage = (event) => {
      try {
        const message: P2PMessage = JSON.parse(event.data);
        console.log('Received P2P message:', message);
        this.onMessageCallback?.(message);
      } catch (error) {
        console.error('Failed to parse P2P message:', error);
      }
    };
  }

  // Initiate connection to remote peer
  async initiateConnection(remoteAddress: string): Promise<void> {
    try {
      console.log('Initiating connection to:', remoteAddress);
      
      if (!this.peerConnection) {
        console.error('No peer connection available');
        return;
      }

      // Check if we're already connected or connecting to this peer
      if (this.remoteAddress === remoteAddress && 
          (this.connectionState === 'connected' || this.connectionState === 'connecting')) {
        console.log('Already connected/connecting to this peer');
        return;
      }

      this.remoteAddress = remoteAddress;
      this.isInitiator = true;

      // Create data channel
      this.dataChannel = this.peerConnection.createDataChannel('messages', {
        ordered: true
      });
      this.setupDataChannel(this.dataChannel);

      // Create offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      console.log('Local description (offer) set successfully');

      // Send offer through signaling server
      this.socket.emit('webrtc-offer', {
        offer,
        target: remoteAddress,
        sender: this.localAddress
      });

      this.connectionState = 'connecting';
    } catch (error) {
      console.error('Error initiating connection:', error);
      this.connectionState = 'failed';
      this.onConnectionStateCallback?.('failed');
    }
  }

  // Handle incoming offer
  async handleOffer(offer: RTCSessionDescriptionInit, senderAddress: string): Promise<void> {
    try {
      console.log('Handling offer from:', senderAddress, 'Current state:', this.peerConnection?.signalingState);
      
      if (!this.peerConnection) {
        console.error('No peer connection available');
        return;
      }

      // Check if we're in the right state to handle an offer
      if (this.peerConnection.signalingState !== 'stable' && this.peerConnection.signalingState !== 'have-local-offer') {
        console.warn('Ignoring offer in state:', this.peerConnection.signalingState);
        return;
      }

      this.remoteAddress = senderAddress;
      this.isInitiator = false;

      await this.peerConnection.setRemoteDescription(offer);
      console.log('Remote description set successfully');

      // Create answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      console.log('Local description (answer) set successfully');

      // Process any pending ICE candidates
      await this.processPendingCandidates();

      // Send answer through signaling server
      this.socket.emit('webrtc-answer', {
        answer,
        target: senderAddress,
        sender: this.localAddress
      });

      this.connectionState = 'connecting';
    } catch (error) {
      console.error('Error handling offer:', error);
      this.connectionState = 'failed';
      this.onConnectionStateCallback?.('failed');
    }
  }

  // Handle incoming answer
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      console.log('Handling answer, Current state:', this.peerConnection?.signalingState);
      
      if (!this.peerConnection) {
        console.error('No peer connection available');
        return;
      }

      // Check if we're in the right state to handle an answer
      if (this.peerConnection.signalingState !== 'have-local-offer') {
        console.warn('Ignoring answer in state:', this.peerConnection.signalingState);
        return;
      }

      await this.peerConnection.setRemoteDescription(answer);
      console.log('Remote description (answer) set successfully');

      // Process any pending ICE candidates
      await this.processPendingCandidates();

      this.connectionState = 'connecting';
    } catch (error) {
      console.error('Error handling answer:', error);
      this.connectionState = 'failed';
      this.onConnectionStateCallback?.('failed');
    }
  }

  // Handle ICE candidate
  async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      if (!this.peerConnection) {
        console.error('No peer connection available for ICE candidate');
        return;
      }

      // If remote description is not set yet, queue the candidate
      if (this.peerConnection.remoteDescription === null) {
        console.log('Queueing ICE candidate until remote description is set');
        this.pendingCandidates.push(candidate);
        return;
      }

      await this.peerConnection.addIceCandidate(candidate);
      console.log('ICE candidate added successfully');
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  // Process pending ICE candidates
  private async processPendingCandidates(): Promise<void> {
    console.log('Processing', this.pendingCandidates.length, 'pending ICE candidates');
    
    for (const candidate of this.pendingCandidates) {
      try {
        await this.peerConnection!.addIceCandidate(candidate);
        console.log('Pending ICE candidate added successfully');
      } catch (error) {
        console.error('Error adding pending ICE candidate:', error);
      }
    }
    
    this.pendingCandidates = [];
  }

  // Send message through P2P connection
  sendMessage(message: P2PMessage): boolean {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // Start audio/video call
  async startCall(video: boolean = false): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video
      });

      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      // Create new offer with media
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      this.socket.emit('webrtc-call-offer', {
        offer,
        target: this.remoteAddress,
        sender: this.localAddress,
        hasVideo: video
      });

    } catch (error) {
      console.error('Failed to start call:', error);
      throw error;
    }
  }

  // Set message callback
  onMessage(callback: (message: P2PMessage) => void): void {
    this.onMessageCallback = callback;
  }

  // Set connection state callback
  onConnectionState(callback: (state: string) => void): void {
    this.onConnectionStateCallback = callback;
  }

  // Get connection state
  getConnectionState(): string {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      return 'connected';
    }
    return this.connectionState;
  }

  // Close connection
  close(): void {
    console.log('Closing WebRTC connection');
    
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    this.connectionState = 'closed';
    this.pendingCandidates = [];
  }

  // Reset connection for retry
  reset(): void {
    console.log('Resetting WebRTC connection');
    this.close();
    this.setupPeerConnection();
    this.connectionState = 'new';
  }
}