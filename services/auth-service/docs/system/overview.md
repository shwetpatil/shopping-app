# Auth Service Overview

## Purpose

The Auth Service is responsible for user authentication, authorization, and identity management in the shopping application ecosystem.

## Core Capabilities

### Authentication
- **User Registration**: Create new user accounts with email/password
- **User Login**: Authenticate users with credentials
- **Token Management**: Issue and manage JWT access tokens and refresh tokens
- **Token Refresh**: Rotate access tokens using refresh tokens
- **Logout**: Invalidate user sessions and tokens

### Authorization
- **Role-Based Access Control (RBAC)**: Support for CUSTOMER, ADMIN, and VENDOR roles
- **Token Validation**: Verify JWT tokens for protected endpoints
- **Permission Enforcement**: Middleware for route-level authorization

### Security
- **Password Hashing**: Bcrypt with configurable salt rounds
- **Token Expiration**: 15-minute access tokens, 7-day refresh tokens
- **Secure Storage**: Refresh tokens stored in database with expiration
- **Rate Limiting**: Protection against brute force attacks

## Service Boundaries

### Owns
- User credentials and profile data
- Authentication tokens (access and refresh)
- User roles and permissions
- Authentication logic and policies

### Does Not Own
- User shopping data (orders, cart)
- Product information
- Payment details
- Business logic outside authentication

## Integration Points

### Upstream Dependencies
- **PostgreSQL**: User and token storage
- **None**: No external service dependencies

### Downstream Consumers
- **API Gateway**: Token validation for all protected routes
- **All Microservices**: User identity propagation via JWT
- **Frontend Applications**: Authentication flows

## Key Metrics

- **Request Rate**: ~100-500 req/s (typical)
- **Response Time**: <100ms (p95)
- **Availability**: 99.9% target
- **Token Generation**: <50ms
- **Database Queries**: <20ms (p95)

## Technology Stack

- **Runtime**: Node.js 20+ LTS
- **Framework**: Express.js 4.18+
- **Language**: TypeScript 5.3+ (strict mode)
- **Database**: PostgreSQL 16
- **ORM**: Prisma 5.7+
- **Security**: bcryptjs, jsonwebtoken
- **Validation**: Zod schemas

## Service Endpoints

```
POST   /api/auth/register     - User registration
POST   /api/auth/login        - User login
POST   /api/auth/refresh      - Token refresh
POST   /api/auth/logout       - User logout
GET    /health                - Health check
```

## Data Model

### User
- id (UUID, PK)
- email (unique)
- password (hashed)
- firstName, lastName
- role (ENUM: CUSTOMER|ADMIN|VENDOR)
- createdAt, updatedAt

### RefreshToken
- id (UUID, PK)
- userId (FK → User)
- token (unique, indexed)
- expiresAt (indexed)
- createdAt

## Design Principles

1. **Stateless Authentication**: JWT tokens enable stateless authentication
2. **Security First**: Multiple layers of security (hashing, rate limiting, token expiration)
3. **Performance**: Fast token generation and validation
4. **Simplicity**: Single responsibility - authentication only
5. **Scalability**: Horizontal scaling with no session state

## Service Level Objectives (SLO)

- **Availability**: 99.9% (8.76 hours downtime/year)
- **Latency**: 95% of requests < 100ms
- **Error Rate**: < 0.1% of requests
- **Token Validity**: 100% accuracy in validation

## Team Ownership

- **Primary Team**: Platform Security Team
- **On-Call Rotation**: 24/7 coverage via PagerDuty
- **Code Owners**: @security-team
- **Slack Channel**: #auth-service
