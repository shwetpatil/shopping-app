# Auth Service Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                          │
│                 (Token Validation)                      │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                 Auth Service (Port 3001)                │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Express.js Application               │  │
│  │                                                    │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │  │
│  │  │  Routes    │→ │Controllers │→ │ Services   │ │  │
│  │  └────────────┘  └────────────┘  └─────┬──────┘ │  │
│  │                                          │        │  │
│  │                                          ▼        │  │
│  │                                  ┌────────────┐  │  │
│  │                                  │Repositories│  │  │
│  │                                  └─────┬──────┘  │  │
│  └────────────────────────────────────────┼─────────┘  │
└─────────────────────────────────────────────┼───────────┘
                                              │
                                              ▼
                                  ┌──────────────────────┐
                                  │  PostgreSQL (5432)   │
                                  │   - users            │
                                  │   - refresh_tokens   │
                                  └──────────────────────┘
```

## Layered Architecture

### 1. Presentation Layer (Routes)
**Responsibility**: HTTP request handling and routing

```typescript
routes/
└── auth.routes.ts
    - POST /register
    - POST /login
    - POST /refresh
    - POST /logout
```

**Features**:
- Route definitions
- Request validation middleware attachment
- Response formatting

### 2. Controller Layer
**Responsibility**: Request/response orchestration

```typescript
controllers/
└── auth.controller.ts
    - register()
    - login()
    - refreshToken()
    - logout()
```

**Features**:
- Extract request data
- Call service methods
- Handle errors
- Format responses

### 3. Service Layer
**Responsibility**: Business logic implementation

```typescript
services/
└── auth.service.ts
    - register()
    - login()
    - refreshAccessToken()
    - logout()
    - generateAccessToken()
    - generateRefreshToken()
```

**Features**:
- Authentication logic
- Token generation
- Password hashing
- Business rules enforcement

### 4. Repository Layer
**Responsibility**: Data access abstraction

```typescript
repositories/
└── user.repository.ts
    - create()
    - findById()
    - findByEmail()
    - update()
    - delete()
    - createRefreshToken()
    - findRefreshToken()
    - deleteRefreshToken()
    - deleteExpiredRefreshTokens()
```

**Features**:
- Database operations
- Query optimization
- Data mapping

### 5. Domain Layer
**Responsibility**: Business entities and DTOs

```typescript
domain/
└── user.ts
    - CreateUserDto
    - LoginDto
    - UserResponse
    - AuthResponse
```

**Features**:
- Type definitions
- Data transfer objects
- Domain models

## Component Interactions

### Registration Flow

```
Client → Route → Controller → Service → Repository → Database
                                   ↓
                            Password Hash (bcrypt)
                                   ↓
                            Generate Tokens (JWT)
                                   ↓
                            Store Refresh Token
                                   ↓
Client ← AuthResponse with tokens ←
```

### Login Flow

```
Client → Route → Controller → Service → Repository → Database
                                   ↓
                            Verify Password (bcrypt)
                                   ↓
                            Generate Tokens (JWT)
                                   ↓
                            Store Refresh Token
                                   ↓
Client ← AuthResponse with tokens ←
```

### Token Refresh Flow

```
Client → Route → Controller → Service → Repository → Database
   (with refresh token)             ↓
                            Verify Refresh Token
                                   ↓
                            Generate New Access Token
                                   ↓
Client ← New Access Token ←
```

## Middleware Stack

```
Request
  ↓
[Helmet] - Security headers
  ↓
[CORS] - Cross-origin resource sharing
  ↓
[Rate Limiter] - DDoS protection
  ↓
[Body Parser] - JSON parsing
  ↓
[Request Logger] - Winston logging
  ↓
[Route Handler]
  ↓
[Validation Middleware] - Zod validation
  ↓
[Controller Logic]
  ↓
[Error Handler] - Centralized error handling
  ↓
Response
```

## Security Architecture

### Defense in Depth

1. **Network Layer**
   - Rate limiting (100 req/15min)
   - CORS configuration
   - Helmet security headers

2. **Application Layer**
   - Input validation (Zod schemas)
   - SQL injection prevention (Prisma ORM)
   - XSS protection (sanitization)

3. **Authentication Layer**
   - Bcrypt password hashing (10 rounds)
   - JWT token signing (HS256)
   - Token expiration enforcement

4. **Data Layer**
   - Encrypted database connections
   - Unique indexes on sensitive fields
   - Soft delete for audit trails

## Database Schema

```sql
┌─────────────────────────┐
│         users           │
├─────────────────────────┤
│ id          UUID PK     │
│ email       VARCHAR(*)  │
│ password    VARCHAR     │
│ firstName   VARCHAR     │
│ lastName    VARCHAR     │
│ role        ENUM        │
│ createdAt   TIMESTAMP   │
│ updatedAt   TIMESTAMP   │
└────────┬────────────────┘
         │ 1:N
         │
┌────────▼────────────────┐
│    refresh_tokens       │
├─────────────────────────┤
│ id          UUID PK     │
│ userId      UUID FK     │
│ token       VARCHAR(*)  │
│ expiresAt   TIMESTAMP   │
│ createdAt   TIMESTAMP   │
└─────────────────────────┘

Indexes:
- users.email (UNIQUE)
- refresh_tokens.token (UNIQUE)
- refresh_tokens.userId
- refresh_tokens.expiresAt
```

## Scalability Patterns

### Horizontal Scaling
- **Stateless Design**: No session state stored in memory
- **Database Connection Pooling**: Prisma manages connections
- **Load Balancing**: Multiple instances behind load balancer

### Vertical Scaling
- **Resource Optimization**: Efficient bcrypt rounds
- **Query Optimization**: Indexed database queries
- **Caching**: JWT tokens cached client-side

## Error Handling Strategy

```typescript
Try-Catch Wrapper
     ↓
Domain Error (e.g., BadRequestError)
     ↓
Error Middleware
     ↓
Logging (Winston)
     ↓
Standardized Error Response
     ↓
Client
```

## Technology Decisions

### Why Express.js?
- Lightweight and performant
- Extensive middleware ecosystem
- TypeScript support
- Large community

### Why JWT?
- Stateless authentication
- Self-contained tokens
- Cross-service validation
- Industry standard

### Why Bcrypt?
- Adaptive hashing (adjustable cost)
- Salt generation built-in
- Proven security track record

### Why Prisma?
- Type-safe queries
- Automatic migrations
- Excellent TypeScript support
- Query optimization

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Load Balancer / Ingress         │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌──────▼──────┐
│Auth Service │  │Auth Service │
│ Instance 1  │  │ Instance 2  │
└──────┬──────┘  └──────┬──────┘
       │                │
       └────────┬───────┘
                │
       ┌────────▼─────────┐
       │  PostgreSQL      │
       │  (Primary)       │
       └──────────────────┘
```

## Monitoring Points

- Request rate and latency
- Token generation time
- Database query performance
- Error rates by endpoint
- Authentication success/failure rates
- Refresh token usage patterns
