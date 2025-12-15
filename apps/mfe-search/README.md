# Search Microfrontend

Independently deployable search module for the shopping app.

## Team Ownership

**Team:** Search & Discovery Team  
**Responsibilities:**
- Product search functionality
- Advanced filtering
- Search analytics
- Search suggestions

## Exposed Components

| Component | Description | Props |
|-----------|-------------|-------|
| `SearchBar` | Main search input with clear button | `onFiltersOpen`, `onSearch` |
| `FilterPanel` | Advanced filter sidebar | `isOpen`, `onClose`, `onApply` |

## Development

```bash
# Install dependencies
npm install

# Run on port 3001
npm run dev

# Open http://localhost:3001
```

## Build & Deploy

```bash
# Build for production
npm run build

# Run production server
npm start

# Deploy independently
npm run deploy
```

## Module Federation

This module exposes:
```javascript
exposes: {
  './SearchBar': './src/components/search-bar',
  './FilterPanel': './src/components/filter-panel',
}
```

Consumed by shell app at runtime:
```typescript
import('search/SearchBar')
import('search/FilterPanel')
```

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test in isolation
npm run dev  # Run standalone
```

## Deployment

**Independent Pipeline:** `.github/workflows/deploy-search-mfe.yml`

Deploys to: `https://search.shopping-app.com`

CDN: CloudFront distribution for static assets

## Communication

### Emits Events
- `search:query` - When user searches
- `search:filter_applied` - When filters are applied

### Listens To
- `auth:logged_in` - Update search preferences
- `product:viewed` - Track for suggestions

## Dependencies

Minimal dependencies for fast builds:
- `next` - Framework
- `react` - UI library
- `lucide-react` - Icons only

**No** heavy dependencies to keep bundle size small.

## Environment Variables

```env
# Not needed for standalone deployment
# All API calls should go through shell app's context
```

## Performance

- Bundle size: ~50KB (gzipped)
- Initial load: <500ms
- Cached after first load

## Versioning

Current: `v1.0.0`

Breaking changes require coordination with shell app team.
