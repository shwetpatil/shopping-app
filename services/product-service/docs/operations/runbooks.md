# Operations Runbooks

## Service Health Check

```bash
curl https://api.example.com/health
```

## Common Tasks

### Restart Service
```bash
kubectl rollout restart deployment/$SERVICE -n shopping-app
```

### View Logs
```bash
kubectl logs -n shopping-app -l app=$SERVICE --tail=100
```

### Scale Service
```bash
kubectl scale deployment/$SERVICE -n shopping-app --replicas=5
```

## Troubleshooting

Step-by-step guides for common issues...
