# MyPay Payout API - Logging & Audit Trail Guide

## Overview

The system implements comprehensive logging for **transparency, audit compliance, and debugging**. All logs are structured, timestamped, and retained for 90 days.

---

## Log Types & Locations

### 1. **Nginx Access Logs** (HTTP Level)
**Location:** `/var/log/nginx/payout-api-access.log`

**Format:** Human-readable combined format with API key tracking

**Example:**
```
39.34.153.134 - - [27/Nov/2025:11:13:19 +0000] "POST /api/v1/payouts HTTP/1.1" 201 438 "-" "curl/8.14.1" rt=0.027 api_key=mypay_34...aee6
```

**What's Captured:**
- Client IP address
- Timestamp (UTC)
- HTTP method & endpoint
- Response status code
- Response size in bytes
- User agent
- Response time (seconds)
- API key (hashed - first 8 + last 4 chars)

**View Live:**
```bash
tail -f /var/log/nginx/payout-api-access.log
```

---

### 2. **Nginx Error Logs**
**Location:** `/var/log/nginx/payout-api-error.log`

**Captures:** Nginx-level errors (proxy failures, timeouts, etc.)

**View Live:**
```bash
tail -f /var/log/nginx/payout-api-error.log
```

---

### 3. **Application Audit Logs** (Business Level)
**Location:** Docker container logs (persisted with rotation)

**Format:** Structured JSON for parsing

#### **3a. Request Audit Logs**
**Tag:** `[AUDIT-REQUEST]`

**Example:**
```json
{
  "timestamp": "2025-11-27T11:13:19.046Z",
  "request_id": "4a4e2bcf8746ec0482dd178dc7390e07",
  "api_key_hash": "mypay_34...aee6",
  "method": "POST",
  "path": "/api/v1/payouts",
  "ip_address": "39.34.153.134",
  "user_agent": "curl/8.14.1",
  "idempotency_key": "550e8400-e29b-41d4-a716-446655440099",
  "request_body": {
    "merchantReference": "LOG-TEST-001",
    "amount": 1500,
    "destType": "BANK",
    "accountNumber": "123******01",
    "accountTitle": "Log Test User",
    "bankCode": "HBL"
  }
}
```

**Features:**
- Unique request ID for tracing
- Sanitized sensitive data (account numbers masked)
- Full request context

---

#### **3b. Authentication Audit Logs**
**Tag:** `[AUDIT-AUTH]`

**Example:**
```json
{
  "timestamp": "2025-11-27T11:13:19.048Z",
  "log_type": "AUTHENTICATION",
  "success": true,
  "api_key_hash": "mypay_34...aee6",
  "reason": "SUCCESS",
  "ip_address": "39.34.153.134"
}
```

**Tracks:**
- ✅ Successful authentications
- ❌ Failed authentication attempts
- Missing API keys
- Invalid API keys
- IP addresses of attempts

---

#### **3c. Transaction Audit Logs**
**Tag:** `[AUDIT-TRANSACTION]`

**Example:**
```json
{
  "timestamp": "2025-11-27T11:13:19.072Z",
  "log_type": "TRANSACTION",
  "transaction_type": "PAYOUT_CREATED",
  "data": {
    "payout_id": "3cf68d08-39fb-4f21-b570-732f5568f371",
    "merchant_id": "db494a83-ac5e-4d8c-bb64-7edad0717dad",
    "merchant_reference": "LOG-TEST-001",
    "amount": 1500,
    "currency": "PKR",
    "dest_type": "BANK",
    "bank_code": "HBL",
    "account_number_masked": "123***01",
    "status": "PENDING"
  }
}
```

**Transaction Types Logged:**
- `PAYOUT_CREATED` - New payout initiated
- (Future: `PAYOUT_SUCCESS`, `PAYOUT_FAILED`, `BALANCE_CHANGE`, etc.)

---

####3d. Response Audit Logs**
**Tag:** `[AUDIT-RESPONSE]`

