# BlockRTC Load Testing

This directory contains load testing tools to help you understand your application's limits and performance characteristics.

## Quick Start

1. **Install dependencies**
   ```bash
   cd load-test
   npm install
   ```

2. **Run a basic test**
   ```bash
   npm run test-small
   ```

## Test Scenarios

### Small Test (50 connections)
```bash
npm run test-small
# Tests: 50 connections, 5 messages each
# Good for: Initial testing, development
```

### Medium Test (200 connections)
```bash
npm run test-medium
# Tests: 200 connections, 10 messages each
# Good for: Staging environment testing
```

### Large Test (1000 connections)
```bash
npm run test-large
# Tests: 1000 connections, 20 messages each
# Good for: Production readiness testing
```

### Stress Test (5000 connections)
```bash
npm run test-stress
# Tests: 5000 connections, 50 messages each
# Good for: Finding breaking points
```

## Custom Testing

```bash
node simple-load-test.js \
  --server http://localhost:3001 \
  --connections 100 \
  --messages 10 \
  --connection-interval 50 \
  --message-interval 1000
```

### Parameters:
- `--server`: Server URL (default: http://localhost:3001)
- `--connections`: Number of concurrent connections (default: 100)
- `--messages`: Messages per connection (default: 10)
- `--connection-interval`: Delay between connections in ms (default: 100)
- `--message-interval`: Delay between messages in ms (default: 1000)

## Understanding Results

### Connection Metrics
- **Success Rate**: Percentage of successful connections
  - 95%+ = Excellent
  - 80-95% = Good
  - <80% = Needs improvement

### Message Delivery
- **Delivery Rate**: Percentage of messages successfully delivered
  - 95%+ = Excellent
  - 80-95% = Good
  - <80% = Needs improvement

### Performance Indicators
- **Connections/sec**: How fast new connections are established
- **Messages/sec**: Message throughput

## Typical Results by Server Capacity

### Single Node.js Server (2 CPU, 4GB RAM)
- **Max Connections**: ~1,000-2,000
- **Messages/sec**: ~500-1,000
- **Breaking Point**: Memory exhaustion around 2,000 connections

### Clustered Setup (4 workers, 8 CPU, 16GB RAM)
- **Max Connections**: ~8,000-10,000
- **Messages/sec**: ~2,000-5,000
- **Breaking Point**: File descriptor limits

### Load Balanced (5 servers, Redis)
- **Max Connections**: ~50,000+
- **Messages/sec**: ~10,000+
- **Breaking Point**: Database/Redis performance

## Monitoring During Tests

1. **Server Resources**
   ```bash
   # Monitor CPU and memory
   htop
   
   # Monitor network connections
   netstat -an | grep :3001 | wc -l
   
   # Monitor file descriptors
   lsof -p $(pgrep node) | wc -l
   ```

2. **Application Logs**
   ```bash
   # If using PM2
   pm2 logs
   
   # Direct server logs
   tail -f server/logs/*.log
   ```

3. **Database Performance**
   ```bash
   # MongoDB
   mongostat
   
   # Redis
   redis-cli info stats
   ```

## Common Bottlenecks

### 1. Memory Issues
**Symptoms**: Connections drop, server becomes unresponsive
**Solutions**: 
- Increase server memory
- Implement connection limits
- Use clustering

### 2. File Descriptor Limits
**Symptoms**: "EMFILE: too many open files"
**Solutions**:
```bash
# Increase limits
ulimit -n 65536
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf
```

### 3. Database Bottlenecks
**Symptoms**: Slow message delivery, timeouts
**Solutions**:
- Add database indexes
- Implement connection pooling
- Use read replicas

### 4. Network Bandwidth
**Symptoms**: Slow connections, packet loss
**Solutions**:
- Upgrade network capacity
- Use CDN for static assets
- Implement message compression

## Scaling Recommendations

Based on test results, here are scaling recommendations:

### For 1,000 concurrent users:
- Single server with 4 CPU, 8GB RAM
- Basic monitoring
- File-based storage acceptable

### For 10,000 concurrent users:
- 2-3 servers with load balancer
- Redis for session management
- Database with connection pooling
- Basic clustering

### For 100,000 concurrent users:
- 10+ servers with auto-scaling
- Redis cluster
- Database sharding
- CDN implementation
- Advanced monitoring

### For 1,000,000 concurrent users:
- 50+ servers across multiple regions
- Microservices architecture
- Message queuing system
- Database clustering
- Full observability stack

## Troubleshooting

### Test Fails to Connect
1. Check if server is running: `curl http://localhost:3001/health`
2. Verify WebSocket support: Check browser console
3. Check firewall settings
4. Verify CORS configuration

### Low Success Rates
1. Increase connection intervals
2. Check server resources
3. Monitor error logs
4. Verify database connectivity

### Poor Message Delivery
1. Check Redis connectivity
2. Monitor database performance
3. Verify Socket.io clustering
4. Check network latency

## Advanced Testing

For more sophisticated load testing, consider:

1. **Artillery.io**: More advanced scenarios
2. **k6**: Better performance metrics
3. **JMeter**: GUI-based testing
4. **Custom scripts**: Specific to your use case

Example Artillery config:
```yaml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 100
scenarios:
  - name: "WebSocket Load Test"
    engine: socketio
    flow:
      - emit:
          channel: "join"
          data: "{{ $randomString() }}"
```