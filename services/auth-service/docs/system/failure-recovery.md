# Failure Recovery Procedures

## Common Failure Scenarios

### 1. Service Unavailable (503)

#### Symptoms
- Health check endpoint returning 503
- Pods crashlooping in Kubernetes
- High error rate in logs

#### Diagnosis
```bash
# Check pod status
kubectl get pods -n shopping-app -l app=auth-service

# View pod logs
kubectl logs -n shopping-app -l app=auth-service --tail=100

# Describe pod for events
kubectl describe pod -n shopping-app <pod-name>

# Check recent events
kubectl get events -n shopping-app --sort-by='.lastTimestamp' | head -20
```

#### Resolution Steps
1. **Check database connectivity**
   ```bash
   # Test database connection
   kubectl exec -n shopping-app deploy/auth-service -- \
     npx prisma db execute --stdin <<< "SELECT 1"
   ```

2. **Restart pods**
   ```bash
   kubectl rollout restart deployment/auth-service -n shopping-app
   ```

3. **Scale up replicas** (if resource constrained)
   ```bash
   kubectl scale deployment/auth-service -n shopping-app --replicas=5
   ```

4. **Rollback if recent deployment**
   ```bash
   kubectl rollout undo deployment/auth-service -n shopping-app
   ```

**ETA to Recovery**: 2-5 minutes

---

### 2. Database Connection Failure

#### Symptoms
- `Error: Can't reach database server` in logs
- All requests failing with 500
- Database health check failing

#### Diagnosis
```bash
# Check database pod (if self-hosted)
kubectl get pods -n database -l app=postgres

# Check database service
kubectl get svc -n database postgres-service

# Test connection from auth service pod
kubectl exec -n shopping-app deploy/auth-service -- \
  nc -zv postgres-service.database.svc.cluster.local 5432
```

#### Resolution Steps
1. **Verify database is running**
   ```bash
   # For managed database (e.g., RDS)
   aws rds describe-db-instances --db-instance-identifier auth-db-prod
   
   # For self-hosted
   kubectl get pods -n database -l app=postgres
   ```

2. **Check connection string**
   ```bash
   kubectl get secret -n shopping-app auth-service-secrets -o jsonpath='{.data.database-url}' | base64 -d
   ```

3. **Restart database connection pool**
   ```bash
   kubectl rollout restart deployment/auth-service -n shopping-app
   ```

4. **Verify network policies**
   ```bash
   kubectl get networkpolicy -n shopping-app
   ```

**ETA to Recovery**: 5-10 minutes

---

### 3. High Memory Usage / OOM Kills

#### Symptoms
- Pods restarting frequently
- `OOMKilled` status in pod events
- Memory usage at 100% in metrics

#### Diagnosis
```bash
# Check memory usage
kubectl top pods -n shopping-app -l app=auth-service

# View OOM events
kubectl get events -n shopping-app | grep OOMKilled

# Check resource limits
kubectl get deployment auth-service -n shopping-app -o jsonpath='{.spec.template.spec.containers[0].resources}'
```

#### Resolution Steps
1. **Increase memory limits**
   ```bash
   kubectl set resources deployment auth-service -n shopping-app \
     --limits=memory=1Gi \
     --requests=memory=512Mi
   ```

2. **Check for memory leaks**
   ```bash
   # Enable heap profiling
   kubectl exec -n shopping-app <pod-name> -- \
     node --heap-prof --heap-prof-interval=10000 /app/dist/server.js
   ```

3. **Scale horizontally instead of vertically**
   ```bash
   kubectl scale deployment/auth-service -n shopping-app --replicas=6
   ```

**ETA to Recovery**: 5 minutes

---

### 4. Rate Limit Misconfiguration

#### Symptoms
- Legitimate users getting 429 errors
- Excessive rate limit alerts
- High rejection rate in metrics

#### Diagnosis
```bash
# Check rate limit configuration
kubectl get configmap -n shopping-app auth-service-config -o yaml | grep RATE_LIMIT

# View recent 429 errors
kubectl logs -n shopping-app -l app=auth-service | grep "429"

# Check metrics
curl http://prometheus:9090/api/v1/query?query='rate(http_requests_total{status_code="429"}[5m])'
```

