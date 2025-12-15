# Data Flow Diagrams

## User Registration Flow

```mermaid
sequenceDiagram
    participant Client
    participant API Gateway
    participant Auth Service
    participant Database

    Client->>API Gateway: POST /api/v1/auth/register
    Note over Client: {email, password, firstName, lastName}
    
    API Gateway->>Auth Service: Forward request
    
    Auth Service->>Auth Service: Validate input (Zod)
    
    Auth Service->>Database: Check if email exists
    Database-->>Auth Service: Email available
    
    Auth Service->>Auth Service: Hash password (bcrypt)
    
    Auth Service->>Database: Insert user record
    Database-->>Auth Service: User created
    
    Auth Service->>Auth Service: Generate access token (JWT)
    Auth Service->>Auth Service: Generate refresh token (UUID)
    
    Auth Service->>Database: Store refresh token
    Database-->>Auth Service: Token stored
    
    Auth Service-->>API Gateway: 201 Created + tokens
    API Gateway-->>Client: AuthResponse
    Note over Client: {user, accessToken, refreshToken}
```

## User Login Flow

```mermaid
sequenceDiagram
    participant Client
    participant API Gateway
    participant Auth Service
    participant Database

    Client->>API Gateway: POST /api/v1/auth/login
    Note over Client: {email, password}
    
    API Gateway->>Auth Service: Forward request
    
    Auth Service->>Auth Service: Validate input (Zod)
    
    Auth Service->>Database: SELECT user WHERE email=?
    Database-->>Auth Service: User record
    
    Auth Service->>Auth Service: Compare password (bcrypt)
    alt Password invalid
        Auth Service-->>Client: 401 Unauthorized
    end
    
    Auth Service->>Auth Service: Generate access token
    Auth Service->>Auth Service: Generate refresh token
    
    Auth Service->>Database: INSERT refresh_token
    Database-->>Auth Service: Token stored
    
    Auth Service->>Database: DELETE expired tokens
    
    Auth Service-->>API Gateway: 200 OK + tokens
    API Gateway-->>Client: AuthResponse
```

## Token Refresh Flow

```mermaid
sequenceDiagram
    participant Client
    participant API Gateway
    participant Auth Service
    participant Database

    Client->>API Gateway: POST /api/v1/auth/refresh
    Note over Client: Authorization: Bearer {refreshToken}
    
    API Gateway->>Auth Service: Forward request
    
    Auth Service->>Auth Service: Extract refresh token
    
    Auth Service->>Database: SELECT refresh_token WHERE token=?
    
    alt Token not found
        Database-->>Auth Service: null
        Auth Service-->>Client: 401 Unauthorized
    end
    
    alt Token expired
        Database-->>Auth Service: expiredAt < now
        Auth Service->>Database: DELETE token
        Auth Service-->>Client: 401 Unauthorized
    end
    
    Database-->>Auth Service: Valid token record
    
    Auth Service->>Database: SELECT user WHERE id=?
    Database-->>Auth Service: User record
    
    Auth Service->>Auth Service: Generate new access token
    
    Auth Service-->>API Gateway: 200 OK + accessToken
    API Gateway-->>Client: {accessToken}
```

## Logout Flow

```mermaid
sequenceDiagram
    participant Client
    participant API Gateway
    participant Auth Service
    participant Database

    Client->>API Gateway: POST /api/v1/auth/logout
    Note over Client: Authorization: Bearer {refreshToken}
    
    API Gateway->>Auth Service: Forward request
    
    Auth Service->>Auth Service: Extract refresh token
    
    Auth Service->>Database: DELETE FROM refresh_tokens WHERE token=?
    Database-->>Auth Service: Rows affected: 1
    
    Auth Service-->>API Gateway: 200 OK
    API Gateway-->>Client: {message: "Logged out successfully"}
    
    Note over Client: Access token still valid until expiry
```

## Protected Endpoint Access Flow

```mermaid
sequenceDiagram
    participant Client
    participant API Gateway
    participant Other Service
    participant Auth Service
    participant Database

    Client->>API Gateway: GET /api/v1/products
    Note over Client: Authorization: Bearer {accessToken}
    
    API Gateway->>API Gateway: Verify JWT token
    Note over API Gateway: jwt.verify(token, secret)
    
    alt Token invalid or expired
        API Gateway-->>Client: 401 Unauthorized
    end
    
    API Gateway->>API Gateway: Extract user from token
    Note over API Gateway: {userId, email, role}
    
    API Gateway->>Other Service: Forward with user context
    Note over API Gateway,Other Service: X-User-Id, X-User-Email, X-User-Role headers
    
    Other Service-->>API Gateway: Response
    API Gateway-->>Client: Response
```

## Role-Based Authorization Flow

