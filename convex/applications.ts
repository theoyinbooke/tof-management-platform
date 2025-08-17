import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { authenticateAndAuthorize } from "./auth";
import { getCurrentUser } from "./auth";

// Generate application number
function generateApplicationNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TOF-${year}-${random}`;
}

// Get review counts for sidebar
export const getReviewCounts = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin", 
      "reviewer",
    ]);

    // Count pending documents
    const pendingDocuments = await ctx.db
      .query("documents")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("status"), "pending_review"))
      .collect();

    // Count applications under review
    const pendingApplications = await ctx.db
      .query("applications")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("status"), "under_review"))
      .collect();

    // Count pending financial records
    const pendingFinancial = await ctx.db
      .query("financialRecords")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "pending"),
          q.eq(q.field("status"), "approved")
        )
      )
      .collect();

    return {
      documents: pendingDocuments.length,
      applications: pendingApplications.length,
      financial: pendingFinancial.length,
      total: pendingDocuments.length + pendingApplications.length + pendingFinancial.length,
    };
  },
});

// Create new application
export const createApplication = mutation({
  args: {
    foundationId: v.id("foundations"),
    data: v.object({
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
      
      // Guardian Information
      guardian: v.optional(v.object({
        firstName: v.string(),
        lastName: v.string(),
        relationship: v.string(),
        phone: v.string(),
        email: v.optional(v.string()),
        occupation: v.optional(v.string())
      })),
      
      // Educational Background
      education: v.object({
        currentLevel: v.string(),
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
        currentFeeSupport: v.optional(v.string()),
        hasOtherSupport: v.boolean()
      }),
      
      // Application Essays/Questions
      essays: v.object({
        personalStatement: v.string(),
        educationalGoals: v.string(),
        whyApplying: v.string(),
        additionalInfo: v.optional(v.string())
      }),
    }),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, ["beneficiary", "guardian", "admin", "super_admin"]);
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    // Check if user already has an application for this foundation
    const existingApplication = await ctx.db
      .query("applications")
      .withIndex("by_foundation", (q) =>
        q.eq("foundationId", args.foundationId)
      )
      .filter((q) => q.eq(q.field("email"), user.email))
      .first();
    
    if (existingApplication) {
      throw new Error("You already have an application for this foundation");
    }
    
    const now = Date.now();
    
    // Create the application
    const applicationId = await ctx.db.insert("applications", {
      foundationId: args.foundationId,
      applicationNumber: generateApplicationNumber(),
      ...args.data,
      status: "submitted",
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "application_submitted",
      entityType: "application",
      entityId: applicationId,
      description: `Application submitted by ${args.data.firstName} ${args.data.lastName}`,
      riskLevel: "low",
      createdAt: now,
    });
    
    return applicationId;
  },
});

// Get all applications for a foundation
export const getAll = query({
  args: { 
    foundationId: v.id("foundations"),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the current user for authorization
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    
    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!userDoc || !userDoc.isActive) {
      return [];
    }
    
    // Check if user has access to this foundation
    if (userDoc.foundationId !== args.foundationId && !["super_admin"].includes(userDoc.role)) {
      return [];
    }
    
    let query = ctx.db
      .query("applications")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));
    
    const applications = await query.collect();
    
    // Apply filters
    let filtered = applications;
    
    if (args.status) {
      filtered = filtered.filter(app => app.status === args.status);
    }
    
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      filtered = filtered.filter(app =>
        app.firstName.toLowerCase().includes(searchLower) ||
        app.lastName.toLowerCase().includes(searchLower) ||
        app.applicationNumber.toLowerCase().includes(searchLower) ||
        (app.email?.toLowerCase().includes(searchLower) || false)
      );
    }
    
    // Sort by creation date (newest first)
    filtered.sort((a, b) => b.createdAt - a.createdAt);
    
    return filtered;
  },
});

// Get user's applications
export const getMyApplications = query({
  handler: async (ctx) => {
    // For this query, we need to get the current user without role restrictions
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    
    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!userDoc || !userDoc.isActive) {
      return [];
    }
    
    // Return empty array if user has no foundation assigned
    if (!userDoc.foundationId) {
      return [];
    }
    
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_foundation", (q) => q.eq("foundationId", userDoc.foundationId!))
      .collect();
    
    // Get foundation details for each application
    const applicationsWithFoundations = await Promise.all(
      applications.map(async (app) => {
        const foundation = await ctx.db.get(app.foundationId);
        return {
          ...app,
          foundation,
        };
      })
    );
    
    return applicationsWithFoundations;
  },
});

// Get single application
export const getApplication = query({
  args: { applicationId: v.id("applications") },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, null, ["beneficiary", "guardian", "admin", "super_admin", "reviewer"]);
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      throw new Error("Application not found");
    }
    
    // Check if user has access to this application
    if (
      application.foundationId !== user.foundationId &&
      !["super_admin", "admin", "reviewer"].includes(user.role)
    ) {
      throw new Error("Access denied");
    }
    
    const foundation = await ctx.db.get(application.foundationId);
    
    return {
      ...application,
      foundation,
    };
  },
});

// Update application (only for draft status)
export const updateApplication = mutation({
  args: {
    applicationId: v.id("applications"),
    data: v.object({
      // Same fields as createApplication
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      // ... other fields as optional
    }),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, null, ["beneficiary", "guardian"]);
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      throw new Error("Application not found");
    }
    
    // Check ownership
    if (application.foundationId !== user.foundationId) {
      throw new Error("Access denied");
    }
    
    // Can only update if in draft or returned status
    if (!["draft", "returned"].includes(application.status)) {
      throw new Error("Application cannot be modified in current status");
    }
    
    await ctx.db.patch(args.applicationId, {
      ...args.data,
      updatedAt: Date.now(),
    });
    
    return args.applicationId;
  },
});

// Submit draft application
export const submitApplication = mutation({
  args: { applicationId: v.id("applications") },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, null, ["beneficiary", "guardian"]);
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      throw new Error("Application not found");
    }
    
    // Check ownership
    if (application.foundationId !== user.foundationId) {
      throw new Error("Access denied");
    }
    
    // Can only submit if in draft or returned status
    if (!["draft", "returned"].includes(application.status)) {
      throw new Error("Application is already submitted");
    }
    
    await ctx.db.patch(args.applicationId, {
      status: "under_review",
      submittedAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: application.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "application_submitted",
      entityType: "application",
      entityId: args.applicationId,
      changes: {
        before: JSON.stringify({ status: application.status }),
        after: JSON.stringify({ status: "under_review" }),
        fields: ["status"]
      },
      description: `Application status changed from ${application.status} to under_review`,
      ipAddress: undefined,
      userAgent: undefined,
      riskLevel: "low",
      createdAt: Date.now(),
    });
    
    return args.applicationId;
  },
});

// Submit application with form data structure (legacy compatibility)
export const submit = mutation({
  args: {
    foundationId: v.id("foundations"),
    firstName: v.string(),
    lastName: v.string(),
    middleName: v.optional(v.string()),
    dateOfBirth: v.string(),
    gender: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      country: v.string(),
      postalCode: v.optional(v.string())
    }),
    guardian: v.object({
      firstName: v.string(),
      lastName: v.string(),
      relationship: v.string(),
      phone: v.string(),
      email: v.optional(v.string()),
      occupation: v.optional(v.string())
    }),
    education: v.object({
      currentLevel: v.string(),
      currentSchool: v.string(),
      hasRepeatedClass: v.optional(v.boolean()),
      specialNeeds: v.optional(v.string())
    }),
    financial: v.object({
      familyIncome: v.optional(v.string()),
      hasOtherSupport: v.optional(v.boolean())
    }),
    essays: v.object({
      personalStatement: v.string(),
      educationalGoals: v.string(),
      whyApplying: v.string(),
      additionalInfo: v.optional(v.string())
    }),
    acceptTerms: v.boolean()
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || !user.isActive) {
      throw new Error("User not found or inactive");
    }

    // Check if user already has an application for this foundation
    const existingApplication = await ctx.db
      .query("applications")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("email"), args.email || user.email))
      .first();

    if (existingApplication) {
      throw new Error("You already have an application for this foundation");
    }

    // Check terms acceptance
    if (!args.acceptTerms) {
      throw new Error("You must accept the terms and conditions");
    }

    const now = Date.now();
    
    // Create the application
    const applicationId = await ctx.db.insert("applications", {
      foundationId: args.foundationId,
      applicationNumber: generateApplicationNumber(),
      firstName: args.firstName,
      lastName: args.lastName,
      middleName: args.middleName,
      dateOfBirth: args.dateOfBirth,
      gender: args.gender as "male" | "female",
      phone: args.phone,
      email: args.email || user.email,
      address: args.address,
      guardian: args.guardian,
      education: {
        currentLevel: args.education.currentLevel,
        currentSchool: args.education.currentSchool,
        hasRepeatedClass: args.education.hasRepeatedClass || false,
        specialNeeds: args.education.specialNeeds
      },
      financial: {
        familyIncome: args.financial.familyIncome as "below_50k" | "50k_100k" | "100k_200k" | "above_200k" | undefined,
        hasOtherSupport: args.financial.hasOtherSupport || false
      },
      essays: args.essays,
      status: "submitted",
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "application_submitted",
      entityType: "applications",
      entityId: applicationId,
      description: `Application submitted by ${args.firstName} ${args.lastName}`,
      riskLevel: "low",
      createdAt: now,
    });

    return applicationId;
  },
});

// Get application statistics for dashboard
export const getApplicationStats = query({
  args: { foundationId: v.optional(v.id("foundations")) },
  handler: async (ctx, args) => {
    // For this query, we need to get the current user without role restrictions
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    
    const userDoc = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    if (!userDoc || !userDoc.isActive) {
      return null;
    }
    
    let query: any = ctx.db.query("applications");
    
    if (args.foundationId) {
      query = query.withIndex("by_foundation", (q: any) =>
        q.eq("foundationId", args.foundationId!)
      );
    } else {
      // If no foundationId provided, filter by user's foundation
      query = query.withIndex("by_foundation", (q: any) =>
        q.eq("foundationId", userDoc.foundationId)
      );
    }
    
    // Note: applications don't have a beneficiaryId field in the schema
    // We'll filter by foundationId instead
    
    const applications = await query.collect();
    
    const stats = {
      total: applications.length,
      pending: applications.filter((a: any) => a.status === "submitted").length,
      underReview: applications.filter((a: any) => a.status === "under_review").length,
      approved: applications.filter((a: any) => a.status === "approved").length,
      rejected: applications.filter((a: any) => a.status === "rejected").length,
      waitlisted: applications.filter((a: any) => a.status === "waitlisted").length,
      returned: applications.filter((a: any) => a.status === "draft").length,
    };
    
    return stats;
  },
});

// Get applications for review (admin/reviewer access)
export const getForReview = query({
  args: {
    foundationId: v.id("foundations"),
    status: v.optional(v.union(
      v.literal("submitted"),
      v.literal("under_review"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("waitlisted")
    )),
    search: v.optional(v.string()),
    reviewerId: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin", "reviewer"]);
    
    let query = ctx.db
      .query("applications")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));
    
    const applications = await query.collect();
    
    // Apply filters
    let filtered = applications;
    
    if (args.status) {
      filtered = filtered.filter(app => app.status === args.status);
    }
    
    // Note: reviewerId filtering should be done via applicationReviews table
    // This filtering is commented out since applications table doesn't have reviewerId
    // if (args.reviewerId) {
    //   filtered = filtered.filter(app => app.reviewerId === args.reviewerId);
    // }
    
    // Apply search filter
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      filtered = filtered.filter(app =>
        app.firstName.toLowerCase().includes(searchLower) ||
        app.lastName.toLowerCase().includes(searchLower) ||
        app.applicationNumber.toLowerCase().includes(searchLower) ||
        app.email?.toLowerCase().includes(searchLower)
      );
    }
    
    // Get reviewer details for each application
    const applicationsWithReviewers = await Promise.all(
      filtered.map(async (application) => {
        // Get reviewer info from applicationReviews table
        const review = await ctx.db
          .query("applicationReviews")
          .withIndex("by_application", (q) => q.eq("applicationId", application._id))
          .unique();
        const reviewer = review
          ? await ctx.db.get(review.reviewerId)
          : null;
          
        return {
          ...application,
          reviewer
        };
      })
    );
    
    return applicationsWithReviewers;
  },
});

// Get single application for review
export const getForReviewById = query({
  args: {
    applicationId: v.id("applications")
  },
  handler: async (ctx, args) => {
    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      return null;
    }
    
    await authenticateAndAuthorize(ctx, application.foundationId, ["admin", "super_admin", "reviewer"]);
    
    // Get reviewer info from applicationReviews table
    const review = await ctx.db
      .query("applicationReviews")
      .withIndex("by_application", (q) => q.eq("applicationId", application._id))
      .unique();
    const reviewer = review
      ? await ctx.db.get(review.reviewerId)
      : null;
    
    // Get any existing reviews/comments
    const reviews = await ctx.db
      .query("applicationReviews")
      .withIndex("by_application", (q) => q.eq("applicationId", args.applicationId))
      .collect();
    
    return {
      ...application,
      reviewer,
      reviews
    };
  },
});

// Assign reviewer to application
export const assignReviewer = mutation({
  args: {
    applicationId: v.id("applications"),
    reviewerId: v.id("users")
  },
  handler: async (ctx, args) => {
    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      throw new Error("Application not found");
    }
    
    const currentUser = await authenticateAndAuthorize(ctx, application.foundationId, ["admin", "super_admin"]);
    
    // Verify the reviewer exists and has correct role
    const reviewer = await ctx.db.get(args.reviewerId);
    if (!reviewer || !["reviewer", "admin", "super_admin"].includes(reviewer.role)) {
      throw new Error("Invalid reviewer");
    }
    
    await ctx.db.patch(args.applicationId, {
      status: "under_review",
      updatedAt: Date.now()
    });
    
    // Create application review record
    await ctx.db.insert("applicationReviews", {
      foundationId: application.foundationId,
      applicationId: args.applicationId,
      reviewerId: args.reviewerId,
      scores: {
        academicPotential: 0,
        financialNeed: 0,
        personalStatement: 0,
        overallFit: 0
      },
      comments: {
        strengths: "",
        concerns: "",
        recommendation: ""
      },
      decision: "needs_discussion",
      isCompleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: application.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "application_reviewer_assigned",
      entityType: "applications",
      entityId: args.applicationId,
      description: `Assigned reviewer ${reviewer.firstName} ${reviewer.lastName} to application ${application.applicationNumber}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Update application status (approve/reject/waitlist)
