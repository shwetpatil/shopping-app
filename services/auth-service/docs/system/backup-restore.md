# Backup and Restore Procedures

## Backup Strategy

### Database Backups

#### Automated Backups

**Frequency**: Daily at 02:00 AM UTC
**Retention**: 30 days
**Type**: Full database dump
**Location**: S3 bucket `auth-service-backups-prod`

```bash
#!/bin/bash
# Automated backup script (runs daily via cron)

DATE=$(date +%Y-%m-%d)
BACKUP_FILE="auth-db-backup-${DATE}.sql.gz"
S3_BUCKET="s3://auth-service-backups-prod"

# Create backup
pg_dump $DATABASE_URL | gzip > /tmp/$BACKUP_FILE

# Upload to S3
aws s3 cp /tmp/$BACKUP_FILE $S3_BUCKET/daily/

# Cleanup local file
rm /tmp/$BACKUP_FILE

# Remove backups older than 30 days
aws s3 ls $S3_BUCKET/daily/ | \
  awk '{print $4}' | \
  grep "^auth-db-backup-" | \
  while read file; do
    file_date=$(echo $file | grep -oP '\d{4}-\d{2}-\d{2}')
    if [[ $(date -d "$file_date" +%s) -lt $(date -d "30 days ago" +%s) ]]; then
      aws s3 rm "$S3_BUCKET/daily/$file"
    fi
  done
```

#### Manual Backups

**When to use**:
- Before major migrations
- Before schema changes
- Before bulk data operations
- For compliance requirements

```bash
# Create manual backup
DATE=$(date +%Y-%m-%d-%H%M%S)
pg_dump $DATABASE_URL > auth-db-manual-${DATE}.sql

# With compression
pg_dump $DATABASE_URL | gzip > auth-db-manual-${DATE}.sql.gz

# Upload to S3
aws s3 cp auth-db-manual-${DATE}.sql.gz \
  s3://auth-service-backups-prod/manual/
```

### Point-in-Time Recovery (PITR)

**Enabled**: Yes (for production only)
**Granularity**: 5 minutes
**Retention**: 7 days

#### Enable PITR (AWS RDS)
```bash
aws rds modify-db-instance \
  --db-instance-identifier auth-db-prod \
  --backup-retention-period 7 \
  --preferred-backup-window "02:00-03:00" \
  --apply-immediately
```

#### Restore to Point in Time
```bash
# Restore to specific time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier auth-db-prod \
  --target-db-instance-identifier auth-db-restored \
  --restore-time 2024-01-01T12:00:00Z

# Restore to latest restorable time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier auth-db-prod \
  --target-db-instance-identifier auth-db-restored \
  --use-latest-restorable-time
```

### Configuration Backups

#### Kubernetes Resources
```bash
# Backup all Kubernetes resources
kubectl get all,configmap,secret,pvc -n shopping-app -o yaml > \
  k8s-backup-$(date +%Y-%m-%d).yaml

# Backup to Git repository
git add k8s/
git commit -m "Backup K8s resources $(date)"
git push origin main
```

#### Environment Variables
```bash
# Export all secrets (encrypted)
kubectl get secrets -n shopping-app -o yaml | \
  kubeseal -o yaml > sealed-secrets-backup.yaml

# Store in version control
git add sealed-secrets-backup.yaml
git commit -m "Backup sealed secrets"
```

### Application Code Backup

