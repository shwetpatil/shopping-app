# Audit Logging

## What We Log

- Authentication events
- Authorization failures
- Data modifications
- Administrative actions

## Log Format

```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "action": "USER_LOGIN",
  "userId": "123",
  "ip": "192.168.1.1",
  "success": true
}
```

## Retention

- Production logs: 90 days
- Audit logs: 7 years (compliance)

## Access

Audit logs can only be accessed by security team.
