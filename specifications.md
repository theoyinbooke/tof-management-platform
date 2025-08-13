# TheOyinbooke Foundation Management Platform
## Complete Technical Specification

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technical Architecture](#technical-architecture)
3. [Complete Database Schema](#complete-database-schema)
4. [Feature Specifications by Phase](#feature-specifications-by-phase)
5. [Component Architecture](#component-architecture)
6. [Admin Configuration System](#admin-configuration-system)
7. [Data Migration & Export Strategy](#data-migration--export-strategy)
8. [Development Workflow](#development-workflow)
9. [Testing Strategy](#testing-strategy)
10. [Deployment & Scaling Plan](#deployment--scaling-plan)

---

## Project Overview

### Mission Statement
Build a comprehensive Educational Support Management Platform for TheOyinbooke Foundation to efficiently manage educational support for 500+ beneficiaries across the Nigerian education system (Nursery → University).

### Core Objectives
- **Administrative Efficiency**: Streamline application review, beneficiary management, and financial tracking
- **Academic Monitoring**: Track academic progress and identify intervention opportunities
- **Financial Transparency**: Complete financial oversight with forecasting capabilities
- **Program Management**: Manage mentorship, workshops, and educational resources
- **Impact Measurement**: Analytics for program effectiveness and donor reporting

### Target Users
- **Foundation Admins** (5+ administrators with different permission levels)
- **Beneficiaries** (Students 16+ managing their own profiles)
- **Parents/Guardians** (Managing profiles for children under 16)
- **Future**: Donors, School Administrators, Mentors

---

## Technical Architecture

### Tech Stack Rationale

```
Frontend: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
├── Reason: Server-side rendering, excellent AI tool support
├── Mobile-first responsive design
└── Component-driven development

Backend: Convex
├── Reason: Real-time capabilities, TypeScript-first, file storage
├── Complex query support for analytics
└── Built-in transaction guarantees

Authentication: Clerk
├── Reason: Multi-role support, easy setup
├── Social login options
└── Admin management features

Deployment: Vercel
├── Reason: Seamless Next.js integration
├── Global CDN for Nigerian users
└── Automatic deployments

Future Integrations: Paystack/Flutterwave (Phase 2)
```

### System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  Admin Portal   │  │ Beneficiary App │  │ Public Site  │ │
│  │  (Dashboard)    │  │   (Profile)     │  │ (Apply)      │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (Next.js)                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Auth Routes   │  │   API Routes    │  │  Webhooks    │ │
│  │   (Clerk)       │  │  (Business)     │  │ (Payments)   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer (Convex)                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Database      │  │   File Storage  │  │  Real-time   │ │
│  │  (TypeScript)   │  │   (Documents)   │  │ (WebSocket)  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Security Architecture

```typescript
// Role-based access control
enum UserRole {
  SUPER_ADMIN = "super_admin",     // Full system access
  ADMIN = "admin",                 // Foundation management
  REVIEWER = "reviewer",           // Application review only
  BENEFICIARY = "beneficiary",     // Self-management (16+)
  GUARDIAN = "guardian"            // Child management (<16)
}

// Data access patterns
interface DataAccess {
  foundation: string;              // Multi-foundation isolation
  role: UserRole;                  // Permission level
  beneficiaryAccess?: string[];    // Specific beneficiary access
}
```

---

## Complete Database Schema

### Core Foundation Entities

```typescript
// Foundation multi-tenancy support
export const foundations = defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  logo: v.optional(v.id("_storage")),
  settings: v.object({
    defaultCurrency: v.union(v.literal("NGN"), v.literal("USD")),
    exchangeRate: v.number(), // NGN to USD
    academicYearStart: v.string(), // "September"
    academicYearEnd: v.string(),   // "July"
    applicationDeadline: v.string(), // "March 31"
    paymentTerms: v.string() // "30 days"
  }),
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number()
});

// User management with role-based access
export const users = defineTable({
  clerkId: v.string(),
  foundationId: v.id("foundations"),
  email: v.string(),
  firstName: v.string(),
  lastName: v.string(),
  phone: v.optional(v.string()),
  role: v.union(
    v.literal("super_admin"),
    v.literal("admin"),
    v.literal("reviewer"),
    v.literal("beneficiary"),
    v.literal("guardian")
  ),
  isActive: v.boolean(),
  lastLogin: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_clerk_id", ["clerkId"])
  .index("by_foundation", ["foundationId"])
  .index("by_email", ["email"]);
```

### Configuration & Settings

```typescript
// Configurable academic levels
export const academicLevels = defineTable({
  foundationId: v.id("foundations"),
  name: v.string(), // "Nursery 1", "Primary 1", "JSS 1", "University Year 1"
  category: v.union(
    v.literal("nursery"),
    v.literal("primary"),
    v.literal("secondary"),
    v.literal("university")
  ),
  sortOrder: v.number(),
  isActive: v.boolean(),
  createdAt: v.number()
}).index("by_foundation", ["foundationId"])
  .index("by_category", ["foundationId", "category"]);

// Configurable fee categories
export const feeCategories = defineTable({
  foundationId: v.id("foundations"),
  name: v.string(), // "Tuition", "Books", "Uniform", "Transport"
  description: v.optional(v.string()),
  isRequired: v.boolean(), // Must be paid each term
  sortOrder: v.number(),
  isActive: v.boolean(),
  createdAt: v.number()
}).index("by_foundation", ["foundationId"]);

// Performance alert rules (configurable)
export const performanceRules = defineTable({
  foundationId: v.id("foundations"),
  name: v.string(), // "Poor Performance Alert"
  description: v.string(),
  conditions: v.object({
    consecutiveTermsBelow: v.optional(v.number()), // 2 terms below threshold
    gradeThreshold: v.optional(v.number()), // Below 60%
    attendanceThreshold: v.optional(v.number()), // Below 75%
    missedUploads: v.optional(v.number()) // 2 missed report uploads
  }),
  actions: v.array(v.union(
    v.literal("notify_admin"),
    v.literal("flag_for_review"),
    v.literal("schedule_intervention")
  )),
  isActive: v.boolean(),
  createdAt: v.number()
}).index("by_foundation", ["foundationId"]);
```

### Application & Onboarding System

```typescript
// Application submissions
export const applications = defineTable({
  foundationId: v.id("foundations"),
  applicationNumber: v.string(), // Auto-generated: "TOF-2024-001"
  
  // Personal Information
  firstName: v.string(),
  lastName: v.string(),
  middleName: v.optional(v.string()),
  dateOfBirth: v.string(),
  gender: v.union(v.literal("male"), v.literal("female")),
  phone: v.optional(v.string()),
  email: v.optional(v.string()),
  
  // Address Information
  address: v.object({
    street: v.string(),
    city: v.string(),
    state: v.string(),
    country: v.string(),
    postalCode: v.optional(v.string())
  }),
  
  // Guardian Information (for applicants under 16)
  guardian: v.optional(v.object({
    firstName: v.string(),
    lastName: v.string(),
    relationship: v.string(), // "Father", "Mother", "Guardian"
    phone: v.string(),
    email: v.optional(v.string()),
    occupation: v.optional(v.string())
  })),
  
  // Educational Background
  education: v.object({
    currentLevel: v.string(), // Maps to academicLevels
    currentSchool: v.string(),
    previousSchools: v.optional(v.array(v.string())),
    hasRepeatedClass: v.boolean(),
    specialNeeds: v.optional(v.string())
  }),
  
  // Financial Information
  financial: v.object({
    familyIncome: v.optional(v.union(
      v.literal("below_50k"),
      v.literal("50k_100k"),
      v.literal("100k_200k"),
      v.literal("above_200k")
    )),
    currentFeeSupport: v.optional(v.string()), // Other scholarship sources
    hasOtherSupport: v.boolean()
  }),
  
  // Application Essays/Questions
  essays: v.object({
    personalStatement: v.string(),
    educationalGoals: v.string(),
    whyApplying: v.string(),
    additionalInfo: v.optional(v.string())
  }),
  
  // Application Status
  status: v.union(
    v.literal("draft"),
    v.literal("submitted"),
    v.literal("under_review"),
    v.literal("approved"),
    v.literal("rejected"),
    v.literal("waitlisted")
  ),
  
  submittedAt: v.optional(v.number()),
  reviewedAt: v.optional(v.number()),
  decidedAt: v.optional(v.number()),
  
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_foundation", ["foundationId"])
  .index("by_status", ["foundationId", "status"])
  .index("by_application_number", ["applicationNumber"]);

// Application reviews and decisions
export const applicationReviews = defineTable({
  foundationId: v.id("foundations"),
  applicationId: v.id("applications"),
  reviewerId: v.id("users"),
  
  // Review Scores (1-10 scale)
  scores: v.object({
    academicPotential: v.number(),
    financialNeed: v.number(),
    personalStatement: v.number(),
    overallFit: v.number()
  }),
  
  // Review Comments
  comments: v.object({
    strengths: v.string(),
    concerns: v.string(),
    recommendation: v.string()
  }),
  
  decision: v.union(
    v.literal("recommend_approve"),
    v.literal("recommend_reject"),
    v.literal("needs_discussion"),
    v.literal("request_more_info")
  ),
  
  isCompleted: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_application", ["applicationId"])
  .index("by_reviewer", ["reviewerId"]);

// Relationships between users (parent-child, mentor-mentee)
export const relationships = defineTable({
  foundationId: v.id("foundations"),
  primaryUserId: v.id("users"), // Parent/Guardian/Mentor
  relatedUserId: v.id("users"),  // Child/Beneficiary/Mentee
  relationshipType: v.union(
    v.literal("parent_child"),
    v.literal("guardian_ward"),
    v.literal("mentor_mentee")
  ),
  isActive: v.boolean(),
  createdAt: v.number()
}).index("by_primary_user", ["primaryUserId"])
  .index("by_related_user", ["relatedUserId"])
  .index("by_foundation", ["foundationId"]);

// Beneficiaries (approved applications)
export const beneficiaries = defineTable({
  foundationId: v.id("foundations"),
  userId: v.id("users"), // Links to user account
  applicationId: v.id("applications"), // Original application
  beneficiaryNumber: v.string(), // "TOF-BEN-2024-001"
  
  // Current Status
  status: v.union(
    v.literal("active"),
    v.literal("graduated"),
    v.literal("withdrawn"),
    v.literal("suspended")
  ),
  
  // Academic Information
  currentAcademicLevel: v.id("academicLevels"),
  currentSchool: v.string(),
  expectedGraduation: v.optional(v.string()),
  
  // Support Information
  supportStartDate: v.string(),
  supportEndDate: v.optional(v.string()),
  supportTypes: v.array(v.string()), // ["tuition", "books", "mentorship"]
  
  // Emergency Contact
  emergencyContact: v.object({
    name: v.string(),
    relationship: v.string(),
    phone: v.string(),
    email: v.optional(v.string())
  }),
  
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_foundation", ["foundationId"])
  .index("by_user", ["userId"])
  .index("by_status", ["foundationId", "status"])
  .index("by_beneficiary_number", ["beneficiaryNumber"]);
```

### Academic Management System

```typescript
// Academic sessions (terms/semesters)
export const academicSessions = defineTable({
  foundationId: v.id("foundations"),
  beneficiaryId: v.id("beneficiaries"),
  academicLevelId: v.id("academicLevels"),
  
  sessionName: v.string(), // "2024/2025 First Term"
  sessionType: v.union(v.literal("term"), v.literal("semester")),
  
  startDate: v.string(),
  endDate: v.string(),
  
  // School Information
  schoolName: v.string(),
  schoolAddress: v.optional(v.string()),
  schoolContact: v.optional(v.object({
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    accountDetails: v.optional(v.string()) // For direct payments
  })),
  
  // Session Status
  status: v.union(
    v.literal("planned"),
    v.literal("active"),
    v.literal("completed"),
    v.literal("cancelled")
  ),
  
  isPromoted: v.optional(v.boolean()), // Did they advance to next level?
  
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_beneficiary", ["beneficiaryId"])
  .index("by_foundation", ["foundationId"])
  .index("by_academic_level", ["academicLevelId"])
  .index("by_status", ["foundationId", "status"]);

// Academic performance tracking
export const performanceRecords = defineTable({
  foundationId: v.id("foundations"),
  beneficiaryId: v.id("beneficiaries"),
  academicSessionId: v.id("academicSessions"),
  
  // Performance Data
  overallGrade: v.optional(v.number()), // 0-100
  gradeClass: v.optional(v.string()), // "First Class", "Second Class Upper"
  position: v.optional(v.number()), // Class position
  totalStudents: v.optional(v.number()),
  attendance: v.optional(v.number()), // Percentage
  
  // Subject-wise performance
  subjects: v.optional(v.array(v.object({
    name: v.string(),
    grade: v.number(),
    comment: v.optional(v.string())
  }))),
  
  // Teacher Comments
  teacherComments: v.optional(v.string()),
  principalComments: v.optional(v.string()),
  
  // Performance Flags
  hasImproved: v.optional(v.boolean()),
  needsIntervention: v.boolean(),
  interventionReason: v.optional(v.string()),
  
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_beneficiary", ["beneficiaryId"])
  .index("by_session", ["academicSessionId"])
  .index("by_foundation", ["foundationId"]);

// Schools database
export const schools = defineTable({
  foundationId: v.id("foundations"),
  name: v.string(),
  address: v.string(),
  city: v.string(),
  state: v.string(),
  
  // Contact Information
  phone: v.optional(v.string()),
  email: v.optional(v.string()),
  website: v.optional(v.string()),
  
  // Academic Information
  schoolType: v.union(
    v.literal("public"),
    v.literal("private"),
    v.literal("federal")
  ),
  levels: v.array(v.string()), // Academic levels offered
  
  // Financial Information
  accountDetails: v.optional(v.object({
    bankName: v.string(),
    accountNumber: v.string(),
    accountName: v.string()
  })),
  
  // Contact Persons
  contacts: v.optional(v.array(v.object({
    name: v.string(),
    position: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string())
  }))),
  
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_foundation", ["foundationId"])
  .index("by_city", ["foundationId", "city"])
  .index("by_school_type", ["foundationId", "schoolType"]);
```

### Financial Management System

```typescript
// Financial records (all money movements)
export const financialRecords = defineTable({
  foundationId: v.id("foundations"),
  beneficiaryId: v.id("beneficiaries"),
  academicSessionId: v.optional(v.id("academicSessions")),
  feeCategoryId: v.id("feeCategories"),
  
  // Financial Details
  amount: v.number(),
  currency: v.union(v.literal("NGN"), v.literal("USD")),
  exchangeRateUsed: v.optional(v.number()), // Rate at time of transaction
  
  // Transaction Information
  transactionType: v.union(
    v.literal("fee_invoice"), // School fee invoice received
    v.literal("payment_made"), // Payment sent to school
    v.literal("reimbursement"), // Money given to family
    v.literal("budget_allocation") // Budget planning
  ),
  
  status: v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("paid"),
    v.literal("cancelled"),
    v.literal("overdue")
  ),
  
  // Dates
  dueDate: v.optional(v.string()),
  paidDate: v.optional(v.string()),
  invoiceDate: v.optional(v.string()),
  
  // References
  invoiceNumber: v.optional(v.string()),
  receiptNumber: v.optional(v.string()),
  paymentReference: v.optional(v.string()),
  
  // School Information
  schoolId: v.optional(v.id("schools")),
  schoolAccountUsed: v.optional(v.string()),
  
  // Approval Workflow
  requestedBy: v.id("users"),
  approvedBy: v.optional(v.id("users")),
  approvalDate: v.optional(v.number()),
  
  // Notes
  description: v.optional(v.string()),
  internalNotes: v.optional(v.string()),
  
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_beneficiary", ["beneficiaryId"])
  .index("by_foundation", ["foundationId"])
  .index("by_status", ["foundationId", "status"])
  .index("by_due_date", ["foundationId", "dueDate"])
  .index("by_session", ["academicSessionId"]);

// Budget planning and forecasting
export const budgetPlan = defineTable({
  foundationId: v.id("foundations"),
  planName: v.string(), // "2024/2025 Academic Year Budget"
  
  // Planning Period
  startDate: v.string(),
  endDate: v.string(),
  
  // Budget Categories
  categories: v.array(v.object({
    feeCategoryId: v.id("feeCategories"),
    budgetedAmount: v.number(),
    currency: v.union(v.literal("NGN"), v.literal("USD")),
    expectedBeneficiaries: v.number(),
    notes: v.optional(v.string())
  })),
  
  // Total Budget
  totalBudget: v.number(),
  currency: v.union(v.literal("NGN"), v.literal("USD")),
  
  // Status
  status: v.union(
    v.literal("draft"),
    v.literal("approved"),
    v.literal("active"),
    v.literal("completed")
  ),
  
  // Approval
  createdBy: v.id("users"),
  approvedBy: v.optional(v.id("users")),
  approvalDate: v.optional(v.number()),
  
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_foundation", ["foundationId"])
  .index("by_status", ["foundationId", "status"]);

// Payment approvals workflow
export const paymentApprovals = defineTable({
  foundationId: v.id("foundations"),
  financialRecordId: v.id("financialRecords"),
  
  // Approval Request
  requestedBy: v.id("users"),
  requestedAmount: v.number(),
  currency: v.union(v.literal("NGN"), v.literal("USD")),
  justification: v.string(),
  
  // Approval Chain
  approvers: v.array(v.object({
    userId: v.id("users"),
    order: v.number(), // Approval sequence
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    comments: v.optional(v.string()),
    actionDate: v.optional(v.number())
  })),
  
  // Overall Status
  overallStatus: v.union(
    v.literal("pending"),
    v.literal("approved"),
    v.literal("rejected"),
    v.literal("cancelled")
  ),
  
  // Final Action
  finalApprover: v.optional(v.id("users")),
  finalActionDate: v.optional(v.number()),
  finalComments: v.optional(v.string()),
  
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_financial_record", ["financialRecordId"])
  .index("by_foundation", ["foundationId"])
  .index("by_status", ["foundationId", "overallStatus"]);
```

### Program Management System

```typescript
// Program types (configurable)
export const programTypes = defineTable({
  foundationId: v.id("foundations"),
  name: v.string(), // "Mentorship", "Tutoring", "Workshop"
  description: v.string(),
  
  // Program Configuration
  requiresApplication: v.boolean(),
  hasCapacityLimit: v.boolean(),
  maxParticipants: v.optional(v.number()),
  
  // Scheduling
  hasFixedSchedule: v.boolean(),
  defaultDuration: v.optional(v.number()), // Days
  
  // Tracking Requirements
  requiresAttendance: v.boolean(),
  requiresProgress: v.boolean(),
  requiresFeedback: v.boolean(),
  
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_foundation", ["foundationId"]);

// Program instances
export const programs = defineTable({
  foundationId: v.id("foundations"),
  programTypeId: v.id("programTypes"),
  
  name: v.string(), // "Mathematics Tutoring - JSS1"
  description: v.string(),
  
  // Schedule
  startDate: v.string(),
  endDate: v.optional(v.string()),
  meetingSchedule: v.optional(v.string()), // "Every Saturday 10am-12pm"
  
  // Capacity
  maxParticipants: v.optional(v.number()),
  currentParticipants: v.number(),
  
  // Location
  venue: v.optional(v.string()),
  isVirtual: v.boolean(),
  meetingLink: v.optional(v.string()),
  
  // Program Staff
  coordinatorId: v.optional(v.id("users")),
  facilitators: v.optional(v.array(v.object({
    userId: v.id("users"),
    role: v.string() // "Lead Facilitator", "Assistant"
  }))),
  
  // Status
  status: v.union(
    v.literal("planned"),
    v.literal("open_for_registration"),
    v.literal("active"),
    v.literal("completed"),
    v.literal("cancelled")
  ),
  
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_foundation", ["foundationId"])
  .index("by_program_type", ["programTypeId"])
  .index("by_status", ["foundationId", "status"]);

// Program participants
export const programParticipants = defineTable({
  foundationId: v.id("foundations"),
  programId: v.id("programs"),
  beneficiaryId: v.id("beneficiaries"),
  
  // Participation Details
  enrollmentDate: v.string(),
  status: v.union(
    v.literal("enrolled"),
    v.literal("active"),
    v.literal("completed"),
    v.literal("withdrawn"),
    v.literal("expelled")
  ),
  
  // Progress Tracking
  attendanceRate: v.optional(v.number()), // Percentage
  progressScore: v.optional(v.number()), // 1-10
  feedback: v.optional(v.string()),
  
  // Completion
  completionDate: v.optional(v.string()),
  certificate: v.optional(v.id("_storage")),
  
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_program", ["programId"])
  .index("by_beneficiary", ["beneficiaryId"])
  .index("by_foundation", ["foundationId"]);

// Events and calendar
export const events = defineTable({
  foundationId: v.id("foundations"),
  programId: v.optional(v.id("programs")), // Linked to program if applicable
  
  title: v.string(),
  description: v.string(),
  
  // Event Details
  eventType: v.union(
    v.literal("workshop"),
    v.literal("mentorship_session"),
    v.literal("graduation"),
    v.literal("fundraiser"),
    v.literal("meeting"),
    v.literal("deadline"),
    v.literal("other")
  ),
  
  // Scheduling
  startDateTime: v.string(), // ISO datetime
  endDateTime: v.string(),
  timeZone: v.string(), // "Africa/Lagos"
  isAllDay: v.boolean(),
  
  // Location
  venue: v.optional(v.string()),
  isVirtual: v.boolean(),
  meetingLink: v.optional(v.string()),
  
  // Participants
  isPublic: v.boolean(), // Visible to all beneficiaries
  invitedParticipants: v.optional(v.array(v.id("beneficiaries"))),
  maxAttendees: v.optional(v.number()),
  
  // Organizer
  organizerId: v.id("users"),
  
  // Status
  status: v.union(
    v.literal("scheduled"),
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("cancelled"),
    v.literal("postponed")
  ),
  
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_foundation", ["foundationId"])
  .index("by_date", ["foundationId", "startDateTime"])
  .index("by_program", ["programId"])
  .index("by_organizer", ["organizerId"]);

// Event attendance
export const eventAttendance = defineTable({
  foundationId: v.id("foundations"),
  eventId: v.id("events"),
  beneficiaryId: v.id("beneficiaries"),
  
  // Attendance Status
  status: v.union(
    v.literal("registered"),
    v.literal("attended"),
    v.literal("no_show"),
    v.literal("cancelled")
  ),
  
  // Registration
  registrationDate: v.optional(v.number()),
  attendanceDate: v.optional(v.number()),
  
  // Feedback
  rating: v.optional(v.number()), // 1-5 stars
  feedback: v.optional(v.string()),
  
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_event", ["eventId"])
  .index("by_beneficiary", ["beneficiaryId"])
  .index("by_foundation", ["foundationId"]);
```

### Communication System

```typescript
// Notifications system
export const notifications = defineTable({
  foundationId: v.id("foundations"),
  
  // Recipients
  recipientType: v.union(
    v.literal("all_users"),
    v.literal("specific_users"),
    v.literal("role_based"),
    v.literal("beneficiary_category")
  ),
  recipients: v.optional(v.array(v.id("users"))), // For specific users
  recipientRoles: v.optional(v.array(v.string())), // For role-based
  
  // Content
  title: v.string(),
  message: v.string(),
  notificationType: v.union(
    v.literal("announcement"),
    v.literal("reminder"),
    v.literal("alert"),
    v.literal("congratulations"),
    v.literal("warning")
  ),
  
  // Delivery
  channels: v.array(v.union(
    v.literal("in_app"),
    v.literal("email"),
    v.literal("sms")
  )),
  
  // Scheduling
  sendAt: v.optional(v.number()), // For scheduled notifications
  isScheduled: v.boolean(),
  isSent: v.boolean(),
  sentAt: v.optional(v.number()),
  
  // Tracking
  readBy: v.optional(v.array(v.object({
    userId: v.id("users"),
    readAt: v.number()
  }))),
  
  // Priority
  priority: v.union(
    v.literal("low"),
    v.literal("normal"),
    v.literal("high"),
    v.literal("urgent")
  ),
  
  // Action Required
  requiresAction: v.boolean(),
  actionUrl: v.optional(v.string()),
  actionText: v.optional(v.string()),
  
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_foundation", ["foundationId"])
  .index("by_recipient", ["recipients"])
  .index("by_sent_status", ["foundationId", "isSent"])
  .index("by_priority", ["foundationId", "priority"]);

// Direct messages between users
export const messages = defineTable({
  foundationId: v.id("foundations"),
  
  // Participants
  senderId: v.id("users"),
  recipientId: v.id("users"),
  
  // Content
  subject: v.optional(v.string()),
  content: v.string(),
  messageType: v.union(
    v.literal("direct_message"),
    v.literal("inquiry"),
    v.literal("support_request"),
    v.literal("feedback")
  ),
  
  // Thread Management
  threadId: v.optional(v.string()), // Groups related messages
  replyToId: v.optional(v.id("messages")), // Reply to specific message
  
  // Status
  isRead: v.boolean(),
  readAt: v.optional(v.number()),
  isArchived: v.boolean(),
  
  // Priority
  priority: v.union(
    v.literal("normal"),
    v.literal("high"),
    v.literal("urgent")
  ),
  
  // Attachments
  attachments: v.optional(v.array(v.id("_storage"))),
  
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_sender", ["senderId"])
  .index("by_recipient", ["recipientId"])
  .index("by_thread", ["threadId"])
  .index("by_foundation", ["foundationId"]);

// Communication templates
export const communicationTemplates = defineTable({
  foundationId: v.id("foundations"),
  
  name: v.string(), // "Welcome Email", "Payment Reminder"
  description: v.string(),
  
  // Template Content
  subject: v.string(),
  content: v.string(), // Supports template variables {{firstName}}
  
  // Template Type
  templateType: v.union(
    v.literal("email"),
    v.literal("sms"),
    v.literal("in_app")
  ),
  
  // Usage
  category: v.union(
    v.literal("welcome"),
    v.literal("reminder"),
    v.literal("congratulations"),
    v.literal("alert"),
    v.literal("follow_up")
  ),
  
  // Variables Available
  availableVariables: v.array(v.string()), // ["firstName", "amount", "dueDate"]
  
  // Status
  isActive: v.boolean(),
  
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_foundation", ["foundationId"])
  .index("by_category", ["foundationId", "category"]);

// Announcements
export const announcements = defineTable({
  foundationId: v.id("foundations"),
  
  title: v.string(),
  content: v.string(),
  
  // Targeting
  targetAudience: v.union(
    v.literal("all"),
    v.literal("beneficiaries"),
    v.literal("guardians"),
    v.literal("admins"),
    v.literal("specific_group")
  ),
  targetGroups: v.optional(v.array(v.string())), // Academic levels, programs, etc.
  
  // Publishing
  publishAt: v.optional(v.number()), // Scheduled publishing
  isPublished: v.boolean(),
  publishedAt: v.optional(v.number()),
  
  // Engagement
  allowComments: v.boolean(),
  isPinned: v.boolean(),
  expiresAt: v.optional(v.number()),
  
  // Media
  featuredImage: v.optional(v.id("_storage")),
  attachments: v.optional(v.array(v.id("_storage"))),
  
  // Priority
  priority: v.union(
    v.literal("normal"),
    v.literal("important"),
    v.literal("urgent")
  ),
  
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_foundation", ["foundationId"])
  .index("by_published", ["foundationId", "isPublished"])
  .index("by_target", ["foundationId", "targetAudience"]);
```

### Document & Resource Management

```typescript
// Document types (configurable)
export const documentTypes = defineTable({
  foundationId: v.id("foundations"),
  name: v.string(), // "Report Card", "School Invoice", "Birth Certificate"
  description: v.string(),
  
  // Requirements
  isRequired: v.boolean(), // Must be uploaded
  requiredFor: v.array(v.string()), // ["application", "enrollment", "payment"]
  
  // Validation Rules
  allowedFormats: v.array(v.string()), // ["pdf", "jpg", "png"]
  maxFileSize: v.number(), // In MB
  
  // Categorization
  category: v.union(
    v.literal("academic"),
    v.literal("financial"),
    v.literal("personal"),
    v.literal("medical"),
    v.literal("legal")
  ),
  
  // Workflow
  requiresApproval: v.boolean(),
  expiresAfter: v.optional(v.number()), // Days
  
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_foundation", ["foundationId"])
  .index("by_category", ["foundationId", "category"]);

// Document storage
export const documents = defineTable({
  foundationId: v.id("foundations"),
  documentTypeId: v.id("documentTypes"),
  
  // Ownership
  uploadedBy: v.id("users"),
  belongsTo: v.union(
    v.literal("application"),
    v.literal("beneficiary"),
    v.literal("program"),
    v.literal("financial_record")
  ),
  entityId: v.string(), // ID of the related entity
  
  // File Information
  fileId: v.id("_storage"),
  fileName: v.string(),
  fileSize: v.number(),
  fileType: v.string(), // MIME type
  
  // Metadata
  title: v.string(),
  description: v.optional(v.string()),
  
  // Academic Context
  academicSessionId: v.optional(v.id("academicSessions")),
  relatedDate: v.optional(v.string()), // Document date (e.g., report card date)
  
  // Status
  status: v.union(
    v.literal("uploaded"),
    v.literal("pending_review"),
    v.literal("approved"),
    v.literal("rejected"),
    v.literal("expired")
  ),
  
  // Review
  reviewedBy: v.optional(v.id("users")),
  reviewedAt: v.optional(v.number()),
  reviewComments: v.optional(v.string()),
  
  // Expiration
  expiresAt: v.optional(v.number()),
  
  // Security
  isConfidential: v.boolean(),
  accessLevel: v.union(
    v.literal("public"),
    v.literal("beneficiary_only"),
    v.literal("admin_only"),
    v.literal("restricted")
  ),
  
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_entity", ["belongsTo", "entityId"])
  .index("by_uploader", ["uploadedBy"])
  .index("by_foundation", ["foundationId"])
  .index("by_status", ["foundationId", "status"])
  .index("by_document_type", ["documentTypeId"]);

// Resource library
export const resources = defineTable({
  foundationId: v.id("foundations"),
  
  title: v.string(),
  description: v.string(),
  
  // Resource Type
  resourceType: v.union(
    v.literal("study_material"),
    v.literal("career_guide"),
    v.literal("scholarship_info"),
    v.literal("educational_video"),
    v.literal("tutorial"),
    v.literal("template"),
    v.literal("handbook")
  ),
  
  // Content
  fileId: v.optional(v.id("_storage")),
  externalUrl: v.optional(v.string()),
  content: v.optional(v.string()), // For text-based resources
  
  // Categorization
  categories: v.array(v.string()), // ["Mathematics", "JAMB Prep", "Career"]
  academicLevels: v.array(v.id("academicLevels")), // Applicable levels
  
  // Access Control
  isPublic: v.boolean(), // Public or beneficiaries only
  accessLevel: v.union(
    v.literal("all_beneficiaries"),
    v.literal("specific_levels"),
    v.literal("specific_programs"),
    v.literal("admin_only")
  ),
  
  // Engagement
  downloads: v.number(),
  views: v.number(),
  rating: v.optional(v.number()), // Average rating
  
  // Publishing
  isPublished: v.boolean(),
  publishedAt: v.optional(v.number()),
  
  // Author
  createdBy: v.id("users"),
  authorName: v.optional(v.string()), // External author
  
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_foundation", ["foundationId"])
  .index("by_resource_type", ["foundationId", "resourceType"])
  .index("by_published", ["foundationId", "isPublished"]);

// Resource categories (configurable)
export const resourceCategories = defineTable({
  foundationId: v.id("foundations"),
  name: v.string(), // "Mathematics", "Science", "Career Guidance"
  description: v.optional(v.string()),
  
  parentCategoryId: v.optional(v.id("resourceCategories")), // Hierarchical
  sortOrder: v.number(),
  
  isActive: v.boolean(),
  createdAt: v.number()
}).index("by_foundation", ["foundationId"])
  .index("by_parent", ["parentCategoryId"]);
```

### Analytics & Reporting

```typescript
// Success metrics tracking
export const successMetrics = defineTable({
  foundationId: v.id("foundations"),
  beneficiaryId: v.id("beneficiaries"),
  
  // Metric Type
  metricType: v.union(
    v.literal("graduation"),
    v.literal("grade_improvement"),
    v.literal("program_completion"),
    v.literal("scholarship_earned"),
    v.literal("employment"),
    v.literal("university_admission")
  ),
  
  // Metric Details
  details: v.object({
    description: v.string(),
    value: v.optional(v.number()), // Grade improvement percentage, etc.
    dateAchieved: v.string(),
    verificationDoc: v.optional(v.id("_storage"))
  }),
  
  // Academic Context
  academicSessionId: v.optional(v.id("academicSessions")),
  academicLevelId: v.optional(v.id("academicLevels")),
  
  // Impact Measurement
  impactScore: v.optional(v.number()), // 1-10 scale
  
  // Verification
  isVerified: v.boolean(),
  verifiedBy: v.optional(v.id("users")),
  verificationDate: v.optional(v.number()),
  
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_beneficiary", ["beneficiaryId"])
  .index("by_foundation", ["foundationId"])
  .index("by_metric_type", ["foundationId", "metricType"]);

// Performance alerts
export const performanceAlerts = defineTable({
  foundationId: v.id("foundations"),
  beneficiaryId: v.id("beneficiaries"),
  ruleId: v.id("performanceRules"),
  
  // Alert Details
  alertType: v.union(
    v.literal("poor_performance"),
    v.literal("missed_deadline"),
    v.literal("attendance_low"),
    v.literal("payment_overdue"),
    v.literal("document_missing")
  ),
  
  severity: v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high"),
    v.literal("critical")
  ),
  
  // Content
  title: v.string(),
  description: v.string(),
  
  // Context
  relatedEntity: v.optional(v.string()), // "academic_session", "financial_record"
  relatedEntityId: v.optional(v.string()),
  
  // Status
  status: v.union(
    v.literal("active"),
    v.literal("acknowledged"),
    v.literal("in_progress"),
    v.literal("resolved"),
    v.literal("dismissed")
  ),
  
  // Action Taken
  actionTaken: v.optional(v.string()),
  actionBy: v.optional(v.id("users")),
  actionDate: v.optional(v.number()),
  
  // Auto-resolution
  autoResolveDate: v.optional(v.number()),
  
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_beneficiary", ["beneficiaryId"])
  .index("by_foundation", ["foundationId"])
  .index("by_status", ["foundationId", "status"])
  .index("by_severity", ["foundationId", "severity"]);

// Reports (generated)
export const reports = defineTable({
  foundationId: v.id("foundations"),
  
  // Report Information
  title: v.string(),
  description: v.string(),
  reportType: v.union(
    v.literal("financial_summary"),
    v.literal("academic_progress"),
    v.literal("program_effectiveness"),
    v.literal("donor_impact"),
    v.literal("compliance"),
    v.literal("custom")
  ),
  
  // Report Period
  periodStart: v.string(),
  periodEnd: v.string(),
  
  // Generated Content
  fileId: v.optional(v.id("_storage")), // PDF/Excel file
  data: v.optional(v.string()), // JSON data for dashboard display
  
  // Parameters Used
  parameters: v.object({
    beneficiaries: v.optional(v.array(v.id("beneficiaries"))),
    academicLevels: v.optional(v.array(v.id("academicLevels"))),
    programs: v.optional(v.array(v.id("programs"))),
    customFilters: v.optional(v.string())
  }),
  
  // Generation Info
  generatedBy: v.id("users"),
  generationTime: v.number(), // Time taken to generate
  
  // Status
  status: v.union(
    v.literal("generating"),
    v.literal("completed"),
    v.literal("failed")
  ),
  
  // Access
  isShared: v.boolean(),
  sharedWith: v.optional(v.array(v.id("users"))),
  
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_foundation", ["foundationId"])
  .index("by_report_type", ["foundationId", "reportType"])
  .index("by_generated_by", ["generatedBy"]);
```

### Donor & Sustainability Management

```typescript
// Donors
export const donors = defineTable({
  foundationId: v.id("foundations"),
  
  // Personal/Organization Information
  type: v.union(v.literal("individual"), v.literal("organization")),
  name: v.string(),
  email: v.string(),
  phone: v.optional(v.string()),
  
  // Address
  address: v.optional(v.object({
    street: v.string(),
    city: v.string(),
    state: v.string(),
    country: v.string(),
    postalCode: v.optional(v.string())
  })),
  
  // Donor Category
  category: v.union(
    v.literal("major_donor"),
    v.literal("regular_donor"),
    v.literal("one_time_donor"),
    v.literal("corporate_sponsor"),
    v.literal("foundation_grant")
  ),
  
  // Preferences
  communicationPreference: v.union(
    v.literal("email"),
    v.literal("phone"),
    v.literal("mail"),
    v.literal("no_contact")
  ),
  
  interests: v.optional(v.array(v.string())), // Areas of interest
  
  // Status
  isActive: v.boolean(),
  
  // Notes
  notes: v.optional(v.string()),
  
  // Relationship Manager
  assignedTo: v.optional(v.id("users")),
  
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_foundation", ["foundationId"])
  .index("by_category", ["foundationId", "category"])
  .index("by_assigned_to", ["assignedTo"]);

// Donations
export const donations = defineTable({
  foundationId: v.id("foundations"),
  donorId: v.id("donors"),
  
  // Donation Details
  amount: v.number(),
  currency: v.union(v.literal("NGN"), v.literal("USD")),
  donationType: v.union(
    v.literal("general"),
    v.literal("education"),
    v.literal("specific_beneficiary"),
    v.literal("program_specific"),
    v.literal("infrastructure")
  ),
  
  // Designation
  beneficiaryId: v.optional(v.id("beneficiaries")), // For specific beneficiary
  programId: v.optional(v.id("programs")), // For program-specific
  designation: v.optional(v.string()), // Free text description
  
  // Payment Information
  paymentMethod: v.union(
    v.literal("bank_transfer"),
    v.literal("check"),
    v.literal("cash"),
    v.literal("online"),
    v.literal("crypto")
  ),
  
  transactionId: v.optional(v.string()),
  receiptNumber: v.string(),
  
  // Dates
  donationDate: v.string(),
  receivedDate: v.optional(v.string()),
  
  // Recognition
  isAnonymous: v.boolean(),
  publicRecognition: v.boolean(),
  
  // Status
  status: v.union(
    v.literal("pledged"),
    v.literal("received"),
    v.literal("processed"),
    v.literal("refunded")
  ),
  
  // Thank You Tracking
  thankYouSent: v.boolean(),
  thankYouDate: v.optional(v.number()),
  thankYouMethod: v.optional(v.string()),
  
  // Notes
  notes: v.optional(v.string()),
  
  // Processing
  processedBy: v.optional(v.id("users")),
  processedAt: v.optional(v.number()),
  
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_donor", ["donorId"])
  .index("by_foundation", ["foundationId"])
  .index("by_status", ["foundationId", "status"])
  .index("by_donation_date", ["foundationId", "donationDate"]);

// Donor communications
export const donorCommunications = defineTable({
  foundationId: v.id("foundations"),
  donorId: v.id("donors"),
  
  // Communication Details
  subject: v.string(),
  content: v.string(),
  communicationType: v.union(
    v.literal("thank_you"),
    v.literal("update"),
    v.literal("impact_report"),
    v.literal("fundraising"),
    v.literal("newsletter"),
    v.literal("invitation")
  ),
  
  // Delivery
  method: v.union(
    v.literal("email"),
    v.literal("phone"),
    v.literal("mail"),
    v.literal("in_person")
  ),
  
  // Status
  status: v.union(
    v.literal("draft"),
    v.literal("sent"),
    v.literal("delivered"),
    v.literal("opened"),
    v.literal("responded")
  ),
  
  sentDate: v.optional(v.number()),
  responseDate: v.optional(v.number()),
  response: v.optional(v.string()),
  
  // Attachments
  attachments: v.optional(v.array(v.id("_storage"))),
  
  // Tracking
  sentBy: v.id("users"),
  
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_donor", ["donorId"])
  .index("by_foundation", ["foundationId"])
  .index("by_communication_type", ["foundationId", "communicationType"]);
```

### System Administration

```typescript
// Audit logs
export const auditLogs = defineTable({
  foundationId: v.id("foundations"),
  
  // User Information
  userId: v.optional(v.id("users")), // May be null for system actions
  userEmail: v.optional(v.string()),
  userRole: v.optional(v.string()),
  
  // Action Details
  action: v.string(), // "create", "update", "delete", "login", "export"
  entityType: v.string(), // "beneficiary", "financial_record", "application"
  entityId: v.optional(v.string()),
  
  // Changes Made
  changes: v.optional(v.object({
    before: v.optional(v.string()), // JSON string of old values
    after: v.optional(v.string()),  // JSON string of new values
    fields: v.array(v.string())     // Fields that changed
  })),
  
  // Context
  description: v.string(),
  ipAddress: v.optional(v.string()),
  userAgent: v.optional(v.string()),
  
  // Risk Level
  riskLevel: v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high"),
    v.literal("critical")
  ),
  
  // Session Information
  sessionId: v.optional(v.string()),
  
  createdAt: v.number()
}).index("by_foundation", ["foundationId"])
  .index("by_user", ["userId"])
  .index("by_entity", ["entityType", "entityId"])
  .index("by_action", ["foundationId", "action"])
  .index("by_risk_level", ["foundationId", "riskLevel"]);

// System settings
export const systemSettings = defineTable({
  foundationId: v.id("foundations"),
  
  // Setting Details
  category: v.string(), // "email", "notifications", "security", "integration"
  key: v.string(),
  value: v.string(), // JSON string for complex values
  
  // Metadata
  description: v.optional(v.string()),
  dataType: v.union(
    v.literal("string"),
    v.literal("number"),
    v.literal("boolean"),
    v.literal("json"),
    v.literal("encrypted")
  ),
  
  // Validation
  validationRules: v.optional(v.string()), // JSON string
  
  // Access Control
  isUserConfigurable: v.boolean(), // Can admin users modify this?
  requiresRestart: v.boolean(), // Requires system restart
  
  // Change Tracking
  lastModifiedBy: v.optional(v.id("users")),
  lastModifiedAt: v.optional(v.number()),
  
  createdAt: v.number()
}).index("by_foundation", ["foundationId"])
  .index("by_category", ["foundationId", "category"])
  .index("by_key", ["foundationId", "key"]);

// Data export jobs
export const exportJobs = defineTable({
  foundationId: v.id("foundations"),
  
  // Job Details
  jobType: v.union(
    v.literal("full_export"),
    v.literal("beneficiary_data"),
    v.literal("financial_data"),
    v.literal("academic_data"),
    v.literal("compliance_report")
  ),
  
  // Parameters
  parameters: v.object({
    dateRange: v.optional(v.object({
      start: v.string(),
      end: v.string()
    })),
    beneficiaries: v.optional(v.array(v.id("beneficiaries"))),
    includeDocuments: v.boolean(),
    format: v.union(v.literal("json"), v.literal("csv"), v.literal("excel"))
  }),
  
  // Status
  status: v.union(
    v.literal("queued"),
    v.literal("processing"),
    v.literal("completed"),
    v.literal("failed"),
    v.literal("cancelled")
  ),
  
  // Results
  fileId: v.optional(v.id("_storage")), // Generated file
  recordCount: v.optional(v.number()),
  fileSize: v.optional(v.number()), // In bytes
  
  // Progress
  progressPercentage: v.optional(v.number()),
  currentStep: v.optional(v.string()),
  
  // Error Handling
  errorMessage: v.optional(v.string()),
  retryCount: v.optional(v.number()),
  
  // Security
  downloadExpiry: v.optional(v.number()), // Timestamp when download link expires
  downloadCount: v.number(),
  maxDownloads: v.number(),
  
  // Request Info
  requestedBy: v.id("users"),
  requestReason: v.optional(v.string()),
  
  createdAt: v.number(),
  updatedAt: v.number()
}).index("by_foundation", ["foundationId"])
  .index("by_requested_by", ["requestedBy"])
  .index("by_status", ["foundationId", "status"]);
```

---

## Feature Specifications by Phase

### Phase 1: Core Foundation (Weeks 1-4)

#### 1.1 Foundation Setup & Configuration
**Admin Configuration Interface**
- Foundation settings management (exchange rates, academic calendar)
- Academic levels configuration (Nursery 1 → University Year 4)
- Fee categories setup (Tuition, Books, Uniform, Transport, etc.)
- Performance rules configuration (what triggers alerts)
- Basic user management (5 admin accounts with role assignment)

**Technical Implementation:**
```typescript
// Core configuration mutations
export const updateFoundationSettings = mutation({
  args: {
    foundationId: v.id("foundations"),
    settings: v.object({
      defaultCurrency: v.union(v.literal("NGN"), v.literal("USD")),
      exchangeRate: v.number(),
      academicYearStart: v.string(),
      academicYearEnd: v.string()
    })
  },
  handler: async (ctx, args) => {
    // Update foundation settings with audit logging
  }
});

export const createAcademicLevel = mutation({
  args: {
    foundationId: v.id("foundations"),
    name: v.string(),
    category: v.union(v.literal("nursery"), v.literal("primary"), 
                     v.literal("secondary"), v.literal("university")),
    sortOrder: v.number()
  },
  handler: async (ctx, args) => {
    // Create new academic level
  }
});
```

#### 1.2 Authentication & User Management
**Multi-Role Authentication System**
- Clerk integration with custom role management
- Role-based access control (Super Admin, Admin, Reviewer, Beneficiary, Guardian)
- User profile management
- Basic permissions system

**Technical Implementation:**
```typescript
// Role-based access control
export const getUserRole = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
    
    return user?.role || null;
  }
});

// Permission checking utility
export const hasPermission = (userRole: string, requiredRole: string) => {
  const roleHierarchy = {
    "super_admin": 5,
    "admin": 4,
    "reviewer": 3,
    "guardian": 2,
    "beneficiary": 1
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};
```

#### 1.3 Application System
**Complete Application Workflow**
- Public application form with document uploads
- Admin review interface with scoring system
- Application approval/rejection workflow
- Automatic beneficiary creation upon approval
- Application status tracking

**UI Components:**
```typescript
// Application form component
const ApplicationForm = () => {
  const [step, setStep] = useState(1);
  const [applicationData, setApplicationData] = useState({});
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <ApplicationSteps currentStep={step} />
      {step === 1 && <PersonalInfoStep />}
      {step === 2 && <EducationalBackgroundStep />}
      {step === 3 && <FinancialInfoStep />}
      {step === 4 && <DocumentUploadStep />}
      {step === 5 && <ReviewSubmitStep />}
    </div>
  );
};

// Admin review interface
const ApplicationReview = ({ applicationId }: { applicationId: string }) => {
  const application = useQuery(api.applications.getById, { applicationId });
  const documents = useQuery(api.documents.getByApplication, { applicationId });
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <ApplicationDetails application={application} />
        <DocumentViewer documents={documents} />
      </div>
      <div>
        <ReviewForm applicationId={applicationId} />
        <ReviewHistory applicationId={applicationId} />
      </div>
    </div>
  );
};
```

#### 1.4 Basic Financial Management
**Financial Record System**
- Fee category management
- Invoice upload and tracking
- Payment recording
- Basic budget planning
- Multi-currency support with exchange rate management

**Dashboard Implementation:**
```typescript
// Financial dashboard
const FinancialDashboard = () => {
  const upcomingPayments = useQuery(api.financial.getUpcomingPayments);
  const overduePayments = useQuery(api.financial.getOverduePayments);
  const monthlySpend = useQuery(api.financial.getMonthlySpend);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <FinancialCard
        title="Upcoming Payments"
        value={upcomingPayments?.totalAmount}
        count={upcomingPayments?.count}
        trend="neutral"
      />
      <FinancialCard
        title="Overdue Payments"
        value={overduePayments?.totalAmount}
        count={overduePayments?.count}
        trend="negative"
      />
      <MonthlySpendChart data={monthlySpend} />
      <ExchangeRateWidget />
    </div>
  );
};
```

#### 1.5 Document Management
**Document Upload & Storage System**
- Configurable document types
- File upload with validation
- Document categorization
- Basic document review workflow
- Secure file storage with access control

#### 1.6 Basic Dashboard
**Real-time Admin Dashboard**
- Application pipeline overview
- Financial summary widgets
- Beneficiary overview
- Quick actions panel
- System health indicators

### Phase 2: Program Operations (Weeks 5-8)

#### 2.1 Advanced Academic Tracking
**Academic Progress Management**
- Academic session registration
- Report card upload and processing
- Performance metrics tracking
- Grade progression monitoring
- Automated performance alerts

**Implementation:**
```typescript
// Academic progress tracking
export const recordAcademicProgress = mutation({
  args: {
    beneficiaryId: v.id("beneficiaries"),
    academicSessionId: v.id("academicSessions"),
    performance: v.object({
      overallGrade: v.number(),
      subjects: v.array(v.object({
        name: v.string(),
        grade: v.number(),
        comment: v.optional(v.string())
      })),
      attendance: v.number(),
      teacherComments: v.optional(v.string())
    })
  },
  handler: async (ctx, args) => {
    // Record performance and trigger alerts if needed
    const performanceRecord = await ctx.db.insert("performanceRecords", {
      foundationId: args.foundationId,
      beneficiaryId: args.beneficiaryId,
      academicSessionId: args.academicSessionId,
      ...args.performance,
      needsIntervention: args.performance.overallGrade < 60,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    // Check performance rules and create alerts
    await ctx.scheduler.runAfter(0, internal.alerts.checkPerformanceRules, {
      beneficiaryId: args.beneficiaryId,
      performanceRecordId: performanceRecord
    });
  }
});
```

#### 2.2 Program Management System
**Complete Program Management**
- Configurable program types (mentorship, workshops, tutoring)
- Program instance creation and management
- Participant enrollment and tracking
- Event scheduling and calendar integration
- Attendance tracking

#### 2.3 Communication System
**Multi-channel Communication**
- In-app notification system
- Email template management
- SMS integration (future)
- Announcement broadcasting
- Direct messaging between users

**Real-time Notifications:**
```typescript
// Real-time notification system
export const sendNotification = mutation({
  args: {
    foundationId: v.id("foundations"),
    title: v.string(),
    message: v.string(),
    recipients: v.array(v.id("users")),
    priority: v.union(v.literal("low"), v.literal("normal"), v.literal("high"))
  },
  handler: async (ctx, args) => {
    // Create notification record
    const notificationId = await ctx.db.insert("notifications", {
      foundationId: args.foundationId,
      title: args.title,
      message: args.message,
      recipients: args.recipients,
      priority: args.priority,
      isSent: true,
      sentAt: Date.now(),
      createdAt: Date.now()
    });
    
    // Real-time push to connected clients
    // Convex handles this automatically through subscriptions
  }
});

// Client-side notification subscription
const useNotifications = (userId: string) => {
  return useQuery(api.notifications.getForUser, { userId });
};
```

#### 2.4 Enhanced Financial Features
**Advanced Financial Management**
- Payment approval workflows
- Advanced budget forecasting
- Financial analytics and reporting
- Automated payment reminders
- Integration preparation for payment processors

#### 2.5 Performance Analytics
**Academic Performance Insights**
- Performance trend analysis
- At-risk beneficiary identification
- Program effectiveness measurement
- Success rate tracking
- Intervention recommendation system

### Phase 3: Analytics & Optimization (Weeks 9-12)

#### 3.1 Advanced Analytics Engine
**Comprehensive Analytics System**
- Success rate tracking and trending
- Program ROI analysis
- Predictive analytics for at-risk beneficiaries
- Financial forecasting with ML insights
- Custom report generation

**Analytics Implementation:**
```typescript
// Advanced analytics queries
export const getSuccessMetrics = query({
  args: { 
    foundationId: v.id("foundations"),
    timeRange: v.object({
      start: v.string(),
      end: v.string()
    })
  },
  handler: async (ctx, args) => {
    // Complex analytics query combining multiple data sources
    const beneficiaries = await ctx.db
      .query("beneficiaries")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    const successMetrics = await ctx.db
      .query("successMetrics")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    // Calculate graduation rates, improvement trends, etc.
    return calculateSuccessRates(beneficiaries, successMetrics, args.timeRange);
  }
});

export const getPredictiveInsights = query({
  args: { foundationId: v.id("foundations") },
  handler: async (ctx, args) => {
    // ML-style analysis for identifying at-risk beneficiaries
    const performanceData = await ctx.db
      .query("performanceRecords")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    return analyzeRiskFactors(performanceData);
  }
});
```

#### 3.2 Donor Management System
**Complete Donor Lifecycle Management**
- Donor database and segmentation
- Donation tracking and receipt generation
- Impact reporting for donors
- Thank-you automation
- Donor communication workflows

#### 3.3 Advanced Reporting
**Executive-Level Reporting**
- Impact dashboard for stakeholders
- Financial transparency reports
- Compliance reporting automation
- Custom report builder
- Scheduled report generation

#### 3.4 Mobile Optimization
**Mobile-First Experience**
- Progressive Web App (PWA) functionality
- Offline capability for poor connectivity
- Touch-optimized interfaces
- Mobile document scanning
- Push notifications

#### 3.5 Integration & API Development
**External System Integration**
- Payment processor integration (Paystack/Flutterwave)
- Email service integration (SendGrid/Mailgun)
- SMS service integration
- School information system APIs
- Government database integrations

#### 3.6 Advanced Data Management
**Enterprise Data Features**
- Advanced import/export capabilities
- Data validation and cleansing
- Backup automation
- Data archival policies
- GDPR compliance features

---

## Component Architecture

### Design System Foundation
**Using shadcn/ui + Custom TOF Components**

```typescript
// Theme configuration
const tofTheme = {
  colors: {
    primary: {
      50: "#f0f9ff",
      500: "#3b82f6", // TOF Blue
      900: "#1e3a8a"
    },
    success: {
      50: "#f0fdf4",
      500: "#22c55e",
      900: "#14532d"
    },
    warning: {
      50: "#fffbeb",
      500: "#f59e0b",
      900: "#78350f"
    },
    danger: {
      50: "#fef2f2",
      500: "#ef4444",
      900: "#7f1d1d"
    }
  },
  spacing: {
    // Mobile-first spacing
  },
  typography: {
    // Nigerian context fonts
  }
};

// Base component structure
interface TOFComponentProps {
  foundationId: string;
  userRole: UserRole;
  children?: React.ReactNode;
  className?: string;
}
```

### Core Layout Components

```typescript
// Main application shell
const AppShell = ({ children }: { children: React.ReactNode }) => {
  const user = useUser();
  const notifications = useQuery(api.notifications.getForUser, { 
    userId: user?.id 
  });
  
  return (
    <div className="min-h-screen bg-background">
      <Header notifications={notifications} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
      <NotificationToast />
    </div>
  );
};

// Responsive navigation
const Sidebar = () => {
  const { userRole } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  return (
    <aside className={cn(
      "bg-card border-r transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <NavigationMenu userRole={userRole} />
    </aside>
  );
};

// Navigation with role-based visibility
const NavigationMenu = ({ userRole }: { userRole: UserRole }) => {
  const menuItems = getMenuItemsForRole(userRole);
  
  return (
    <nav className="p-4">
      {menuItems.map((item) => (
        <NavigationItem key={item.key} {...item} />
      ))}
    </nav>
  );
};
```

### Dashboard Components

```typescript
// Main dashboard
const Dashboard = () => {
  const { foundationId, userRole } = useAuth();
  
  if (userRole === "beneficiary") {
    return <BeneficiaryDashboard />;
  }
  
  if (userRole === "guardian") {
    return <GuardianDashboard />;
  }
  
  return <AdminDashboard />;
};

// Admin dashboard with real-time widgets
const AdminDashboard = () => {
  const stats = useQuery(api.dashboard.getAdminStats);
  const recentActivity = useQuery(api.dashboard.getRecentActivity);
  const alerts = useQuery(api.alerts.getActiveAlerts);
  
  return (
    <div className="space-y-6">
      <DashboardHeader />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Beneficiaries"
          value={stats?.activeBeneficiaries}
          trend={stats?.beneficiaryTrend}
          icon={Users}
        />
        <StatCard
          title="Pending Applications"
          value={stats?.pendingApplications}
          trend={stats?.applicationTrend}
          icon={FileText}
        />
        <StatCard
          title="Monthly Budget"
          value={stats?.monthlyBudget}
          currency="NGN"
          trend={stats?.budgetTrend}
          icon={DollarSign}
        />
        <StatCard
          title="Success Rate"
          value={stats?.successRate}
          suffix="%"
          trend={stats?.successTrend}
          icon={TrendingUp}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivity activities={recentActivity} />
          <UpcomingPayments />
        </div>
        <div>
          <ActiveAlerts alerts={alerts} />
          <QuickActions />
        </div>
      </div>
    </div>
  );
};

// Reusable stat card component
const StatCard = ({ 
  title, 
  value, 
  trend, 
  icon: Icon, 
  currency,
  suffix 
}: StatCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {currency && <span className="text-sm text-muted-foreground">{currency} </span>}
          {value?.toLocaleString()}
          {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        </div>
        <TrendIndicator trend={trend} />
      </CardContent>
    </Card>
  );
};
```

### Application Management Components

```typescript
// Application review interface
const ApplicationReview = ({ applicationId }: { applicationId: string }) => {
  const application = useQuery(api.applications.getById, { applicationId });
  const documents = useQuery(api.documents.getByApplication, { applicationId });
  const [reviewData, setReviewData] = useState<ReviewFormData>();
  
  if (!application) return <ApplicationSkeleton />;
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <ApplicationHeader application={application} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Application Details */}
        <div className="lg:col-span-2 space-y-6">
          <ApplicationOverview application={application} />
          <EducationalBackground education={application.education} />
          <FinancialInformation financial={application.financial} />
          <ApplicationEssays essays={application.essays} />
          <DocumentViewer documents={documents} />
        </div>
        
        {/* Review Panel */}
        <div className="space-y-6">
          <ReviewProgress application={application} />
          <ReviewForm 
            applicationId={applicationId}
            onSubmit={handleReviewSubmit}
          />
          <ReviewHistory applicationId={applicationId} />
        </div>
      </div>
    </div>
  );
};

// Document viewer with PDF preview
const DocumentViewer = ({ documents }: { documents: Document[] }) => {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Uploaded Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents?.map((doc) => (
            <DocumentCard
              key={doc._id}
              document={doc}
              onPreview={() => setSelectedDoc(doc)}
            />
          ))}
        </div>
        
        {selectedDoc && (
          <DocumentPreviewModal
            document={selectedDoc}
            onClose={() => setSelectedDoc(null)}
          />
        )}
      </CardContent>
    </Card>
  );
};

// Review form with scoring
const ReviewForm = ({ 
  applicationId, 
  onSubmit 
}: ReviewFormProps) => {
  const form = useForm<ReviewFormSchema>();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Review</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Scoring Section */}
            <div className="space-y-4">
              <Label>Evaluation Scores (1-10)</Label>
              <ScoreInput
                name="academicPotential"
                label="Academic Potential"
                form={form}
              />
              <ScoreInput
                name="financialNeed"
                label="Financial Need"
                form={form}
              />
              <ScoreInput
                name="personalStatement"
                label="Personal Statement"
                form={form}
              />
              <ScoreInput
                name="overallFit"
                label="Overall Fit"
                form={form}
              />
            </div>
            
            {/* Comments Section */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="strengths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Strengths</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="What are the applicant's key strengths?" />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="concerns"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Concerns</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Any concerns or red flags?" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            {/* Decision */}
            <FormField
              control={form.control}
              name="decision"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recommendation</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your recommendation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="recommend_approve">Recommend Approval</SelectItem>
                      <SelectItem value="recommend_reject">Recommend Rejection</SelectItem>
                      <SelectItem value="needs_discussion">Needs Discussion</SelectItem>
                      <SelectItem value="request_more_info">Request More Info</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full">
              Submit Review
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
```

### Financial Management Components

```typescript
// Financial dashboard
const FinancialManagement = () => {
  const [activeTab, setActiveTab] = useState("overview");
  
  return (
    <div className="space-y-6">
      <FinancialHeader />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <FinancialOverview />
        </TabsContent>
        
        <TabsContent value="payments">
          <PaymentManagement />
        </TabsContent>
        
        <TabsContent value="budgets">
          <BudgetPlanning />
        </TabsContent>
        
        <TabsContent value="approvals">
          <PaymentApprovals />
        </TabsContent>
        
        <TabsContent value="reports">
          <FinancialReports />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Payment management with approval workflow
const PaymentManagement = () => {
  const payments = useQuery(api.financial.getAllPayments);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payment Management</h2>
        <Button onClick={() => setSelectedPayment("new")}>
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>
      
      <PaymentFilters />
      
      <PaymentTable
        payments={payments}
        onSelect={setSelectedPayment}
      />
      
      {selectedPayment && (
        <PaymentModal
          payment={selectedPayment === "new" ? null : selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
};

// Responsive payment table
const PaymentTable = ({ 
  payments, 
  onSelect 
}: PaymentTableProps) => {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Beneficiary</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments?.map((payment) => (
              <TableRow 
                key={payment._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSelect(payment)}
              >
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {payment.beneficiaryName?.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{payment.beneficiaryName}</p>
                      <p className="text-sm text-muted-foreground">
                        {payment.academicLevel}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{payment.feeCategory}</TableCell>
                <TableCell>
                  <div className="font-medium">
                    {payment.currency} {payment.amount.toLocaleString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className={cn(
                    "text-sm",
                    isOverdue(payment.dueDate) && "text-destructive"
                  )}>
                    {formatDate(payment.dueDate)}
                  </div>
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={payment.status} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onSelect(payment)}>
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Mark as Paid
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Request Approval
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
```

### Mobile-Responsive Patterns

```typescript
// Mobile-first responsive utilities
const useMobileBreakpoint = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

// Responsive data table
const ResponsiveTable = ({ 
  data, 
  columns, 
  mobileCard 
}: ResponsiveTableProps) => {
  const isMobile = useMobileBreakpoint();
  
  if (isMobile) {
    return (
      <div className="space-y-4">
        {data.map((item, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              {mobileCard(item)}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.key}>{column.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, index) => (
          <TableRow key={index}>
            {columns.map((column) => (
              <TableCell key={column.key}>
                {column.render ? column.render(item) : item[column.key]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// Mobile-optimized forms
const MobileForm = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="space-y-6">
      <div className="md:hidden">
        {/* Mobile-specific form layout */}
        <div className="space-y-4">
          {children}
        </div>
      </div>
      
      <div className="hidden md:block">
        {/* Desktop form layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {children}
        </div>
      </div>
    </div>
  );
};
```

---

## Admin Configuration System

### Configuration Management Interface

```typescript
// Main configuration dashboard
const ConfigurationDashboard = () => {
  const [activeSection, setActiveSection] = useState("foundation");
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      <ConfigurationHeader />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div>
          <ConfigurationNav 
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        </div>
        
        <div className="lg:col-span-3">
          {activeSection === "foundation" && <FoundationSettings />}
          {activeSection === "academic" && <AcademicConfiguration />}
          {activeSection === "financial" && <FinancialConfiguration />}
          {activeSection === "programs" && <ProgramConfiguration />}
          {activeSection === "communication" && <CommunicationSettings />}
          {activeSection === "users" && <UserManagement />}
          {activeSection === "security" && <SecuritySettings />}
        </div>
      </div>
    </div>
  );
};

// Foundation settings configuration
const FoundationSettings = () => {
  const foundation = useQuery(api.foundation.getCurrent);
  const updateSettings = useMutation(api.foundation.updateSettings);
  
  const form = useForm<FoundationSettingsSchema>({
    defaultValues: foundation?.settings
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Foundation Settings</CardTitle>
        <CardDescription>
          Configure basic foundation information and operational settings
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Foundation Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Foundation Information</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Foundation Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            {/* Financial Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Financial Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="defaultCurrency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                          <SelectItem value="USD">US Dollar (USD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="exchangeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exchange Rate (NGN to USD)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Current rate: 1 USD = {field.value} NGN
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Academic Year Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Academic Year Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="academicYearStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year Start</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="January">January</SelectItem>
                          <SelectItem value="September">September</SelectItem>
                          <SelectItem value="October">October</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="academicYearEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year End</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="July">July</SelectItem>
                          <SelectItem value="December">December</SelectItem>
                          <SelectItem value="June">June</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full">
              Save Foundation Settings
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

// Academic levels configuration
const AcademicConfiguration = () => {
  const academicLevels = useQuery(api.configuration.getAcademicLevels);
  const createLevel = useMutation(api.configuration.createAcademicLevel);
  const updateLevel = useMutation(api.configuration.updateAcademicLevel);
  const deleteLevel = useMutation(api.configuration.deleteAcademicLevel);
  
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Academic Levels</CardTitle>
              <CardDescription>
                Configure education levels for the Nigerian education system
              </CardDescription>
            </div>
            <Button onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Level
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Academic Level Categories */}
            {["nursery", "primary", "secondary", "university"].map((category) => (
              <div key={category} className="space-y-2">
                <h4 className="font-semibold capitalize">{category}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {academicLevels
                    ?.filter(level => level.category === category)
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((level) => (
                      <AcademicLevelCard
                        key={level._id}
                        level={level}
                        isEditing={isEditing === level._id}
                        onEdit={() => setIsEditing(level._id)}
                        onSave={updateLevel}
                        onCancel={() => setIsEditing(null)}
                        onDelete={() => deleteLevel({ levelId: level._id })}
                      />
                    ))}
                </div>
              </div>
            ))}
          </div>
          
          {isAdding && (
            <AddAcademicLevelForm
              onSave={createLevel}
              onCancel={() => setIsAdding(false)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Fee categories configuration
const FinancialConfiguration = () => {
  const feeCategories = useQuery(api.configuration.getFeeCategories);
  const createCategory = useMutation(api.configuration.createFeeCategory);
  const updateCategory = useMutation(api.configuration.updateFeeCategory);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fee Categories</CardTitle>
          <CardDescription>
            Configure different types of fees tracked by the system
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <FeeCategoryManager
            categories={feeCategories}
            onCreate={createCategory}
            onUpdate={updateCategory}
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Performance Rules</CardTitle>
          <CardDescription>
            Configure automated alert rules for academic performance
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <PerformanceRulesManager />
        </CardContent>
      </Card>
    </div>
  );
};

// User management interface
const UserManagement = () => {
  const users = useQuery(api.users.getAll);
  const updateUserRole = useMutation(api.users.updateRole);
  const deactivateUser = useMutation(api.users.deactivate);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </div>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <UserTable
            users={users}
            onUpdateRole={updateUserRole}
            onDeactivate={deactivateUser}
          />
        </CardContent>
      </Card>
    </div>
  );
};

---

## Data Migration & Export Strategy

### Export System Architecture

```typescript
// Export job management
export const createExportJob = mutation({
  args: {
    foundationId: v.id("foundations"),
    jobType: v.union(
      v.literal("full_export"),
      v.literal("beneficiary_data"),
      v.literal("financial_data"),
      v.literal("academic_data"),
      v.literal("compliance_report")
    ),
    parameters: v.object({
      dateRange: v.optional(v.object({
        start: v.string(),
        end: v.string()
      })),
      beneficiaries: v.optional(v.array(v.id("beneficiaries"))),
      includeDocuments: v.boolean(),
      format: v.union(v.literal("json"), v.literal("csv"), v.literal("excel"))
    })
  },
  handler: async (ctx, args) => {
    // Create export job record
    const jobId = await ctx.db.insert("exportJobs", {
      foundationId: args.foundationId,
      jobType: args.jobType,
      parameters: args.parameters,
      status: "queued",
      progressPercentage: 0,
      downloadCount: 0,
      maxDownloads: 5,
      requestedBy: ctx.auth.userId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    // Schedule background processing
    await ctx.scheduler.runAfter(0, internal.exports.processExportJob, {
      jobId
    });
    
    return jobId;
  }
});

// Background export processing
export const processExportJob = internalMutation({
  args: { jobId: v.id("exportJobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Export job not found");
    
    try {
      // Update status to processing
      await ctx.db.patch(args.jobId, {
        status: "processing",
        currentStep: "Gathering data",
        progressPercentage: 10
      });
      
      // Gather data based on job type
      const data = await gatherExportData(ctx, job);
      
      // Update progress
      await ctx.db.patch(args.jobId, {
        currentStep: "Formatting data",
        progressPercentage: 50
      });
      
      // Format data according to requested format
      const formattedData = formatExportData(data, job.parameters.format);
      
      // Store file in Convex storage
      const fileId = await ctx.storage.store(
        new Blob([formattedData], { 
          type: getContentType(job.parameters.format) 
        })
      );
      
      // Complete job
      await ctx.db.patch(args.jobId, {
        status: "completed",
        fileId,
        recordCount: data.length,
        progressPercentage: 100,
        currentStep: "Complete"
      });
      
    } catch (error) {
      // Handle errors
      await ctx.db.patch(args.jobId, {
        status: "failed",
        errorMessage: error.message
      });
    }
  }
});
```

### Data Import System

```typescript
// Import validation and processing
export const processDataImport = mutation({
  args: {
    foundationId: v.id("foundations"),
    fileId: v.id("_storage"),
    importType: v.union(
      v.literal("beneficiaries"),
      v.literal("financial_records"),
      v.literal("academic_data")
    ),
    mappingConfig: v.object({
      fieldMappings: v.record(v.string(), v.string()), // CSV column to DB field mapping
      validationRules: v.optional(v.string())
    })
  },
  handler: async (ctx, args) => {
    // Read and parse file
    const file = await ctx.storage.get(args.fileId);
    const data = await parseImportFile(file, args.importType);
    
    // Validate data structure
    const validationResults = validateImportData(data, args.mappingConfig);
    
    if (validationResults.errors.length > 0) {
      throw new Error(`Import validation failed: ${validationResults.errors.join(", ")}`);
    }
    
    // Process import in batches
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await processBatch(ctx, batch, args.importType, args.foundationId);
    }
    
    return {
      recordsProcessed: data.length,
      recordsImported: validationResults.validRecords,
      warnings: validationResults.warnings
    };
  }
});

// Batch processing for large imports
const processBatch = async (
  ctx: MutationCtx, 
  batch: any[], 
  importType: string, 
  foundationId: string
) => {
  switch (importType) {
    case "beneficiaries":
      for (const record of batch) {
        await createBeneficiaryFromImport(ctx, record, foundationId);
      }
      break;
    case "financial_records":
      for (const record of batch) {
        await createFinancialRecordFromImport(ctx, record, foundationId);
      }
      break;
    case "academic_data":
      for (const record of batch) {
        await createAcademicRecordFromImport(ctx, record, foundationId);
      }
      break;
  }
};
```

### Backup and Recovery System

```typescript
// Automated backup scheduling
export const scheduleBackup = internalAction({
  args: { foundationId: v.id("foundations") },
  handler: async (ctx, args) => {
    // Create comprehensive backup
    const backupData = {
      timestamp: new Date().toISOString(),
      foundationData: await ctx.runQuery(internal.backup.getFoundationData, {
        foundationId: args.foundationId
      }),
      beneficiaryData: await ctx.runQuery(internal.backup.getBeneficiaryData, {
        foundationId: args.foundationId
      }),
      financialData: await ctx.runQuery(internal.backup.getFinancialData, {
        foundationId: args.foundationId
      }),
      academicData: await ctx.runQuery(internal.backup.getAcademicData, {
        foundationId: args.foundationId
      }),
      schemaVersion: "1.0.0"
    };
    
    // Compress and store backup
    const compressedBackup = compressData(JSON.stringify(backupData));
    const backupFile = await ctx.storage.store(
      new Blob([compressedBackup], { type: "application/gzip" })
    );
    
    // Record backup metadata
    await ctx.runMutation(internal.backup.recordBackup, {
      foundationId: args.foundationId,
      fileId: backupFile,
      size: compressedBackup.length,
      type: "automated"
    });
  }
});

// Point-in-time recovery
export const restoreFromBackup = internalMutation({
  args: {
    foundationId: v.id("foundations"),
    backupId: v.id("backups"),
    restoreOptions: v.object({
      includeBeneficiaries: v.boolean(),
      includeFinancialData: v.boolean(),
      includeAcademicData: v.boolean(),
      createRestorePoint: v.boolean()
    })
  },
  handler: async (ctx, args) => {
    // Create restore point before recovery
    if (args.restoreOptions.createRestorePoint) {
      await ctx.scheduler.runAfter(0, internal.backup.createRestorePoint, {
        foundationId: args.foundationId
      });
    }
    
    // Load backup data
    const backup = await ctx.db.get(args.backupId);
    const backupFile = await ctx.storage.get(backup.fileId);
    const backupData = JSON.parse(decompressData(backupFile));
    
    // Restore data based on options
    if (args.restoreOptions.includeBeneficiaries) {
      await restoreBeneficiaryData(ctx, backupData.beneficiaryData);
    }
    
    if (args.restoreOptions.includeFinancialData) {
      await restoreFinancialData(ctx, backupData.financialData);
    }
    
    if (args.restoreOptions.includeAcademicData) {
      await restoreAcademicData(ctx, backupData.academicData);
    }
  }
});
```

### Compliance Export Features

```typescript
// GDPR compliance export
export const exportUserData = mutation({
  args: {
    userId: v.id("users"),
    requestType: v.union(
      v.literal("data_export"),
      v.literal("data_deletion_report"),
      v.literal("processing_activities")
    )
  },
  handler: async (ctx, args) => {
    // Gather all data related to the user
    const userData = {
      personalData: await getUserPersonalData(ctx, args.userId),
      beneficiaryData: await getUserBeneficiaryData(ctx, args.userId),
      financialData: await getUserFinancialData(ctx, args.userId),
      communicationData: await getUserCommunicationData(ctx, args.userId),
      auditTrail: await getUserAuditTrail(ctx, args.userId)
    };
    
    // Generate compliant export format
    const compliantExport = generateCompliantExport(userData, args.requestType);
    
    // Store and return download link
    const fileId = await ctx.storage.store(
      new Blob([JSON.stringify(compliantExport, null, 2)], {
        type: "application/json"
      })
    );
    
    return { fileId, expiresIn: 30 * 24 * 60 * 60 * 1000 }; // 30 days
  }
});

// Audit report generation
export const generateAuditReport = mutation({
  args: {
    foundationId: v.id("foundations"),
    reportType: v.union(
      v.literal("financial_audit"),
      v.literal("data_processing_audit"),
      v.literal("access_audit"),
      v.literal("security_audit")
    ),
    dateRange: v.object({
      start: v.string(),
      end: v.string()
    })
  },
  handler: async (ctx, args) => {
    // Generate comprehensive audit report
    const auditData = await gatherAuditData(ctx, args);
    const report = generateAuditReport(auditData, args.reportType);
    
    // Store report with restricted access
    const fileId = await ctx.storage.store(
      new Blob([report], { type: "application/pdf" })
    );
    
    // Log audit report generation
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      action: "generate_audit_report",
      entityType: "system",
      description: `Generated ${args.reportType} for period ${args.dateRange.start} to ${args.dateRange.end}`,
      riskLevel: "medium",
      userId: ctx.auth.userId,
      createdAt: Date.now()
    });
    
    return fileId;
  }
});
```

---

## Development Workflow

### AI-Optimized Development Setup

```typescript
// Convex schema validation for AI tools
export const validateSchema = () => {
  // This helps AI tools understand the complete data structure
  const schemaValidation = {
    foundations: "Foundation multi-tenancy with settings",
    users: "Multi-role user management with Clerk integration",
    applications: "Complete application workflow with documents",
    beneficiaries: "Approved applications with academic tracking",
    academicSessions: "Term/semester registration and progress",
    financialRecords: "Complete financial transaction tracking",
    programs: "Program management with participant tracking",
    documents: "File storage with metadata and access control",
    notifications: "Real-time communication system",
    reports: "Generated analytics and compliance reports"
  };
  
  return schemaValidation;
};

// Type definitions for AI development
export type FoundationContext = {
  foundationId: Id<"foundations">;
  userRole: UserRole;
  permissions: Permission[];
};

export type BeneficiaryProfile = {
  id: Id<"beneficiaries">;
  personalInfo: PersonalInfo;
  academicHistory: AcademicSession[];
  financialRecords: FinancialRecord[];
  documents: Document[];
  programs: ProgramParticipation[];
};
```

### Component Development Patterns

```typescript
// Standard component structure for AI tools
interface TOFComponentProps {
  foundationId: Id<"foundations">;
  className?: string;
  children?: React.ReactNode;
}

// Hook patterns for data fetching
const useBeneficiaryData = (beneficiaryId: Id<"beneficiaries">) => {
  const beneficiary = useQuery(api.beneficiaries.getById, { beneficiaryId });
  const academicSessions = useQuery(api.academic.getByBeneficiary, { beneficiaryId });
  const financialRecords = useQuery(api.financial.getByBeneficiary, { beneficiaryId });
  const documents = useQuery(api.documents.getByBeneficiary, { beneficiaryId });
  
  return {
    beneficiary,
    academicSessions,
    financialRecords,
    documents,
    isLoading: !beneficiary || !academicSessions || !financialRecords || !documents
  };
};

// Error boundary pattern
const TOFErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <ErrorBoundary
      fallback={({ error, resetErrorBoundary }) => (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={resetErrorBoundary}>Try again</Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};
```

### Testing Strategy with AI Tools

```typescript
// Component testing patterns
describe("ApplicationReview Component", () => {
  const mockApplication = {
    _id: "app_123" as Id<"applications">,
    foundationId: "foundation_1" as Id<"foundations">,
    firstName: "John",
    lastName: "Doe",
    status: "under_review" as const,
    // ... other required fields
  };
  
  it("displays application details correctly", () => {
    render(
      <ApplicationReview applicationId={mockApplication._id} />
    );
    
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Under Review")).toBeInTheDocument();
  });
  
  it("allows review submission", async () => {
    const user = userEvent.setup();
    
    render(
      <ApplicationReview applicationId={mockApplication._id} />
    );
    
    // Fill out review form
    await user.type(
      screen.getByLabelText("Academic Potential"),
      "8"
    );
    
    await user.click(
      screen.getByRole("button", { name: "Submit Review" })
    );
    
    // Verify review was submitted
    expect(mockSubmitReview).toHaveBeenCalledWith({
      applicationId: mockApplication._id,
      scores: { academicPotential: 8 }
    });
  });
});

// Integration testing for Convex functions
describe("Financial Records API", () => {
  it("creates financial record with audit trail", async () => {
    const { mutation } = convexTest(schema, modules);
    
    const result = await mutation(api.financial.create, {
      foundationId: "foundation_1" as Id<"foundations">,
      beneficiaryId: "ben_1" as Id<"beneficiaries">,
      amount: 50000,
      currency: "NGN",
      feeCategoryId: "cat_1" as Id<"feeCategories">,
      transactionType: "fee_invoice"
    });
    
    expect(result).toBeDefined();
    
    // Verify audit log was created
    const auditLogs = await query(api.audit.getByEntity, {
      entityType: "financial_record",
      entityId: result
    });
    
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].action).toBe("create");
  });
});
```

### CI/CD Pipeline Configuration

```yaml
# .github/workflows/deploy.yml
name: Deploy TOF Platform

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

env:
  CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
  CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run TypeScript check
        run: npm run type-check
      
      - name: Run tests
        run: npm run test
      
      - name: Run Convex schema validation
        run: npx convex dev --dry-run
  
  deploy-staging:
    if: github.ref == 'refs/heads/staging'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Convex staging
        run: |
          npx convex deploy --cmd-url-env-var-name=CONVEX_URL_STAGING
      
      - name: Deploy to Vercel staging
        run: |
          npx vercel --prod --env CONVEX_URL=$CONVEX_URL_STAGING
  
  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Convex production
        run: |
          npx convex deploy --cmd-url-env-var-name=CONVEX_URL
      
      - name: Deploy to Vercel production
        run: |
          npx vercel --prod
      
      - name: Run post-deployment tests
        run: npm run test:e2e
```

### Environment Configuration

```typescript
// lib/config.ts - Environment-specific configuration
export const config = {
  convex: {
    url: process.env.CONVEX_URL!,
  },
  clerk: {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
    secretKey: process.env.CLERK_SECRET_KEY!,
  },
  app: {
    name: "TheOyinbooke Foundation",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://tof-platform.vercel.app",
    supportEmail: "support@theoyinbookefoundation.org",
  },
  features: {
    enableSMS: process.env.ENABLE_SMS === "true",
    enablePaymentIntegration: process.env.ENABLE_PAYMENTS === "true",
    enableAnalytics: process.env.ENABLE_ANALYTICS === "true",
  },
};

// Validation
const requiredEnvVars = [
  "CONVEX_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
```

---

## Testing Strategy

### Comprehensive Testing Framework

```typescript
// Testing utilities for Convex + React
import { convexTest } from "convex-test";
import { render, screen, userEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Test providers wrapper
const TestProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      <ClerkProvider publishableKey="test-key">
        {children}
      </ClerkProvider>
    </QueryClientProvider>
  );
};

// Custom render function
const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui, { wrapper: TestProviders });
};

// Mock data factories
export const createMockApplication = (overrides = {}) => ({
  _id: "app_test_123" as Id<"applications">,
  foundationId: "foundation_test" as Id<"foundations">,
  applicationNumber: "TOF-2024-001",
  firstName: "John",
  lastName: "Doe",
  status: "submitted" as const,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

export const createMockBeneficiary = (overrides = {}) => ({
  _id: "ben_test_123" as Id<"beneficiaries">,
  foundationId: "foundation_test" as Id<"foundations">,
  userId: "user_test_123" as Id<"users">,
  beneficiaryNumber: "TOF-BEN-2024-001",
  status: "active" as const,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});
```

### Unit Testing Patterns

```typescript
// Testing Convex mutations
describe("Financial Record Management", () => {
  const ctx = convexTest(schema, modules);
  
  beforeEach(async () => {
    // Set up test data
    await ctx.run(async (ctx) => {
      await ctx.db.insert("foundations", {
        name: "Test Foundation",
        settings: {
          defaultCurrency: "NGN",
          exchangeRate: 750,
          academicYearStart: "September",
          academicYearEnd: "July"
        },
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    });
  });
  
  it("creates financial record with proper validation", async () => {
    const result = await ctx.mutation(api.financial.create, {
      foundationId: "foundation_test" as Id<"foundations">,
      beneficiaryId: "ben_test" as Id<"beneficiaries">,
      feeCategoryId: "cat_test" as Id<"feeCategories">,
      amount: 50000,
      currency: "NGN",
      transactionType: "fee_invoice",
      description: "School fees for Term 1"
    });
    
    expect(result).toBeDefined();
    
    // Verify record was created with correct data
    const record = await ctx.query(api.financial.getById, { id: result });
    expect(record.amount).toBe(50000);
    expect(record.currency).toBe("NGN");
    expect(record.status).toBe("pending");
  });
  
  it("enforces currency validation", async () => {
    await expect(
      ctx.mutation(api.financial.create, {
        foundationId: "foundation_test" as Id<"foundations">,
        beneficiaryId: "ben_test" as Id<"beneficiaries">,
        feeCategoryId: "cat_test" as Id<"feeCategories">,
        amount: 50000,
        currency: "EUR" as any, // Invalid currency
        transactionType: "fee_invoice"
      })
    ).rejects.toThrow("Invalid currency");
  });
  
  it("creates audit log on financial record creation", async () => {
    const recordId = await ctx.mutation(api.financial.create, {
      foundationId: "foundation_test" as Id<"foundations">,
      beneficiaryId: "ben_test" as Id<"beneficiaries">,
      feeCategoryId: "cat_test" as Id<"feeCategories">,
      amount: 50000,
      currency: "NGN",
      transactionType: "fee_invoice"
    });
    
    const auditLogs = await ctx.query(api.audit.getByEntity, {
      entityType: "financial_record",
      entityId: recordId
    });
    
    expect(auditLogs).toHaveLength(1);
    expect(auditLogs[0].action).toBe("create");
    expect(auditLogs[0].description).toContain("financial record");
  });
});
```

### Component Testing

```typescript
// Testing React components with Convex integration
describe("BeneficiaryDashboard", () => {
  const mockBeneficiary = createMockBeneficiary();
  
  beforeEach(() => {
    // Mock Convex queries
    vi.mocked(useQuery).mockImplementation((query) => {
      if (query === api.beneficiaries.getById) {
        return mockBeneficiary;
      }
      if (query === api.academic.getByBeneficiary) {
        return [createMockAcademicSession()];
      }
      return null;
    });
  });
  
  it("displays beneficiary information", () => {
    renderWithProviders(
      <BeneficiaryDashboard beneficiaryId={mockBeneficiary._id} />
    );
    
    expect(screen.getByText(mockBeneficiary.beneficiaryNumber)).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
  
  it("shows academic progress", () => {
    renderWithProviders(
      <BeneficiaryDashboard beneficiaryId={mockBeneficiary._id} />
    );
    
    expect(screen.getByText("Academic Progress")).toBeInTheDocument();
    expect(screen.getByTestId("progress-chart")).toBeInTheDocument();
  });
  
  it("handles loading states", () => {
    vi.mocked(useQuery).mockReturnValue(undefined);
    
    renderWithProviders(
      <BeneficiaryDashboard beneficiaryId={mockBeneficiary._id} />
    );
    
    expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
  });
});

// Testing form interactions
describe("ApplicationForm", () => {
  it("submits application with complete data", async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();
    
    renderWithProviders(
      <ApplicationForm onSubmit={mockSubmit} />
    );
    
    // Fill out form
    await user.type(screen.getByLabelText("First Name"), "John");
    await user.type(screen.getByLabelText("Last Name"), "Doe");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    
    // Select academic level
    await user.click(screen.getByLabelText("Current Academic Level"));
    await user.click(screen.getByText("Primary 5"));
    
    // Upload document
    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    const fileInput = screen.getByLabelText("Birth Certificate");
    await user.upload(fileInput, file);
    
    // Submit form
    await user.click(screen.getByRole("button", { name: "Submit Application" }));
    
    expect(mockSubmit).toHaveBeenCalledWith({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      currentLevel: "Primary 5",
      documents: expect.any(Array)
    });
  });
  
  it("validates required fields", async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<ApplicationForm onSubmit={vi.fn()} />);
    
    await user.click(screen.getByRole("button", { name: "Submit Application" }));
    
    expect(screen.getByText("First name is required")).toBeInTheDocument();
    expect(screen.getByText("Last name is required")).toBeInTheDocument();
  });
});
```

### Integration Testing

```typescript
// End-to-end testing with Playwright
import { test, expect } from "@playwright/test";

test.describe("Application Workflow", () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto("/");
    await page.click('text="Apply Now"');
  });
  
  test("complete application submission flow", async ({ page }) => {
    // Fill personal information
    await page.fill('[data-testid="firstName"]', "John");
    await page.fill('[data-testid="lastName"]', "Doe");
    await page.fill('[data-testid="email"]', "john@example.com");
    await page.click('button:text("Next")');
    
    // Fill educational background
    await page.selectOption('[data-testid="currentLevel"]', "Primary 5");
    await page.fill('[data-testid="currentSchool"]', "Test Primary School");
    await page.click('button:text("Next")');
    
    // Upload documents
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("tests/fixtures/sample-document.pdf");
    await page.click('button:text("Next")');
    
    // Review and submit
    await page.click('button:text("Submit Application")');
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('text="Application submitted successfully"')).toBeVisible();
  });
  
  test("admin can review applications", async ({ page }) => {
    // Login as admin
    await page.goto("/admin/login");
    await page.fill('[data-testid="email"]', "admin@tof.org");
    await page.fill('[data-testid="password"]', "test123");
    await page.click('button:text("Sign In")');
    
    // Navigate to applications
    await page.click('text="Applications"');
    
    // Open first application
    await page.click('[data-testid="application-row"]:first-child');
    
    // Fill review form
    await page.fill('[data-testid="academicPotential"]', "8");
    await page.fill('[data-testid="financialNeed"]', "9");
    await page.fill('[data-testid="strengths"]', "Strong academic background");
    await page.selectOption('[data-testid="decision"]', "recommend_approve");
    
    // Submit review
    await page.click('button:text("Submit Review")');
    
    // Verify review was saved
    await expect(page.locator('text="Review submitted successfully"')).toBeVisible();
  });
});

// Performance testing
test.describe("Performance", () => {
  test("dashboard loads within acceptable time", async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto("/admin/dashboard");
    await page.waitForSelector('[data-testid="dashboard-content"]');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3 second limit
  });
  
  test("large beneficiary list renders efficiently", async ({ page }) => {
    await page.goto("/admin/beneficiaries");
    
    // Wait for initial load
    await page.waitForSelector('[data-testid="beneficiary-table"]');
    
    // Test scrolling performance
    const startTime = Date.now();
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    const scrollTime = Date.now() - startTime;
    expect(scrollTime).toBeLessThan(1000); // Smooth scrolling
  });
});
```

### Accessibility Testing

```typescript
// Accessibility testing with jest-axe
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

describe("Accessibility", () => {
  it("dashboard has no accessibility violations", async () => {
    const { container } = renderWithProviders(
      <AdminDashboard />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it("application form is keyboard navigable", async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<ApplicationForm onSubmit={vi.fn()} />);
    
    // Tab through form elements
    await user.tab();
    expect(screen.getByLabelText("First Name")).toHaveFocus();
    
    await user.tab();
    expect(screen.getByLabelText("Last Name")).toHaveFocus();
    
    // Verify all interactive elements are reachable
    const interactiveElements = screen.getAllByRole("textbox")
      .concat(screen.getAllByRole("button"))
      .concat(screen.getAllByRole("combobox"));
    
    for (const element of interactiveElements) {
      expect(element).toBeVisible();
    }
  });
  
  it("has proper ARIA labels", () => {
    renderWithProviders(<PaymentTable payments={mockPayments} />);
    
    expect(screen.getByRole("table")).toHaveAttribute("aria-label", "Payment records");
    expect(screen.getByRole("columnheader", { name: "Amount" })).toBeInTheDocument();
  });
});
```

---

## Deployment & Scaling Plan

### Production Architecture

```typescript
// Environment-specific configurations
const environments = {
  development: {
    convex: "https://dev-tof.convex.cloud",
    domain: "localhost:3000",
    features: {
      debugMode: true,
      mockPayments: true,
      emailSimulation: true
    }
  },
  staging: {
    convex: "https://staging-tof.convex.cloud",
    domain: "staging-tof.vercel.app",
    features: {
      debugMode: false,
      mockPayments: true,
      emailSimulation: false
    }
  },
  production: {
    convex: "https://prod-tof.convex.cloud",
    domain: "platform.theoyinbookefoundation.org",
    features: {
      debugMode: false,
      mockPayments: false,
      emailSimulation: false
    }
  }
};

// Infrastructure configuration
export const infraConfig = {
  database: {
    // Convex handles scaling automatically
    maxConnections: "unlimited",
    replication: "multi-region",
    backup: "automatic"
  },
  cdn: {
    provider: "Vercel Edge Network",
    regions: ["lagos", "london", "virginia"],
    caching: {
      static: "31536000", // 1 year
      api: "300",         // 5 minutes
      images: "2592000"   // 30 days
    }
  },
  monitoring: {
    uptime: "Vercel Analytics",
    errors: "Sentry",
    performance: "Vercel Speed Insights"
  }
};
```

### Scalability Strategies

```typescript
// Database optimization for scale
export const optimizeQueries = {
  // Efficient pagination
  getBeneficiariesPaginated: query({
    args: {
      foundationId: v.id("foundations"),
      paginationOpts: paginationOptsValidator,
      filters: v.optional(v.object({
        status: v.optional(v.string()),
        academicLevel: v.optional(v.string()),
        searchTerm: v.optional(v.string())
      }))
    },
    handler: async (ctx, args) => {
      let query = ctx.db
        .query("beneficiaries")
        .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));
      
      // Apply filters
      if (args.filters?.status) {
        query = query.filter((q) => q.eq(q.field("status"), args.filters.status));
      }
      
      if (args.filters?.searchTerm) {
        // Use search index for text search
        query = ctx.db
          .query("beneficiaries")
          .withSearchIndex("search_beneficiaries", (q) =>
            q.search("searchableText", args.filters.searchTerm)
              .eq("foundationId", args.foundationId)
          );
      }
      
      return await query
        .order("desc")
        .paginate(args.paginationOpts);
    }
  }),
  
  // Optimized dashboard stats
  getDashboardStats: query({
    args: { foundationId: v.id("foundations") },
    handler: async (ctx, args) => {
      // Parallel queries for better performance
      const [
        activeBeneficiaries,
        pendingApplications,
        monthlySpend,
        upcomingPayments
      ] = await Promise.all([
        ctx.db
          .query("beneficiaries")
          .withIndex("by_status", (q) => 
            q.eq("foundationId", args.foundationId).eq("status", "active")
          )
          .collect(),
        ctx.db
          .query("applications")
          .withIndex("by_status", (q) =>
            q.eq("foundationId", args.foundationId).eq("status", "under_review")
          )
          .collect(),
        ctx.db
          .query("financialRecords")
          .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
          .filter((q) => q.gte(q.field("createdAt"), Date.now() - 30 * 24 * 60 * 60 * 1000))
          .collect(),
        ctx.db
          .query("financialRecords")
          .withIndex("by_status", (q) =>
            q.eq("foundationId", args.foundationId).eq("status", "pending")
          )
          .collect()
      ]);
      
      return {
        activeBeneficiaries: activeBeneficiaries.length,
        pendingApplications: pendingApplications.length,
        monthlySpend: monthlySpend.reduce((sum, record) => sum + record.amount, 0),
        upcomingPayments: upcomingPayments.length
      };
    }
  })
};

// Caching strategies
export const cacheConfig = {
  // Static data caching
  staticData: {
    academicLevels: "1 hour",
    feeCategories: "1 hour",
    foundationSettings: "30 minutes"
  },
  
  // Dynamic data caching
  dynamicData: {
    dashboardStats: "5 minutes",
    beneficiaryList: "2 minutes",
    notifications: "1 minute"
  },
  
  // Real-time data (no caching)
  realTime: [
    "applicationStatus",
    "paymentApprovals",
    "newMessages"
  ]
};
```

### Performance Optimization

```typescript
// Image optimization configuration
export const imageConfig = {
  domains: ["files.convex.cloud", "images.clerk.dev"],
  formats: ["image/webp", "image/avif"],
  sizes: {
    avatar: [32, 64, 128],
    thumbnail: [150, 300],
    document: [400, 800, 1200],
    hero: [800, 1200, 1600]
  },
  quality: 85
};

// Code splitting strategy
export const codeSpitting = {
  pages: {
    // Core pages loaded immediately
    core: ["/", "/dashboard", "/login"],
    
    // Admin pages lazy loaded
    admin: ["/admin/*"],
    
    // Beneficiary pages lazy loaded
    beneficiary: ["/beneficiary/*"],
    
    // Reports lazy loaded
    reports: ["/reports/*"]
  },
  
  components: {
    // Heavy components lazy loaded
    lazy: [
      "DocumentViewer",
      "ReportGenerator",
      "AnalyticsChart",
      "FileUploader"
    ]
  }
};

// Bundle optimization
export const bundleConfig = {
  chunks: {
    vendor: ["react", "react-dom", "@clerk/nextjs"],
    convex: ["convex/react"],
    ui: ["@radix-ui/*", "lucide-react"],
    charts: ["recharts"],
    utils: ["date-fns", "lodash"]
  },
  
  treeshaking: {
    enabled: true,
    sideEffects: false
  }
};
```

### Monitoring & Analytics

```typescript
// Error tracking setup
export const errorTracking = {
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay()
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1
  },
  
  customTracking: {
    applicationSubmissions: "track conversion rates",
    paymentProcessing: "monitor payment success rates",
    userEngagement: "track feature usage",
    performanceMetrics: "monitor load times"
  }
};

// Health checks
export const healthChecks = {
  endpoints: [
    "/api/health",
    "/api/health/database",
    "/api/health/storage",
    "/api/health/auth"
  ],
  
  monitors: {
    uptime: {
      interval: "1 minute",
      timeout: "30 seconds",
      regions: ["lagos", "london"]
    },
    
    performance: {
      metrics: ["response_time", "memory_usage", "error_rate"],
      thresholds: {
        response_time: "2000ms",
        error_rate: "1%"
      }
    }
  }
};

// Analytics dashboard
export const analyticsConfig = {
  metrics: {
    business: [
      "application_conversion_rate",
      "beneficiary_retention_rate",
      "program_completion_rate",
      "financial_efficiency_ratio"
    ],
    
    technical: [
      "page_load_times",
      "api_response_times",
      "error_rates",
      "user_satisfaction_score"
    ]
  },
  
  alerts: {
    critical: [
      "system_down",
      "data_breach",
      "payment_failure_spike"
    ],
    
    warning: [
      "high_error_rate",
      "slow_response_times",
      "low_user_engagement"
    ]
  }
};
```

### Security Hardening

```typescript
// Security configuration
export const securityConfig = {
  authentication: {
    provider: "Clerk",
    mfa: "required_for_admins",
    sessionTimeout: "8 hours",
    passwordPolicy: {
      minLength: 12,
      requireNumbers: true,
      requireSymbols: true,
      requireUppercase: true
    }
  },
  
  dataProtection: {
    encryption: {
      inTransit: "TLS 1.3",
      atRest: "AES-256",
      keys: "managed_by_convex"
    },
    
    accessControl: {
      rbac: "enabled",
      dataIsolation: "by_foundation",
      auditLogging: "comprehensive"
    }
  },
  
  apiSecurity: {
    rateLimiting: {
      global: "1000 requests/hour",
      perUser: "100 requests/minute",
      authentication: "10 attempts/minute"
    },
    
    cors: {
      origins: [
        "https://platform.theoyinbookefoundation.org",
        "https://staging-tof.vercel.app"
      ]
    }
  }
};

// Compliance measures
export const compliance = {
  dataPrivacy: {
    gdpr: "implemented",
    dataRetention: "7 years",
    rightToErasure: "automated",
    dataPortability: "json_export"
  },
  
  financial: {
    auditTrail: "immutable",
    financialReporting: "automated",
    complianceChecks: "monthly"
  },
  
  security: {
    vulnerabilityScanning: "weekly",
    penetrationTesting: "quarterly",
    securityTraining: "mandatory"
  }
};
```

### Disaster Recovery

```typescript
// Backup and recovery strategy
export const backupStrategy = {
  automated: {
    frequency: "daily",
    retention: "30 days",
    storage: "multi_region",
    encryption: "enabled"
  },
  
  manual: {
    beforeMajorChanges: "required",
    beforeDataMigration: "required",
    retention: "1 year"
  },
  
  recovery: {
    rto: "4 hours", // Recovery Time Objective
    rpo: "1 hour",  // Recovery Point Objective
    testing: "monthly"
  }
};

// Incident response plan
export const incidentResponse = {
  severityLevels: {
    critical: {
      responseTime: "15 minutes",
      escalation: "immediate",
      communication: "all_stakeholders"
    },
    
    high: {
      responseTime: "1 hour",
      escalation: "2 hours",
      communication: "affected_users"
    },
    
    medium: {
      responseTime: "4 hours",
      escalation: "next_business_day",
      communication: "status_page"
    }
  },
  
  procedures: {
    detection: "automated_monitoring",
    assessment: "severity_classification",
    response: "predefined_playbooks",
    communication: "status_updates",
    resolution: "root_cause_analysis",
    postMortem: "lessons_learned"
  }
};
```

---

## Summary & Next Steps

This comprehensive technical specification provides the complete blueprint for building the TheOyinbooke Foundation Management Platform. The system is designed to be:

### **Scalable & Future-Ready**
- Built on Convex for real-time capabilities and automatic scaling
- Microservice-ready architecture with clear separation of concerns
- Configurable system that can adapt to changing requirements

### **Mobile-First & Accessible**
- Responsive design optimized for Nigerian connectivity
- Progressive Web App capabilities
- Full accessibility compliance

### **Admin-Configurable**
- Complete admin interface for system configuration
- No code changes needed for operational adjustments
- Flexible program and fee management

### **Data-Driven & Compliant**
- Comprehensive analytics and reporting
- Complete audit trails for compliance
- GDPR-ready data export and deletion

### **Developer-Friendly**
- Optimized for AI development tools (Cursor, Windsurf, Claude Code)
- Clear TypeScript types throughout
- Comprehensive testing strategy

### **Immediate Action Plan**

1. **Week 1**: Set up development environment and core Convex schema
2. **Week 2**: Build authentication system and basic admin interface
3. **Week 3**: Implement application workflow and document management
4. **Week 4**: Create financial management system
5. **Week 5**: Build beneficiary dashboard and academic tracking
6. **Week 6**: Implement program management and communication system
7. **Week 7**: Add analytics and reporting features
8. **Week 8**: Mobile optimization and testing
9. **Week 9**: Security hardening and performance optimization
10. **Week 10**: User acceptance testing and deployment preparation

With your AI development toolset and this detailed specification, you're well-positioned to build a world-class foundation management platform that will serve TheOyinbooke Foundation's mission effectively.

The modular architecture ensures you can start simple and add complexity gradually, while the comprehensive data model means you won't need major refactoring as requirements evolve.