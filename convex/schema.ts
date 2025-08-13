// convex/schema.ts
// TheOyinbooke Foundation Management Platform - Complete Database Schema

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ===================================
  // CORE FOUNDATION ENTITIES
  // ===================================

  // Foundation multi-tenancy support
  foundations: defineTable({
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
  }),

  // User management with role-based access
  users: defineTable({
    clerkId: v.string(),
    foundationId: v.optional(v.id("foundations")),
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
    
    // Communication preferences
    communicationPreferences: v.optional(v.object({
      emailNotifications: v.boolean(),
      smsNotifications: v.boolean(),
      academicAlerts: v.boolean(),
      financialAlerts: v.boolean(),
      administrativeNotifications: v.boolean(),
      marketingCommunications: v.boolean(),
    })),
    
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_clerk_id", ["clerkId"])
    .index("by_foundation", ["foundationId"])
    .index("by_email", ["email"])
    .index("by_role", ["foundationId", "role"]),

  // ===================================
  // CONFIGURATION & SETTINGS
  // ===================================

  // Configurable academic levels
  academicLevels: defineTable({
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
    .index("by_category", ["foundationId", "category"]),

  // Configurable fee categories
  feeCategories: defineTable({
    foundationId: v.id("foundations"),
    name: v.string(), // "Tuition", "Books", "Uniform", "Transport"
    description: v.optional(v.string()),
    isRequired: v.boolean(), // Must be paid each term
    sortOrder: v.number(),
    isActive: v.boolean(),
    createdAt: v.number()
  }).index("by_foundation", ["foundationId"]),

  // Performance alert rules (configurable)
  performanceRules: defineTable({
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
  }).index("by_foundation", ["foundationId"]),

  // ===================================
  // APPLICATION & ONBOARDING SYSTEM
  // ===================================

  // Application submissions
  applications: defineTable({
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
    .index("by_application_number", ["applicationNumber"]),

  // Application reviews and decisions
  applicationReviews: defineTable({
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
    .index("by_reviewer", ["reviewerId"]),

  // Relationships between users (parent-child, mentor-mentee)
  relationships: defineTable({
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
    .index("by_foundation", ["foundationId"]),

  // Beneficiaries (approved applications)
  beneficiaries: defineTable({
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
    .index("by_beneficiary_number", ["beneficiaryNumber"]),

  // ===================================
  // ACADEMIC MANAGEMENT SYSTEM
  // ===================================

  // Academic sessions (terms/semesters)
  academicSessions: defineTable({
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
    .index("by_status", ["foundationId", "status"]),

  // Academic performance tracking
  performanceRecords: defineTable({
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
    .index("by_foundation", ["foundationId"]),

  // Schools database
  schools: defineTable({
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
    .index("by_school_type", ["foundationId", "schoolType"]),

  // ===================================
  // FINANCIAL MANAGEMENT SYSTEM
  // ===================================

  // Financial records (all money movements)
  financialRecords: defineTable({
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
    .index("by_session", ["academicSessionId"]),

  // Budget planning and forecasting
  budgetPlan: defineTable({
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
    .index("by_status", ["foundationId", "status"]),

  // Payment approvals workflow
  paymentApprovals: defineTable({
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
    .index("by_status", ["foundationId", "overallStatus"]),

  // ===================================
  // PROGRAM MANAGEMENT SYSTEM
  // ===================================

  // Program types (configurable)
  programTypes: defineTable({
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
  }).index("by_foundation", ["foundationId"]),

  // Program instances
  programs: defineTable({
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
    .index("by_status", ["foundationId", "status"]),

  // Program participants
  programParticipants: defineTable({
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
    .index("by_foundation", ["foundationId"]),

  // Events and calendar
  events: defineTable({
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
    .index("by_organizer", ["organizerId"]),

  // Event attendance
  eventAttendance: defineTable({
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
    .index("by_foundation", ["foundationId"]),

  // ===================================
  // COMMUNICATION SYSTEM
  // ===================================

  // Notifications system
  notifications: defineTable({
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
    .index("by_priority", ["foundationId", "priority"]),


  // Announcements
  announcements: defineTable({
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
    .index("by_target", ["foundationId", "targetAudience"]),

  // ===================================
  // DOCUMENT & RESOURCE MANAGEMENT
  // ===================================

  // Document types (configurable)
  documentTypes: defineTable({
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
    .index("by_category", ["foundationId", "category"]),

  // Document storage
  documents: defineTable({
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
    .index("by_document_type", ["documentTypeId"]),

  // Resource library
  resources: defineTable({
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
    .index("by_published", ["foundationId", "isPublished"]),

  // Resource categories (configurable)
  resourceCategories: defineTable({
    foundationId: v.id("foundations"),
    name: v.string(), // "Mathematics", "Science", "Career Guidance"
    description: v.optional(v.string()),
    
    parentCategoryId: v.optional(v.id("resourceCategories")), // Hierarchical
    sortOrder: v.number(),
    
    isActive: v.boolean(),
    createdAt: v.number()
  }).index("by_foundation", ["foundationId"])
    .index("by_parent", ["parentCategoryId"]),

  // ===================================
  // ANALYTICS & REPORTING
  // ===================================

  // Success metrics tracking
  successMetrics: defineTable({
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
    .index("by_metric_type", ["foundationId", "metricType"]),

  // Performance alerts
  performanceAlerts: defineTable({
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
    .index("by_severity", ["foundationId", "severity"]),

  // Reports (generated)
  reports: defineTable({
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
    .index("by_generated_by", ["generatedBy"]),

  // ===================================
  // DONOR & SUSTAINABILITY MANAGEMENT
  // ===================================

  // Donors
  donors: defineTable({
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
    .index("by_assigned_to", ["assignedTo"]),

  // Donations
  donations: defineTable({
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
    .index("by_donation_date", ["foundationId", "donationDate"]),

  // Donor communications
  donorCommunications: defineTable({
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
    .index("by_communication_type", ["foundationId", "communicationType"]),

  // ===================================
  // SYSTEM ADMINISTRATION
  // ===================================

  // Audit logs
  auditLogs: defineTable({
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
    .index("by_risk_level", ["foundationId", "riskLevel"]),

  // System settings
  systemSettings: defineTable({
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
    .index("by_key", ["foundationId", "key"]),

  // Data export jobs
  exportJobs: defineTable({
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
    .index("by_status", ["foundationId", "status"]),

  // ===================================
  // PROGRAM MANAGEMENT EXTENDED TABLES
  // ===================================

  // Program enrollments
  programEnrollments: defineTable({
    foundationId: v.id("foundations"),
    programId: v.id("programs"),
    beneficiaryId: v.id("beneficiaries"),
    
    status: v.union(
      v.literal("enrolled"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("withdrawn")
    ),
    
    enrolledAt: v.number(),
    enrolledBy: v.id("users"),
    notes: v.optional(v.string()),
    
    // Attendance tracking
    attendance: v.optional(v.array(v.object({
      sessionId: v.id("programSessions"),
      sessionDate: v.number(),
      status: v.union(v.literal("present"), v.literal("absent"), v.literal("late")),
      notes: v.optional(v.string())
    }))),
    
    // Performance tracking
    performance: v.optional(v.object({
      score: v.number(),
      feedback: v.optional(v.string()),
      lastUpdated: v.number()
    })),
    
    completionStatus: v.union(
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("dropped_out")
    ),
    
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_foundation", ["foundationId"])
    .index("by_program", ["programId"])
    .index("by_beneficiary", ["beneficiaryId"])
    .index("by_program_beneficiary", ["programId", "beneficiaryId"]),

  // Program sessions
  programSessions: defineTable({
    foundationId: v.id("foundations"),
    programId: v.id("programs"),
    
    title: v.string(),
    description: v.optional(v.string()),
    sessionDate: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    location: v.optional(v.string()),
    facilitator: v.optional(v.string()),
    
    materials: v.optional(v.array(v.string())),
    objectives: v.optional(v.array(v.string())),
    
    status: v.union(
      v.literal("scheduled"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    
    // Attendance tracking
    attendanceRecorded: v.boolean(),
    attendance: v.optional(v.array(v.object({
      enrollmentId: v.id("programEnrollments"),
      status: v.union(v.literal("present"), v.literal("absent"), v.literal("late")),
      notes: v.optional(v.string())
    }))),
    attendanceRecordedBy: v.optional(v.id("users")),
    attendanceRecordedAt: v.optional(v.number()),
    
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_foundation", ["foundationId"])
    .index("by_program", ["programId"]),

  // ===================================
  // FINANCIAL EXTENDED TABLES
  // ===================================

  // Invoices
  invoices: defineTable({
    foundationId: v.id("foundations"),
    beneficiaryId: v.id("beneficiaries"),
    
    invoiceNumber: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    
    totalAmount: v.number(),
    currency: v.union(v.literal("NGN"), v.literal("USD")),
    
    status: v.union(
      v.literal("draft"),
      v.literal("pending"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("cancelled")
    ),
    
    dueDate: v.number(),
    paidDate: v.optional(v.number()),
    
    items: v.array(v.object({
      description: v.string(),
      quantity: v.number(),
      unitPrice: v.number(),
      total: v.number()
    })),
    
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_foundation", ["foundationId"])
    .index("by_beneficiary", ["beneficiaryId"])
    .index("by_status", ["foundationId", "status"]),

  // ===================================
  // FILE MANAGEMENT
  // ===================================

  // File storage and metadata
  files: defineTable({
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(), // MIME type
    size: v.number(), // Size in bytes
    
    // Associations
    foundationId: v.optional(v.id("foundations")),
    applicationId: v.optional(v.id("applications")),
    beneficiaryId: v.optional(v.id("beneficiaries")),
    documentType: v.optional(v.string()), // e.g., "passport_photo", "birth_certificate"
    
    // Metadata
    uploadedBy: v.optional(v.id("users")),
    uploadedAt: v.number(),
    clerkUserId: v.optional(v.string()),
    
    // File processing
    isProcessed: v.optional(v.boolean()),
    processingError: v.optional(v.string()),
    
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number())
  }).index("by_storage", ["storageId"])
    .index("by_application", ["applicationId"])
    .index("by_beneficiary", ["beneficiaryId"])
    .index("by_foundation", ["foundationId"])
    .index("by_document_type", ["foundationId", "documentType"])
    .index("by_uploader", ["uploadedBy"]),

  // ===================================
  // EXTERNAL COMMUNICATION SYSTEM
  // ===================================

  // Communication logs for email/SMS tracking
  communicationLogs: defineTable({
    foundationId: v.id("foundations"),
    
    // Communication details
    type: v.union(v.literal("email"), v.literal("sms")),
    recipient: v.string(), // Email address or phone number
    subject: v.optional(v.string()), // For emails
    content: v.string(),
    
    // Template information
    template: v.optional(v.string()),
    templateData: v.optional(v.object({})),
    
    // Status tracking
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed"),
      v.literal("bounced")
    ),
    
    // Delivery information
    sentAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    
    // Error handling
    attemptCount: v.number(),
    lastAttemptAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    
    // Priority
    priority: v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    ),
    
    // External service details
    externalMessageId: v.optional(v.string()), // Provider's message ID
    externalStatus: v.optional(v.string()), // Provider's status
    
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_foundation", ["foundationId"])
    .index("by_type", ["foundationId", "type"])
    .index("by_status", ["foundationId", "status"])
    .index("by_recipient", ["recipient"]),

  // Enhanced communication templates
  communicationTemplates: defineTable({
    foundationId: v.id("foundations"),
    
    name: v.string(),
    description: v.optional(v.string()),
    
    // Template type and category
    type: v.union(v.literal("email"), v.literal("sms")),
    category: v.union(
      v.literal("academic"),
      v.literal("financial"),
      v.literal("administrative"),
      v.literal("alert"),
      v.literal("welcome")
    ),
    
    // Template content
    subject: v.optional(v.string()), // For email templates
    content: v.string(),
    
    // Available variables for substitution
    variables: v.array(v.string()), // ["firstName", "amount", "dueDate"]
    
    // Template status
    isActive: v.boolean(),
    
    // Usage statistics
    usageCount: v.optional(v.number()),
    lastUsed: v.optional(v.number()),
    
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_foundation", ["foundationId"])
    .index("by_type", ["foundationId", "type"])
    .index("by_category", ["foundationId", "category"]),

  // Bulk communication tracking
  bulkCommunications: defineTable({
    foundationId: v.id("foundations"),
    
    // Communication details
    subject: v.optional(v.string()),
    message: v.string(),
    channels: v.array(v.union(v.literal("email"), v.literal("sms"), v.literal("in_app"))),
    
    // Template information
    templateId: v.optional(v.id("communicationTemplates")),
    
    // Targeting
    category: v.union(
      v.literal("academic"),
      v.literal("financial"),
      v.literal("administrative"),
      v.literal("alert"),
      v.literal("announcement")
    ),
    
    // Recipient information
    recipientCount: v.number(),
    sentCount: v.number(),
    failedCount: v.number(),
    
    // Status
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    
    // Priority
    priority: v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    ),
    
    // Timing
    scheduledFor: v.optional(v.number()), // For scheduled sends
    completedAt: v.optional(v.number()),
    
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_foundation", ["foundationId"])
    .index("by_status", ["foundationId", "status"])
    .index("by_category", ["foundationId", "category"]),

  // Enhanced messaging system - conversations
  conversations: defineTable({
    foundationId: v.id("foundations"),
    
    // Participants
    participantIds: v.array(v.id("users")),
    createdBy: v.id("users"),
    
    // Conversation details
    title: v.optional(v.string()),
    type: v.union(
      v.literal("direct"),
      v.literal("group"),
      v.literal("program"),
      v.literal("announcement")
    ),
    
    // Associated entities
    metadata: v.optional(v.object({
      beneficiaryId: v.optional(v.id("beneficiaries")),
      programId: v.optional(v.id("programs")),
      sessionId: v.optional(v.id("academicSessions")),
    })),
    
    // Status
    isActive: v.boolean(),
    
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_foundation", ["foundationId"])
    .index("by_type", ["foundationId", "type"]),

  // Enhanced messaging system - messages
  messages: defineTable({
    conversationId: v.id("conversations"),
    foundationId: v.id("foundations"),
    
    // Message details
    senderId: v.id("users"),
    content: v.string(),
    type: v.union(
      v.literal("text"),
      v.literal("file"),
      v.literal("image"),
      v.literal("system")
    ),
    
    // File attachments
    attachmentId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    
    // Reply functionality
    replyToId: v.optional(v.id("messages")),
    
    // Status tracking
    isRead: v.boolean(),
    deliveredTo: v.array(v.id("users")),
    readBy: v.array(v.id("users")),
    
    // Message management
    isDeleted: v.optional(v.boolean()),
    deletedBy: v.optional(v.id("users")),
    deletedAt: v.optional(v.number()),
    
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_conversation", ["conversationId"])
    .index("by_foundation", ["foundationId"])
    .index("by_sender", ["senderId"]),
});