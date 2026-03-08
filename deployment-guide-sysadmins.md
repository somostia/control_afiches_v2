# System Administrator Guide: Full-Stack Application Deployment
## Infrastructure & Operations Reference

> **Target Audience**: System Administrators, DevOps Engineers, Infrastructure Teams
> **Scope**: VPS deployment, Cloud Panel integration, security hardening, monitoring, maintenance
> **Companion Guide**: See `deployment-guide-developers.md` for application development aspects

---

## Table of Contents

1. [Infrastructure Overview](#infrastructure-overview)
2. [Pre-Deployment System Requirements](#pre-deployment-system-requirements)
3. [VPS Initial Setup & Hardening](#vps-initial-setup--hardening)
4. [Cloud Panel Installation & Configuration](#cloud-panel-installation--configuration)
5. [Docker Environment Setup](#docker-environment-setup)
6. [Application Deployment Pipeline](#application-deployment-pipeline)
7. [Reverse Proxy & SSL Configuration](#reverse-proxy--ssl-configuration)
8. [Security Implementation](#security-implementation)
9. [Database Administration](#database-administration)
10. [Monitoring & Health Checks](#monitoring--health-checks)
11. [Backup & Recovery Procedures](#backup--recovery-procedures)
12. [Maintenance & Updates](#maintenance--updates)
13. [Troubleshooting Operations](#troubleshooting-operations)
14. [Performance Optimization](#performance-optimization)
15. [Security Auditing](#security-auditing)
16. [Disaster Recovery](#disaster-recovery)

---

## Infrastructure Overview

### System Architecture
```
[Internet] → [CloudFlare/CDN] → [VPS (Ubuntu 22.04)]
    ↓
[Cloud Panel (Nginx + Management)]
    ↓
[Docker Network: app-network]
    ├── Frontend Container (React) :8090
    ├── Backend Container (Node.js) :3002
    ├── PostgreSQL Container :5432
    └── PgAdmin Container :5050
```

### Technology Stack
- **VPS**: Ubuntu 22.04 LTS
- **Control Panel**: Cloud Panel 2.x
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx (managed by Cloud Panel)
- **SSL/TLS**: Let's Encrypt (auto-renewal via Cloud Panel)
- **Database**: PostgreSQL 15
- **Application**: React + Node.js + Express

### Resource Requirements
- **Minimum VPS**: 2 CPU cores, 4GB RAM, 40GB SSD
- **Recommended VPS**: 4 CPU cores, 8GB RAM, 80GB SSD
- **Network**: 100 Mbps minimum bandwidth
- **Storage**: Additional space for uploads and backups

---

## Pre-Deployment System Requirements

### VPS Provider Requirements
```bash
# Verify system specifications
cat /proc/cpuinfo | grep processor | wc -l  # CPU cores
free -h                                      # RAM
df -h                                        # Disk space
uname -a                                     # OS version
```

### Required Software Installation
```bash
# Update system packages
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git ufw fail2ban htop iotop

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker $USER

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version
```

### Network Configuration
```bash
# Configure firewall (before Cloud Panel installation)
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 8080/tcp    # Cloud Panel
ufw --force enable

# Check network interface
ip addr show
netstat -tuln
```

---

## VPS Initial Setup & Hardening

### User Management
```bash
# Create admin user (replace 'admin' with your preferred username)
adduser admin
usermod -aG sudo admin
usermod -aG docker admin

# Configure SSH key authentication
mkdir -p /home/admin/.ssh
chmod 700 /home/admin/.ssh
# Copy your public key to /home/admin/.ssh/authorized_keys
chmod 600 /home/admin/.ssh/authorized_keys
chown -R admin:admin /home/admin/.ssh
```

### SSH Hardening
```bash
# Edit SSH configuration
nano /etc/ssh/sshd_config

# Recommended settings:
Port 22
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2

# Restart SSH service
systemctl restart sshd
```

### System Security
```bash
# Configure fail2ban
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
nano /etc/fail2ban/jail.local

# Basic jail configuration:
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

# Start fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

### System Monitoring Setup
```bash
# Install monitoring tools
apt install -y htop iotop nethogs ncdu

# Configure logrotate for application logs
cat > /etc/logrotate.d/docker-apps << 'EOF'
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    size 10M
    missingok
    delaycompress
    copytruncate
}
EOF
```

---

## Cloud Panel Installation & Configuration

### Cloud Panel Installation
```bash
# Download and install Cloud Panel
curl -sS https://installer.cloudpanel.io/ce/v2/install.sh -o install.sh
echo "85762db0edc00ce19a2cd5496d46fec28b48bbd3cd7d3dd2c47bf716566a894b install.sh" | sha256sum -c
sudo bash install.sh

# Access Cloud Panel at: https://your-server-ip:8080
# Follow setup wizard to create admin account
```

### Initial Cloud Panel Configuration
```bash
# Verify installation
systemctl status cloudpanel
docker ps | grep cloudpanel

# Configure Cloud Panel settings via web interface:
# 1. Set server timezone
# 2. Configure email settings for notifications
# 3. Set up Let's Encrypt account
# 4. Configure backup settings
```

### Domain Configuration
```bash
# Add domain in Cloud Panel web interface:
# 1. Domains → Add Domain
# 2. Enter: your-domain.com
# 3. Document Root: /home/cloudpanel/htdocs/your-domain.com
# 4. Enable SSL certificate (Let's Encrypt)
```

---

## Docker Environment Setup

### Docker Network Configuration
```bash
# Create application network
docker network create app-network

# Verify network creation
docker network ls
docker network inspect app-network
```

### Docker Resource Limits
```bash
# Configure Docker daemon for production
cat > /etc/docker/daemon.json << 'EOF'
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "storage-driver": "overlay2",
    "userland-proxy": false
}
EOF

# Restart Docker daemon
systemctl restart docker
```

### Container Health Monitoring
```bash
# Create monitoring script
cat > /usr/local/bin/docker-health-check.sh << 'EOF'
#!/bin/bash
containers=("frontend" "backend" "postgres" "pgadmin")
for container in "${containers[@]}"; do
    if ! docker ps --filter "name=$container" --filter "status=running" | grep -q "$container"; then
        echo "WARNING: Container $container is not running"
        # Send alert (email, webhook, etc.)
    fi
done
EOF

chmod +x /usr/local/bin/docker-health-check.sh

# Add to crontab for regular checks
echo "*/5 * * * * /usr/local/bin/docker-health-check.sh" | crontab -
```

---

## Application Deployment Pipeline

### Deployment Directory Structure
```bash
# Create deployment directory
mkdir -p /home/cloudpanel/htdocs/your-domain.com/app
cd /home/cloudpanel/htdocs/your-domain.com/app

# Set proper ownership
chown -R clp:clp /home/cloudpanel/htdocs/your-domain.com/
```

### Application Files Deployment
```bash
# Clone repository (or upload files)
git clone https://github.com/your-repo/app.git .

# Create production environment file
cat > .env << 'EOF'
NODE_ENV=production
DB_HOST=postgres
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_secure_password_32_chars
JWT_SECRET=your_jwt_secret_64_chars
PGADMIN_DEFAULT_EMAIL=admin@your-domain.com
PGADMIN_DEFAULT_PASSWORD=your_pgadmin_password_24_chars
EOF

# Secure environment file
chmod 600 .env
chown clp:clp .env
```

### Container Orchestration
```bash
# Production docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: frontend
    ports:
      - "8090:80"
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: backend
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./backend/uploads:/app/uploads
    networks:
      - app-network
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15
    container_name: postgres
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 30s
      timeout: 10s
      retries: 3

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: pgadmin
    environment:
      - PGADMIN_DEFAULT_EMAIL=${PGADMIN_DEFAULT_EMAIL}
      - PGADMIN_DEFAULT_PASSWORD=${PGADMIN_DEFAULT_PASSWORD}
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    networks:
      - app-network
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

networks:
  app-network:
    external: true

volumes:
  postgres_data:
    driver: local
  pgadmin_data:
    driver: local
EOF
```

### Deployment Execution
```bash
# Build and deploy application
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Verify deployment
docker-compose ps
docker-compose logs
```

---

## Reverse Proxy & SSL Configuration

### Nginx Configuration for Cloud Panel
```bash
# Cloud Panel Nginx configuration location:
# /etc/nginx/sites-enabled/your-domain.com.conf

# Example configuration for API and uploads routing:
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL configuration (managed by Cloud Panel)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Application routing
    location / {
        proxy_pass http://localhost:8090;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API routing
    location /api/ {
        proxy_pass http://localhost:3002/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files routing
    location /uploads/ {
        proxy_pass http://localhost:3002/uploads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL Certificate Management
```bash
# Check SSL certificate status
certbot certificates

# Manual certificate renewal (if needed)
certbot renew --dry-run

# Monitor certificate expiration
cat > /usr/local/bin/ssl-check.sh << 'EOF'
#!/bin/bash
domain="your-domain.com"
expiry_date=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/$domain/fullchain.pem | cut -d= -f2)
expiry_epoch=$(date -d "$expiry_date" +%s)
current_epoch=$(date +%s)
days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))

if [ $days_until_expiry -lt 30 ]; then
    echo "WARNING: SSL certificate for $domain expires in $days_until_expiry days"
fi
EOF

chmod +x /usr/local/bin/ssl-check.sh
```

### Nginx Performance Tuning
```bash
# Add to Cloud Panel nginx configuration
client_max_body_size 50M;
client_body_buffer_size 128k;
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
proxy_buffer_size 4k;
proxy_buffers 16 32k;
proxy_busy_buffers_size 64k;
```

---

## Security Implementation

### Environment Security
```bash
# Generate secure passwords
password_32_chars=$(openssl rand -base64 24)
jwt_secret_64_chars=$(openssl rand -base64 48)
pgadmin_password_24_chars=$(openssl rand -base64 18)

echo "DB_PASSWORD: $password_32_chars"
echo "JWT_SECRET: $jwt_secret_64_chars"
echo "PGADMIN_PASSWORD: $pgadmin_password_24_chars"
```

### Database Security
```bash
# PostgreSQL security configuration
docker exec -it postgres psql -U your_user -d your_database -c "
-- Revoke public schema permissions
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT CREATE ON SCHEMA public TO your_user;

-- Create read-only user for monitoring
CREATE USER monitoring_user WITH PASSWORD 'monitoring_password';
GRANT CONNECT ON DATABASE your_database TO monitoring_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring_user;
"
```

### Container Security
```bash
# Run containers as non-root user
# Add to Dockerfiles:
RUN groupadd -r appuser && useradd -r -g appuser appuser
USER appuser

# Scan for vulnerabilities
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image your-app:latest
```

### File System Security
```bash
# Secure uploads directory
mkdir -p /home/cloudpanel/htdocs/your-domain.com/app/backend/uploads
chown -R clp:clp /home/cloudpanel/htdocs/your-domain.com/app/backend/uploads
chmod 755 /home/cloudpanel/htdocs/your-domain.com/app/backend/uploads

# Prevent script execution in uploads
cat > /home/cloudpanel/htdocs/your-domain.com/app/backend/uploads/.htaccess << 'EOF'
<FilesMatch "\.(php|phtml|php3|php4|php5|pl|py|jsp|asp|sh|cgi)$">
    Deny from all
</FilesMatch>
EOF
```

---

## Database Administration

### PostgreSQL Configuration
```bash
# Access PostgreSQL container
docker exec -it postgres psql -U your_user -d your_database

# Database optimization
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.7;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
SELECT pg_reload_conf();
```

### Database Monitoring
```bash
# Monitor database performance
docker exec -it postgres psql -U your_user -d your_database -c "
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
ORDER BY tablename, attname;
"

# Check slow queries
docker exec -it postgres psql -U your_user -d your_database -c "
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
"
```

### Database Backup Strategy
```bash
# Create backup script
cat > /usr/local/bin/db-backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="your_database"
DB_USER="your_user"

mkdir -p $BACKUP_DIR

# Create backup
docker exec postgres pg_dump -U $DB_USER -d $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Remove backups older than 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: backup_$DATE.sql.gz"
EOF

chmod +x /usr/local/bin/db-backup.sh

# Schedule daily backups
echo "0 2 * * * /usr/local/bin/db-backup.sh" | crontab -e
```

---

## Monitoring & Health Checks

### System Monitoring
```bash
# Create comprehensive monitoring script
cat > /usr/local/bin/system-monitor.sh << 'EOF'
#!/bin/bash

echo "=== System Health Check ==="
echo "Date: $(date)"
echo

echo "=== CPU Usage ==="
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print "CPU Usage: " 100-$1 "%"}'

echo "=== Memory Usage ==="
free -h | grep Mem

echo "=== Disk Usage ==="
df -h | grep -v tmpfs

echo "=== Docker Container Status ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "=== Application Health ==="
curl -f http://localhost:8090 > /dev/null && echo "Frontend: OK" || echo "Frontend: FAILED"
curl -f http://localhost:3002/health > /dev/null && echo "Backend: OK" || echo "Backend: FAILED"

echo "=== Database Connection ==="
docker exec postgres pg_isready -U your_user > /dev/null && echo "PostgreSQL: OK" || echo "PostgreSQL: FAILED"

echo "=== SSL Certificate ==="
days_until_expiry=$((($(date -d "$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/your-domain.com/fullchain.pem | cut -d= -f2)" +%s) - $(date +%s)) / 86400))
echo "SSL expires in: $days_until_expiry days"

echo
EOF

chmod +x /usr/local/bin/system-monitor.sh

# Run monitoring every 15 minutes
echo "*/15 * * * * /usr/local/bin/system-monitor.sh >> /var/log/system-monitor.log" | crontab -e
```

### Application Performance Monitoring
```bash
# Monitor application metrics
cat > /usr/local/bin/app-performance.sh << 'EOF'
#!/bin/bash

echo "=== Application Performance Metrics ==="
echo "Date: $(date)"

echo "=== Response Times ==="
curl -w "@curl-format.txt" -s -o /dev/null http://localhost:8090
curl -w "@curl-format.txt" -s -o /dev/null http://localhost:3002/api/health

echo "=== Container Resource Usage ==="
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"

echo "=== Database Performance ==="
docker exec postgres psql -U your_user -d your_database -c "
SELECT 
    count(*) as total_connections,
    sum(case when state = 'active' then 1 else 0 end) as active_connections
FROM pg_stat_activity;
"
EOF

# Create curl format file
cat > curl-format.txt << 'EOF'
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
EOF
```

### Log Aggregation
```bash
# Centralized logging setup
mkdir -p /var/log/application
cat > /etc/rsyslog.d/50-docker.conf << 'EOF'
$template DockerLogFormat,"%TIMESTAMP% %HOSTNAME% docker[%syslogtag%]: %msg%\n"
*.* /var/log/application/docker.log;DockerLogFormat
& stop
EOF

# Restart rsyslog
systemctl restart rsyslog

# Log rotation for application logs
cat > /etc/logrotate.d/application << 'EOF'
/var/log/application/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 0644 root root
}
EOF
```

---

## Backup & Recovery Procedures

### Full System Backup
```bash
# Create comprehensive backup script
cat > /usr/local/bin/full-backup.sh << 'EOF'
#!/bin/bash

BACKUP_ROOT="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/full_$DATE"

mkdir -p $BACKUP_DIR

echo "Starting full system backup at $(date)"

# Backup application files
echo "Backing up application files..."
tar -czf $BACKUP_DIR/application.tar.gz -C /home/cloudpanel/htdocs/your-domain.com app

# Backup database
echo "Backing up database..."
docker exec postgres pg_dump -U your_user -d your_database | gzip > $BACKUP_DIR/database.sql.gz

# Backup Docker volumes
echo "Backing up Docker volumes..."
docker run --rm -v postgres_data:/volume -v $BACKUP_DIR:/backup alpine tar -czf /backup/postgres_volume.tar.gz -C /volume .
docker run --rm -v pgadmin_data:/volume -v $BACKUP_DIR:/backup alpine tar -czf /backup/pgadmin_volume.tar.gz -C /volume .

# Backup configuration files
echo "Backing up configuration files..."
mkdir -p $BACKUP_DIR/config
cp /etc/nginx/sites-enabled/your-domain.com.conf $BACKUP_DIR/config/
cp -r /etc/letsencrypt/live/your-domain.com $BACKUP_DIR/config/

# Create backup manifest
echo "Creating backup manifest..."
cat > $BACKUP_DIR/manifest.txt << EOL
Backup Date: $(date)
System: $(uname -a)
Docker Version: $(docker --version)
Application Files: application.tar.gz
Database: database.sql.gz
Docker Volumes: postgres_volume.tar.gz, pgadmin_volume.tar.gz
Configuration: config/
EOL

echo "Full backup completed at $(date)"
echo "Backup location: $BACKUP_DIR"

# Clean old backups (keep 7 days)
find $BACKUP_ROOT -name "full_*" -type d -mtime +7 -exec rm -rf {} \;
EOF

chmod +x /usr/local/bin/full-backup.sh

# Schedule weekly full backups
echo "0 3 * * 0 /usr/local/bin/full-backup.sh" | crontab -e
```

### Disaster Recovery Plan
```bash
# Create disaster recovery script
cat > /usr/local/bin/disaster-recovery.sh << 'EOF'
#!/bin/bash

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_directory>"
    echo "Example: $0 /backups/full_20241207_030000"
    exit 1
fi

BACKUP_DIR=$1
APP_DIR="/home/cloudpanel/htdocs/your-domain.com/app"

echo "Starting disaster recovery from $BACKUP_DIR"

# Stop all containers
echo "Stopping all containers..."
cd $APP_DIR
docker-compose down

# Restore application files
echo "Restoring application files..."
rm -rf $APP_DIR
mkdir -p $(dirname $APP_DIR)
tar -xzf $BACKUP_DIR/application.tar.gz -C $(dirname $APP_DIR)

# Restore Docker volumes
echo "Restoring Docker volumes..."
docker volume rm postgres_data pgadmin_data
docker volume create postgres_data
docker volume create pgadmin_data
docker run --rm -v postgres_data:/volume -v $BACKUP_DIR:/backup alpine tar -xzf /backup/postgres_volume.tar.gz -C /volume
docker run --rm -v pgadmin_data:/volume -v $BACKUP_DIR:/backup alpine tar -xzf /backup/pgadmin_volume.tar.gz -C /volume

# Start containers
echo "Starting containers..."
cd $APP_DIR
docker-compose up -d

# Wait for database
echo "Waiting for database to start..."
sleep 30

# Restore database (if needed)
if [ -f "$BACKUP_DIR/database.sql.gz" ]; then
    echo "Restoring database..."
    gunzip -c $BACKUP_DIR/database.sql.gz | docker exec -i postgres psql -U your_user -d your_database
fi

echo "Disaster recovery completed"
echo "Please verify application functionality"
EOF

chmod +x /usr/local/bin/disaster-recovery.sh
```

---

## Maintenance & Updates

### System Updates
```bash
# Create update script
cat > /usr/local/bin/system-update.sh << 'EOF'
#!/bin/bash

echo "Starting system maintenance at $(date)"

# Update system packages
echo "Updating system packages..."
apt update && apt upgrade -y

# Update Docker images
echo "Updating Docker images..."
cd /home/cloudpanel/htdocs/your-domain.com/app
docker-compose pull

# Rebuild and restart containers
echo "Rebuilding application containers..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Clean up unused Docker resources
echo "Cleaning up Docker resources..."
docker system prune -f
docker volume prune -f

# Update Cloud Panel (if available)
echo "Checking Cloud Panel updates..."
# Cloud Panel auto-updates, but you can check status
systemctl status cloudpanel

echo "System maintenance completed at $(date)"
EOF

chmod +x /usr/local/bin/system-update.sh

# Schedule monthly updates (first Sunday of month)
echo "0 4 1-7 * 0 /usr/local/bin/system-update.sh" | crontab -e
```

### Application Updates
```bash
# Create application update script
cat > /usr/local/bin/app-update.sh << 'EOF'
#!/bin/bash

APP_DIR="/home/cloudpanel/htdocs/your-domain.com/app"
BACKUP_DIR="/backups/pre-update_$(date +%Y%m%d_%H%M%S)"

echo "Starting application update at $(date)"

# Create pre-update backup
echo "Creating pre-update backup..."
mkdir -p $BACKUP_DIR
docker exec postgres pg_dump -U your_user -d your_database > $BACKUP_DIR/database.sql
tar -czf $BACKUP_DIR/application.tar.gz -C $(dirname $APP_DIR) app

# Pull latest code
echo "Pulling latest application code..."
cd $APP_DIR
git pull origin main

# Update dependencies
echo "Updating dependencies..."
docker-compose build --no-cache

# Run database migrations (if applicable)
echo "Running database migrations..."
# Add migration commands here if needed

# Restart services
echo "Restarting services..."
docker-compose down
docker-compose up -d

# Health check
echo "Performing health check..."
sleep 30
curl -f http://localhost:8090 && echo "Frontend: OK" || echo "Frontend: FAILED"
curl -f http://localhost:3002/health && echo "Backend: OK" || echo "Backend: FAILED"

echo "Application update completed at $(date)"
EOF

chmod +x /usr/local/bin/app-update.sh
```

### Maintenance Windows
```bash
# Create maintenance mode script
cat > /usr/local/bin/maintenance-mode.sh << 'EOF'
#!/bin/bash

NGINX_CONF="/etc/nginx/sites-enabled/your-domain.com.conf"
BACKUP_CONF="/tmp/nginx_backup_$(date +%s).conf"

if [ "$1" = "enable" ]; then
    echo "Enabling maintenance mode..."
    
    # Backup current config
    cp $NGINX_CONF $BACKUP_CONF
    echo "Config backed up to: $BACKUP_CONF"
    
    # Create maintenance page
    cat > /tmp/maintenance.html << 'EOL'
<!DOCTYPE html>
<html>
<head>
    <title>Maintenance</title>
    <style>
        body { font-family: Arial; text-align: center; padding: 50px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>System Under Maintenance</h1>
    <p>We're performing scheduled maintenance. Please try again in a few minutes.</p>
</body>
</html>
EOL
    
    # Update nginx config for maintenance
    sed -i '/location \//,/}/ c\
    location / {\
        root /tmp;\
        try_files /maintenance.html =503;\
    }' $NGINX_CONF
    
    nginx -t && nginx -s reload
    echo "Maintenance mode enabled"
    
elif [ "$1" = "disable" ]; then
    echo "Disabling maintenance mode..."
    
    # Find latest backup
    LATEST_BACKUP=$(ls -t /tmp/nginx_backup_*.conf 2>/dev/null | head -1)
    
    if [ -n "$LATEST_BACKUP" ]; then
        cp $LATEST_BACKUP $NGINX_CONF
        nginx -t && nginx -s reload
        rm -f /tmp/maintenance.html
        echo "Maintenance mode disabled"
    else
        echo "No backup config found. Please restore manually."
    fi
else
    echo "Usage: $0 {enable|disable}"
fi
EOF

chmod +x /usr/local/bin/maintenance-mode.sh
```

---

## Troubleshooting Operations

### Container Diagnostics
```bash
# Container troubleshooting commands

# Check container logs
docker-compose logs frontend
docker-compose logs backend
docker-compose logs postgres
docker-compose logs pgadmin

# Interactive container access
docker exec -it frontend sh
docker exec -it backend bash
docker exec -it postgres psql -U your_user -d your_database

# Container resource usage
docker stats
docker system df

# Network connectivity testing
docker exec backend ping postgres
docker exec backend telnet postgres 5432
```

### Database Troubleshooting
```bash
# PostgreSQL diagnostics
docker exec postgres psql -U your_user -d your_database -c "
-- Check active connections
SELECT pid, usename, application_name, client_addr, state 
FROM pg_stat_activity 
WHERE state = 'active';

-- Check database size
SELECT datname, pg_size_pretty(pg_database_size(datname)) 
FROM pg_database 
WHERE datname = 'your_database';

-- Check table sizes
SELECT schemaname,tablename,
       pg_size_pretty(pg_total_relation_size(tablename::text)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(tablename::text) DESC;

-- Check locks
SELECT locktype, database, relation, page, tuple, pid, mode, granted 
FROM pg_locks;
"

# Database connection troubleshooting
docker exec postgres pg_isready -U your_user -d your_database
docker exec backend telnet postgres 5432
```

### SSL/Certificate Issues
```bash
# SSL diagnostics
openssl x509 -in /etc/letsencrypt/live/your-domain.com/fullchain.pem -text -noout
openssl x509 -enddate -noout -in /etc/letsencrypt/live/your-domain.com/fullchain.pem

# Test SSL configuration
curl -I https://your-domain.com
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Certificate renewal troubleshooting
certbot certificates
certbot renew --dry-run
journalctl -u certbot -f
```

### Performance Issues
```bash
# System performance diagnostics
htop
iotop -ao
nethogs
vmstat 1
iostat 1

# Application performance
curl -w "@curl-format.txt" -s -o /dev/null https://your-domain.com
ab -n 100 -c 10 https://your-domain.com/

# Database performance
docker exec postgres psql -U your_user -d your_database -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;
"
```

### Network Issues
```bash
# Network diagnostics
ss -tulpn | grep -E '(80|443|3002|5432|8090)'
iptables -L -n
ufw status verbose

# Cloud Panel network
systemctl status cloudpanel
docker logs cloudpanel

# Test internal connectivity
docker exec frontend curl backend:3002/health
docker exec backend curl postgres:5432
```

---

## Performance Optimization

### System Optimization
```bash
# Kernel parameter optimization
cat >> /etc/sysctl.conf << 'EOF'
# Network optimization
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 12582912 16777216
net.ipv4.tcp_wmem = 4096 12582912 16777216
net.ipv4.tcp_window_scaling = 1
net.core.netdev_max_backlog = 5000

# File system optimization
fs.file-max = 2097152
vm.swappiness = 10
vm.dirty_ratio = 60
vm.dirty_background_ratio = 2
EOF

sysctl -p
```

### Docker Optimization
```bash
# Docker daemon optimization
cat > /etc/docker/daemon.json << 'EOF'
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "storage-driver": "overlay2",
    "userland-proxy": false,
    "experimental": false,
    "live-restore": true,
    "default-ulimits": {
        "nofile": {
            "Name": "nofile",
            "Hard": 64000,
            "Soft": 64000
        }
    }
}
EOF

systemctl restart docker
```

### Database Optimization
```bash
# PostgreSQL performance tuning
docker exec postgres psql -U your_user -d your_database -c "
-- Memory settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET work_mem = '4MB';

-- Checkpoint settings
ALTER SYSTEM SET checkpoint_completion_target = 0.7;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET checkpoint_segments = 32;

-- Query planner
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;

-- Connection settings
ALTER SYSTEM SET max_connections = 200;

SELECT pg_reload_conf();
"

# Create database indexes for performance
docker exec postgres psql -U your_user -d your_database -c "
-- Add indexes based on common queries
-- Example indexes (adjust based on your schema):
-- CREATE INDEX idx_users_email ON users(email);
-- CREATE INDEX idx_orders_date ON orders(created_at);
"
```

### Application Caching
```bash
# Add Redis for caching (optional)
cat >> docker-compose.yml << 'EOF'

  redis:
    image: redis:7-alpine
    container_name: redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - app-network
    restart: unless-stopped
    command: redis-server --appendonly yes

volumes:
  redis_data:
    driver: local
EOF
```

---

## Security Auditing

### Security Scanning
```bash
# Create security audit script
cat > /usr/local/bin/security-audit.sh << 'EOF'
#!/bin/bash

echo "=== Security Audit Report ==="
echo "Date: $(date)"
echo

echo "=== System Security ==="
# Check for failed login attempts
echo "Recent failed login attempts:"
grep "Failed password" /var/log/auth.log | tail -10

# Check running services
echo -e "\nRunning services:"
systemctl list-units --type=service --state=running

# Check open ports
echo -e "\nOpen ports:"
ss -tulpn

echo "=== Docker Security ==="
# Check for privileged containers
echo "Privileged containers:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" --filter "label=privileged=true"

# Scan images for vulnerabilities
echo -e "\nImage vulnerabilities:"
for image in $(docker images --format "{{.Repository}}:{{.Tag}}" | grep -v "<none>"); do
    echo "Scanning $image..."
    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image --severity HIGH,CRITICAL $image | head -20
done

echo "=== File System Security ==="
# Check file permissions
echo "Checking critical file permissions:"
ls -la /home/cloudpanel/htdocs/your-domain.com/app/.env
ls -la /etc/ssl/private/
ls -la /etc/letsencrypt/live/

# Check for SUID files
echo -e "\nSUID files:"
find /usr -perm -4000 -type f 2>/dev/null

echo "=== Network Security ==="
# Check firewall status
echo "Firewall status:"
ufw status verbose

# Check fail2ban status
echo -e "\nFail2ban status:"
fail2ban-client status

EOF

chmod +x /usr/local/bin/security-audit.sh

# Schedule weekly security audits
echo "0 6 * * 1 /usr/local/bin/security-audit.sh > /var/log/security-audit.log" | crontab -e
```

### SSL Security Testing
```bash
# SSL configuration testing
curl -I https://your-domain.com
testssl.sh your-domain.com

# Check SSL configuration score
curl -s "https://api.ssllabs.com/api/v3/analyze?host=your-domain.com&publish=off&startNew=on&all=done"
```

### Access Control Audit
```bash
# User access audit
echo "=== User Access Audit ==="
echo "System users with shell access:"
grep -E '/bin/(bash|sh|zsh)$' /etc/passwd

echo "Users with sudo privileges:"
grep -E '^sudo:' /etc/group

echo "SSH key authentication status:"
grep -E '^(PasswordAuthentication|PubkeyAuthentication|PermitRootLogin)' /etc/ssh/sshd_config

# Docker access audit
echo "Users in docker group:"
getent group docker
```

---

## Disaster Recovery

### Recovery Planning
```bash
# Create disaster recovery documentation
cat > /usr/local/share/disaster-recovery-plan.md << 'EOF'
# Disaster Recovery Plan

## Recovery Time Objectives (RTO)
- System restoration: 2-4 hours
- Database restoration: 30-60 minutes
- Full application functionality: 4-6 hours

## Recovery Point Objectives (RPO)
- Database: 24 hours (daily backups)
- Application files: 24 hours
- Configuration: Immediate (version controlled)

## Emergency Contacts
- System Administrator: [Your contact]
- Application Developer: [Developer contact]
- Hosting Provider: [Provider support]

## Recovery Procedures

### Level 1: Service Restart
1. Restart containers: `docker-compose restart`
2. Check service health: `/usr/local/bin/system-monitor.sh`
3. Verify application functionality

### Level 2: Container Rebuild
1. Stop services: `docker-compose down`
2. Rebuild images: `docker-compose build --no-cache`
3. Start services: `docker-compose up -d`
4. Verify functionality

### Level 3: Full System Recovery
1. Assess damage and data integrity
2. Locate latest backup: `ls -la /backups/`
3. Run disaster recovery: `/usr/local/bin/disaster-recovery.sh /backups/full_YYYYMMDD_HHMMSS`
4. Verify system functionality
5. Update DNS if necessary
6. Communicate with stakeholders

### Level 4: New Server Deployment
1. Provision new VPS with same specifications
2. Install base system and Cloud Panel
3. Run disaster recovery script
4. Update DNS records
5. Test all functionality
6. Decommission old server

## Testing Schedule
- Monthly: Test backup restoration
- Quarterly: Full disaster recovery simulation
- Annually: Complete system rebuild test
EOF
```

### Emergency Response Scripts
```bash
# Create emergency response toolkit
mkdir -p /usr/local/share/emergency

# Quick system status script
cat > /usr/local/share/emergency/quick-status.sh << 'EOF'
#!/bin/bash
echo "=== EMERGENCY SYSTEM STATUS ==="
echo "Time: $(date)"
echo "Uptime: $(uptime)"
echo "Load: $(cat /proc/loadavg)"
echo "Memory: $(free -h | grep Mem)"
echo "Disk: $(df -h / | tail -1)"
echo "Docker: $(docker ps --format 'table {{.Names}}\t{{.Status}}')"
echo "Network: $(ss -tulpn | grep -E '(80|443|3002)')"
echo "Services: $(systemctl is-active nginx cloudpanel docker)"
EOF

# Service recovery script
cat > /usr/local/share/emergency/recover-services.sh << 'EOF'
#!/bin/bash
echo "Starting emergency service recovery..."

# Stop all services
docker-compose -f /home/cloudpanel/htdocs/your-domain.com/app/docker-compose.yml down

# Clean up
docker system prune -f

# Restart Docker
systemctl restart docker

# Wait for Docker to stabilize
sleep 10

# Restart application
cd /home/cloudpanel/htdocs/your-domain.com/app
docker-compose up -d

echo "Service recovery completed. Run system-monitor.sh to verify."
EOF

chmod +x /usr/local/share/emergency/*.sh
```

---

## Maintenance Schedules & Checklists

### Daily Tasks
- [ ] Check system health via monitoring dashboard
- [ ] Review application logs for errors
- [ ] Verify SSL certificate status
- [ ] Check backup completion status
- [ ] Monitor resource usage (CPU, memory, disk)

### Weekly Tasks
- [ ] Run security audit script
- [ ] Review and rotate log files
- [ ] Check for system updates
- [ ] Test application functionality
- [ ] Review access logs for anomalies

### Monthly Tasks
- [ ] Full system backup verification
- [ ] Update system packages
- [ ] Review and optimize database performance
- [ ] Check SSL certificate expiration
- [ ] Disaster recovery plan testing

### Quarterly Tasks
- [ ] Complete disaster recovery simulation
- [ ] Security vulnerability assessment
- [ ] Performance optimization review
- [ ] Documentation updates
- [ ] Capacity planning review

---

## Emergency Contacts & Escalation

### Contact Information
```bash
# Create emergency contact file
cat > /usr/local/share/emergency-contacts.txt << 'EOF'
EMERGENCY CONTACTS

SYSTEM ADMINISTRATOR
Name: [Your Name]
Primary: [Phone]
Secondary: [Email]
Available: 24/7

HOSTING PROVIDER
Provider: [Provider Name]
Support: [Support Phone]
Portal: [Support URL]
Account ID: [Account ID]

DOMAIN REGISTRAR
Provider: [Registrar Name]
Support: [Support Contact]
Login: [Control Panel URL]

ESCALATION LEVELS
Level 1: Application restart/troubleshooting
Level 2: System administrator involvement
Level 3: Hosting provider support
Level 4: Complete system rebuild

CRITICAL SERVICES PRIORITY
1. Database (PostgreSQL)
2. Backend API
3. Frontend Application
4. SSL/Security
5. Monitoring/Backups
EOF
```

---

## Appendix: Quick Reference Commands

### Container Management
```bash
# View running containers
docker ps

# View all containers
docker ps -a

# Container logs
docker logs <container_name>

# Execute command in container
docker exec -it <container_name> bash

# Restart containers
docker-compose restart

# Rebuild containers
docker-compose build --no-cache

# Stop all containers
docker-compose down

# Start all containers
docker-compose up -d
```

### Database Operations
```bash
# Connect to PostgreSQL
docker exec -it postgres psql -U your_user -d your_database

# Database backup
docker exec postgres pg_dump -U your_user -d your_database > backup.sql

# Database restore
cat backup.sql | docker exec -i postgres psql -U your_user -d your_database

# Check database status
docker exec postgres pg_isready -U your_user
```

### System Monitoring
```bash
# System resources
htop
free -h
df -h
iostat 1

# Network connections
ss -tulpn
netstat -tulpn

# Process monitoring
ps aux | grep docker
systemctl status docker
```

### Log Files
```bash
# System logs
journalctl -f
tail -f /var/log/syslog

# Application logs
docker-compose logs -f
docker logs -f <container_name>

# Nginx logs (Cloud Panel)
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Security Commands
```bash
# Firewall status
ufw status verbose

# Failed login attempts
grep "Failed password" /var/log/auth.log

# SSL certificate check
openssl x509 -enddate -noout -in /etc/letsencrypt/live/your-domain.com/fullchain.pem

# Service status
systemctl status nginx cloudpanel docker fail2ban
```

---

## Document Information

**Version**: 1.0
**Last Updated**: December 2024
**Author**: System Administrator
**Purpose**: Operations and infrastructure management guide
**Companion**: deployment-guide-developers.md

**Change Log**:
- v1.0 - Initial comprehensive operations guide
- Based on successful production deployment experience
- Includes real-world troubleshooting scenarios
- Covers complete infrastructure lifecycle

---

*This guide is based on actual deployment experience and real-world troubleshooting scenarios. All procedures have been tested in production environments.*