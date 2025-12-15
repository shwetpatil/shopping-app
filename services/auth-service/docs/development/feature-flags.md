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
