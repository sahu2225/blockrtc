#!/usr/bin/env node

/**
 * Simple Load Test for BlockRTC
 * Tests WebSocket connections and message sending
 */

const io = require('socket.io-client');
const { performance } = require('perf_hooks');

class LoadTester {
  constructor(options = {}) {
    this.serverUrl = options.serverUrl || 'http://localhost:3001';
    this.maxConnections = options.maxConnections || 100;
    this.messagesPerConnection = options.messagesPerConnection || 10;
    this.connectionInterval = options.connectionInterval || 100; // ms between connections
    this.messageInterval = options.messageInterval || 1000; // ms between messages
    
    this.connections = [];
    this.stats = {
      connectionsAttempted: 0,
      connectionsSuccessful: 0,
      connectionsFailed: 0,
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      startTime: null,
      endTime: null
    };
  }

  generateWalletAddress() {
    return '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  async createConnection(userId) {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      
      const socket = io(this.serverUrl, {
        transports: ['websocket'],
        timeout: 5000
      });

      socket.on('connect', () => {
        const connectionTime = performance.now() - startTime;
        console.log(`✅ Connection ${this.stats.connectionsSuccessful + 1} established in ${connectionTime.toFixed(2)}ms`);
        
        // Join with user ID
        socket.emit('join', userId);
        
        this.stats.connectionsSuccessful++;
        resolve({ socket, userId, connectionTime });
      });

      socket.on('connect_error', (error) => {
        console.error(`❌ Connection failed: ${error.message}`);
        this.stats.connectionsFailed++;
        this.stats.errors++;
        reject(error);
      });

      socket.on('disconnect', (reason) => {
        console.log(`🔌 Disconnected: ${reason}`);
      });

      socket.on('receiveMessage', (message) => {
        this.stats.messagesReceived++;
        console.log(`📨 Message received by ${userId.slice(0, 8)}...`);
      });

      socket.on('error', (error) => {
        console.error(`🚨 Socket error: ${error}`);
        this.stats.errors++;
      });

      this.stats.connectionsAttempted++;
    });
  }

  async sendMessages(socket, userId) {
    const targetUsers = this.connections
      .filter(conn => conn.userId !== userId)
      .map(conn => conn.userId);

    if (targetUsers.length === 0) {
      console.log(`⚠️  No target users for ${userId.slice(0, 8)}...`);
      return;
    }

    for (let i = 0; i < this.messagesPerConnection; i++) {
      const targetUser = targetUsers[Math.floor(Math.random() * targetUsers.length)];
      const message = {
        id: `msg_${Date.now()}_${Math.random()}`,
        sender: userId,
        receiver: targetUser,
        content: `Load test message ${i + 1} from ${userId.slice(0, 8)}...`,
        timestamp: new Date(),
        type: 'text'
      };

      socket.emit('sendMessage', message);
      this.stats.messagesSent++;
      
      console.log(`📤 Message ${i + 1}/${this.messagesPerConnection} sent from ${userId.slice(0, 8)}... to ${targetUser.slice(0, 8)}...`);
      
      // Wait between messages
      await this.sleep(this.messageInterval);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runTest() {
    console.log(`🚀 Starting load test...`);
    console.log(`📊 Configuration:`);
    console.log(`   Server: ${this.serverUrl}`);
    console.log(`   Max Connections: ${this.maxConnections}`);
    console.log(`   Messages per Connection: ${this.messagesPerConnection}`);
    console.log(`   Connection Interval: ${this.connectionInterval}ms`);
    console.log(`   Message Interval: ${this.messageInterval}ms`);
    console.log('');

    this.stats.startTime = performance.now();

    // Phase 1: Create connections
    console.log(`📡 Phase 1: Creating ${this.maxConnections} connections...`);
    
    for (let i = 0; i < this.maxConnections; i++) {
      try {
        const userId = this.generateWalletAddress();
        const connection = await this.createConnection(userId);
        this.connections.push(connection);
        
        // Progress indicator
        if ((i + 1) % 10 === 0) {
          console.log(`📈 Progress: ${i + 1}/${this.maxConnections} connections created`);
        }
        
        // Wait between connections to avoid overwhelming the server
        await this.sleep(this.connectionInterval);
      } catch (error) {
        console.error(`Failed to create connection ${i + 1}: ${error.message}`);
      }
    }

    console.log(`\n✅ Phase 1 Complete: ${this.stats.connectionsSuccessful}/${this.maxConnections} connections established`);
    
    if (this.stats.connectionsSuccessful === 0) {
      console.error('❌ No connections established. Aborting test.');
      return this.getResults();
    }

    // Phase 2: Send messages
    console.log(`\n💬 Phase 2: Sending messages...`);
    
    const messagePromises = this.connections.map(async (connection, index) => {
      // Stagger message sending to avoid overwhelming
      await this.sleep(index * 50);
      return this.sendMessages(connection.socket, connection.userId);
    });

    await Promise.all(messagePromises);

    console.log(`\n✅ Phase 2 Complete: All messages sent`);

    // Phase 3: Wait for message delivery
    console.log(`\n⏳ Phase 3: Waiting for message delivery...`);
    await this.sleep(5000); // Wait 5 seconds for messages to be delivered

    // Phase 4: Cleanup
    console.log(`\n🧹 Phase 4: Cleaning up connections...`);
    this.connections.forEach(connection => {
      connection.socket.disconnect();
    });

    this.stats.endTime = performance.now();
    return this.getResults();
  }

  getResults() {
    const duration = (this.stats.endTime - this.stats.startTime) / 1000;
    const successRate = (this.stats.connectionsSuccessful / this.stats.connectionsAttempted) * 100;
    const messageDeliveryRate = this.stats.messagesSent > 0 ? (this.stats.messagesReceived / this.stats.messagesSent) * 100 : 0;

    const results = {
      duration: duration.toFixed(2),
      connections: {
        attempted: this.stats.connectionsAttempted,
        successful: this.stats.connectionsSuccessful,
        failed: this.stats.connectionsFailed,
        successRate: successRate.toFixed(2)
      },
      messages: {
        sent: this.stats.messagesSent,
        received: this.stats.messagesReceived,
        deliveryRate: messageDeliveryRate.toFixed(2)
      },
      performance: {
        connectionsPerSecond: (this.stats.connectionsSuccessful / duration).toFixed(2),
        messagesPerSecond: (this.stats.messagesSent / duration).toFixed(2)
      },
      errors: this.stats.errors
    };

    console.log(`\n📊 LOAD TEST RESULTS`);
    console.log(`==================`);
    console.log(`Duration: ${results.duration}s`);
    console.log(`\nConnections:`);
    console.log(`  Attempted: ${results.connections.attempted}`);
    console.log(`  Successful: ${results.connections.successful}`);
    console.log(`  Failed: ${results.connections.failed}`);
    console.log(`  Success Rate: ${results.connections.successRate}%`);
    console.log(`\nMessages:`);
    console.log(`  Sent: ${results.messages.sent}`);
    console.log(`  Received: ${results.messages.received}`);
    console.log(`  Delivery Rate: ${results.messages.deliveryRate}%`);
    console.log(`\nPerformance:`);
    console.log(`  Connections/sec: ${results.performance.connectionsPerSecond}`);
    console.log(`  Messages/sec: ${results.performance.messagesPerSecond}`);
    console.log(`\nErrors: ${results.errors}`);

    // Performance assessment
    console.log(`\n🎯 PERFORMANCE ASSESSMENT`);
    console.log(`========================`);
    
    if (results.connections.successRate >= 95) {
      console.log(`✅ Connection Success Rate: EXCELLENT (${results.connections.successRate}%)`);
    } else if (results.connections.successRate >= 80) {
      console.log(`⚠️  Connection Success Rate: GOOD (${results.connections.successRate}%)`);
    } else {
      console.log(`❌ Connection Success Rate: POOR (${results.connections.successRate}%)`);
    }

    if (results.messages.deliveryRate >= 95) {
      console.log(`✅ Message Delivery Rate: EXCELLENT (${results.messages.deliveryRate}%)`);
    } else if (results.messages.deliveryRate >= 80) {
      console.log(`⚠️  Message Delivery Rate: GOOD (${results.messages.deliveryRate}%)`);
    } else {
      console.log(`❌ Message Delivery Rate: POOR (${results.messages.deliveryRate}%)`);
    }

    const connectionsPerSec = parseFloat(results.performance.connectionsPerSecond);
    if (connectionsPerSec >= 50) {
      console.log(`✅ Connection Speed: EXCELLENT (${connectionsPerSec}/sec)`);
    } else if (connectionsPerSec >= 20) {
      console.log(`⚠️  Connection Speed: GOOD (${connectionsPerSec}/sec)`);
    } else {
      console.log(`❌ Connection Speed: POOR (${connectionsPerSec}/sec)`);
    }

    // Recommendations
    console.log(`\n💡 RECOMMENDATIONS`);
    console.log(`==================`);
    
    if (results.connections.successRate < 95) {
      console.log(`• Increase server resources (CPU/Memory)`);
      console.log(`• Implement connection pooling`);
      console.log(`• Add load balancing`);
    }
    
    if (results.messages.deliveryRate < 95) {
      console.log(`• Implement message queuing`);
      console.log(`• Add Redis for session management`);
      console.log(`• Optimize database queries`);
    }
    
    if (connectionsPerSec < 50) {
      console.log(`• Scale horizontally with multiple servers`);
      console.log(`• Implement WebSocket clustering`);
      console.log(`• Use sticky sessions with load balancer`);
    }

    console.log(`\n🔍 For 1M users, you would need:`);
    const serversNeeded = Math.ceil(1000000 / this.stats.connectionsSuccessful);
    console.log(`• Approximately ${serversNeeded} servers of this capacity`);
    console.log(`• Load balancer with sticky sessions`);
    console.log(`• Redis cluster for session management`);
    console.log(`• Database sharding/clustering`);
    console.log(`• CDN for static assets`);

    return results;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    if (key === 'connections') options.maxConnections = parseInt(value);
    if (key === 'messages') options.messagesPerConnection = parseInt(value);
    if (key === 'server') options.serverUrl = value;
    if (key === 'connection-interval') options.connectionInterval = parseInt(value);
    if (key === 'message-interval') options.messageInterval = parseInt(value);
  }

  const tester = new LoadTester(options);
  
  tester.runTest().catch(error => {
    console.error('Load test failed:', error);
    process.exit(1);
  });
}

module.exports = LoadTester;