```mermaid
sequenceDiagram
    participant Client
    participant API Gateway
    participant Admin Service
    
    Client->>API Gateway: DELETE /api/v1/products/123
    Note over Client: Authorization: Bearer {accessToken}
    
    API Gateway->>API Gateway: Verify JWT
    API Gateway->>API Gateway: Extract user role
    
    alt Role != ADMIN
        API Gateway-->>Client: 403 Forbidden
        Note over Client: Insufficient permissions
    end
    
    API Gateway->>Admin Service: Forward request
    Note over API Gateway,Admin Service: X-User-Role: ADMIN
    
    Admin Service-->>API Gateway: 200 OK
    API Gateway-->>Client: 200 OK
```

## Token Cleanup Job Flow

```mermaid
sequenceDiagram
    participant Cron Job
    participant Database

    Note over Cron Job: Scheduled: Daily at 02:00
    
    Cron Job->>Database: DELETE FROM refresh_tokens WHERE expiresAt < NOW()
    Database-->>Cron Job: Rows deleted: N
    
    Cron Job->>Cron Job: Log cleanup result
    Note over Cron Job: INFO: Cleaned N expired tokens
```

## Error Handling Flow

```mermaid
sequenceDiagram
    participant Client
    participant API Gateway
    participant Auth Service
    participant Error Middleware
    participant Logger

    Client->>API Gateway: POST /api/v1/auth/register
    API Gateway->>Auth Service: Forward request
    
    Auth Service->>Auth Service: Validate email format
    
    alt Validation error
        Auth Service->>Error Middleware: throw BadRequestError
        Error Middleware->>Logger: Log error
        Logger-->>Error Middleware: Logged
        Error Middleware-->>Client: 400 Bad Request
    end
    
    alt Database error
        Auth Service->>Error Middleware: throw Error
        Error Middleware->>Logger: Log error with stack trace
        Error Middleware-->>Client: 500 Internal Server Error
    end
    
    Auth Service-->>Client: 201 Created (success)
```

## Data Write Path

```
Client Request
      ↓
Input Validation (Zod)
      ↓
Business Logic (AuthService)
      ↓
Password Hashing (if applicable)
      ↓
Repository Layer
      ↓
Prisma ORM
      ↓
PostgreSQL Write
      ↓
Database Constraint Check
      ↓
Transaction Commit
      ↓
Response to Client
```

## Data Read Path

```
Client Request
      ↓
Input Validation
      ↓
Repository Layer
      ↓
Prisma ORM (with caching)
      ↓
PostgreSQL Query
      ↓
Index Scan (if available)
      ↓
Result Set
      ↓
Data Mapping
      ↓
Sensitive Data Filtering (remove password)
      ↓
Response to Client
```

## Token Generation Flow

```
User Authentication Success
      ↓
Prepare Token Payload
  - userId
  - email
  - role
      ↓
Access Token Generation
  - Algorithm: HS256
  - Secret: JWT_SECRET
  - Expiry: 15 minutes
      ↓
Refresh Token Generation
  - Random UUID v4
  - Expiry: 7 days
      ↓
Store Refresh Token in DB
  - userId (foreign key)
  - token (unique)
  - expiresAt (indexed)
      ↓
Return Both Tokens to Client
```

## Multi-Layer Validation

```
HTTP Request
      ↓
[Layer 1: Express Validator]
  - Content-Type check
  - Body size limits
      ↓
[Layer 2: Zod Schema]
  - Type validation
  - Format validation
  - Required fields
      ↓
[Layer 3: Business Rules]
  - Email uniqueness
  - Password strength
  - Role validity
      ↓
[Layer 4: Database Constraints]
  - UNIQUE constraints
  - NOT NULL constraints
  - FOREIGN KEY constraints
      ↓
Persist Data
```

## Cross-Service Authentication

```
┌─────────┐                                ┌──────────────┐
│ Client  │───① POST /login───────────────►│ Auth Service │
└─────────┘                                └──────┬───────┘
     ▲                                            │
     │                                            │② Store tokens
     │                                            ▼
     │                                    ┌───────────────┐
     │                                    │   PostgreSQL  │
     │                                    └───────────────┘
     │
     │③ {accessToken, refreshToken}
     │
     ├──④ GET /products (with accessToken)──►┌──────────────┐
     │                                        │ API Gateway  │
     │                                        └──────┬───────┘
     │                                               │
     │                                               │⑤ Verify JWT
     │                                               │  (No DB call)
     │                                               ▼
     │                                        ┌──────────────┐
     │◄─────────────⑦ Products─────────────  │Product Service│
                                               └──────────────┘
```

## Performance Optimization Points

1. **Token Verification**: Stateless JWT validation (no DB lookup)
2. **Database Indexes**: Email and token lookups use indexes
3. **Connection Pooling**: Prisma manages connection pool
4. **Password Hashing**: Balanced bcrypt rounds (10)
5. **Token Cleanup**: Batch deletion during off-peak hours