**Example:**
```json
{
  "timestamp": "2025-11-27T11:13:19.073Z",
  "request_id": "4a4e2bcf8746ec0482dd178dc7390e07",
  "merchant_id": "db494a83-ac5e-4d8c-bb64-7edad0717dad",
  "method": "POST",
  "path": "/payouts",
  "query": {},
  "ip_address": "39.34.153.134",
  "user_agent": "curl/8.14.1",
  "response_status": 201,
  "response_time_ms": 27
}
```

**Features:**
- Links to request via request_id
- Response time in milliseconds
- Error messages (if status >= 400)

---

### 4. **Docker Container Logs**
**Location:** Docker's logging driver (JSON file, rotated)

**Configuration:**
- Max size per file: 10MB
- Max files kept: 5
- Total max: 50MB per container

**View Live:**
```bash
cd /opt/payout-system

# API logs
docker compose logs api -f

# Worker logs
docker compose logs worker -f

# MySQL logs
docker compose logs mysql -f

# Filter audit logs only
docker compose logs api -f | grep AUDIT
```

---

## Log Retention & Rotation

### Nginx Logs
- **Rotation:** Daily
- **Retention:** 90 days
- **Compression:** Enabled (gzip)
- **Config:** `/etc/logrotate.d/payout-api`

### Docker Logs
- **Per-file limit:** 10MB
- **Files per container:** 5
- **Total per container:** 50MB max
- **Automatic rotation:** Yes

---

## Viewing Logs

### Real-Time Monitoring
```bash
# Watch all API requests
tail -f /var/log/nginx/payout-api-access.log

# Watch application audit trail
docker compose logs api -f | grep AUDIT

# Watch authentication attempts
docker compose logs api -f | grep AUDIT-AUTH

# Watch transactions
docker compose logs api -f | grep AUDIT-TRANSACTION
```

### Historical Analysis
```bash
# Search for specific merchant
docker compose logs api | grep "merchant_id.*db494a83-ac5e-4d8c-bb64-7edad0717dad"

# Find all payouts created today
docker compose logs api | grep "PAYOUT_CREATED" | grep "2025-11-27"

# Find failed authentications
docker compose logs api | grep "AUDIT-AUTH" | grep '"success":false'

# Find slow requests (>1000ms)
docker compose logs api | grep "response_time_ms" | grep -E '"response_time_ms":[0-9]{4,}'
```

---

## Security & Privacy Features

### 1. **Sensitive Data Masking**
- **Account numbers:** Show first 3 and last 2 digits only
  - Original: `12345678901`
  - Logged: `123***01`

- **API Keys:** Show first 8 and last 4 characters only
  - Original: `mypay_342699b6453691099d2a94c84957fec8189edb386dee26c5def0d4cefd0faee6`
  - Logged: `mypay_34...aee6`

### 2. **Redacted Fields**
These fields are NEVER logged if present:
- `password`
- `pin`
- `cvv`
- `card_number`

---

## Audit Trail Use Cases

### 1. **Track Merchant Activity**
```bash
# Get all actions by specific merchant
docker compose logs api | grep "merchant_id.*YOUR_MERCHANT_ID"
```

### 2. **Investigate Failed Payouts**
```bash
# Find payout creation
docker compose logs api | grep "payout_id.*YOUR_PAYOUT_ID"

# Check authentication for that request
# (use request_id from payout creation log)
docker compose logs api | grep "request_id.*YOUR_REQUEST_ID"
```

### 3. **Security Audit**
```bash
# Failed authentication attempts from specific IP
docker compose logs api | grep "AUDIT-AUTH" | grep "false" | grep "39.34.153.134"

# Multiple failed attempts (brute force detection)
docker compose logs api | grep "AUDIT-AUTH" | grep "false" | wc -l
```

### 4. **Performance Analysis**
```bash
# Find slow endpoints
docker compose logs api | grep "response_time_ms" | awk -F'"' '{print $8, $16}' | sort -n -k2 -r | head -20
```

### 5. **Compliance Reporting**
```bash
# Export all transactions for a date
docker compose logs api --since 2025-11-27T00:00:00 --until 2025-11-27T23:59:59 | grep "AUDIT-TRANSACTION" > transactions_nov27.log
```

---

## Log Formats Reference

### Request Body Sanitization
The system automatically sanitizes:
1. Account numbers (partial masking)
2. Sensitive fields (complete redaction)
3. Personal data (as configured)

