#!/bin/bash

# Documentation Generator for Shopping App Microservices
# Generates comprehensive documentation structure for all services

set -e

# Base directory
BASE_DIR="/Users/siddharthy/Shweta-S/Learn/shopping-app/services"

# Services list
SERVICES=("auth-service" "product-service" "order-service" "cart-service" "payment-service" "inventory-service" "notification-service" "api-gateway")

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Shopping App Documentation Generator ===${NC}"
echo ""

# Function to create directory structure
create_directories() {
    local service=$1
    local service_dir="$BASE_DIR/$service/docs"
    
    echo -e "${GREEN}Creating directories for $service...${NC}"
    
    mkdir -p "$service_dir/system"
    mkdir -p "$service_dir/adr"
    mkdir -p "$service_dir/development"
    mkdir -p "$service_dir/operations"
}

# Function to create remaining system docs
create_system_docs() {
    local service=$1
    local service_dir="$BASE_DIR/$service/docs/system"
    
    # Create disaster-recovery.md
    cat > "$service_dir/disaster-recovery.md" << 'EOF'
# Disaster Recovery Plan

## Recovery Objectives

- **RTO (Recovery Time Objective)**: 2 hours
- **RPO (Recovery Point Objective)**: 1 hour
- **Maximum Tolerable Downtime**: 4 hours

## Disaster Scenarios

### 1. Complete Service Outage
### 2. Data Center Failure  
### 3. Database Corruption
### 4. Security Breach
### 5. Natural Disaster

## Recovery Procedures

Detailed procedures for each scenario...

## Contact Information

Emergency contacts and escalation procedures...
EOF

    # Create capacity-planning.md
    cat > "$service_dir/capacity-planning.md" << 'EOF'
# Capacity Planning

## Current Capacity

- **Users**: 10,000 active users
- **Requests/sec**: 100-500 rps
- **Storage**: 50 GB database
- **Compute**: 3 pods × 256MB RAM

## Growth Projections

### 6 Months
- Users: 25,000 (+150%)
- Requests/sec: 250-1250 rps
- Storage: 125 GB

### 12 Months
- Users: 50,000 (+400%)
- Requests/sec: 500-2500 rps
- Storage: 250 GB

## Scaling Strategy

Horizontal and vertical scaling recommendations...
EOF

    # Create sla-slo.md
    cat > "$service_dir/sla-slo.md" << 'EOF'
# Service Level Agreements (SLA) and Objectives (SLO)

## SLA Commitments

### Availability
- **Target**: 99.9% uptime
- **Measurement**: Monthly uptime percentage
- **Downtime Allowance**: 43.2 minutes/month

### Performance
- **Latency**: 95% of requests < 100ms
- **Throughput**: Support 500 req/sec minimum

### Support
- **Response Time**: < 1 hour for critical issues
- **Resolution Time**: < 4 hours for critical issues

## SLO Targets

Internal targets stricter than SLA commitments...

## Monitoring and Reporting

How we measure and report on SLA/SLO...
EOF

    # Create glossary.md
    cat > "$service_dir/glossary.md" << 'EOF'
# Glossary

## Technical Terms

**API Gateway**: Entry point for all API requests, handles routing and authentication

**JWT (JSON Web Token)**: Stateless authentication token format

**Microservice**: Independently deployable service focused on specific business capability

**Prisma**: TypeScript ORM for database access

**Rate Limiting**: Technique to control request frequency

## Acronyms

- **SLA**: Service Level Agreement
- **SLO**: Service Level Objective
- **RTO**: Recovery Time Objective
- **RPO**: Recovery Point Objective
- **RBAC**: Role-Based Access Control
- **CORS**: Cross-Origin Resource Sharing

## Business Terms

Domain-specific terminology and definitions...
EOF

    echo -e "${GREEN}✓ Created system documentation for $service${NC}"
}

