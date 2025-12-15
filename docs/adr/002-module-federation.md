# ADR-002: Using Webpack Module Federation

**Status:** ✅ Accepted  
**Date:** 2025-12-14  
**Deciders:** Platform Architecture Team, Frontend Lead  
**Technical Story:** MFE runtime integration mechanism

## Context

After deciding to adopt microfrontend architecture (ADR-001), we needed a mechanism to:

1. **Load Remote MFEs**: Dynamically load MFE code from different servers at runtime
2. **Share Dependencies**: Avoid loading React, React-DOM, and common libraries multiple times
3. **Type Safety**: Maintain TypeScript types across MFE boundaries
4. **Development Experience**: Enable fast local development with hot module replacement

### Integration Options Available

Several technical approaches existed for integrating MFEs:

- **iFrames**: Simple but poor performance, styling constraints, accessibility issues
- **Web Components**: Framework-agnostic but complex state management
- **Server-Side Composition**: Good for SSR but limited client-side interactivity
- **Build-Time Integration**: No runtime flexibility, still coupled deployments
- **Runtime Integration**: Maximum flexibility but more complex

## Decision

We will use **Webpack Module Federation** as our primary MFE integration mechanism.

### How It Works

```javascript
// Shell (Host) Configuration
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      remotes: {
        search: 'search@http://localhost:3001/remoteEntry.js',
        products: 'products@http://localhost:3004/remoteEntry.js',
        cart: 'cart@http://localhost:3005/remoteEntry.js',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
        'next': { singleton: true },
      },
    }),
  ],
};

// Remote MFE Configuration (Products)
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'products',
      filename: 'remoteEntry.js',
      exposes: {
        './ProductGrid': './components/ProductGrid',
        './ProductDetail': './components/ProductDetail',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
  ],
};
```

### Key Features We're Using

1. **Dynamic Remotes**: Load MFEs at runtime based on configuration
2. **Shared Dependencies**: Single instance of React, React-DOM, Next.js
3. **Asynchronous Loading**: Lazy load MFEs only when needed
4. **Version Management**: Specify compatible version ranges
5. **Fallback Mechanism**: Gracefully handle failed remote loads

## Consequences

### Positive ✅

