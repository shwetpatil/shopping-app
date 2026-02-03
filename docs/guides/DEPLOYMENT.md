# Deployment Guide

Guide for deploying the Shopping App microfrontends to production.

## Deployment Strategy

Each microfrontend can be deployed independently without affecting others.

### Deployment Options

1. **Vercel** (Recommended for Next.js)
2. **AWS** (S3 + CloudFront + ECS)
3. **Kubernetes**
4. **Docker Swarm**

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Code review completed
- [ ] Environment variables configured
- [ ] API endpoints updated
- [ ] Build succeeds locally
- [ ] Performance metrics acceptable

## Vercel Deployment

### Setup

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy MFE**
```bash
cd apps/mfe-search
vercel
```

### Environment Variables

Configure in Vercel dashboard:
- `NEXT_PUBLIC_API_URL` - Backend API Gateway URL
- `NODE_ENV` - production

### Automatic Deployment

Create `.github/workflows/deploy-search.yml`:

```yaml
name: Deploy Search MFE

on:
  push:
    branches: [main]
    paths:
      - 'apps/mfe-search/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        working-directory: apps/mfe-search
        run: npm ci
        
      - name: Build
        working-directory: apps/mfe-search
        run: npm run build
        
      - name: Deploy to Vercel
        working-directory: apps/mfe-search
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Docker Deployment

### Build Images

```bash
# Build all MFEs
docker-compose -f docker-compose.mfe.yml build

# Or build individual
cd apps/mfe-search
docker build -t shopping-app/mfe-search:v1.0.0 .
```

### Push to Registry

```bash
# Tag image
docker tag shopping-app/mfe-search:v1.0.0 registry.example.com/mfe-search:v1.0.0

# Push to registry
docker push registry.example.com/mfe-search:v1.0.0
```

### Run Container

```bash
docker run -d \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_API_URL=https://api.example.com \
  --name mfe-search \
  registry.example.com/mfe-search:v1.0.0
```

## Kubernetes Deployment

### Deployment Manifest

`k8s/mfe-search-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mfe-search
  labels:
    app: mfe-search
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mfe-search
  template:
    metadata:
      labels:
        app: mfe-search
    spec:
      containers:
      - name: mfe-search
        image: registry.example.com/mfe-search:v1.0.0
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: NEXT_PUBLIC_API_URL
          value: "https://api.example.com"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: mfe-search
spec:
  selector:
    app: mfe-search
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: mfe-search
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: mfe-search
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Deploy to Kubernetes

```bash
# Apply deployment
kubectl apply -f k8s/mfe-search-deployment.yaml

# Check status
kubectl get pods -l app=mfe-search
kubectl get svc mfe-search

# View logs
kubectl logs -f deployment/mfe-search
```


## AWS Deployment

### S3 + CloudFront (Static Export)

> **Note:** Only MFEs that do NOT use server-side rendering (SSR) or custom API routes can be deployed as static exports to S3/CloudFront. Typically, MFEs like `mfe-search`, `mfe-wishlist`, and `mfe-reviews` are suitable for static export. MFEs like `mfe-shell`, `mfe-products`, and `mfe-cart` may require SSR or API routes and should use ECS (Docker).

#### For Static MFEs (e.g., mfe-search, mfe-wishlist, mfe-reviews):

1. **Export Next.js app**

Add to `apps/mfe-<name>/next.config.js`:
```javascript
module.exports = {
  output: 'export',
  images: {
    unoptimized: true
  }
}
```

2. **Build and export**
```bash
cd apps/mfe-<name>
npm run build
```

3. **Upload to S3**
```bash
aws s3 sync out/ s3://mfe-<name>-bucket --delete
```

4. **Create CloudFront distribution**
```bash
aws cloudfront create-distribution \
  --origin-domain-name mfe-<name>-bucket.s3.amazonaws.com \
  --default-root-object index.html
```

#### For SSR/API MFEs (e.g., mfe-shell, mfe-products, mfe-cart):

### ECS (Docker)

1. **Create ECR repository**
```bash
aws ecr create-repository --repository-name mfe-<name>
```