# Function to create ADR documents
create_adr_docs() {
    local service=$1
    local service_dir="$BASE_DIR/$service/docs/adr"
    
    # ADR 0001
    cat > "$service_dir/0001-tech-stack.md" << 'EOF'
# ADR 0001: Technology Stack Selection

**Date**: 2024-01-01  
**Status**: Accepted  
**Deciders**: Engineering Team

## Context

Need to select appropriate technology stack for the microservice.

## Decision

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma

## Consequences

### Positive
- Type safety with TypeScript
- Mature ecosystem
- Good performance
- Team expertise

### Negative
- Learning curve for TypeScript
- Build step required
EOF

    # ADR 0002
    cat > "$service_dir/0002-database-orm.md" << 'EOF'
# ADR 0002: Database and ORM Choice

**Date**: 2024-01-01  
**Status**: Accepted  

## Context

Need reliable data persistence with type safety.

## Decision

Selected PostgreSQL with Prisma ORM.

## Rationale

- ACID compliance
- Excellent TypeScript support
- Migration management
- Query optimization
EOF

    # ADR 0003
    cat > "$service_dir/0003-authentication.md" << 'EOF'
# ADR 0003: Authentication Strategy

**Date**: 2024-01-01  
**Status**: Accepted  

## Context

Need secure, stateless authentication mechanism.

## Decision

JWT-based authentication with refresh tokens.

## Alternatives Considered

- Session-based authentication
- OAuth 2.0 only
- API keys
EOF

    # ADR 0004
    cat > "$service_dir/0004-api-design.md" << 'EOF'
# ADR 0004: API Design Principles

**Date**: 2024-01-01  
**Status**: Accepted  

## Context

Need consistent API design across services.

## Decision

- RESTful API design
- JSON request/response
- Consistent error handling
- Versioned APIs (v1, v2)
EOF

    # ADR 0005
    cat > "$service_dir/0005-deployment-strategy.md" << 'EOF'
# ADR 0005: Deployment Strategy

**Date**: 2024-01-01  
**Status**: Accepted  

## Context

Need reliable, zero-downtime deployments.

## Decision

- Kubernetes for orchestration
- Rolling updates strategy
- Health checks for readiness
- Horizontal pod autoscaling
EOF

    echo -e "${GREEN}✓ Created ADR documentation for $service${NC}"
}

