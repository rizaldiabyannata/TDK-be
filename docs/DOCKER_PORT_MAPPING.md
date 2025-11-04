# Docker Compose Port Mapping Guide

## 📋 Port Configuration

### Current Port Mapping (Host:Container)

| Service           | Host Port | Container Port | Access From Host     | Access From Container |
| ----------------- | --------- | -------------- | -------------------- | --------------------- |
| **App API**       | 5000      | 5000           | ✅ `localhost:5000`  | ✅ `app:5000`         |
| **Redis**         | 6379      | 6379           | ✅ `localhost:6379`  | ✅ `redis:6379`       |
| **MongoDB**       | 27017     | 27017          | ✅ `localhost:27017` | ✅ `mongo:27017`      |
| **MinIO API**     | 9004      | 9000           | ✅ `localhost:9004`  | ✅ `minio:9000`       |
| **MinIO Console** | 9005      | 9001           | ✅ `localhost:9005`  | ✅ `minio:9001`       |

## 🔧 Docker Compose Configuration

### Redis Service:

```yaml
redis:
  ports:
    - "6379:6379" # Host:Container
  networks:
    - app-network
```

**Access:**

- From Host: `redis://localhost:6379`
- From Container: `redis://redis:6379`
- With Auth: `redis://default:password@localhost:6379`

### MongoDB Service:

```yaml
mongo:
  ports:
    - "27017:27017" # Host:Container
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: strongpassword123
  networks:
    - app-network
```

**Access:**

- From Host: `mongodb://admin:strongpassword123@localhost:27017/tdk-db?authSource=admin`
- From Container: `mongodb://admin:strongpassword123@mongo:27017/tdk-db?authSource=admin`

### MinIO Service:

```yaml
minio:
  ports:
    - "9004:9000" # API: Host:Container
    - "9005:9001" # Console: Host:Container
  environment:
    MINIO_ROOT_USER: minioadmin
    MINIO_ROOT_PASSWORD: minioadmin123
  networks:
    - app-network
```

**Access:**

- API From Host: `http://localhost:9004`
- API From Container: `http://minio:9000`
- Console: `http://localhost:9005` (username: minioadmin, password: minioadmin123)

## 🧪 Testing Connections

### Test Redis from Host:

```bash
# Using bun
bun test/test-redis-from-host.js

# Using redis-cli (if installed)
redis-cli -h localhost -p 6379 -a j0pyQezhUPiXkkiD9icg ping
```

### Test MongoDB from Host:

```bash
# Using mongosh (if installed)
mongosh "mongodb://admin:strongpassword123@localhost:27017/tdk-db?authSource=admin"

# Test connection
mongosh --host localhost --port 27017 -u admin -p strongpassword123 --authenticationDatabase admin
```

### Test MinIO from Host:

```bash
# Using test script
bun test/test-minio-connection.js

# Using curl
curl http://localhost:9004/minio/health/live
```

### Test API from Host:

```bash
curl http://localhost:5000/api/runtime
```

## 📝 Environment Variables

### For Development (Host Access):

```env
# .env file
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=j0pyQezhUPiXkkiD9icg

MONGO_URI=mongodb://admin:strongpassword123@localhost:27017/tdk-db?authSource=admin

MINIO_ENDPOINT=localhost
MINIO_PORT=9004
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
```

### For Docker Container (Internal Access):

```yaml
# docker-compose.yml environment override
app:
  environment:
    REDIS_HOST: redis
    MONGO_URI: mongodb://admin:strongpassword123@mongo:27017/tdk-db?authSource=admin
    MINIO_ENDPOINT: minio
    MINIO_PORT: 9000
```

## 🔒 Security Considerations

### Development Environment:

✅ **Ports forwarded** - Easy to debug and test with local tools

- Redis: 6379
- MongoDB: 27017
- MinIO: 9004, 9005

### Production Environment:

⚠️ **Recommended**: Remove port forwarding for databases

```yaml
# Production docker-compose.yml
redis:
  expose:
    - "6379" # Internal only, no host access

mongo:
  expose:
    - "27017" # Internal only, no host access

minio:
  expose:
    - "9000"
    - "9001" # Internal only, no host access
```

**Why?**

- Reduces attack surface
- Prevents unauthorized external access
- Forces access through app layer
- Better for production security

### Access Production Databases:

```bash
# Option 1: Use docker exec
docker compose exec redis redis-cli -a password
docker compose exec mongo mongosh -u admin -p password

# Option 2: Temporary port forwarding
docker port redis-tdk 6379
ssh -L 6379:localhost:6379 user@server
```

## 🚀 Quick Commands

### Start All Services:

```bash
docker compose up -d
```

### Check Port Mapping:

```bash
docker compose ps
```

### View Logs:

```bash
docker compose logs -f app
docker compose logs redis
docker compose logs mongo
docker compose logs minio
```

### Stop Services:

```bash
docker compose down
```

### Reset Everything (including volumes):

```bash
docker compose down -v
```

## 🔍 Troubleshooting

### Port Already in Use:

```bash
# Windows: Find process using port
netstat -ano | findstr :6379
netstat -ano | findstr :27017

# Kill process by PID
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
```

### Can't Connect from Host:

1. Check if ports are forwarded:
   ```bash
   docker compose ps
   ```
2. Verify firewall settings
3. Check .env variables match host/container context
4. Ensure services are healthy:
   ```bash
   docker compose logs <service-name>
   ```

### Connection Refused:

- Wait for services to fully start (especially MongoDB)
- Check authentication credentials
- Verify network connectivity

## ✅ Test Results

All services tested and working from host:

```
✅ Redis: localhost:6379 - Connected
✅ MongoDB: localhost:27017 - Connected (with auth)
✅ MinIO: localhost:9004 - Connected
✅ App API: localhost:5000 - Running
```

---

**Last Updated**: November 4, 2025  
**Configuration**: Development (All ports forwarded for easy access)
