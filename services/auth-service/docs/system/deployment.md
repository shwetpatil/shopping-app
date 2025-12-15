# Deployment Guide

## Prerequisites

### Infrastructure Requirements
- **Kubernetes**: v1.24+
- **PostgreSQL**: v16+ (managed or self-hosted)
- **Container Registry**: Docker Hub, ECR, GCR, or ACR
- **Load Balancer**: Cloud provider LB or Nginx/HAProxy
- **Monitoring**: Prometheus + Grafana (optional but recommended)

### Environment Variables
```bash
# Application
NODE_ENV=production
PORT=3001
APP_VERSION=1.0.0

# Database
DATABASE_URL=postgresql://user:password@host:5432/auth_db?schema=public

# Security
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
REFRESH_TOKEN_SECRET=your-refresh-token-secret
BCRYPT_ROUNDS=10

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

## Docker Deployment

### Dockerfile
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production && npm cache clean --force

# Copy source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3001

CMD ["npm", "start"]
```

### Build & Push
```bash
# Build image
docker build -t auth-service:1.0.0 .

# Tag for registry
docker tag auth-service:1.0.0 your-registry/auth-service:1.0.0
docker tag auth-service:1.0.0 your-registry/auth-service:latest

# Push to registry
docker push your-registry/auth-service:1.0.0
docker push your-registry/auth-service:latest
```

### Docker Compose (Local/Staging)
```yaml
version: '3.8'

services:
  auth-service:
    image: auth-service:latest
    container_name: auth-service
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:password@postgres:5432/auth_db
      JWT_SECRET: ${JWT_SECRET}
      REFRESH_TOKEN_SECRET: ${REFRESH_TOKEN_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: auth_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

## Kubernetes Deployment

### Namespace
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: shopping-app
```

### ConfigMap
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: auth-service-config
  namespace: shopping-app
data:
  NODE_ENV: "production"
  PORT: "3001"
  LOG_LEVEL: "info"
  BCRYPT_ROUNDS: "10"
  RATE_LIMIT_WINDOW_MS: "900000"
  RATE_LIMIT_MAX_REQUESTS: "100"
```

### Secret
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: auth-service-secrets
  namespace: shopping-app
type: Opaque
stringData:
  database-url: "postgresql://user:password@postgres-service:5432/auth_db"
  jwt-secret: "your-super-secret-jwt-key"
  refresh-token-secret: "your-refresh-token-secret"
```

### Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: shopping-app
  labels:
    app: auth-service
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
        version: v1
    spec:
      containers:
      - name: auth-service
        image: your-registry/auth-service:1.0.0
        ports:
        - containerPort: 3001
          name: http
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: auth-service-config
              key: NODE_ENV
        - name: PORT
          valueFrom:
            configMapKeyRef:
              name: auth-service-config
              key: PORT
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: auth-service-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: auth-service-secrets
              key: jwt-secret
        - name: REFRESH_TOKEN_SECRET
          valueFrom:
            secretKeyRef:
              name: auth-service-secrets
              key: refresh-token-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
      imagePullSecrets:
      - name: registry-credentials
```

### Service
```yaml
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: shopping-app
  labels:
    app: auth-service
spec:
  type: ClusterIP
  ports:
  - port: 3001
    targetPort: 3001
    protocol: TCP
    name: http
  selector:
    app: auth-service
```

### HorizontalPodAutoscaler
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auth-service-hpa
  namespace: shopping-app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  minReplicas: 3
  maxReplicas: 10
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
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
      - type: Pods
        value: 2
        periodSeconds: 60
```

### Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: auth-service-ingress
  namespace: shopping-app
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/rate-limit: "100"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.example.com
    secretName: api-tls
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /api/v1/auth
        pathType: Prefix
        backend:
          service:
            name: auth-service
            port:
              number: 3001
```

## Database Migration

### Pre-Deployment
```bash
# Run migrations
npx prisma migrate deploy

# Verify migration
npx prisma migrate status

# Generate Prisma Client
npx prisma generate
```

### Kubernetes Job for Migration
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: auth-service-migration
  namespace: shopping-app
spec:
  template:
    spec:
      containers:
      - name: migration
        image: your-registry/auth-service:1.0.0
        command: ["npx", "prisma", "migrate", "deploy"]
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: auth-service-secrets
              key: database-url
      restartPolicy: OnFailure
  backoffLimit: 3
```

## Deployment Process

### 1. Pre-Deployment Checks
```bash
# Build and test locally
npm run build
npm run test

# Build Docker image
docker build -t auth-service:1.0.0 .

# Run image locally
docker run -p 3001:3001 --env-file .env.production auth-service:1.0.0

# Health check
curl http://localhost:3001/health
```

### 2. Push to Registry
```bash
docker push your-registry/auth-service:1.0.0
```

### 3. Apply Kubernetes Resources
```bash
# Apply in order
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/migration-job.yaml

# Wait for migration to complete
kubectl wait --for=condition=complete job/auth-service-migration -n shopping-app

# Deploy service
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/ingress.yaml
```

### 4. Verify Deployment
```bash
# Check pods
kubectl get pods -n shopping-app -l app=auth-service

# Check logs
kubectl logs -n shopping-app -l app=auth-service --tail=100

# Port forward for testing
kubectl port-forward -n shopping-app svc/auth-service 3001:3001

# Test endpoints
curl http://localhost:3001/health
```

### 5. Monitor Rollout
```bash
# Watch rollout status
kubectl rollout status deployment/auth-service -n shopping-app

# Check events
kubectl get events -n shopping-app --sort-by='.lastTimestamp'

# Monitor logs
kubectl logs -n shopping-app -l app=auth-service -f
```

## Rollback Procedure

```bash
# View rollout history
kubectl rollout history deployment/auth-service -n shopping-app

# Rollback to previous version
kubectl rollout undo deployment/auth-service -n shopping-app

# Rollback to specific revision
kubectl rollout undo deployment/auth-service -n shopping-app --to-revision=2

# Verify rollback
kubectl rollout status deployment/auth-service -n shopping-app
```

## Blue-Green Deployment

```yaml
# Blue deployment (current)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service-blue
  labels:
    version: blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
      version: blue
  # ... rest of spec

---
# Green deployment (new)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service-green
  labels:
    version: green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
      version: green
  # ... rest of spec

---
# Service (switch between blue/green)
apiVersion: v1
kind: Service
metadata:
  name: auth-service
spec:
  selector:
    app: auth-service
    version: blue  # Change to 'green' to switch
  # ... rest of spec
```

## Canary Deployment

```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: auth-service
  namespace: shopping-app
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  service:
    port: 3001
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
      interval: 1m
    - name: request-duration
      thresholdRange:
        max: 500
      interval: 1m
```

## Health Check Endpoints

### Implementation
```typescript
// Liveness probe
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Readiness probe
app.get('/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'READY' });
  } catch (error) {
    res.status(503).json({ status: 'NOT_READY' });
  }
});
```

## Monitoring Setup

### ServiceMonitor (Prometheus)
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: auth-service
  namespace: shopping-app
spec:
  selector:
    matchLabels:
      app: auth-service
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Secrets created and stored securely
- [ ] Database migrations tested
- [ ] Docker image built and pushed
- [ ] Kubernetes resources applied
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Logging aggregation setup
- [ ] Alerting rules configured
- [ ] Load testing performed
- [ ] Rollback procedure tested
- [ ] Documentation updated
- [ ] Team notified