2. **Build and push image**
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

cd apps/mfe-<name>
docker build -t mfe-<name> .
docker tag mfe-<name>:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/mfe-<name>:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/mfe-<name>:latest
```

3. **Create ECS task definition**
```json
{
  "family": "mfe-<name>",
  "containerDefinitions": [
    {
      "name": "mfe-<name>",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/mfe-<name>:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "NEXT_PUBLIC_API_URL",
          "value": "https://api.example.com"
        }
      ],
      "memory": 512,
      "cpu": 256
    }
  ]
}
```

4. **Create ECS service**
```bash
aws ecs create-service \
  --cluster production \
  --service-name mfe-<name> \
  --task-definition mfe-<name> \
  --desired-count 2 \
  --launch-type FARGATE
```

## Environment Configuration

### Development
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NODE_ENV=development
```

### Staging
```env
NEXT_PUBLIC_API_URL=https://staging-api.example.com
NODE_ENV=production
```

### Production
```env
NEXT_PUBLIC_API_URL=https://api.example.com
NODE_ENV=production
```

## Monitoring & Observability

### Health Checks

Add to each MFE:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
}
```

### Performance Monitoring

Integrate with:
- **Vercel Analytics** (built-in)
- **Google Analytics**
- **New Relic**
- **Datadog**

### Error Tracking

Use **Sentry**:

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Logging

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      meta,
      timestamp: new Date().toISOString()
    }));
  },
  error: (message: string, error?: Error) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.stack,
      timestamp: new Date().toISOString()
    }));
  }
};
```

## Rollback Strategy

### Vercel
```bash
vercel rollback
```

### Kubernetes
```bash
# Rollback to previous version
kubectl rollout undo deployment/mfe-search

# Rollback to specific revision
kubectl rollout undo deployment/mfe-search --to-revision=2
```

### Docker
```bash
# Deploy previous version
docker pull registry.example.com/mfe-search:v0.9.0
docker stop mfe-search
docker rm mfe-search
docker run -d --name mfe-search registry.example.com/mfe-search:v0.9.0
```

## Performance Optimization

### Bundle Analysis

```bash
npm install --save-dev @next/bundle-analyzer

# Analyze bundle
ANALYZE=true npm run build
```

### Image Optimization

Use Next.js Image component:
```typescript
import Image from 'next/image';

<Image
  src="/product.jpg"
  alt="Product"
  width={500}
  height={500}
  priority
/>
```

### Caching Strategy

Configure in `next.config.js`:
```javascript
module.exports = {
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable'
        }
      ]
    }
  ]
}
```

## Security

### Environment Variables

Never commit secrets:
- Use `.env.local` for local development
- Use platform secrets for production
- Rotate credentials regularly

### Content Security Policy

```typescript
// next.config.js
module.exports = {
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-eval';"
        }
      ]
    }
  ]
}
```

## Troubleshooting

### Build Failures

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Container Won't Start

```bash
# Check logs
docker logs mfe-search

# Debug container
docker run -it mfe-search sh
```

### High Memory Usage

- Reduce image size
- Optimize bundle
- Enable compression
- Use smaller base image

## CI/CD Pipeline Example

`.github/workflows/ci-cd.yml`:

```yaml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        mfe: [shell, search, wishlist, reviews, products, cart]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Build
        working-directory: apps/mfe-${{ matrix.mfe }}
        run: |
          npm ci
          npm run build
      - name: Deploy
        run: |
          # Deploy logic here
          echo "Deploying mfe-${{ matrix.mfe }}"
```

## Best Practices

1. **Use staging environment** - Test before production
2. **Gradual rollouts** - Deploy to small % of users first
3. **Automated testing** - Run tests in CI/CD
4. **Monitor metrics** - Watch error rates, latency
5. **Have rollback plan** - Be ready to revert quickly
6. **Document changes** - Keep changelog updated
7. **Version everything** - Tag releases
8. **Use feature flags** - Enable/disable features without deployment

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [AWS Documentation](https://docs.aws.amazon.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
