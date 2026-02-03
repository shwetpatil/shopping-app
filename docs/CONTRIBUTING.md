# Contributing to Shopping App

Thank you for your interest in contributing to the Shopping App!


## Project Structure

This is a B2B microfrontend e-commerce platform with independently deployable modules and a robust backend microservices architecture:

```
shopping-app/
├── apps/              # Frontend microfrontends
│   ├── mfe-shell/     # Host application
│   ├── mfe-search/    # Search module
│   ├── mfe-wishlist/  # Wishlist module
│   ├── mfe-reviews/   # Reviews module
│   ├── mfe-products/  # Products catalog
│   └── mfe-cart/      # Cart & checkout
├── services/          # Backend microservices (see Backend Architecture below)
└── packages/          # Shared libraries

---

## Backend Architecture (Microservices)

Our backend follows modern microservices best practices for scalability, resilience, and maintainability:

- **Database per Service**: Each service (orders, payments, inventory, etc.) owns its own database. No direct cross-service DB access.
- **API Gateway**: All client requests go through a gateway for authentication, rate limiting, logging, and routing.
- **Event-Driven Communication**: Services communicate asynchronously via events (using a message bus), enabling loose coupling and eventual consistency.
- **Saga Pattern**: Distributed transactions are managed using the Saga pattern (choreography), ensuring data consistency without distributed locks.
- **Resilience**: Circuit breakers, retries, and timeouts are used to handle failures gracefully.
- **Security**: JWT authentication, per-endpoint rate limiting, and CORS are enforced at the gateway and service level.
- **Observability**: Centralized logging, metrics, and health checks for all services.
- **Technology Flexibility**: Each service can use the most appropriate language or database for its domain.

For details, see [Backend Best Practices](architecture/BACKEND_BEST_PRACTICES.md).
```


---

## Development Setup

### Prerequisites
- Node.js 18+
- npm 9+
- Docker & Docker Compose (for backend services)

### Getting Started

1. **Clone the repository**
```bash
git clone <repository-url>
cd shopping-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Start backend services**
```bash
docker-compose up -d
```

4. **Start all microfrontends**
```bash
./start-all.sh
# Or
npm run dev:all
```

5. **Access the applications**
- Shell App: http://localhost:3000
- Search MFE: http://localhost:3001
- Wishlist MFE: http://localhost:3002
- Reviews MFE: http://localhost:3003
- Products MFE: http://localhost:3004
- Cart MFE: http://localhost:3005

## Working on a Specific MFE

Each microfrontend can be developed independently:

```bash
cd apps/mfe-search
npm install
cp .env.example .env.local
npm run dev
```

## Team Structure

### Platform Team
- **Owns:** Shell application
- **Responsibilities:** Layout, routing, authentication, global state

### Search Team
- **Owns:** Search MFE
- **Responsibilities:** Search functionality, filters

### Engagement Team
- **Owns:** Wishlist & Reviews MFEs
- **Responsibilities:** User engagement features

### Commerce Team
- **Owns:** Products & Cart MFEs
- **Responsibilities:** Product catalog, shopping cart, checkout

## Code Standards

### TypeScript
- Use strict mode
- Define proper types (avoid `any`)
- Use interfaces for component props

### React/Next.js
- Use functional components with hooks
- Follow Next.js App Router conventions
- Use server components when possible

### Styling
- Use Tailwind CSS utility classes
- Follow consistent naming conventions
- Keep styles co-located with components

### State Management
- Use TanStack React Query for server state
- Use React Context for client state
- Keep state as local as possible

## Commit Messages

Follow conventional commits format:

```
type(scope): description

feat(search): add price range filter
fix(cart): resolve checkout validation bug
docs(readme): update setup instructions
refactor(products): simplify grid layout
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Pull Request Process

1. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**
- Write clean, documented code
- Add tests for new features
- Update documentation as needed

3. **Test your changes**
```bash
npm run lint
npm run type-check
npm test
```

4. **Submit a pull request**
- Provide a clear description
- Reference related issues
- Request review from team leads

5. **Code review**
- Address reviewer feedback
- Keep the PR focused and small
- Ensure CI/CD passes

## Testing

### Unit Tests
```bash
cd apps/mfe-search
npm test
```

### E2E Tests
```bash
cd apps/mfe-search
npm run test:e2e
```

### Integration Tests
```bash
npm run test:integration
```

## Building for Production

### Build all MFEs
```bash
npm run build:all
```

### Build specific MFE
```bash
cd apps/mfe-search
npm run build
npm start
```

### Docker build
```bash
docker-compose -f docker-compose.mfe.yml up --build
```

## Documentation

- Update README.md for significant changes
- Add inline code comments for complex logic
- Update API documentation when changing endpoints
- Keep architecture docs up-to-date

## Need Help?

- Check the [Quick Start Guide](docs/guides/QUICK_START.md)
- Read the [Architecture Guide](docs/architecture/MICROFRONTEND_B2B_GUIDE.md)
- Review the [Documentation](docs/)
- Open an issue for bugs or questions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
