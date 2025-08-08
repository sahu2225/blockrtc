# Scaling BlockRTC for 1 Million Concurrent Users

## 🚨 Current Architecture Limitations

With 1 million concurrent users, your current setup would face these critical issues:

### 1. **Single Server Bottlenecks**
- **Memory**: Each Socket.io connection uses ~10KB RAM = 10GB for 1M users
- **CPU**: Single-threaded Node.js can't handle 1M concurrent connections
- **File Descriptors**: OS limit (~65K) prevents 1M connections on one server
- **Network**: Single server bandwidth becomes the bottleneck

### 2. **Database Issues**
- **File-based storage** would completely fail
- **Memory storage** would consume 100GB+ RAM
- **No data persistence** across server restarts
- **No horizontal scaling** capability

### 3. **WebRTC Signaling**
- **Single signaling server** can't coordinate 1M P2P connections
- **Memory explosion** from storing connection states
- **Network congestion** from signaling traffic

## 🏗️ Scalable Architecture Design

### High-Level Architecture
```
[Load Balancer] → [API Gateway] → [Microservices]
                                      ↓
[Message Queue] ← [WebSocket Cluster] → [Database Cluster]
                                      ↓
[Redis Cluster] ← [P2P Signaling] → [Media Servers]
```

## 🔧 Detailed Scaling Solutions

### 1. **Horizontal Scaling with Microservices**

#### API Gateway + Load Balancer
```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  nginx-lb:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf
    depends_on:
      - api-gateway

  api-gateway:
    image: kong:latest
    environment:
      - KONG_DATABASE=off
      - KONG_DECLARATIVE_CONFIG=/kong/kong.yml
    volumes:
      - ./kong.yml:/kong/kong.yml
    ports:
      - "8000:8000"
      - "8443:8443"

  # Multiple WebSocket servers
  websocket-server:
    build: ./server
    deploy:
      replicas: 20  # Scale based on load
    environment:
      - REDIS_URL=redis://redis-cluster:6379
      - DB_URL=mongodb://mongo-cluster:27017
    depends_on:
      - redis-cluster
      - mongo-cluster

  # Redis cluster for session management
  redis-cluster:
    image: redis/redis-stack:latest
    deploy:
      replicas: 3
    command: redis-server --cluster-enabled yes

  # MongoDB cluster for data persistence
  mongo-cluster:
    image: mongo:latest
    deploy:
      replicas: 3
    command: mongod --replSet rs0
```

### 2. **Database Architecture for Scale**

#### MongoDB Sharded Cluster
```javascript
// server/database/mongodb.js
const mongoose = require('mongoose');

// User schema with sharding key
const userSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, index: true },
  contacts: [{ address: String, lastMessage: String, timestamp: Date }],
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  shardKey: { type: String, required: true } // For sharding
});

// Message schema with sharding
const messageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sender: { type: String, required: true, index: true },
  receiver: { type: String, required: true, index: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  type: { type: String, enum: ['text', 'audio', 'video'], default: 'text' },
  shardKey: { type: String, required: true } // Combination of sender+receiver
});

// Compound indexes for performance
messageSchema.index({ sender: 1, receiver: 1, timestamp: -1 });
messageSchema.index({ shardKey: 1, timestamp: -1 });

module.exports = { User: mongoose.model('User', userSchema), Message: mongoose.model('Message', messageSchema) };
```

#### Redis for Real-time Data
```javascript
// server/cache/redis.js
const Redis = require('ioredis');

class RedisManager {
  constructor() {
    // Redis Cluster setup
    this.cluster = new Redis.Cluster([
      { host: 'redis-1', port: 6379 },
      { host: 'redis-2', port: 6379 },
      { host: 'redis-3', port: 6379 }
    ]);
  }

  // Store user session
  async setUserOnline(userId, socketId, serverId) {
    const pipeline = this.cluster.pipeline();
    pipeline.hset(`user:${userId}`, {
      socketId,
      serverId,
      lastSeen: Date.now(),
      status: 'online'
    });
    pipeline.sadd('online_users', userId);
    pipeline.expire(`user:${userId}`, 3600); // 1 hour TTL
    await pipeline.exec();
  }

  // Get user's server location
  async getUserServer(userId) {
    return await this.cluster.hget(`user:${userId}`, 'serverId');
  }

  // Store message for offline delivery
  async storeOfflineMessage(userId, message) {
    await this.cluster.lpush(`offline:${userId}`, JSON.stringify(message));
    await this.cluster.expire(`offline:${userId}`, 86400 * 7); // 7 days
  }

  // Get online users count
  async getOnlineCount() {
    return await this.cluster.scard('online_users');
  }
}

module.exports = RedisManager;
```

