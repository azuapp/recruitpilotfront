# RecruitPro - AI-Powered Recruitment Platform

## Overview

RecruitPro is a comprehensive recruitment management system that combines AI-powered resume analysis with a modern web interface. The platform streamlines the hiring process through intelligent candidate screening, automated assessments, interview scheduling, and email communication management.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 27, 2025)

✅ **Sidebar Layout Fix & Mobile Responsiveness:**
- **Layout Consistency**: Fixed sidebar disappearing issue on candidates and emails pages
- **Desktop Sidebar**: Implemented reliable fixed positioning with `hidden lg:block` for consistent visibility
- **Mobile Sidebar**: Enhanced slide-in overlay with proper z-index layering and smooth transitions
- **Responsive Design**: Standardized `lg:ml-64` spacing across all admin pages (home, candidates, emails, interviews, assessments, job-descriptions, users)
- **Mobile Experience**: Improved touch targets and auto-close functionality for mobile navigation
- **Cross-page Compatibility**: Unified sidebar behavior across entire admin dashboard

✅ **Production Cleanup & TypeScript Error Resolution:**
- **TypeScript Validation**: Fixed 118+ TypeScript errors across all files for production readiness
- **Build Optimization**: Successfully completed production build with optimized bundles (91.9kb server, 545kb client)
- **Error Handling**: Enhanced error handling with proper type safety throughout the application
- **Schema Alignment**: Fixed all database schema inconsistencies and type mismatches
- **Import Resolution**: Resolved all import issues and missing dependencies (@types/pdf-parse added)
- **Production Testing**: Comprehensive health checks and system validation completed successfully

## Previous Changes

✅ **Gmail SMTP Email Integration:**
- **Environment Loading**: Added dotenv configuration for proper environment variable loading
- **SMTP Configuration**: Fixed Gmail SMTP settings with secure authentication
- **Email Templates**: Professional HTML email templates with company branding
- **Real Email Sending**: Integrated nodemailer with Gmail SMTP (azuapphealth@gmail.com)
- **Error Handling**: Comprehensive email error handling and user feedback

✅ **Enhanced Email Management System:**
- **Searchable Candidate Dropdown**: Replaced manual Candidate ID input with intelligent search
- **Real-time Filtering**: Search candidates by name, email, or position
- **Detailed Email Cards**: Complete email history display with full content and metadata
- **Interactive Features**: Copy content and reply functionality for each email
- **Professional UI**: Card-based layout with gradient headers and organized information display

✅ **Code Optimization & SOLID Principles Applied:**
- **Modular Architecture**: Split routes into separate modules (candidateRoutes, authRoutes)
- **Service Layer**: Created dedicated services (errorHandler, logger, assessmentService, candidateController)
- **Configuration Management**: Centralized environment variables in config/environment.ts
- **Error Handling**: Implemented comprehensive error handling with custom AppError class
- **Logging System**: Added structured logging throughout the application
- **PDF Text Extraction**: Enhanced PDF processing with proper error handling and validation

✅ **Production-Ready Features:**
- **Environment Template**: Created .env.example with all required variables
- **Comprehensive Documentation**: Added detailed README.md with deployment instructions
- **Security Enhancements**: Improved input validation and error handling
- **Database Schema**: Optimized with proper relationships and constraints
- **File Management**: Secure CV upload/download with validation

✅ **Tested Workflow:**
- ✓ Candidate application submission with CV upload
- ✓ PDF text extraction and storage in resume_summary field
- ✓ AI assessment processing (OpenAI GPT-4o integration)
- ✓ Admin dashboard with candidate management
- ✓ Action buttons (view details, download CV, send email)
- ✓ Authentication and session management
- ✓ Database operations with PostgreSQL
- ✓ Email system with searchable candidates and detailed history cards

✅ **Local Development Setup:**
- ✓ Complete LOCAL_SETUP.md documentation with step-by-step instructions
- ✓ Environment configuration guide with all required variables
- ✓ Database setup options (local PostgreSQL + Neon cloud)
- ✓ API key configuration for OpenAI and Gmail SMTP
- ✓ Production deployment guidelines

## System Architecture

### Full-Stack Structure
The application follows a monorepo structure with clear separation between client and server code:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Styling**: Tailwind CSS with shadcn/ui components

### Project Structure
```
├── client/          # React frontend application
├── server/          # Express.js backend API
├── shared/          # Shared TypeScript schemas and types
├── migrations/      # Database migration files
└── uploads/         # File storage for CV uploads
```

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite bundler
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle with PostgreSQL dialect
- **Authentication**: Replit Auth with session management
- **File Upload**: Multer for handling CV uploads (PDF only)
- **AI Integration**: OpenAI GPT-4o for resume analysis

### Database Schema
The system uses PostgreSQL with the following core entities:
- **Users**: Stores authenticated user information (required for Replit Auth)
- **Candidates**: Job applicant information and application details
- **Assessments**: AI-powered resume analysis results
- **Interviews**: Interview scheduling and management
- **Email History**: Email communication tracking
- **Sessions**: User session storage (required for Replit Auth)

## Data Flow

### Application Process
1. Candidates submit applications through public form
2. CV files are uploaded and stored locally
3. AI analysis is triggered for resume evaluation
4. Results are stored in assessments table
5. Admin users can review candidates and manage process

### Authentication Flow
1. Replit Auth handles user authentication via OpenID Connect
2. Session data is stored in PostgreSQL
3. Protected routes verify authentication status
4. Admin interface is only accessible to authenticated users

### File Management
1. CVs are uploaded to local `uploads/` directory
2. File serving through Express static route
3. PDF validation and 10MB size limit enforced
4. File cleanup on candidate deletion

## External Dependencies

### Core Services
- **Neon Database**: PostgreSQL hosting via `@neondatabase/serverless`
- **OpenAI**: Resume analysis via GPT-4o model
- **Replit Auth**: Authentication and user management
- **SMTP**: Email sending capabilities via nodemailer

### Development Tools
- **Vite**: Frontend build tool and dev server
- **Drizzle Kit**: Database schema management and migrations
- **ESBuild**: Server-side bundling for production
- **TypeScript**: Type checking and compilation

### UI Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library
- **React Hook Form**: Form management and validation

## Deployment Strategy

### Development Environment
- Frontend served by Vite dev server with HMR
- Backend runs with tsx for TypeScript execution
- Database migrations applied via Drizzle Kit
- File uploads stored locally in development

### Production Build
1. Frontend built using Vite to `dist/public/`
2. Backend bundled using ESBuild to `dist/`
3. Static files served by Express in production
4. Database connections via connection pooling

### Environment Configuration
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `OPENAI_API_KEY`: OpenAI API access
- `SMTP_*`: Email service configuration
- `REPL_ID`: Replit environment identifier

### Session Management
- PostgreSQL-backed session store using `connect-pg-simple`
- 7-day session expiry with automatic cleanup
- Secure cookie settings for production deployment

The architecture prioritizes developer experience with hot reloading, type safety throughout the stack, and clear separation of concerns while maintaining the ability to deploy as a single unit on Replit's platform.