#### Resolution Steps
1. **Temporarily increase limits**
   ```bash
   kubectl patch configmap -n shopping-app auth-service-config \
     --type merge \
     -p '{"data":{"RATE_LIMIT_MAX_REQUESTS":"200"}}'
   
   # Restart to apply
   kubectl rollout restart deployment/auth-service -n shopping-app
   ```

2. **Implement IP whitelisting** for known good actors
   ```typescript
   const whitelist = ['10.0.0.0/8', '192.168.0.0/16'];
   
   if (whitelist.some(range => isIpInRange(req.ip, range))) {
     return next(); // Skip rate limiting
   }
   ```

**ETA to Recovery**: 2 minutes

---

### 5. JWT Secret Compromise

#### Symptoms
- Security alert indicating potential secret leak
- Unauthorized access detected
- Token validation failures

#### Immediate Response
1. **Rotate JWT secret immediately**
   ```bash
   # Generate new secret
   NEW_SECRET=$(openssl rand -base64 32)
   
   # Update secret
   kubectl patch secret -n shopping-app auth-service-secrets \
     --type merge \
     -p "{\"data\":{\"jwt-secret\":\"$(echo -n $NEW_SECRET | base64)\"}}"
   
   # Rolling restart
   kubectl rollout restart deployment/auth-service -n shopping-app
   ```

2. **Invalidate all refresh tokens**
   ```sql
   -- Connect to database
   DELETE FROM refresh_tokens WHERE created_at < NOW();
   ```

3. **Force re-authentication**
   - All users will need to log in again
   - Send notification to users

4. **Audit access logs**
   ```bash
   # Find suspicious activity
   kubectl logs -n shopping-app -l app=auth-service --since=24h | \
     grep -E "(401|403)" | \
     awk '{print $1}' | sort | uniq -c | sort -nr | head -20
   ```

**ETA to Recovery**: 15-30 minutes  
**Impact**: All users logged out

---

### 6. Database Migration Failure

#### Symptoms
- Deployment stuck during migration job
- Schema version mismatch errors
- Application fails to start

#### Diagnosis
```bash
# Check migration job status
kubectl get jobs -n shopping-app | grep migration

# View migration logs
kubectl logs -n shopping-app job/auth-service-migration

# Check schema status
kubectl exec -n shopping-app deploy/auth-service -- \
  npx prisma migrate status
```

#### Resolution Steps
1. **Identify failing migration**
   ```bash
   kubectl logs -n shopping-app job/auth-service-migration --tail=50
   ```

2. **Rollback database** (if possible)
   ```sql
   -- Manual rollback
   BEGIN;
   -- Revert schema changes
   DROP TABLE IF EXISTS problematic_table;
   -- Mark migration as rolled back
   DELETE FROM _prisma_migrations WHERE migration_name = 'failed_migration';
   COMMIT;
   ```

3. **Fix migration** and redeploy
   ```bash
   # Create new migration fixing the issue
   npx prisma migrate dev --name fix-migration-issue
   
   # Delete failed job
   kubectl delete job -n shopping-app auth-service-migration
   
   # Reapply
   kubectl apply -f k8s/migration-job.yaml
   ```

4. **Deploy with fixed migration**

**ETA to Recovery**: 30-60 minutes

---

### 7. Downstream Service Failure (API Gateway Down)

#### Symptoms
- Auth service healthy but requests not reaching it
- API Gateway showing errors
- Users unable to authenticate

#### Diagnosis
```bash
# Check API Gateway
kubectl get pods -n shopping-app -l app=api-gateway

# Test direct connection to auth service
kubectl port-forward -n shopping-app svc/auth-service 3001:3001

# Test from local machine
curl http://localhost:3001/health
```

#### Resolution Steps
1. **Restart API Gateway**
   ```bash
   kubectl rollout restart deployment/api-gateway -n shopping-app
   ```

2. **Verify service discovery**
   ```bash
   kubectl get svc -n shopping-app auth-service
   kubectl get endpoints -n shopping-app auth-service
   ```

