# RecruitPro - Ubuntu VPS Deployment Guide

## Prerequisites
- Ubuntu VPS (18.04 or later)
- Root or sudo access
- Domain name (optional but recommended)
- Basic SSH knowledge

## Step 1: Server Preparation

### Connect to your VPS
```bash
ssh root@your-server-ip
# or
ssh your-username@your-server-ip
```

### Update system packages
```bash
sudo apt update && sudo apt upgrade -y
```

### Install essential packages
```bash
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx
```

## Step 2: Install Node.js

### Install Node.js 20 (LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Verify installation
```bash
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

## Step 3: Install PostgreSQL

### Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
```

### Setup PostgreSQL
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell, create database and user
CREATE DATABASE recruitpro;
CREATE USER recruitpro_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE recruitpro TO recruitpro_user;
\q
```

### Enable PostgreSQL service
```bash
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

## Step 4: Deploy Application

### Create application directory
```bash
sudo mkdir -p /var/www/recruitpro
sudo chown $USER:$USER /var/www/recruitpro
cd /var/www/recruitpro
```

### Clone your project (or upload files)
```bash
# Option 1: If using Git
git clone https://github.com/your-username/recruitpro.git .

# Option 2: Upload files using SCP from your local machine
# scp -r /path/to/your/project/* root@your-server-ip:/var/www/recruitpro/
```

### Install dependencies
```bash
npm install
```

### Create production environment file
```bash
cp .env.example .env
nano .env
```

Configure your `.env` file:
```env
# Database Configuration
DATABASE_URL=postgresql://recruitpro_user:your_secure_password@localhost:5432/recruitpro

# Authentication
SESSION_SECRET=your-super-secure-session-key-change-this

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# Server Configuration
PORT=3000
NODE_ENV=production
```

### Setup database schema
```bash
npm run db:push
```

### Build application
```bash
npm run build
```

### Create admin user
```bash
npm run create-admin
```

## Step 5: Setup Process Manager (PM2)

### Install PM2 globally
```bash
sudo npm install -g pm2
```

### Create PM2 ecosystem file
```bash
nano ecosystem.config.js
```

Add this configuration:
```javascript
module.exports = {
  apps: [{
    name: 'recruitpro',
    script: 'dist/index.js',
    cwd: '/var/www/recruitpro',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/pm2/recruitpro-error.log',
    out_file: '/var/log/pm2/recruitpro-out.log',
    log_file: '/var/log/pm2/recruitpro.log'
  }]
};
```

### Start application with PM2
```bash
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Start application
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions shown by this command
```

## Step 6: Configure Nginx

### Create Nginx configuration
```bash
sudo nano /etc/nginx/sites-available/recruitpro
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # File upload size limit
    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

### Enable the site
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/recruitpro /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 7: Setup SSL Certificate (Recommended)

### Install SSL certificate with Certbot
```bash
# Replace your-domain.com with your actual domain
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Setup automatic renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab for automatic renewal
sudo crontab -e

# Add this line to run renewal check twice daily
0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 8: Setup Firewall

### Configure UFW firewall
```bash
# Enable firewall
sudo ufw enable

# Allow SSH (important - don't lock yourself out!)
sudo ufw allow ssh
sudo ufw allow 22

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Check status
sudo ufw status
```

## Step 9: Monitoring and Maintenance

### Check application status
```bash
# PM2 status
pm2 status
pm2 logs recruitpro

# Nginx status
sudo systemctl status nginx

# PostgreSQL status
sudo systemctl status postgresql
```

### Application logs
```bash
# View application logs
pm2 logs recruitpro

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart services
```bash
# Restart application
pm2 restart recruitpro

# Restart Nginx
sudo systemctl restart nginx

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## Step 10: Backup Strategy

### Database backup script
```bash
# Create backup directory
sudo mkdir -p /var/backups/recruitpro

# Create backup script
sudo nano /usr/local/bin/backup-recruitpro.sh
```

Add this script:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/recruitpro"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="recruitpro"
DB_USER="recruitpro_user"

# Create database backup
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete

echo "Backup completed: db_backup_$DATE.sql"
```

### Make script executable and schedule
```bash
sudo chmod +x /usr/local/bin/backup-recruitpro.sh

# Add to crontab for daily backup at 2 AM
sudo crontab -e

# Add this line
0 2 * * * /usr/local/bin/backup-recruitpro.sh
```

## Troubleshooting

### Common Issues

1. **Application not starting**
   ```bash
   pm2 logs recruitpro
   # Check for environment variable issues or database connection problems
   ```

2. **Database connection failed**
   ```bash
   # Check PostgreSQL is running
   sudo systemctl status postgresql
   
   # Check database credentials in .env file
   # Verify database and user exist
   ```

3. **File upload issues**
   ```bash
   # Check file permissions
   ls -la /var/www/recruitpro/uploads/
   
   # Fix permissions if needed
   sudo chown -R $USER:$USER /var/www/recruitpro/uploads/
   ```

4. **Email not sending**
   ```bash
   # Check SMTP credentials in .env
   # Verify Gmail app password is correct
   # Check firewall allows outbound SMTP (port 587)
   ```

## Security Best Practices

1. **Regular updates**
   ```bash
   sudo apt update && sudo apt upgrade -y
   npm update
   ```

2. **Monitor logs regularly**
   ```bash
   pm2 logs
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Change default passwords**
   - Change admin password from default
   - Use strong database passwords
   - Generate secure SESSION_SECRET

4. **Backup regularly**
   - Test backup restoration
   - Store backups offsite

## Performance Optimization

1. **Enable Nginx gzip compression**
   ```bash
   sudo nano /etc/nginx/nginx.conf
   # Uncomment gzip settings
   ```

2. **Monitor resource usage**
   ```bash
   htop
   pm2 monit
   ```

3. **Database optimization**
   ```bash
   # Monitor database performance
   sudo -u postgres psql recruitpro -c "SELECT * FROM pg_stat_activity;"
   ```

Your RecruitPro application is now successfully deployed on Ubuntu VPS! 

Access your application at: `https://your-domain.com`
Admin panel: `https://your-domain.com` (login with admin credentials)