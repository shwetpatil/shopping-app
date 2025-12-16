# Products MFE Testing Guide

## Overview

The Products MFE uses **Jest** and **React Testing Library** for unit and integration tests.

## Running Tests

```bash
# Run all tests
npm test

# Watch mode (re-run on changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

## Test Structure

```
src/__tests__/
├── components/          # Component tests
│   ├── product-card.test.tsx
│   └── product-grid.test.tsx
├── hooks/              # Custom hook tests
│   └── use-product-queries.test.ts
├── lib/                # Utility tests
│   └── api.test.ts
├── fixtures/           # Test data
│   └── products.fixture.ts
└── utils/              # Test utilities
    └── test-utils.tsx
```

## Test Coverage

Current coverage targets:
- **Statements:** 80%
- **Branches:** 75%
- **Functions:** 80%
- **Lines:** 80%

## Writing Tests

### Component Test Example

```tsx
import { render, screen, fireEvent } from '../utils/test-utils';
import { ProductCard } from '../../components/product-card';

describe('ProductCard', () => {
  it('renders product information', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Product Name')).toBeInTheDocument();
  });
});
```

### Hook Test Example

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useProducts } from '../../hooks/use-product-queries';

describe('useProducts', () => {
  it('fetches products successfully', async () => {
    const { result } = renderHook(() => useProducts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
```

### API Test Example

```tsx
import { fetchProducts } from '../../lib/api';

describe('fetchProducts', () => {
  it('calls the correct endpoint', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockProducts,
    });

    await fetchProducts();
    
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/products'),
      expect.any(Object)
    );
  });
});
```

## Best Practices

✅ **Test user behavior, not implementation**
✅ **Use semantic queries** (getByRole, getByText, etc.)
✅ **Test accessibility** (ARIA labels, keyboard navigation)
✅ **Mock external dependencies** (API calls, MFE events)
✅ **Use fixtures for test data**
✅ **Keep tests isolated and independent**

## Fixtures

Test data is centralized in `src/__tests__/fixtures/`:

```typescript
import { mockProducts } from '../fixtures/products.fixture';

// Use in tests
const product = mockProducts[0];
```

## Mocking

### Mocking Next.js Router

```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    // ...
  }),
}));
```

### Mocking API Calls

```typescript
jest.mock('../../lib/api');

(api.fetchProducts as jest.Mock).mockResolvedValue(mockProducts);
```

### Mocking MFE Contracts

```typescript
jest.mock('@shopping-app/mfe-contracts', () => ({
  useMFEPublish: () => jest.fn(),
}));
```

## CI/CD Integration

Tests run automatically on:
- Pre-commit (with lint-staged)
- Pull requests
- Before deployment

## Troubleshooting

**Issue:** Tests timeout
**Solution:** Increase timeout in jest.config.ts

**Issue:** React Query tests fail
**Solution:** Use `waitFor` for async operations

**Issue:** Mock not working
**Solution:** Clear mocks in `beforeEach`

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```
