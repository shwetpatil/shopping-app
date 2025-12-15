# Secrets Management

## Storage

Secrets stored in:
- Development: `.env` file (gitignored)
- Production: Kubernetes Secrets / AWS Secrets Manager

## Rotation

Rotate secrets every 90 days:
1. Generate new secret
2. Update in secrets manager
3. Deploy updated configuration
4. Verify service health

## Access Control

Only authorized personnel can access production secrets.

## Audit

All secret access is logged.