### 3. **WebSocket Server Clustering**

#### Scalable WebSocket Server
```javascript
// server/websocket-cluster.js
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');
const RedisManager = require('./cache/redis');

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);
  
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Restart worker
  });
} else {
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    cors: { origin: "*" },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Redis adapter for clustering
  const pubClient = new Redis(process.env.REDIS_URL);
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  const redisManager = new RedisManager();
  const serverId = `server-${process.pid}`;

  // Connection handling with rate limiting
  const connectionLimiter = new Map();
  
  io.use((socket, next) => {
    const ip = socket.handshake.address;
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxConnections = 10; // Max 10 connections per IP per minute

    if (!connectionLimiter.has(ip)) {
      connectionLimiter.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const limiter = connectionLimiter.get(ip);
    if (now > limiter.resetTime) {
      limiter.count = 1;
      limiter.resetTime = now + windowMs;
      return next();
    }

    if (limiter.count >= maxConnections) {
      return next(new Error('Rate limit exceeded'));
    }

    limiter.count++;
    next();
  });

  io.on('connection', async (socket) => {
    console.log(`User connected to worker ${process.pid}: ${socket.id}`);

    socket.on('join', async (userId) => {
      try {
        socket.userId = userId;
        socket.join(userId); // Join user-specific room
        
        // Store user location in Redis
        await redisManager.setUserOnline(userId, socket.id, serverId);
        
        // Notify other servers about user online status
        io.emit('user_online', userId);
        
        // Send offline messages
        const offlineMessages = await redisManager.getOfflineMessages(userId);
        if (offlineMessages.length > 0) {
          socket.emit('offline_messages', offlineMessages);
          await redisManager.clearOfflineMessages(userId);
        }

      } catch (error) {
        console.error('Join error:', error);
        socket.emit('error', 'Failed to join');
      }
    });

    socket.on('send_message', async (messageData) => {
      try {
        const { receiver } = messageData;
        
        // Check if receiver is online
        const receiverServer = await redisManager.getUserServer(receiver);
        
        if (receiverServer) {
          // User is online, send directly
          io.to(receiver).emit('receive_message', messageData);
        } else {
          // User is offline, store message
          await redisManager.storeOfflineMessage(receiver, messageData);
        }

        // Store in database for persistence
        await storeMessageInDB(messageData);

      } catch (error) {
        console.error('Message send error:', error);
        socket.emit('error', 'Failed to send message');
      }
    });

    socket.on('disconnect', async () => {
      if (socket.userId) {
        await redisManager.setUserOffline(socket.userId);
        io.emit('user_offline', socket.userId);
      }
    });
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      worker: process.pid,
      connections: io.engine.clientsCount,
      uptime: process.uptime()
    });
  });

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Worker ${process.pid} listening on port ${PORT}`);
  });
}
```

### 4. **Message Queue for Reliability**

#### RabbitMQ Integration
```javascript
// server/queue/messageQueue.js
const amqp = require('amqplib');

class MessageQueue {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
    
    // Declare exchanges and queues
    await this.channel.assertExchange('messages', 'topic', { durable: true });
    await this.channel.assertQueue('message_processing', { durable: true });
    await this.channel.assertQueue('offline_messages', { durable: true });
  }

  async publishMessage(routingKey, message) {
    await this.channel.publish('messages', routingKey, Buffer.from(JSON.stringify(message)), {
      persistent: true
    });
  }

  async consumeMessages(queue, callback) {
    await this.channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const message = JSON.parse(msg.content.toString());
          await callback(message);
          this.channel.ack(msg);
        } catch (error) {
          console.error('Message processing error:', error);
          this.channel.nack(msg, false, true); // Requeue
        }
      }
    });
  }
}

module.exports = MessageQueue;
```

### 5. **CDN and Static Asset Optimization**

#### CloudFlare Configuration
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['i.pravatar.cc'],
    loader: 'cloudinary',
    path: 'https://res.cloudinary.com/your-cloud/image/fetch/',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
```

## 📊 Performance Monitoring

### Monitoring Stack
```yaml
# monitoring/docker-compose.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.14.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  kibana:
    image: docker.elastic.co/kibana/kibana:7.14.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

### Application Metrics
```javascript
// server/monitoring/metrics.js
const prometheus = require('prom-client');

