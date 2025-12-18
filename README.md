# Shopping App - Enterprise E-Commerce Platform

🏆 **Production-Ready** microservices-based e-commerce platform with microfrontend architecture, event-driven backend, and comprehensive security.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Microservices](https://img.shields.io/badge/Microservices-8-green.svg)](#backend-microservices)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success.svg)](#project-status)

## ✨ Key Features

**Frontend (Microfrontends)**
- 🎯 **6 Independent MFEs** - Domain isolation with separate deployments
- 📦 **Type-Safe Contracts** - Shared contracts package with event system
- 🎨 **Shared UI** - Common components and utilities
- 🔒 **Centralized Auth** - Shared authentication manager
- 📊 **Performance Monitoring** - Built-in metrics and tracking
- 🚀 **Feature Flags** - Gradual rollout capabilities

**Backend (Microservices)**
- 🏗️ **8 Microservices** - Event-driven with Kafka
- 🔐 **JWT Authentication** - Secure auth service
- 💳 **Stripe Integration** - Payment processing
- 📧 **Email Notifications** - Templated messaging
- 🗄️ **Database Per Service** - PostgreSQL + Redis
- 🔄 **Event Sourcing** - Complete audit trail

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

### Start Everything
```bash
# 1. Install dependencies
pnpm install

# 2. Start infrastructure (PostgreSQL, Redis, Kafka)
docker-compose up -d

# 3. Seed databases with test data (1,500+ records)
pnpm run db:seed

# 4. Start backend services
pnpm run services:all

# 5. Start frontend microfrontends
./start-all.sh

# 6. Test the APIs
./scripts/test-phase2-apis.sh
```

📚 **Detailed Setup:** [docs/PHASE2_SETUP.md](docs/PHASE2_SETUP.md) | [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)

### Test Accounts
```
Admin:    admin@example.com / Admin123!
Vendor:   vendor@example.com / Vendor123!
Customer: customer@example.com / Customer123!
```

### 🌐 Application URLs

> **Note:** All ports are centrally managed in [config/ports.ts](config/ports.ts). See [config/README.md](config/README.md) for details.

#### Frontend Microfrontends
| Application | Port | URL | Owner |
|------------|------|-----|-------|
| Shell (Host) | 3000 | http://localhost:3000 | Platform Team |
| Search | 3001 | http://localhost:3001 | Search Team |
| Wishlist | 3002 | http://localhost:3002 | Engagement Team |
| Reviews | 3003 | http://localhost:3003 | Engagement Team |
| Products | 3004 | http://localhost:3004 | Commerce Team |
| Cart | 3005 | http://localhost:3005 | Commerce Team |

#### Backend Microservices
| Service | Port | URL |
|---------|------|-----|
| API Gateway | 3000 | http://localhost:3000 |
| Auth | 3001 | http://localhost:3001 |
| Products | 3002 | http://localhost:3002 |
| Orders | 3003 | http://localhost:3003 |
| Payments | 3005 | http://localhost:3005 |
| Cart | 3006 | http://localhost:3006 |
| Inventory | 3007 | http://localhost:3007 |
| Notifications | 3008 | http://localhost:3008 |
| Kafka UI | 8080 | http://localhost:8080 |

## 🏗️ Architecture

### Project Structure
```
shopping-app/
├── apps/                           # Frontend Microfrontends
│   ├── mfe-shell/                  # Host container (Platform Team)
│   ├── mfe-search/                 # Search (Search Team)
│   ├── mfe-products/               # Products (Commerce Team)
│   ├── mfe-cart/                   # Cart (Commerce Team)
│   ├── mfe-wishlist/               # Wishlist (Engagement Team)
│   └── mfe-reviews/                # Reviews (Engagement Team)
│
├── config/                         # Configuration
│   ├── ports.ts                    # Centralized port configuration
│   └── README.md                   # Port documentation
│   ├── mfe-wishlist/               # Wishlist (Engagement Team)
│   └── mfe-reviews/                # Reviews (Engagement Team)
│
├── packages/                       # Shared Packages
│   ├── mfe-contracts/              # Type-safe contracts & events
│   ├── shared-ui/                  # Common UI utilities
│   └── common/                     # Backend utilities
│
├── services/                       # Backend Microservices
│   ├── api-gateway/                # API Gateway + BFF
│   ├── auth-service/               # Authentication
│   ├── product-service/            # Product catalog
│   ├── order-service/              # Order processing
│   ├── cart-service/               # Shopping cart
│   ├── payment-service/            # Stripe payments
│   ├── inventory-service/          # Stock management
│   └── notification-service/       # Email notifications
│
├── docs/                           # Documentation
│   ├── architecture/               # Architecture & best practices
│   ├── adr/                        # Architecture decisions
│   ├── guides/                     # How-to guides
│   ├── operations/                 # Ops procedures
│   └── development/                # Dev guides
│
└── scripts/                        # Utility scripts
```

### Event-Driven Workflows

**Order Creation Flow:**
```
User → Order Service → publishes ORDER_CREATED event
  ├→ Inventory Service (reserves stock) → publishes STOCK_RESERVED
  │   └→ Order Service (updates status)
  └→ Notification Service (sends confirmation email)
```

**Payment Flow:**
```
User → Payment Service (create intent) → Stripe processes payment
Stripe Webhook → Payment Service → publishes PAYMENT_AUTHORIZED
  ├→ Order Service (confirms order)
  └→ Notification Service (payment confirmation email)
```

## 📦 Shared Packages

### @shopping-app/mfe-contracts
Type-safe contracts for microfrontends with event system, performance monitoring, and feature flags.

```typescript
import { 
  ProductCardProps,
  mfeEventBus,
  useMFELoadTime,
  useAuth,
  featureFlags,
  MFEErrorBoundary 
} from '@shopping-app/mfe-contracts';

// Event publishing
mfeEventBus.publish('product:view', { productId: '123' });

// Performance monitoring
const loadTime = useMFELoadTime('mfe-search');

// Feature flags
const showNewUI = featureFlags.isEnabled('new-product-card');
```

### @shopping-app/shared-ui
Common UI utilities including API client, formatting, and validation.

```typescript
import { 
  createAPIClient,
  formatCurrency,
  formatDate,
  validateEmail 
} from '@shopping-app/shared-ui';

// API client with auth
const api = createAPIClient({ baseURL: '/api' });
const products = await api.get('/products');

// Utilities
formatCurrency(29.99, 'USD'); // "$29.99"
formatDate(new Date(), 'relative'); // "2 hours ago"
```

### @shopping-app/common
Backend utilities for error handling, logging, and Kafka integration.

```typescript
import { KafkaClient, logger, AppError } from '@shopping-app/common';

// Kafka events
await kafka.publish('order.created', { orderId: '123' });

// Structured logging
logger.info('Order created', { orderId: '123' });
```

## 🎯 Key Benefits

### Independent Deployment
- Deploy individual MFEs or services without affecting others
- Separate CI/CD pipelines per team
- Zero downtime deployments

### Team Autonomy
- Each team owns their domain
- Independent release schedules
- No merge conflicts

### Technology Flexibility
- Different versions/frameworks per module
- Independent dependency management
- Module-specific optimizations

### Scalability
- Scale individual services based on demand
- Modular loading in frontend
- Efficient resource utilization

## 📊 Architecture Metrics

| Metric | Value |
|--------|-------|
| **MFE Build Time** | ~30s per MFE |
| **MFE Bundle Size** | ~450KB average |
| **Microfrontends** | 6 independent apps |
| **Microservices** | 8 backend services |
| **Shared Packages** | 3 packages |
| **Teams** | 3 autonomous teams |
| **Deployment** | Independent per module |

## 🎉 What's Implemented

### Frontend ✅
- 6 Next.js 14 microfrontends
- Type-safe contracts system
- Event-driven communication
- Shared UI utilities
- Performance monitoring
- Feature flags
- Error boundaries
- Centralized auth

### Backend ✅
- 8 Express.js microservices
- Event-driven with Kafka
- JWT authentication
- Stripe payment processing
- Email notifications
- Redis caching
- PostgreSQL per service
- API Gateway with BFF pattern
- Comprehensive security

### DevOps ✅
- Docker Compose infrastructure
- Database seeding (1,500+ records)
- Health checks
- Structured logging
- Error handling

## 📚 Documentation

### Getting Started
- [Quick Start](docs/GETTING_STARTED.md) - Get running in minutes
- [Phase 2 Setup](docs/PHASE2_SETUP.md) - Complete backend setup
- [Database Seeding](docs/DATABASE_SEEDING.md) - Test data guide
- [API Testing](docs/API_TESTING.md) - API testing guide

### Architecture & Design
- [Best Practices](docs/architecture/BEST_PRACTICES.md) - Frontend patterns
- [Backend Best Practices](docs/architecture/BACKEND_BEST_PRACTICES.md) - Microservices patterns
- [Architecture Decisions](docs/adr/) - ADRs
- [Phase 2 Summary](docs/PHASE2_SUMMARY.md) - Event-driven architecture
- [Phase 3 Complete](docs/PHASE3_COMPLETE.md) - Cart, Payment, Inventory, Notifications

### Security
- [Security Summary](docs/SECURITY_SUMMARY.md) - Security overview
- [Security Implementation](docs/SECURITY_IMPLEMENTATION.md) - Detailed guide
- [Security Quick Reference](docs/SECURITY_QUICK_REFERENCE.md) - Quick guide

### Development
- [Development Guide](docs/development/) - Dev procedures
- [Operations Guide](docs/operations/) - Ops procedures
- [API Documentation](docs/api/) - API reference

## 🏢 Team Ownership

| Team | Domains | Services |
|------|---------|----------|
| **Platform** | Infrastructure, Shell | API Gateway, mfe-shell |
| **Search** | Search & Discovery | Search Service, mfe-search |
| **Engagement** | User Engagement | Wishlist, Reviews, Notifications |
| **Commerce** | Shopping & Orders | Products, Cart, Orders, Payments, Inventory |

## 🔐 Security

- JWT authentication with refresh tokens
- Rate limiting (100 req/min)
- CORS with whitelist
- Input validation & sanitization
- SQL injection protection
- XSS prevention
- CSRF protection
- Encryption at rest
- Secure password hashing (bcrypt)
- API key management
- PCI compliance (via Stripe)

See [Security Summary](docs/SECURITY_SUMMARY.md) for details.

## 🛠️ Development Commands

```bash
# Install dependencies
pnpm install

# Start infrastructure
docker-compose up -d

# Seed databases
npm run db:seed:all

# Start backend services
./scripts/start-phase2-services.sh

# Start frontend MFEs
./start-all.sh

# Run tests
pnpm test

# Lint code
pnpm lint

# Build all
pnpm build
```

## 📝 License

MIT

---

**Built with ❤️ for enterprise-grade microservices architecture**
