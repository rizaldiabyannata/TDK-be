# Render Deployment Guide

## Overview

This guide explains how to deploy your TDK Backend application to Render using the `render.yaml` Blueprint.

## Important Notes

### MongoDB Configuration

**Render does not natively support MongoDB databases.** The `render.yaml` file includes a PostgreSQL database placeholder. You have three options:

1. **MongoDB Atlas (Recommended)**

   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster
   - Get your connection string
   - Update the `MONGO_URI` environment variable in Render Dashboard

2. **External MongoDB Provider**

   - Use services like DigitalOcean, AWS DocumentDB, or other MongoDB providers
   - Update the connection string accordingly

3. **Self-Hosted MongoDB**
   - Deploy MongoDB as a separate Docker service on Render
   - Not recommended for production

### MinIO Configuration

MinIO is used for object storage. You'll need to:

- Use an external MinIO instance, or
- Use alternative object storage (AWS S3, Cloudflare R2, etc.)
- Update the MinIO environment variables accordingly

## Pre-Deployment Checklist

- [ ] Push your code to GitHub/GitLab
- [ ] Set up MongoDB Atlas or external MongoDB
- [ ] Prepare MinIO or alternative object storage
- [ ] Have all secret values ready (passwords, API keys, etc.)

## Deployment Steps

### 1. Connect Repository

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Blueprint"
3. Connect your GitHub/GitLab repository
4. Render will detect the `render.yaml` file

### 2. Configure Environment Variables

During setup, you'll be prompted for these secret values:

**Required:**

- `ADMIN_PASSWORD` - Initial admin password
- `MONGO_URI` - MongoDB connection string (from Atlas or external provider)

**Optional (if using):**

- `REDIS_PASSWORD` - Redis password (if authentication enabled)
- `EMAIL_USER` - Email service username
- `EMAIL_PASSWORD` - Email service password
- `MINIO_ENDPOINT` - MinIO server endpoint
- `MINIO_PORT` - MinIO server port
- `MINIO_ACCESS_KEY` - MinIO access key
- `MINIO_SECRET_KEY` - MinIO secret key
- `ORIGIN_WHITELIST` - Comma-separated list of allowed origins

### 3. Review and Deploy

1. Review the services that will be created:
   - `tdk-backend` - Main Express.js application
   - `tdk-redis` - Redis Key-Value store
   - `tdk-mongodb` - PostgreSQL (placeholder - replace with MongoDB Atlas)
2. Click "Apply" to start deployment

### 4. Post-Deployment Configuration

#### Update MongoDB Connection

1. Go to your web service settings
2. Update `MONGO_URI` with your MongoDB Atlas connection string:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/tdk-db?retryWrites=true&w=majority
   ```

#### Configure CORS Origins

Update the `ORIGIN_WHITELIST` variable with your frontend URLs:

```
https://your-frontend.com,https://www.your-frontend.com
```

#### Verify Health Check

Your application should be accessible at:

```
https://tdk-backend.onrender.com/api/runtime
```

## Service Configuration

### Web Service (tdk-backend)

- **Instance Type:** Starter (can upgrade to Standard/Pro)
- **Region:** Singapore
- **Health Check:** `/api/runtime`
- **Auto-deploy:** Enabled on push to main branch

### Redis (tdk-redis)

- **Instance Type:** Starter
- **Region:** Singapore
- **Eviction Policy:** allkeys-lru
- **External Access:** Enabled

## Scaling Considerations

### Manual Scaling

To scale your web service:

1. Go to service settings
2. Update `numInstances` in `render.yaml`:
   ```yaml
   numInstances: 3
   ```
3. Commit and push changes

### Autoscaling (Professional Plan)

```yaml
scaling:
  minInstances: 1
  maxInstances: 5
  targetCPUPercent: 70
  targetMemoryPercent: 80
```

## Monitoring

### Logs

- Access logs in Render Dashboard under each service
- Application logs are written to Winston logger

### Metrics

- Monitor CPU, Memory, and Network usage in Render Dashboard
- Set up alerts for service health

## Troubleshooting

### Service Won't Start

1. Check logs in Render Dashboard
2. Verify all environment variables are set
3. Ensure MongoDB connection string is correct

### CORS Errors

1. Update `ORIGIN_WHITELIST` with your frontend URL
2. Ensure credentials are enabled in frontend requests

### Database Connection Issues

1. Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
2. Check connection string format
3. Ensure database user has correct permissions

## Cost Estimation

### Free Tier

- Web Service: Free (with limitations)
- Redis: Free (25MB)
- Total: $0/month

### Starter Tier

- Web Service: $7/month
- Redis: $10/month
- Total: $17/month

### Production Tier

- Web Service (Standard): $25/month
- Redis (Pro): $50/month
- MongoDB Atlas (M10): $57/month
- Total: ~$132/month

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Blueprint Reference](https://render.com/docs/blueprint-spec)
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/)
- [Environment Variables](https://render.com/docs/configure-environment-variables)

## Support

For issues specific to:

- **Render Platform:** [Render Support](https://render.com/support)
- **Application Code:** Check application logs and documentation
- **MongoDB Atlas:** [MongoDB Support](https://www.mongodb.com/support)