// Create metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new prometheus.Gauge({
  name: 'websocket_active_connections',
  help: 'Number of active WebSocket connections'
});

const messagesSent = new prometheus.Counter({
  name: 'messages_sent_total',
  help: 'Total number of messages sent'
});

const messagesReceived = new prometheus.Counter({
  name: 'messages_received_total',
  help: 'Total number of messages received'
});

// Export metrics endpoint
const register = prometheus.register;

module.exports = {
  httpRequestDuration,
  activeConnections,
  messagesSent,
  messagesReceived,
  register
};
```

## 🚀 Deployment Strategy for Scale

### Kubernetes Deployment
```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: blockrtc-websocket
spec:
  replicas: 50  # Scale based on load
  selector:
    matchLabels:
      app: blockrtc-websocket
  template:
    metadata:
      labels:
        app: blockrtc-websocket
    spec:
      containers:
      - name: websocket-server
        image: blockrtc/websocket-server:latest
        ports:
        - containerPort: 3001
        env:
        - name: REDIS_URL
          value: "redis://redis-cluster:6379"
        - name: MONGODB_URL
          value: "mongodb://mongo-cluster:27017"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: blockrtc-websocket-service
spec:
  selector:
    app: blockrtc-websocket
  ports:
  - port: 3001
    targetPort: 3001
  type: LoadBalancer

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: blockrtc-websocket-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: blockrtc-websocket
  minReplicas: 10
  maxReplicas: 100
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## 💰 Cost Estimation for 1M Users

### AWS Infrastructure Costs (Monthly)
```
Load Balancers (ALB): $25/month
EC2 Instances (50 x c5.2xlarge): $6,000/month
RDS MongoDB Cluster (3 x r5.4xlarge): $3,600/month
ElastiCache Redis (3 x r5.2xlarge): $1,800/month
CloudFront CDN: $500/month
S3 Storage: $200/month
Data Transfer: $1,000/month
Monitoring (CloudWatch): $300/month

Total: ~$13,425/month ($0.013 per user/month)
```

### Optimization Strategies
1. **Use Spot Instances**: Save 70% on compute costs
2. **Reserved Instances**: Save 40% with 1-year commitment
3. **Auto-scaling**: Scale down during low usage
4. **CDN Optimization**: Reduce bandwidth costs
5. **Database Optimization**: Use read replicas

## 🔧 Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up Redis cluster
- [ ] Implement MongoDB sharding
- [ ] Create WebSocket clustering
- [ ] Add basic monitoring

### Phase 2: Scaling (Weeks 3-4)
- [ ] Implement message queues
- [ ] Add load balancing
- [ ] Set up CDN
- [ ] Implement caching strategies

### Phase 3: Optimization (Weeks 5-6)
- [ ] Performance tuning
- [ ] Database optimization
- [ ] Memory optimization
- [ ] Network optimization

### Phase 4: Production (Weeks 7-8)
- [ ] Kubernetes deployment
- [ ] Auto-scaling setup
- [ ] Monitoring dashboards
- [ ] Disaster recovery

## 🧪 Load Testing

### Artillery Load Test
```javascript
// load-test/config.yml
config:
  target: 'https://your-domain.com'
  phases:
    - duration: 60
      arrivalRate: 1000  # 1000 users per second
    - duration: 300
      arrivalRate: 5000  # Ramp up to 5000/sec
    - duration: 600
      arrivalRate: 10000 # Peak load
  socketio:
    transports: ['websocket']

scenarios:
  - name: "Connect and send messages"
    weight: 100
    engine: socketio
    flow:
      - emit:
          channel: "join"
          data: "{{ $randomString() }}"
      - think: 5
      - loop:
        - emit:
            channel: "send_message"
            data:
              receiver: "{{ $randomString() }}"
              content: "Load test message {{ $randomInt(1, 1000) }}"
        - think: 2
        count: 10
```

## 📈 Expected Performance

### With Optimized Architecture:
- **Concurrent Users**: 1M+ users
- **Message Throughput**: 100K messages/second
- **Response Time**: <100ms average
- **Uptime**: 99.9% availability
- **Scalability**: Auto-scale to 10M users

### Key Success Metrics:
- Connection establishment: <2 seconds
- Message delivery: <500ms
- Memory usage: <2GB per 10K connections
- CPU usage: <70% under normal load
- Database queries: <50ms average

This architecture can handle 1 million concurrent users with proper implementation and sufficient infrastructure investment.