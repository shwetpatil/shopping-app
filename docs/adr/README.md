# Architecture Decision Records (ADRs)

This directory contains all significant architectural decisions made for the Shopping App B2B Microfrontend Platform.

## ADR Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [001](001-microfrontend-architecture.md) | Adopting Microfrontend Architecture | ✅ Accepted | 2025-12-14 |
| [002](002-module-federation.md) | Using Webpack Module Federation | ✅ Accepted | 2025-12-14 |
| [003](003-shared-contracts-package.md) | Shared Contracts Package Strategy | ✅ Accepted | 2025-12-14 |
| [004](004-event-driven-communication.md) | Event-Driven MFE Communication | ✅ Accepted | 2025-12-14 |
| [005](005-independent-deployments.md) | Independent Deployment Strategy | ✅ Accepted | 2025-12-14 |
| [006](006-shared-state-management.md) | Shared State Management Approach | ✅ Accepted | 2025-12-14 |
| [007](007-api-client-architecture.md) | API Client with Retry & Caching | ✅ Accepted | 2025-12-15 |
| [008](008-accessibility-first.md) | Accessibility-First Development | ✅ Accepted | 2025-12-15 |
| [009](009-observability-platform.md) | Comprehensive Observability Platform | ✅ Accepted | 2025-12-15 |
| [010](010-testing-strategy.md) | Testing Strategy for MFEs | ✅ Accepted | 2025-12-15 |

## What is an ADR?

An Architecture Decision Record (ADR) captures an important architectural decision made along with its context and consequences.

### ADR Format

Each ADR follows this structure:

```markdown
# [Number]. [Title]

**Status:** [Proposed | Accepted | Deprecated | Superseded]  
**Date:** YYYY-MM-DD  
**Deciders:** [List of people involved]  
**Technical Story:** [Link to issue/story if applicable]

## Context

What is the issue that we're seeing that is motivating this decision or change?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

What becomes easier or more difficult to do because of this change?

### Positive
- List of positive consequences

### Negative
- List of negative consequences

### Neutral
- List of neutral consequences

## Alternatives Considered

What other approaches did we consider?

## Implementation Notes

Specific details about how this decision was implemented.
```

## Creating a New ADR

1. Copy the template above
2. Assign the next sequential number
3. Fill in all sections with detailed information
4. Get review from team
5. Update this index once accepted

## Referencing ADRs

When referencing an ADR in code or documentation, use the format: `ADR-001` or link to the file directly.
