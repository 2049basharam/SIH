# Operations & Backup Guide
## Internal SIH College Management & Intelligence Platform

This document describes backup routines, system health checks, log monitoring, and disaster recovery procedures.

---

## 1. Database Backup & Restore Procedures

### 1.1. SQLite Backup (Development / Simple Hosting)
For small deployments using SQLite, execute an online database backup using Python or standard shell copy. Do not copy the database directly while writes are in progress.
```bash
# Safely backup the SQLite database using SQLite shell
sqlite3 sih.db ".backup 'backups/sih_backup_$(date +%F).db'"
```

### 1.2. PostgreSQL Backup (Production)
Set up a daily cron job to run `pg_dump` inside the database container:
```bash
# Run pg_dump and compress the output
docker exec -t sih_db pg_dump -U sih_user sih_db | gzip > /backups/sih_db_$(date +%F).sql.gz
```

### 1.3. Restore Verification
To restore the database during a recovery event:
```bash
# SQLite Restore
cp backups/sih_backup_2026-08-11.db sih.db

# PostgreSQL Restore
gunzip < backups/sih_db_2026-08-11.sql.gz | docker exec -i sih_db psql -U sih_user sih_db
```

---

## 2. Health Monitoring & Observability

The platform exposes dedicated health check routes:
- **Health Endpoint**: `/health` (verifies the API is online and responding).
- **Ready Endpoint**: `/ready` (verifies active database connections).

Configure your load balancer or Kubernetes probe:
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
readinessProbe:
  httpGet:
    path: /ready
    port: 8000
```

---

## 3. Log Aggregation & Security Controls

Ensure that logs do not write sensitive user tokens or credentials (e.g. plaintext passwords, JWT signatures).
- Set standard logging to write in JSON format for easy parsing by Logstash/Fluentd.
- Monitor docker container outputs:
  ```bash
  docker logs -f sih_backend
  ```

---

## 4. Disaster Recovery Strategy

- **Recovery Point Objective (RPO)**: 24 hours (maximum age of daily off-site backups).
- **Recovery Time Objective (RTO)**: 1 hour (time required to provision a new Docker cluster and import the backup SQL file).
- **Fail-safe Mode**: If the database crashes, uvicorn returns `503 Service Unavailable`. If the Google Gemini AI provider goes offline, the platform suppresses recommendations and operations continue normally.