export const updateStatus = mutation({
  args: {
    applicationId: v.id("applications"),
    status: v.union(
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("waitlisted"),
      v.literal("under_review")
    ),
    reviewComments: v.optional(v.string()),
    internalNotes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      throw new Error("Application not found");
    }
    
    const currentUser = await authenticateAndAuthorize(ctx, application.foundationId, ["admin", "super_admin", "reviewer"]);
    
    const previousStatus = application.status;
    
    // Update application
    await ctx.db.patch(args.applicationId, {
      status: args.status,
      reviewedAt: Date.now(),
      updatedAt: Date.now()
    });
    
    // Create review record
    if (args.reviewComments || args.internalNotes) {
      await ctx.db.insert("applicationReviews", {
        foundationId: application.foundationId,
        applicationId: args.applicationId,
        reviewerId: currentUser._id,
        scores: {
          academicPotential: 0,
          financialNeed: 0,
          personalStatement: 0,
          overallFit: 0
        },
        comments: {
          strengths: args.reviewComments || "",
          concerns: "",
          recommendation: ""
        },
        decision: args.status === "approved" ? "recommend_approve" : args.status === "rejected" ? "recommend_reject" : "needs_discussion",
        isCompleted: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: application.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "application_status_updated",
      entityType: "applications",
      entityId: args.applicationId,
      description: `Changed application status from ${previousStatus} to ${args.status}`,
      riskLevel: args.status === "approved" ? "high" : "medium",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Bulk approve applications
export const bulkApprove = mutation({
  args: {
    applicationIds: v.array(v.id("applications")),
    reviewComments: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const applications = await Promise.all(
      args.applicationIds.map(id => ctx.db.get(id))
    );
    
    // Verify all applications exist and user has access
    for (const app of applications) {
      if (!app) throw new Error("One or more applications not found");
      await authenticateAndAuthorize(ctx, app.foundationId, ["admin", "super_admin"]);
    }
    
    const currentUser = await authenticateAndAuthorize(ctx, applications[0]!.foundationId, ["admin", "super_admin"]);
    
    // Update all applications
    const results = await Promise.all(
      args.applicationIds.map(async (applicationId) => {
        await ctx.db.patch(applicationId, {
          status: "approved",
          reviewedAt: Date.now(),
          updatedAt: Date.now()
        });
        
        // Create review record
        if (args.reviewComments) {
          const app = await ctx.db.get(applicationId);
          await ctx.db.insert("applicationReviews", {
            foundationId: app!.foundationId,
            applicationId,
            reviewerId: currentUser._id,
            scores: {
              academicPotential: 0,
              financialNeed: 0,
              personalStatement: 0,
              overallFit: 0
            },
            comments: {
              strengths: args.reviewComments,
              concerns: "",
              recommendation: "Bulk approved"
            },
            decision: "recommend_approve",
            isCompleted: true,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        }
        
        return applicationId;
      })
    );
    
    // Create audit log for bulk operation
    await ctx.db.insert("auditLogs", {
      foundationId: applications[0]!.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "applications_bulk_approved",
      entityType: "applications",
      entityId: applications[0]!._id, // Reference first application
      description: `Bulk approved ${args.applicationIds.length} applications`,
      riskLevel: "high",
      createdAt: Date.now(),
    });
    
    return { success: true, processed: results.length };
  },
});

// Convert approved application to beneficiary
export const convertToBeneficiary = mutation({
  args: {
    applicationId: v.id("applications"),
    programId: v.optional(v.id("programs")),
    initialBudget: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Authenticate as admin or super_admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!currentUser || !["admin", "super_admin"].includes(currentUser.role)) {
      throw new Error("Access denied: Admin privileges required");
    }

    // Get the application
    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      throw new Error("Application not found");
    }

    // Verify application is approved
    if (application.status !== "approved") {
      throw new Error("Only approved applications can be converted to beneficiaries");
    }

    // Check if already converted
    const existingBeneficiary = await ctx.db
      .query("beneficiaries")
      .filter((q) => q.eq(q.field("applicationId"), args.applicationId))
      .unique();

    if (existingBeneficiary) {
      throw new Error("Application has already been converted to beneficiary");
    }

    // Generate beneficiary ID
    const year = new Date().getFullYear();
    const count = await ctx.db
      .query("beneficiaries")
      .withIndex("by_foundation", (q) => q.eq("foundationId", application.foundationId))
      .collect();
    const beneficiaryNumber = `TOF-${year}-BEN-${(count.length + 1).toString().padStart(4, '0')}`;

    // Create beneficiary record
    const beneficiaryId = await ctx.db.insert("beneficiaries", {
      foundationId: application.foundationId,
      userId: currentUser!._id,
      applicationId: args.applicationId,
      beneficiaryNumber: beneficiaryNumber,
      status: "active",
      currentAcademicLevel: `placeholder_level` as Id<"academicLevels">,
      currentSchool: application.education.currentSchool,
      supportStartDate: new Date().toISOString(),
      supportTypes: ["tuition"],
      emergencyContact: {
        name: application.guardian?.firstName + " " + application.guardian?.lastName || "Unknown",
        relationship: application.guardian?.relationship || "Unknown",
        phone: application.guardian?.phone || application.phone || "Unknown",
        email: application.guardian?.email || application.email
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update application status to converted
    await ctx.db.patch(args.applicationId, {
      status: "approved",
      // convertedToBeneficiaryAt field not in applications schema
      // convertedBy: currentUser._id, // Field not in schema
      // beneficiaryId, // Field not in applications schema
      updatedAt: Date.now(),
    });

    // Copy application files to beneficiary
    const applicationFiles = await ctx.db
      .query("files")
      .withIndex("by_application", (q) => q.eq("applicationId", args.applicationId))
      .collect();

    for (const file of applicationFiles) {
      await ctx.db.patch(file._id, {
        beneficiaryId,
        updatedAt: Date.now(),
      });
    }

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: application.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "application_converted_to_beneficiary",
      entityType: "applications",
      entityId: args.applicationId,
      description: `Converted application ${application.applicationNumber} to beneficiary ${beneficiaryNumber}`,
      riskLevel: "high",
      createdAt: Date.now(),
    });

    // Create notification for the new beneficiary if they have an account
    const beneficiaryUser = await ctx.db
      .query("users")
      .withIndex("by_foundation", (q) => q.eq("foundationId", application.foundationId))
      .filter((q) => q.eq(q.field("email"), application.email))
      .filter((q) => q.eq(q.field("role"), "beneficiary"))
      .unique();

    if (beneficiaryUser) {
      await ctx.db.insert("notifications", {
        foundationId: application.foundationId,
        recipientType: "specific_users",
        recipients: [beneficiaryUser._id],
        title: "🎉 Application Approved - Welcome to TheOyinbooke Foundation!",
        message: `Congratulations! Your application has been approved and you are now an active beneficiary. Your beneficiary ID is: ${beneficiaryNumber}`,
        notificationType: "congratulations",
        channels: ["in_app"],
        sendAt: undefined,
        isScheduled: false,
        isSent: true,
        sentAt: Date.now(),
        readBy: [],
        priority: "high",
        requiresAction: false,
        actionUrl: undefined,
        actionText: undefined,
        createdBy: currentUser._id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return {
      success: true,
      beneficiaryId,
      beneficiaryNumber,
    };
  },
});

// Bulk convert multiple approved applications to beneficiaries
export const bulkConvertToBeneficiaries = mutation({
  args: {
    applicationIds: v.array(v.id("applications")),
    programId: v.optional(v.id("programs")),
    initialBudget: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!currentUser || !["admin", "super_admin"].includes(currentUser.role)) {
      throw new Error("Access denied: Admin privileges required");
    }

    // Get all applications
    const applications = await Promise.all(
      args.applicationIds.map(id => ctx.db.get(id))
    );

    const validApplications = applications.filter(app => 
      app && app.status === "approved"
    );

    if (validApplications.length === 0) {
      throw new Error("No valid approved applications found");
    }

    const results = [];

    // Convert each application
    for (const app of validApplications) {
      const application = app!; // Assert non-null since we filtered valid applications
      try {
        // Call the convertToBeneficiary logic directly without recursion
        const result = {
          beneficiaryId: await ctx.db.insert("beneficiaries", {
            foundationId: application.foundationId,
            userId: currentUser!._id,
            applicationId: application._id,
            beneficiaryNumber: `TOF-${new Date().getFullYear()}-BEN-${Math.random().toString().substring(2, 6)}`,
            status: "active",
            currentAcademicLevel: `placeholder_level` as Id<"academicLevels">,
            currentSchool: application.education.currentSchool,
            supportStartDate: new Date().toISOString(),
            supportTypes: ["tuition"],
            emergencyContact: {
              name: application.guardian?.firstName + " " + application.guardian?.lastName || "Unknown",
              relationship: application.guardian?.relationship || "Unknown",
              phone: application.guardian?.phone || application.phone || "Unknown",
              email: application.guardian?.email || application.email
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }),
          beneficiaryNumber: `TOF-${new Date().getFullYear()}-BEN-${Math.random().toString().substring(2, 6)}`,
        };
        results.push({
          applicationId: application._id,
          beneficiaryId: result.beneficiaryId,
          beneficiaryNumber: result.beneficiaryNumber,
          success: true,
        });
      } catch (error) {
        results.push({
          applicationId: application._id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Create bulk audit log
    const successfulConversions = results.filter(r => r.success);
    if (successfulConversions.length > 0) {
      await ctx.db.insert("auditLogs", {
        foundationId: validApplications[0]!.foundationId,
        userId: currentUser._id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        action: "applications_bulk_converted",
        entityType: "applications",
        entityId: validApplications[0]!._id,
        description: `Bulk converted ${successfulConversions.length} applications to beneficiaries`,
        riskLevel: "high",
        createdAt: Date.now(),
      });
    }

    return {
      success: true,
      processed: results.length,
      successful: successfulConversions.length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  },
});