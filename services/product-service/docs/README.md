# Product Service Documentation

Welcome to the Product Service documentation. This service manages product catalog, inventory visibility, and product information for the shopping application.

## Quick Links

### System Documentation
- [Overview](./system/overview.md) - Service purpose, capabilities, and boundaries
- [Architecture](./system/architecture.md) - Technical architecture and design patterns
- [Data Flow](./system/data-flow.md) - Request/response flows and data processing
- [Security Model](./system/security-model.md) - Authentication, authorization, and security measures
- [Observability](./system/observability.md) - Logging, metrics, and monitoring
- [Performance](./system/performance.md) - Performance optimization and benchmarks
- [Deployment](./system/deployment.md) - Deployment procedures and configurations
- [Environment Strategy](./system/environment-strategy.md) - Environment-specific configurations
- [Failure Recovery](./system/failure-recovery.md) - Incident response and recovery procedures
- [Backup & Restore](./system/backup-restore.md) - Data backup and restoration procedures
- [Disaster Recovery](./system/disaster-recovery.md) - DR plans and procedures
- [Capacity Planning](./system/capacity-planning.md) - Scaling and capacity management
- [SLA/SLO](./system/sla-slo.md) - Service level commitments
- [Glossary](./system/glossary.md) - Technical terms and definitions

### Architecture Decision Records (ADR)
- [ADR-0001: Technology Stack](./adr/0001-tech-stack.md)
- [ADR-0002: Database and ORM](./adr/0002-database-orm.md)
- [ADR-0003: Caching Strategy](./adr/0003-authentication.md)
- [ADR-0004: API Design](./adr/0004-api-design.md)
- [ADR-0005: Deployment Strategy](./adr/0005-deployment-strategy.md)

### Development Guides
- [Onboarding](./development/onboarding.md) - New developer setup guide
- [Local Setup](./development/local-setup.md) - Local development environment
- [Coding Standards](./development/coding-standards.md) - Code style and best practices
- [Branching & Release](./development/branching-release.md) - Git workflow and releases
- [Debugging](./development/debugging.md) - Debugging tools and techniques
- [Feature Flags](./development/feature-flags.md) - Feature flag usage
- [Conventions](./development/conventions.md) - Project conventions and patterns

### Operations
- [Runbooks](./operations/runbooks.md) - Operational procedures
- [Incident Management](./operations/incident-management.md) - Incident response
- [Monitoring & Alerts](./operations/monitoring-alerts.md) - Monitoring setup
- [Secrets Management](./operations/secrets-management.md) - Secret handling
- [Audit Logging](./operations/audit-logging.md) - Audit trail procedures

## Service Overview

**Port**: 3002  
**Database**: PostgreSQL (port 5433)  
**Purpose**: Product catalog management and search

### Key Features
- Product CRUD operations
- Category management
- Product search and filtering
- Image management
- Inventory integration
- Price management

### API Endpoints
```
GET    /api/products           - List products
GET    /api/products/:id       - Get product details
POST   /api/products           - Create product (Admin/Vendor)
PUT    /api/products/:id       - Update product (Admin/Vendor)
DELETE /api/products/:id       - Delete product (Admin)
GET    /api/products/search    - Search products
GET    /api/categories         - List categories
POST   /api/categories         - Create category (Admin)
```

### Technology Stack
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4.18+
- **Language**: TypeScript 5.3+
- **Database**: PostgreSQL 16 with Prisma ORM
- **Caching**: Redis (planned)

### Database Schema
- **products**: Product information
- **categories**: Product categories
- **product_images**: Product images
- **product_categories**: Many-to-many relationship

## Getting Started

### Prerequisites
- Node.js 20+
- Docker Desktop
- PostgreSQL (via Docker)

### Quick Start
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev

# Service available at http://localhost:3002
```

### Testing
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

## Contributing

Please read our [Coding Standards](./development/coding-standards.md) and [Branching Strategy](./development/branching-release.md) before contributing.

## Support

- **Team**: Product Team
- **Slack**: #product-service
- **On-Call**: Via PagerDuty rotation
- **Email**: product-team@example.com

## Related Services

- **Auth Service**: User authentication
- **Order Service**: Order management
- **Cart Service**: Shopping cart
- **Inventory Service**: Stock management
- **API Gateway**: Request routing

---

**Version**: 1.0.0  
**Status**: Production Ready
