# Production Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Environment Setup
```bash
# Clone the repository
git clone https://github.com/azuapp/recruitpilotfront.git
cd recruitpilotfront

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your production values
```

### 2. Database Setup
```bash
# Push database schema
npm run db:push

# Create admin user
npm run create-admin
```

### 3. Production Build & Start
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔧 Environment Variables

Required for production:
```env
DATABASE_URL=postgresql://username:password@host:5432/database
SESSION_SECRET=your-secure-session-secret-32-chars-minimum
NODE_ENV=production
PORT=5001
```

Optional but recommended:
```env
OPENAI_API_KEY=sk-your-key-for-ai-features
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password
```

## 🛡️ Security Features Enabled

- ✅ Rate limiting (100 req/15min general, 5 req/15min auth)
- ✅ XSS protection with input sanitization
- ✅ SQL injection prevention
- ✅ CSRF protection via CORS
- ✅ Security headers (Helmet.js)
- ✅ File upload validation (PDF only, 10MB max)
- ✅ Authentication with bcrypt

## 📋 Production Checklist

- [ ] Database configured and accessible
- [ ] Environment variables set
- [ ] SSL/TLS certificates configured
- [ ] Reverse proxy setup (nginx/apache)
- [ ] Process manager setup (PM2/systemd)
- [ ] Monitoring and logging configured
- [ ] Backup strategy implemented
- [ ] Domain and DNS configured

## 🔍 Health Check

Test your deployment:
```bash
curl http://your-domain/api/candidates
```

Should return JSON array of candidates.

## 📞 Support

For deployment issues, check:
1. Database connectivity
2. Environment variables
3. Port availability
4. File permissions for uploads directory
