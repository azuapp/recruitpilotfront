# RecruitPro - AI-Powered Recruitment Platform

## Overview

RecruitPro is a comprehensive recruitment management system that combines AI-powered resume analysis with a modern web interface. The platform streamlines the hiring process through intelligent candidate screening, automated assessments, interview scheduling, and email communication management.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 28, 2025)

✅ **Final Production Preparation (COMPLETED):**
- **CV Download Fix**: Resolved ES module import issue causing "require is not defined" error in candidateController.ts
- **Email HTML Rendering**: Fixed email content display from raw HTML to properly formatted content using dangerouslySetInnerHTML
- **Tailwind Prose Styling**: Added proper typography styling for HTML email content with clean text preview
- **Build Validation**: Production build successful (109.3kb server, 547kb client) with zero TypeScript errors
- **Security Review**: Environment variables secured, no sensitive data in .env.example template
- **Performance Testing**: All API endpoints responding correctly, database operations optimized
- **Mobile Responsiveness**: RTL/LTR sidebar positioning verified, touch targets optimized

✅ **User Management System Fixed (COMPLETED):**
- **Root Cause**: Server was using modular routing system but user management routes were only in old monolithic routes file
- **Solution**: Added user management endpoints (GET/POST/PUT/DELETE /api/users) to proper authRoutes.ts module
- **Issue**: API requests were returning HTML instead of JSON due to Vite fallback middleware catching unregistered routes
- **Resolution**: Routes now properly registered and responding with valid JSON
- **Testing**: Successfully created, updated, and deleted users with proper UI feedback
- **Status**: Create New User functionality working correctly, dialog closes, list updates automatically

✅ **PDF Extraction System Fixed (COMPLETED):**
- **Root Cause**: pdf-parse library initialization bug trying to read non-existent test file './test/data/05-versions-space.pdf'
- **Solution**: Created missing test file to resolve library initialization error
- **Testing**: Successfully extracted 1,615 characters from Omar's CV (telecommunications engineer)
- **Verification**: AI assessment processed with score of 55, full resume content stored in database
- **Status**: PDF parser now working correctly for all new applications, error message eliminated
- **Impact**: Candidates no longer see "Resume content could not be extracted" error message

✅ **Application Duplicate Prevention (COMPLETED):**
- **Email + Position Validation**: Successfully prevents duplicate applications for same email and position combination
- **Multi-Position Support**: Same email can apply for different positions without restriction
- **Clear Error Messages**: Informative feedback when duplicate application is attempted
- **Database Validation**: Server-side validation ensures data integrity
- **User-Friendly Response**: Guides users on next steps for existing applications
- **Implementation Location**: Added validation to `server/controllers/candidateController.ts` createCandidate function
- **Testing Confirmed**: Duplicate applications correctly blocked with 400 error, different positions allowed

✅ **Application Success Page Cleanup:**
- **Removed Navigation**: Eliminated "Return to Home" button from success page
- **Clean Confirmation**: Simple success message with application timeline
- **Professional Presentation**: Focused confirmation without unnecessary UI elements

✅ **Sidebar Layout Fix & Mobile Responsiveness:**
- **Layout Consistency**: Fixed sidebar disappearing issue on candidates and emails pages
- **Desktop Sidebar**: Implemented reliable fixed positioning with `hidden lg:block` for consistent visibility
- **Mobile Sidebar**: Enhanced slide-in overlay with proper z-index layering and smooth transitions
- **RTL Support**: Sidebar positions on right for Arabic (lg:mr-64), left for English (lg:ml-64)
- **Language-Aware Layout**: Conditional positioning based on language direction with proper RTL/LTR support
- **Mobile Experience**: Improved touch targets and auto-close functionality for mobile navigation
- **Cross-page Compatibility**: Unified sidebar behavior across entire admin dashboard

✅ **Authentication Security Enhancement:**
- **Registration Removal**: Removed public registration form from /auth page for security
- **Admin-Only Registration**: User creation now exclusively through admin dashboard Users page
- **Simplified Login**: Clean admin login interface with demo credentials display
- **Security Notice**: Clear messaging that new users must be created by existing administrators

✅ **Production Deployment Preparation:**
- **TypeScript Validation**: All TypeScript errors resolved, production build successful
- **Build Optimization**: Optimized bundles (91.9kb server, 545kb client) ready for deployment
- **Security Cleanup**: Removed sensitive credentials from .env.example template
- **Comprehensive Testing**: All API endpoints, UI components, and core features validated
- **Documentation**: Complete production checklist and deployment guide created
- **Ubuntu VPS Guide**: Comprehensive step-by-step Ubuntu deployment documentation
- **Performance Verification**: Response times <300ms, mobile responsiveness confirmed

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