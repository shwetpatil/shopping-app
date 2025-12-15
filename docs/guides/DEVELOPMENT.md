# Development Guide

Complete guide for developing the Shopping App microfrontends.

## Architecture Overview

The Shopping App uses a true microfrontend architecture where each module is independently deployable.

### Technology Stack

**Frontend:**
- Next.js 14+ (App Router)
- React 18+
- TypeScript
- TanStack React Query v5
- Tailwind CSS
- Lucide React (icons)

**Backend:**
- Node.js + Express
- PostgreSQL + Prisma
- Kafka (event streaming)
- Redis (caching)

## Project Organization

### Microfrontends (apps/)

Each MFE is a complete Next.js application:

```
apps/mfe-[name]/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Home page
│   │   └── globals.css   # Global styles
│   └── components/       # React components
├── public/               # Static assets
├── package.json          # Dependencies
├── next.config.js        # Next.js config
├── tsconfig.json         # TypeScript config
├── tailwind.config.ts    # Tailwind config
├── Dockerfile            # Docker image
├── .env.example          # Environment template
└── README.md             # Module docs
```

### Backend Services (services/)

Each service follows domain-driven design:

```
services/[name]-service/
├── src/
│   ├── controllers/      # HTTP handlers
│   ├── services/         # Business logic
│   ├── repositories/     # Data access
│   ├── models/           # Domain models
│   ├── middleware/       # Express middleware
│   └── utils/            # Helpers
├── prisma/               # Database schema
├── docs/                 # Service documentation
└── package.json
```

## Development Workflow

### 1. Start Backend Services

```bash
# Start databases, Kafka, Redis
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 2. Start a Single MFE

```bash
cd apps/mfe-search
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### 3. Start All MFEs

```bash
# From root directory
./start-all.sh

# Or using npm
npm run dev:all
```

## Component Development

### Shell App (mfe-shell)

The shell provides:
- Authentication context
- Cart context  
- React Query provider
- Layout (header, footer)
- Routing

Example - Adding a new context:

```typescript
// src/contexts/notification-context.tsx
'use client';

import { createContext, useContext, useState } from 'react';

interface NotificationContextType {
  notify: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');

  const notify = (msg: string) => setMessage(msg);

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      {message && <div className="notification">{message}</div>}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};
```

### Feature MFEs

Each feature MFE exports components:

```typescript
// apps/mfe-search/src/components/search-bar.tsx
'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Trigger search
    window.location.href = `/search?q=${encodeURIComponent(query)}`;
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
        className="px-4 py-2 border rounded-lg flex-1"
      />
      <button
        type="submit"
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <Search className="w-5 h-5" />
      </button>
    </form>
  );
}
```

## Communication Patterns

### 1. React Query Cache

Share data between MFEs:

```typescript
// In Products MFE
const { data } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts
});

// In Cart MFE - access same data
const { data: products } = useQuery({
  queryKey: ['products'] // Same key!
});
```

### 2. Context Providers (Shell)

Shell provides global contexts:

```typescript
// Access auth in any MFE
import { useAuth } from '@/contexts/auth-context';

export default function Component() {
  const { user, login, logout } = useAuth();
  
  return <div>Welcome {user?.name}</div>;
}
```

### 3. URL Parameters

Navigate with state:

```typescript
// In Search MFE
router.push('/products?category=electronics&sort=price');

// In Products MFE
const searchParams = useSearchParams();
const category = searchParams.get('category');
const sort = searchParams.get('sort');
```

### 4. Event Bus (Optional)

For custom events:

```typescript
// Emit event
window.dispatchEvent(new CustomEvent('cart:updated', {
  detail: { itemCount: 5 }
}));

// Listen for event
useEffect(() => {
  const handler = (e: CustomEvent) => {
    console.log('Cart updated:', e.detail);
  };
  
  window.addEventListener('cart:updated', handler);
  return () => window.removeEventListener('cart:updated', handler);
}, []);
```

## API Integration

Use React Query for API calls:

```typescript
// lib/api-client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// components/products.tsx
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export default function Products() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await apiClient.get('/products');
      return res.data;
    }
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading products</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {data.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

## Testing

### Unit Tests

```bash
cd apps/mfe-search
npm test
```

Example test:

```typescript
// __tests__/search-bar.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '@/components/search-bar';

describe('SearchBar', () => {
  it('renders search input', () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText('Search products...');
    expect(input).toBeInTheDocument();
  });

  it('submits search query', () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText('Search products...');
    fireEvent.change(input, { target: { value: 'laptop' } });
    fireEvent.submit(input.closest('form'));
    // Assert navigation
  });
});
```

### E2E Tests

```bash
cd apps/mfe-search
npm run test:e2e
```

## Building and Deployment

### Development Build

```bash
cd apps/mfe-search
npm run build
npm start
```

### Docker Build

```bash
cd apps/mfe-search
docker build -t mfe-search:latest .
docker run -p 3001:3001 mfe-search:latest
```

### Production Deployment

Each MFE can be deployed independently:

1. **Build the MFE**
```bash
npm run build
```

2. **Deploy to your platform**
- Vercel: `vercel deploy`
- AWS: Upload to S3 + CloudFront
- Kubernetes: Apply deployment yaml

3. **Update shell app**
Update environment variables in shell to point to new URLs.

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## Best Practices

1. **Keep MFEs small and focused** - Each should do one thing well
2. **Minimize shared dependencies** - Reduces coupling
3. **Use TypeScript** - Catch errors early
4. **Write tests** - Ensure quality
5. **Document changes** - Help your team
6. **Version APIs** - Enable independent deployment
7. **Monitor performance** - Track bundle sizes
8. **Use feature flags** - Enable gradual rollouts

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Microfrontend Patterns](https://martinfowler.com/articles/micro-frontends.html)
