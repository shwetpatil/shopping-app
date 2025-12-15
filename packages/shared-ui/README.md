# @shopping-app/shared-ui

Shared UI utilities, API clients, and helper functions for all microfrontends.

## Installation

```bash
npm install @shopping-app/shared-ui
```

## Features

### API Client
- Type-safe HTTP client
- Token management
- Request/response interceptors
- Timeout handling

### Utilities
- Currency and date formatting
- Debounce and throttle
- Array and object helpers
- ID generation

### Validation
- Email, password, credit card validation
- Phone and URL validation
- Field validation helpers

## Usage

### API Client

```typescript
import { createAPIClient, withAuth } from '@shopping-app/shared-ui';

const api = createAPIClient({
  baseURL: 'https://api.example.com',
  timeout: 30000,
});

// Make requests
const response = await api.get('/products');
const data = await api.post('/orders', { productId: '123' });

// With authentication
const headers = withAuth();
const response = await api.get('/profile', { headers });
```

### Formatting

```typescript
import { formatCurrency, formatDate, formatRelativeTime } from '@shopping-app/shared-ui';

formatCurrency(99.99); // "$99.99"
formatDate(new Date(), 'long'); // "December 14, 2025"
formatRelativeTime(new Date(Date.now() - 3600000)); // "1 hour ago"
```

### Validation

```typescript
import { validateEmail, validatePassword, validateCreditCard } from '@shopping-app/shared-ui';

const emailResult = validateEmail('user@example.com');
if (!emailResult.isValid) {
  console.error(emailResult.errors);
}

const passwordResult = validatePassword('MyPass123!');
if (passwordResult.isValid) {
  // Password is valid
}
```

### Utilities

```typescript
import { debounce, throttle, unique, groupBy } from '@shopping-app/shared-ui';

// Debounce search
const debouncedSearch = debounce((query) => {
  console.log('Searching for:', query);
}, 300);

// Remove duplicates
const uniqueItems = unique(array, 'id');

// Group by category
const grouped = groupBy(products, 'category');
```

## B2B Microfrontend Pattern

This package follows B2B (Business-to-Business) microfrontend principles:

- **Shared Utilities**: Common functions used across all MFEs
- **No Business Logic**: Only utilities, no domain-specific code
- **Type-Safe**: Full TypeScript support
- **Framework Agnostic**: Can be used with any framework
- **Minimal Dependencies**: Only essential dependencies included

## License

MIT
