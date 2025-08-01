// Application-wide constants and enums

export const USER_ROLES = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
} as const;

export const APPLICATION_STATUS = {
  NEW: 'new',
  REVIEWED: 'reviewed',
  INTERVIEW: 'interview',
  HIRED: 'hired',
  REJECTED: 'rejected'
} as const;

export const INTERVIEW_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled'
} as const;

export const EMAIL_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed'
} as const;

export const ASSESSMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

export const EMAIL_TYPES = {
  APPLICATION_CONFIRMATION: 'application_confirmation',
  INTERVIEW_INVITATION: 'interview_invitation',
  REJECTION: 'rejection',
  ACCEPTANCE: 'acceptance'
} as const;

export const INTERVIEW_TYPES = {
  PHONE: 'phone',
  VIDEO: 'video',
  IN_PERSON: 'in_person'
} as const;

// File upload constants
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['application/pdf'],
  UPLOAD_PATH: 'uploads'
} as const;

// API Response constants
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
} as const;

// Validation constants
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 255,
  MAX_PHONE_LENGTH: 20,
  MAX_POSITION_LENGTH: 100
} as const;

// Type exports for TypeScript
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type ApplicationStatus = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS];
export type InterviewStatus = typeof INTERVIEW_STATUS[keyof typeof INTERVIEW_STATUS];
export type EmailStatus = typeof EMAIL_STATUS[keyof typeof EMAIL_STATUS];
export type AssessmentStatus = typeof ASSESSMENT_STATUS[keyof typeof ASSESSMENT_STATUS];
export type EmailType = typeof EMAIL_TYPES[keyof typeof EMAIL_TYPES];
export type InterviewType = typeof INTERVIEW_TYPES[keyof typeof INTERVIEW_TYPES];
