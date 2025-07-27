# RecruitPro - AI-Powered Recruitment Platform

A comprehensive recruitment automation system that streamlines the hiring process through intelligent resume analysis, automated assessments, and candidate management.

## 🚀 Features

### Core Functionality
- **Public Application Form**: Candidates can submit applications with CV uploads
- **AI Resume Analysis**: Automated resume parsing and scoring using OpenAI GPT-4o
- **Admin Dashboard**: Complete candidate management interface
- **Email Automation**: Confirmation emails and communication tracking
- **Interview Scheduling**: Built-in interview management system
- **User Management**: Role-based access control for administrators

### Technical Highlights
- **Bilingual Support**: Full Arabic/English localization
- **PDF Text Extraction**: Intelligent PDF parsing for resume analysis
- **Real-time Analytics**: Dashboard with recruitment metrics
- **Secure Authentication**: Session-based admin authentication
- **File Management**: Secure CV upload and download system

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** with shadcn/ui components
- **TanStack Query** for state management
- **Wouter** for client-side routing
- **React Hook Form** with Zod validation

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **OpenAI GPT-4o** for resume analysis
- **Multer** for file uploads
- **Passport.js** for authentication
- **Nodemailer** for email sending

### Infrastructure
- **Neon Database** for PostgreSQL hosting
- **Replit** deployment platform
- **Environment-based configuration**

## 📋 Prerequisites

Before running the application, ensure you have:

1. **Node.js** (v18 or higher)
2. **PostgreSQL** database
3. **OpenAI API key**
4. **SMTP credentials** (optional, for emails)

## 🚀 Quick Start

### 1. Environment Setup

Copy the environment template and configure your variables:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/recruitpro
SESSION_SECRET=your-super-secret-session-key-here
OPENAI_API_KEY=sk-your-openai-api-key-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-app-password
```

### 2. Database Setup

Push the database schema:

```bash
npm run db:push
```

Create an admin user (run once):

```bash
npm run create-admin
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 🏗 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and configurations
├── server/                 # Express backend
│   ├── controllers/        # Route controllers
│   ├── services/           # Business logic services
│   ├── routes/             # API route definitions
│   ├── config/             # Configuration files
│   └── storage.ts          # Database operations
├── shared/                 # Shared TypeScript schemas
├── uploads/                # CV file storage
└── package.json
```

## 🔧 API Endpoints

### Public Routes
- `POST /api/applications` - Submit job application
- `GET /api/candidates/:id/cv` - Download CV file

### Protected Routes (Admin)
- `GET /api/candidates` - List all candidates
- `GET /api/assessments` - View AI assessments
- `GET /api/interviews` - Manage interviews
- `GET /api/emails` - Email history
- `GET /api/stats` - Dashboard statistics
- `GET /api/users` - User management

## 📊 How It Works

### Application Flow
1. **Candidate Submission**: Applicants fill out the public form and upload their CV
2. **PDF Processing**: System extracts text from uploaded PDF files
3. **AI Analysis**: OpenAI analyzes the resume against job requirements
4. **Scoring**: Candidates receive scores for technical skills, experience, and education
5. **Admin Review**: Recruiters review candidates through the admin dashboard

### Admin Workflow
1. **Login**: Access the admin dashboard with credentials
2. **Candidate Management**: View, filter, and manage applicants
3. **Assessment Review**: Analyze AI-generated insights and scores
4. **Interview Scheduling**: Schedule and track interviews
5. **Communication**: Send emails and track correspondence

## 🔒 Security Features

- **Session-based Authentication**: Secure admin access
- **File Upload Validation**: PDF-only uploads with size limits
- **SQL Injection Prevention**: Parameterized queries with Drizzle ORM
- **Environment Variable Security**: Sensitive data stored securely
- **Error Handling**: Comprehensive error logging and user feedback

## 🌐 Deployment

### Production Deployment on Replit

1. **Environment Variables**: Set all required environment variables in Replit Secrets
2. **Database**: Configure production PostgreSQL connection
3. **Deploy**: Click the Deploy button in Replit

The application automatically:
- Builds the frontend with Vite
- Bundles the backend with ESBuild
- Serves static files through Express
- Handles database migrations

## 🧪 Testing Scenarios

### Complete Workflow Test

1. **Submit Application**:
   ```bash
   curl -X POST http://localhost:5000/api/applications \
     -F "fullName=John Smith" \
     -F "email=john@example.com" \
     -F "phone=1234567890" \
     -F "position=frontend-developer" \
     -F "cv=@sample_cv.pdf"
   ```

2. **Add Job Description** (Admin):
   - Login to admin panel
   - Navigate to Job Descriptions
   - Add new job description for the position

3. **Review Assessment**:
   - Check Candidates page for AI analysis
   - Review scores and insights
   - Download CV if needed

4. **Schedule Interview**:
   - Use Interviews section
   - Schedule candidate interview
   - Send invitation email

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation in `replit.md`
- Review the API endpoints
- Ensure environment variables are correctly set
- Check server logs for debugging information

---

**RecruitPro** - Streamlining recruitment through AI automation 🎯