3. **Check ingress configuration**
   ```bash
   kubectl get ingress -n shopping-app
   kubectl describe ingress api-gateway-ingress -n shopping-app
   ```

**ETA to Recovery**: 2-5 minutes

---

## Disaster Recovery Procedures

### Complete Database Loss

#### Pre-Requisites
- Automated daily backups enabled
- Backup retention: 30 days
- Point-in-time recovery available

#### Recovery Steps

1. **Provision new database instance**
   ```bash
   # For RDS
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier auth-db-prod-new \
     --db-snapshot-identifier auth-db-snapshot-2024-01-01
   ```

2. **Update connection string**
   ```bash
   # Update secret with new database URL
   kubectl patch secret -n shopping-app auth-service-secrets \
     --type merge \
     -p '{"data":{"database-url":"<new-base64-encoded-url>"}}'
   ```

3. **Restart services**
   ```bash
   kubectl rollout restart deployment/auth-service -n shopping-app
   ```

4. **Verify data integrity**
   ```bash
   # Run data validation queries
   psql $NEW_DATABASE_URL -c "SELECT COUNT(*) FROM users"
   ```

**RTO (Recovery Time Objective)**: 1-2 hours  
**RPO (Recovery Point Objective)**: 24 hours (last backup)

---

### Complete Service Outage

#### Scenario: Entire cluster unavailable

1. **Failover to backup region** (if multi-region)
   ```bash
   # Update DNS to point to backup region
   aws route53 change-resource-record-sets \
     --hosted-zone-id Z123456 \
     --change-batch file://failover-dns.json
   ```

2. **Deploy to new cluster**
   ```bash
   # Use infrastructure-as-code
   terraform apply -var="region=us-west-2"
   
   # Deploy services
   kubectl apply -f k8s/ -n shopping-app
   ```

3. **Restore database** from latest backup

4. **Verify all systems operational**

**RTO**: 2-4 hours  
**RPO**: 1 hour

---

## Post-Incident Procedures

### 1. Incident Documentation

```markdown
## Incident Report: [Title]

**Date**: 2024-01-01
**Duration**: 2 hours
**Severity**: Critical/High/Medium/Low
**Services Affected**: auth-service

### Timeline
- 10:00 AM: Issue detected (automated alert)
- 10:05 AM: On-call engineer paged
- 10:15 AM: Root cause identified
- 11:30 AM: Fix deployed
- 12:00 PM: Service fully restored

### Root Cause
[Detailed explanation]

### Resolution
[Steps taken to resolve]

### Prevention
[Steps to prevent recurrence]

### Action Items
- [ ] Update monitoring thresholds
- [ ] Add additional tests
- [ ] Update runbook
```

### 2. Post-Mortem Meeting

**Participants**: Engineering team, Product Manager, SRE

**Agenda**:
1. Incident timeline review
2. Root cause analysis
3. Impact assessment
4. Prevention strategies
5. Action items assignment

### 3. Knowledge Base Update

- Update runbooks with new learnings
- Add to known issues documentation
- Share insights with team

---

## Emergency Contacts

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| On-Call Engineer | Rotation | PagerDuty | @oncall |
| Team Lead | [Name] | +1-XXX-XXX-XXXX | @team-lead |
| Database Admin | [Name] | +1-XXX-XXX-XXXX | @dba |
| Security Team | [Name] | +1-XXX-XXX-XXXX | @security-oncall |

---

## Useful Commands Reference

```bash
# Quick health check
kubectl get pods -n shopping-app && \
kubectl logs -n shopping-app -l app=auth-service --tail=10

# View real-time logs
kubectl logs -n shopping-app -l app=auth-service -f

# Execute command in pod
kubectl exec -it -n shopping-app deploy/auth-service -- /bin/sh

# Port forward for debugging
kubectl port-forward -n shopping-app svc/auth-service 3001:3001

# Scale replicas
kubectl scale deployment/auth-service -n shopping-app --replicas=5

# Rollback deployment
kubectl rollout undo deployment/auth-service -n shopping-app

# View resource usage
kubectl top pods -n shopping-app -l app=auth-service
```
