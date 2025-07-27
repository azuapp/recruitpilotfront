# RecruitPro - Local Development Setup Guide

This guide provides step-by-step instructions to run the RecruitPro AI-powered recruitment platform locally on your machine.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **PostgreSQL** (v13 or higher) - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/)

## 1. Clone the Repository

```bash
git clone <your-repository-url>
cd recruitpro
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Database Setup

### Option A: Local PostgreSQL Setup

1. **Create a new database:**
```sql
CREATE DATABASE recruitpro_dev;
CREATE USER recruitpro_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE recruitpro_dev TO recruitpro_user;
```

2. **Get your database URL:**
```
postgresql://recruitpro_user:your_password@localhost:5432/recruitpro_dev
```

### Option B: Use Neon Database (Recommended)

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string

## 4. Environment Configuration

1. **Copy the environment template:**
```bash
cp .env.example .env
```

2. **Edit the `.env` file with your settings:**
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/recruitpro_dev

# Session Security
SESSION_SECRET=your-super-secret-session-key-here-change-this

# OpenAI Configuration (Required for AI features)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Email Configuration (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password

# Replit Configuration (for deployment)
REPL_ID=your-repl-id
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=your-domain.replit.app
```

## 5. Required API Keys & Services

### OpenAI API Key (Required)
1. Go to [OpenAI API](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Generate a new API key
4. Add it to your `.env` file as `OPENAI_API_KEY`

### Gmail SMTP Setup (For Email Features)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use this app password in `SMTP_PASS`

## 6. Database Migration

Run the database migration to create all required tables:

```bash
npm run db:push
```

## 7. Create Admin User

Create the initial admin user:

```bash
npm run create-admin
```

This creates an admin user with:
- **Email:** admin@recruitpro.com
- **Password:** admin123

## 8. Start the Development Server

```bash
npm run dev
```

This command starts both:
- Frontend (React + Vite) on port 5173
- Backend (Express.js) on port 3000
- Combined service accessible at http://localhost:5173

## 9. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

### Login Credentials:
- **Email:** admin@recruitpro.com
- **Password:** admin123

## 10. Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Database
npm run db:push         # Push schema changes to database
npm run db:studio       # Open Drizzle Studio (database GUI)
npm run create-admin    # Create admin user

# Testing
npm run test            # Run test scenarios
```

## 11. Project Structure

```
recruitpro/
├── client/             # React frontend
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── pages/      # Application pages
│   │   ├── hooks/      # Custom React hooks
│   │   └── lib/        # Utilities and configuration
├── server/             # Express.js backend
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── controllers/    # Request handlers
│   └── utils/          # Server utilities
├── shared/             # Shared TypeScript schemas
├── uploads/            # CV file storage
└── dist/               # Production build output
```

## 12. Features Available Locally

✅ **Core Features:**
- User authentication and management
- Candidate application form with CV upload
- AI-powered resume analysis using OpenAI GPT-4o
- Interview scheduling system
- Email communication system
- Bilingual support (Arabic/English)
- Admin dashboard with analytics

✅ **AI Features:**
- Resume parsing and analysis
- Job fit scoring
- Skill extraction
- Assessment generation

✅ **Communication:**
- Email templates and sending
- Interview scheduling
- Candidate notifications

## 13. Common Issues & Solutions

### Database Connection Issues
```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Restart PostgreSQL
sudo service postgresql restart
```

### Port Already in Use
```bash
# Kill process on port 5173
npx kill-port 5173

# Kill process on port 3000
npx kill-port 3000
```

### OpenAI API Errors
- Ensure you have a valid API key with credits
- Check if your organization has access to GPT-4o model

### Email Not Sending
- Verify Gmail app password is correct
- Ensure 2-factor authentication is enabled
- Check SMTP settings in `.env` file

## 14. Production Deployment

For production deployment on Replit or other platforms:

1. **Update environment variables for production**
2. **Build the application:**
```bash
npm run build
```

3. **The application serves from the `dist/` directory**

## 15. Development Tips

- **Hot Reload:** Changes to frontend code auto-refresh the browser
- **API Changes:** Backend changes auto-restart the server
- **Database Changes:** Run `npm run db:push` after schema modifications
- **Logs:** Check console for detailed error messages
- **File Uploads:** CVs are stored in the `uploads/` directory

## 16. Support

If you encounter issues:

1. Check the browser console for frontend errors
2. Check the terminal for backend errors
3. Verify all environment variables are set correctly
4. Ensure all required services (PostgreSQL, OpenAI) are accessible

---

**Note:** This is a development setup. For production, additional security measures, environment-specific configurations, and deployment optimizations should be implemented.