# Function to create development docs
create_development_docs() {
    local service=$1
    local service_dir="$BASE_DIR/$service/docs/development"
    
    # Create onboarding.md
    cat > "$service_dir/onboarding.md" << 'EOF'
# Developer Onboarding

## Welcome!

This guide will help you get started with development.

## Prerequisites

- Node.js 20+
- Docker Desktop
- Git
- VS Code (recommended)

## Setup Steps

1. Clone repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env`
4. Start dependencies: `docker-compose up -d`
5. Run migrations: `npx prisma migrate dev`
6. Start service: `npm run dev`

## Your First Task

Try implementing a simple feature to familiarize yourself with the codebase.
EOF

    # Create local-setup.md
    cat > "$service_dir/local-setup.md" << 'EOF'
# Local Development Setup

## System Requirements

- macOS, Linux, or Windows with WSL2
- 8GB RAM minimum
- 20GB free disk space

## Installation

Detailed setup instructions...

## Running Locally

```bash
npm run dev
```

## Troubleshooting

Common issues and solutions...
EOF

    # Create coding-standards.md
    cat > "$service_dir/coding-standards.md" << 'EOF'
# Coding Standards

## TypeScript Guidelines

- Use strict mode
- Explicit types for function parameters
- Avoid `any` type
- Use interfaces for object shapes

## Naming Conventions

- Classes: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Files: kebab-case.ts

## Code Style

- Use Prettier for formatting
- ESLint for linting
- 2 spaces indentation
- Single quotes for strings
EOF

    # Create branching-release.md
    cat > "$service_dir/branching-release.md" << 'EOF'
# Branching and Release Strategy

## Branch Types

- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Urgent production fixes

## Workflow

1. Create feature branch from `develop`
2. Make changes and commit
3. Create pull request
4. Code review and approval
5. Merge to `develop`
6. Deploy to staging
7. Release to `main`

## Release Process

Semantic versioning (v1.2.3)...
EOF

    # Create debugging.md
    cat > "$service_dir/debugging.md" << 'EOF'
# Debugging Guide

## VS Code Debugging

Configuration for debugging with VS Code...

## Common Issues

### Database Connection Errors
Solution steps...

### TypeScript Errors
Solution steps...

## Logging

How to add and view logs...

## Tools

- VS Code Debugger
- Chrome DevTools (for Node)
- Postman for API testing
EOF

    # Create feature-flags.md
    cat > "$service_dir/feature-flags.md" << 'EOF'
# Feature Flags

## Overview

Feature flags allow controlled rollout of features.

## Implementation

```typescript
if (featureFlags.isEnabled('new-feature')) {
  // New feature code
} else {
  // Old code
}
```

## Management

How to enable/disable features...
EOF

    # Create conventions.md
    cat > "$service_dir/conventions.md" << 'EOF'
# Project Conventions

## File Structure

```
src/
  routes/
  controllers/
  services/
  repositories/
  domain/
```

## Error Handling

Always use custom error classes...

## Testing

Unit tests in `__tests__` folders...

## Documentation

Keep docs up to date with code changes...
EOF

    echo -e "${GREEN}✓ Created development documentation for $service${NC}"
}

# Function to create operations docs
create_operations_docs() {
    local service=$1
    local service_dir="$BASE_DIR/$service/docs/operations"
    
    # Create runbooks.md
    cat > "$service_dir/runbooks.md" << 'EOF'
# Operations Runbooks

## Service Health Check

```bash
curl https://api.example.com/health
```

## Common Tasks

### Restart Service
```bash
kubectl rollout restart deployment/$SERVICE -n shopping-app
```

### View Logs
```bash
kubectl logs -n shopping-app -l app=$SERVICE --tail=100
```

### Scale Service
```bash
kubectl scale deployment/$SERVICE -n shopping-app --replicas=5
```

## Troubleshooting

Step-by-step guides for common issues...
EOF

    # Create incident-management.md
    cat > "$service_dir/incident-management.md" << 'EOF'
# Incident Management

## Severity Levels

- **P0 (Critical)**: Service down, data loss
- **P1 (High)**: Major feature broken
- **P2 (Medium)**: Minor issue affecting users
- **P3 (Low)**: Cosmetic issue

## Response Procedures

### P0 Incidents
1. Page on-call engineer immediately
2. Create war room
3. Notify stakeholders
4. Begin investigation

## Post-Incident

- Write post-mortem
- Identify action items
- Update runbooks
EOF

    # Create monitoring-alerts.md
    cat > "$service_dir/monitoring-alerts.md" << 'EOF'
# Monitoring and Alerts

## Key Metrics

- Request rate (req/s)
- Error rate (%)
- Response time (P50, P95, P99)
- CPU/Memory usage

## Alert Rules

### Critical Alerts
- Service down
- High error rate (>5%)
- Database connection lost

### Warning Alerts
- High latency (>500ms P95)
- Memory usage >80%
- Disk space <20%

## Dashboards

Links to Grafana dashboards...
EOF

    # Create secrets-management.md
    cat > "$service_dir/secrets-management.md" << 'EOF'
# Secrets Management

## Storage

Secrets stored in:
- Development: `.env` file (gitignored)
- Production: Kubernetes Secrets / AWS Secrets Manager

## Rotation

Rotate secrets every 90 days:
1. Generate new secret
2. Update in secrets manager
3. Deploy updated configuration
4. Verify service health

## Access Control

Only authorized personnel can access production secrets.

## Audit

All secret access is logged.
EOF

    # Create audit-logging.md
    cat > "$service_dir/audit-logging.md" << 'EOF'
# Audit Logging

## What We Log

- Authentication events
- Authorization failures
- Data modifications
- Administrative actions

## Log Format

```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "action": "USER_LOGIN",
  "userId": "123",
  "ip": "192.168.1.1",
  "success": true
}
```

## Retention

- Production logs: 90 days
- Audit logs: 7 years (compliance)

## Access

Audit logs can only be accessed by security team.
EOF

    echo -e "${GREEN}✓ Created operations documentation for $service${NC}"
}

# Main execution
echo "Starting documentation generation..."
echo ""

for service in "${SERVICES[@]}"; do
    echo -e "${BLUE}Processing $service...${NC}"
    
    # Only create if docs don't exist yet or are incomplete
    if [ ! -d "$BASE_DIR/$service/docs" ] || [ $(find "$BASE_DIR/$service/docs" -name "*.md" | wc -l) -lt 30 ]; then
        create_directories "$service"
        create_system_docs "$service"
        create_adr_docs "$service"
        create_development_docs "$service"
        create_operations_docs "$service"
        echo -e "${GREEN}✓ Completed $service documentation${NC}"
    else
        echo -e "${GREEN}✓ $service documentation already exists${NC}"
    fi
    echo ""
done

echo -e "${BLUE}=== Documentation Generation Complete ===${NC}"
echo ""
echo "Summary:"
for service in "${SERVICES[@]}"; do
    count=$(find "$BASE_DIR/$service/docs" -name "*.md" 2>/dev/null | wc -l)
    echo "  $service: $count files"
done