- **Runtime Flexibility**: Change MFE URLs without rebuilding the shell
- **Shared Dependencies**: React loaded once = faster initial load
- **True Independence**: MFEs can be deployed without shell changes
- **Type Safety**: Works with TypeScript when combined with contracts package
- **Hot Module Replacement**: Fast development with instant updates
- **Version Negotiation**: Automatic resolution of compatible dependency versions
- **Built-in Webpack**: No additional build tools required for Next.js apps
- **Production Proven**: Used by major companies (Spotify, Lowe's, etc.)

### Negative ❌

- **Webpack Dependency**: Locked into Webpack (though Next.js uses it by default)
- **Configuration Complexity**: Module Federation config can be tricky to debug
- **Runtime Errors**: If remote is unavailable, need proper error handling
- **Async Boundaries**: All federated imports must be asynchronous
- **TypeScript Limitations**: Type definitions need separate distribution via contracts
- **Debugging Difficulty**: Chrome DevTools shows federated modules differently
- **Version Conflicts**: Can have runtime errors if versions incompatible

### Neutral ⚖️

- **Bundle Analysis**: Need to monitor what's actually shared vs. duplicated
- **Network Dependency**: MFEs load over network (but fast with CDN)
- **Cache Strategy**: Need proper caching headers for remoteEntry.js

## Alternatives Considered

### 1. iFrame Integration
**Rejected because:**
- Poor performance (separate DOM, layout thrashing)
- Styling constraints (CSS can't cross boundary easily)
- Accessibility issues (separate focus contexts)
- URL synchronization complexity
- Poor mobile experience

### 2. Web Components
**Rejected because:**
- Complex state management across boundaries
- Shadow DOM styling constraints
- Framework interop issues
- Limited TypeScript support
- Steeper learning curve for teams familiar with React

### 3. ESM Dynamic Imports + SystemJS
**Rejected because:**
- No built-in dependency sharing
- More manual configuration required
- Less tooling support
- Would duplicate React/common libs

### 4. Single-SPA Framework
**Considered but not chosen because:**
- More opinionated framework (lock-in)
- Module Federation provides similar benefits with less overhead
- Wanted to stay closer to standard Webpack/Next.js patterns
- Note: Could revisit if Module Federation proves insufficient

### 5. Build-Time Composition (NPM Packages)
**Rejected because:**
- Defeats purpose of independent deployments
- Still requires shell rebuild for updates
- Doesn't solve coordination issues

## Implementation Notes

### Current Setup (Next.js 14+)

We're using `@module-federation/nextjs-mf` plugin for Next.js compatibility:

```bash
npm install @module-federation/nextjs-mf
```

```javascript
// next.config.js (Shell)
const NextFederationPlugin = require('@module-federation/nextjs-mf');

module.exports = {
  webpack: (config, options) => {
    const { isServer } = options;
    
    config.plugins.push(
      new NextFederationPlugin({
        name: 'shell',
        filename: 'static/chunks/remoteEntry.js',
        remotes: {
          search: `search@${process.env.SEARCH_MFE_URL}/_next/static/chunks/remoteEntry.js`,
          products: `products@${process.env.PRODUCTS_MFE_URL}/_next/static/chunks/remoteEntry.js`,
        },
        shared: {
          react: { singleton: true, eager: true },
          'react-dom': { singleton: true, eager: true },
        },
      })
    );
    
    return config;
  },
};
```

### Error Handling Pattern

```typescript
// Safe remote component loading
const RemoteComponent = dynamic(
  () => import('products/ProductGrid')
    .catch((err) => {
      console.error('Failed to load products MFE:', err);
      return () => <FallbackComponent />;
    }),
  {
    loading: () => <LoadingSpinner />,
    ssr: false, // Client-side only for federated modules
  }
);
```

### Environment-Based Remote URLs

```env
# .env.development
SEARCH_MFE_URL=http://localhost:3001
PRODUCTS_MFE_URL=http://localhost:3004

# .env.production
SEARCH_MFE_URL=https://search.shopping-app.com
PRODUCTS_MFE_URL=https://products.shopping-app.com
```

### Shared Dependency Strategy

We share only these packages as singletons:
- `react` (singleton, eager)
- `react-dom` (singleton, eager)
- `next` (singleton)
- `@shopping-app/mfe-contracts` (singleton)
- `@shopping-app/shared-ui` (singleton)

Other dependencies are NOT shared to avoid version conflicts.

## Performance Considerations

### Initial Load Time
- Shell loads first (~200KB gzipped)
- React/React-DOM loaded once (~150KB gzipped)
- Remote MFEs loaded on-demand (~50-100KB each)

### Caching Strategy
```nginx
# Cache remoteEntry.js for 1 hour (allows updates)
location ~* remoteEntry\.js$ {
  add_header Cache-Control "public, max-age=3600";
}

# Cache other chunks for 1 year (immutable)
location ~* /static/chunks/ {
  add_header Cache-Control "public, max-age=31536000, immutable";
}
```

### Bundle Analysis
We monitor shared vs. duplicated dependencies using:
```bash
ANALYZE=true npm run build
```

## Migration Plan

### Phase 1: Proof of Concept ✅ Complete
- Set up Module Federation in shell
- Expose one component from products MFE
- Verify hot reload works
- Test production build

### Phase 2: All MFEs Federated ✅ Complete
- Configure all MFEs as remotes
- Expose public components
- Update shell to load all remotes
- Add error boundaries

### Phase 3: Optimization 🔄 In Progress
- Fine-tune shared dependencies
- Implement proper caching strategy
- Add preloading hints for critical MFEs
- Monitor bundle sizes

### Phase 4: Advanced Features ⏳ Planned
- Implement dynamic remote URLs from API
- Add A/B testing for MFE versions
- Server-side rendering for MFEs
- Streaming SSR with Suspense

## Monitoring & Debugging

### Key Metrics to Track
- Remote load time per MFE
- Shared dependency cache hit rate
- Failed remote load errors (with fallback rate)
- Bundle size per MFE
- Time to interactive per page

### Debug Tools
```javascript
// Check what's actually shared at runtime
console.log(__webpack_share_scopes__);

// Check loaded remotes
console.log(__webpack_require__.f);
```

## References

- [Webpack Module Federation Documentation](https://webpack.js.org/concepts/module-federation/)
- [Module Federation Examples](https://github.com/module-federation/module-federation-examples)
- [Next.js Module Federation Plugin](https://www.npmjs.com/package/@module-federation/nextjs-mf)
- [Practical Module Federation Book](https://module-federation.io/)

## Related ADRs

- [ADR-001: Adopting Microfrontend Architecture](001-microfrontend-architecture.md) - Parent decision
- [ADR-003: Shared Contracts Package Strategy](003-shared-contracts-package.md) - Type safety approach
- [ADR-005: Independent Deployment Strategy](005-independent-deployments.md) - Deployment implications
- [ADR-010: Testing Strategy for MFEs](010-testing-strategy.md) - Testing federated modules