**Repository**: GitHub (https://github.com/org/auth-service)
**Backup Frequency**: Real-time (via git push)
**Retention**: Indefinite (all commits)
**Additional**: Weekly full repository backup to S3

```bash
# Create repository archive
git archive --format=tar.gz --prefix=auth-service/ HEAD > \
  auth-service-$(date +%Y-%m-%d).tar.gz

# Upload to S3
aws s3 cp auth-service-$(date +%Y-%m-%d).tar.gz \
  s3://auth-service-backups-prod/code/
```

## Restore Procedures

### Database Restore

#### From Daily Backup

**Scenario**: Complete database loss or corruption

```bash
# 1. Download backup from S3
aws s3 cp s3://auth-service-backups-prod/daily/auth-db-backup-2024-01-01.sql.gz .

# 2. Extract backup
gunzip auth-db-backup-2024-01-01.sql.gz

# 3. Stop application (prevent writes)
kubectl scale deployment/auth-service -n shopping-app --replicas=0

# 4. Drop existing database (if necessary)
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE;"
psql $DATABASE_URL -c "CREATE SCHEMA public;"

# 5. Restore backup
psql $DATABASE_URL < auth-db-backup-2024-01-01.sql

# 6. Verify data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM refresh_tokens;"

# 7. Run migrations (if schema changes since backup)
npx prisma migrate deploy

# 8. Restart application
kubectl scale deployment/auth-service -n shopping-app --replicas=3

# 9. Verify service health
curl https://api.example.com/health
```

**Expected Duration**: 15-30 minutes  
**Data Loss**: Up to 24 hours (last backup)

#### From Point-in-Time Recovery

**Scenario**: Accidental data deletion or corruption with minimal data loss

```bash
# 1. Restore database to point in time (AWS RDS)
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier auth-db-prod \
  --target-db-instance-identifier auth-db-restored \
  --restore-time "2024-01-01T11:55:00Z"

# 2. Wait for restore to complete
aws rds wait db-instance-available \
  --db-instance-identifier auth-db-restored

# 3. Get new endpoint
NEW_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier auth-db-restored \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

# 4. Update application connection string
NEW_DATABASE_URL="postgresql://user:pass@${NEW_ENDPOINT}:5432/auth_db"
kubectl patch secret -n shopping-app auth-service-secrets \
  --type merge \
  -p "{\"data\":{\"database-url\":\"$(echo -n $NEW_DATABASE_URL | base64)\"}}"

# 5. Restart application
kubectl rollout restart deployment/auth-service -n shopping-app

# 6. Verify
kubectl logs -n shopping-app -l app=auth-service --tail=20
```

**Expected Duration**: 30-45 minutes  
**Data Loss**: Up to 5 minutes

### Configuration Restore

#### Kubernetes Resources

```bash
# 1. Retrieve backup
git pull origin main

# 2. Apply resources
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/ingress.yaml

# 3. Verify
kubectl get all -n shopping-app
```

#### Secrets Restore

```bash
# From sealed secrets backup
kubectl apply -f sealed-secrets-backup.yaml

# Verify secrets exist
kubectl get secrets -n shopping-app
```

### Application Code Restore

**Scenario**: Complete repository loss (extremely rare)

```bash
# 1. Download archive from S3
aws s3 cp s3://auth-service-backups-prod/code/auth-service-2024-01-01.tar.gz .

# 2. Extract
tar -xzf auth-service-2024-01-01.tar.gz

# 3. Initialize new repository
cd auth-service
git init
git remote add origin https://github.com/org/auth-service.git

# 4. Push to remote
git add .
git commit -m "Restore from backup"
git push -u origin main --force
```

## Backup Verification

### Automated Backup Testing

**Frequency**: Weekly
**Process**: Restore to test environment and verify

```bash
#!/bin/bash
# Backup verification script (runs weekly)

# 1. Get latest backup
LATEST_BACKUP=$(aws s3 ls s3://auth-service-backups-prod/daily/ | \
  sort | tail -n 1 | awk '{print $4}')

# 2. Download backup
aws s3 cp s3://auth-service-backups-prod/daily/$LATEST_BACKUP .

# 3. Restore to test database
gunzip $LATEST_BACKUP
psql $TEST_DATABASE_URL < ${LATEST_BACKUP%.gz}

# 4. Run validation queries
EXPECTED_USERS=$(psql $PROD_DATABASE_URL -t -c "SELECT COUNT(*) FROM users;")
RESTORED_USERS=$(psql $TEST_DATABASE_URL -t -c "SELECT COUNT(*) FROM users;")

if [ "$EXPECTED_USERS" -eq "$RESTORED_USERS" ]; then
  echo "✓ Backup verification successful"
  # Send success notification
  curl -X POST $SLACK_WEBHOOK -d '{"text":"Backup verification successful"}'
else
  echo "✗ Backup verification failed"
  # Send alert
  curl -X POST $PAGERDUTY_WEBHOOK -d '{"event_action":"trigger"}'
fi

# 5. Cleanup
rm $LATEST_BACKUP
psql $TEST_DATABASE_URL -c "DROP SCHEMA public CASCADE;"
```

### Manual Verification Checklist

- [ ] Backup file exists in S3
- [ ] Backup file size is reasonable (not 0 bytes)
- [ ] Backup can be extracted without errors
- [ ] Restore completes successfully
- [ ] User count matches production
- [ ] Refresh token count matches production
- [ ] Critical data integrity checks pass
- [ ] Application can start with restored database

## Backup Monitoring

### Backup Success Metrics

```typescript
// Prometheus metrics for backup monitoring
const backupMetrics = {
  lastBackupTime: new Gauge({
    name: 'auth_db_last_backup_timestamp',
    help: 'Timestamp of last successful backup'
  }),
  
  backupDuration: new Histogram({
    name: 'auth_db_backup_duration_seconds',
    help: 'Time taken to complete backup'
  }),
  
  backupSize: new Gauge({
    name: 'auth_db_backup_size_bytes',
    help: 'Size of backup file'
  }),
  
  backupFailures: new Counter({
    name: 'auth_db_backup_failures_total',
    help: 'Total number of backup failures'
  })
};
```

### Alerts

```yaml
# Alert if backup hasn't run in 25 hours
alert: BackupNotRun
expr: time() - auth_db_last_backup_timestamp > 90000
for: 1h
severity: critical
description: Database backup has not run in over 25 hours

# Alert if backup fails
alert: BackupFailed
expr: increase(auth_db_backup_failures_total[1h]) > 0
severity: critical
description: Database backup has failed
```

## Compliance & Retention

### Data Retention Policy

| Backup Type | Retention Period | Storage Location |
|-------------|------------------|------------------|
| Daily backups | 30 days | S3 Standard |
| Weekly backups | 90 days | S3 Standard-IA |
| Monthly backups | 1 year | S3 Glacier |
| Yearly backups | 7 years | S3 Glacier Deep Archive |

### Compliance Requirements

- **GDPR**: Right to erasure (delete user data from backups)
- **HIPAA**: Encrypted backups, access logs
- **SOC 2**: Backup verification, disaster recovery testing

### Backup Encryption

```bash
# Encrypt backup before upload
pg_dump $DATABASE_URL | \
  gzip | \
  openssl enc -aes-256-cbc -salt -pass pass:$ENCRYPTION_KEY > \
  auth-db-encrypted.sql.gz.enc

# Decrypt backup
openssl enc -d -aes-256-cbc -pass pass:$ENCRYPTION_KEY \
  -in auth-db-encrypted.sql.gz.enc | \
  gunzip > auth-db-decrypted.sql
```

## Disaster Recovery Testing

### DR Drill Schedule

**Frequency**: Quarterly  
**Duration**: 2-4 hours  
**Participants**: Engineering team, SRE, DBA

### DR Drill Procedure

1. **Preparation** (1 week before)
   - Schedule drill
   - Notify stakeholders
   - Prepare test environment

2. **Execution** (2-4 hours)
   - Simulate disaster scenario
   - Execute recovery procedures
   - Document issues and timing

3. **Validation**
   - Verify data integrity
   - Test application functionality
   - Measure RTO and RPO

4. **Post-Drill Review**
   - Update procedures
   - Address gaps
   - Train team on learnings

### DR Drill Scenarios

1. **Complete database loss** - Restore from backup
2. **Accidental data deletion** - PITR restore
3. **Corrupted backup** - Restore from older backup
4. **Multi-region failover** - Switch to backup region
5. **Ransomware attack** - Clean restore from verified backup

## Contact Information

**Backup Administrator**: backup-admin@example.com  
**DBA On-Call**: PagerDuty escalation  
**AWS Support**: 1-800-AWS-SUPPORT  
**S3 Bucket**: auth-service-backups-prod  
**Backup Documentation**: https://wiki.example.com/backups