### Timestamp Format
All timestamps use **ISO 8601 UTC format**:
```
2025-11-27T11:13:19.073Z
```

This ensures consistency across time zones and easy parsing.

---

## Monitoring & Alerts (Recommended)

### Set Up Alerts For:
1. **Multiple failed authentication** from same IP (> 10 in 5 min)
2. **High error rate** (> 5% 4xx/5xx responses)
3. **Slow responses** (> 2000ms average)
4. **Large payouts** (> threshold for review)

### Tools You Can Use:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Grafana + Loki** for log aggregation
- **Fail2Ban** for IP blocking on failed auth
- **CloudWatch** or **Datadog** for hosted monitoring

---

## Exporting Logs for Analysis

### Export JSON logs to file
```bash
# Export all audit logs from API
docker compose logs api --no-log-prefix | grep "AUDIT" > audit-export-$(date +%Y%m%d).json

# Export specific date range
docker compose logs api --since "2025-11-27T00:00:00" --until "2025-11-27T23:59:59" | grep "AUDIT-TRANSACTION" > transactions-nov27.json
```

### Parse JSON logs with jq
```bash
# Extract all merchant IDs
docker compose logs api --no-log-prefix | grep "AUDIT-REQUEST" | jq -r '.merchant_id' | sort -u

# Count requests by endpoint
docker compose logs api --no-log-prefix | grep "AUDIT-REQUEST" | jq -r '.path' | sort | uniq -c

# Average response time
docker compose logs api --no-log-prefix | grep "AUDIT-RESPONSE" | jq '.response_time_ms' | awk '{sum+=$1; n++} END {print sum/n}'
```

---

## Disk Space Management

### Current Usage
```bash
# Check Nginx log size
du -sh /var/log/nginx/

# Check Docker log size
docker system df
```

### Clean Old Logs (if needed)
```bash
# Force logrotate
logrotate -f /etc/logrotate.d/payout-api

# Prune old Docker logs
docker system prune -a --volumes
```

---

## Troubleshooting

### Logs not appearing?
```bash
# Check Nginx is running
systemctl status nginx

# Check containers are running
docker compose ps

# Check log file permissions
ls -la /var/log/nginx/

# Test log rotation
logrotate --debug /etc/logrotate.d/payout-api
```

### Docker logs missing?
```bash
# Check logging driver
docker inspect payout_api | grep LogPath

# Restart containers to refresh logging
docker compose restart
```

---

## Best Practices

1. **Regular backups** - Export critical logs weekly
2. **Monitor disk space** - Set up alerts at 80% usage
3. **Review failed auth** - Check daily for suspicious activity
4. **Archive old logs** - Move to cold storage after 90 days
5. **Use log analysis tools** - Don't rely on manual grep
6. **Test log rotation** - Verify it works before it's needed

---

## Compliance & Regulations

These logs support compliance with:
- **PCI-DSS** - Transaction tracking & access logs
- **GDPR** - Data masking & audit trails
- **ISO 27001** - Information security logging
- **PSD2** - Payment service provider requirements

---

## Summary

**What We Log:**
✅ Every API request & response
✅ Authentication attempts (success & failure)
✅ All financial transactions
✅ Performance metrics
✅ Error details

**What We DON'T Log:**
❌ Full account numbers
❌ Full API keys
❌ Passwords or PINs
❌ Sensitive personal data

**Retention:**
- Nginx logs: 90 days (compressed)
- Docker logs: 50MB per container (rolling)
- Database: Permanent (for transactions)

---

## Quick Reference Commands

```bash
# SSH to VPS
ssh root@72.60.110.249

# Navigate to logs
cd /var/log/nginx/

# Watch API logs
tail -f payout-api-access.log

# Watch audit trail
docker compose logs api -f | grep AUDIT

# Search for merchant
docker compose logs api | grep "merchant_id.*YOUR_ID"

# Export yesterday's transactions
docker compose logs api --since yesterday | grep AUDIT-TRANSACTION > export.json
```

---

**Last Updated:** November 27, 2025
**Version:** 1.0.0

For questions or issues with logging, check container logs or contact technical support.
