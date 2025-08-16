import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authenticateAndAuthorize } from "./auth";

/**
 * Get all foundations (super admin only)
 */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    await authenticateAndAuthorize(ctx, null, ["super_admin"]);
    
    const foundations = await ctx.db.query("foundations").collect();
    
    // Get statistics for each foundation
    const foundationsWithStats = await Promise.all(
      foundations.map(async (foundation) => {
        const beneficiaryCount = await ctx.db
          .query("beneficiaries")
          .withIndex("by_foundation", (q) => q.eq("foundationId", foundation._id))
          .collect();
        
        const userCount = await ctx.db
          .query("users")
          .withIndex("by_foundation", (q) => q.eq("foundationId", foundation._id))
          .collect();
        
        return {
          ...foundation,
          stats: {
            beneficiaries: beneficiaryCount.length,
            users: userCount.length,
          },
        };
      })
    );
    
    return foundationsWithStats;
  },
});

/**
 * Get foundation settings including payment gateway configuration
 */
export const getSettings = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "beneficiary",
      "guardian",
      "reviewer",
    ]);

    const foundation = await ctx.db.get(args.foundationId);
    if (!foundation) {
      throw new Error("Foundation not found");
    }

    // Return foundation settings with payment gateway configuration
    return {
      ...foundation,
      paymentGateways: {
        paystack: {
          enabled: !!process.env.PAYSTACK_PUBLIC_KEY,
          publicKey: process.env.PAYSTACK_PUBLIC_KEY,
        },
        flutterwave: {
          enabled: !!process.env.FLUTTERWAVE_PUBLIC_KEY,
          publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
        },
      },
    };
  },
});

/**
 * Get foundation by ID
 */
export const getById = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    const foundation = await ctx.db.get(args.foundationId);
    
    if (!foundation) {
      throw new Error("Foundation not found");
    }
    
    // Only authorized users can view foundation details
    await authenticateAndAuthorize(ctx, args.foundationId, [
      "super_admin",
      "admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);
    
    return foundation;
  },
});

/**
 * Create a new foundation (super admin only)
 */
export const create = mutation({
  args: {
    name: v.string(),
    registrationNumber: v.optional(v.string()),
    taxId: v.optional(v.string()),
    website: v.optional(v.string()),
    email: v.string(),
    phone: v.string(),
    address: v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      country: v.string(),
      postalCode: v.optional(v.string()),
    }),
    bankDetails: v.optional(
      v.object({
        bankName: v.string(),
        accountName: v.string(),
        accountNumber: v.string(),
        swiftCode: v.optional(v.string()),
        routingNumber: v.optional(v.string()),
      })
    ),
    logo: v.optional(v.id("_storage")),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, null, ["super_admin"]);
    
    // Check if foundation with same name exists
    const existing = await ctx.db
      .query("foundations")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
    
    if (existing) {
      throw new Error("Foundation with this name already exists");
    }
    
    // Create foundation
    const foundationId = await ctx.db.insert("foundations", {
      name: args.name,
      description: args.registrationNumber,
      logo: args.logo,
      settings: {
        defaultCurrency: "NGN",
        exchangeRate: 1500,
        academicYearStart: "September",
        academicYearEnd: "July",
        applicationDeadline: "March 31",
        paymentTerms: "30 days",
      },
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "foundation_created",
      entityType: "foundations",
      entityId: foundationId,
      description: `Created new foundation: ${args.name}`,
      riskLevel: "high",
      createdAt: Date.now(),
    });
    
    return foundationId;
  },
});

/**
 * Update foundation details (admin only)
 */
export const update = mutation({
  args: {
    foundationId: v.id("foundations"),
    name: v.optional(v.string()),
    registrationNumber: v.optional(v.string()),
    taxId: v.optional(v.string()),
    website: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(
      v.object({
        street: v.string(),
        city: v.string(),
        state: v.string(),
        country: v.string(),
        postalCode: v.optional(v.string()),
      })
    ),
    bankDetails: v.optional(
      v.object({
        bankName: v.string(),
        accountName: v.string(),
        accountNumber: v.string(),
        swiftCode: v.optional(v.string()),
        routingNumber: v.optional(v.string()),
      })
    ),
    logo: v.optional(v.id("_storage")),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, ["super_admin", "admin"]);
    
    const foundation = await ctx.db.get(args.foundationId);
    if (!foundation) {
      throw new Error("Foundation not found");
    }
    
    const { foundationId, ...updates } = args;
    
    // Remove undefined values
    const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
    
    if (Object.keys(cleanUpdates).length === 0) {
      throw new Error("No updates provided");
    }
    
    // Update foundation
    await ctx.db.patch(args.foundationId, {
      ...cleanUpdates,
      updatedAt: Date.now(),
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "foundation_updated",
      entityType: "foundations",
      entityId: args.foundationId,
      description: `Updated foundation settings`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Update foundation settings (admin only)
 */
export const updateSettings = mutation({
  args: {
    foundationId: v.id("foundations"),
    settings: v.object({
      defaultCurrency: v.optional(v.union(v.literal("NGN"), v.literal("USD"))),
      exchangeRate: v.optional(v.number()),
      academicYearStart: v.optional(v.string()),
      academicYearEnd: v.optional(v.string()),
      applicationDeadline: v.optional(v.string()),
      paymentTerms: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, ["super_admin", "admin"]);
    
    const foundation = await ctx.db.get(args.foundationId);
    if (!foundation) {
      throw new Error("Foundation not found");
    }
    
    // Merge settings with existing ones
    const updatedSettings = {
      ...foundation.settings,
      ...args.settings,
    };
    
    // Update foundation
    await ctx.db.patch(args.foundationId, {
      settings: updatedSettings,
      updatedAt: Date.now(),
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "settings_updated",
      entityType: "foundations",
      entityId: args.foundationId,
      description: `Updated foundation configuration settings`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Get foundation statistics
 */
export const getStatistics = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin", "reviewer"]);
    
    // Get counts
    const beneficiaries = await ctx.db
      .query("beneficiaries")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    const users = await ctx.db
      .query("users")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    const programs = await ctx.db
      .query("programs")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    // Calculate statistics
    return {
      totalBeneficiaries: beneficiaries.length,
      activeBeneficiaries: beneficiaries.filter((b) => b.status === "active").length,
      totalApplications: applications.length,
      pendingApplications: applications.filter((a) => a.status === "submitted").length,
      approvedApplications: applications.filter((a) => a.status === "approved").length,
      totalUsers: users.length,
      adminUsers: users.filter((u) => u.role === "admin" || u.role === "super_admin").length,
      reviewerUsers: users.filter((u) => u.role === "reviewer").length,
      totalPrograms: programs.length,
      activePrograms: programs.filter((p) => p.status === "active").length,
      byStatus: {
        beneficiaries: {
          active: beneficiaries.filter((b) => b.status === "active").length,
          graduated: beneficiaries.filter((b) => b.status === "graduated").length,
          suspended: beneficiaries.filter((b) => b.status === "suspended").length,
          withdrawn: beneficiaries.filter((b) => b.status === "withdrawn").length,
        },
        applications: {
          pending: applications.filter((a) => a.status === "submitted").length,
          under_review: applications.filter((a) => a.status === "under_review").length,
          approved: applications.filter((a) => a.status === "approved").length,
          rejected: applications.filter((a) => a.status === "rejected").length,
        },
      },
    };
  },
});

/**
 * Get recent activities for foundation
 */
export const getRecentActivities = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin", "reviewer"]);
    
    // Get recent audit logs
    const auditLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .order("desc")
      .take(20);
    
    // Transform audit logs to activities
    const activities = auditLogs.map(log => {
      let type: 'application' | 'beneficiary' | 'payment' | 'alert' = 'application';
      let title = log.action;
      
      if (log.entityType === 'applications') {
        type = 'application';
        title = `Application ${log.action}`;
      } else if (log.entityType === 'beneficiaries') {
        type = 'beneficiary';
        title = `Beneficiary ${log.action}`;
      } else if (log.entityType === 'payments' || log.entityType === 'invoices') {
        type = 'payment';
        title = `Payment ${log.action}`;
      } else if (log.entityType === 'performanceAlerts') {
        type = 'alert';
        title = `Alert ${log.action}`;
      }
      
      return {
        type,
        title,
        description: log.description || `${log.action} by ${log.userEmail}`,
        timestamp: log.createdAt,
        userId: log.userId,
        userEmail: log.userEmail,
      };
    });
    
    return activities;
  },
});

/**
 * Get performance metrics for foundation
 */
export const getPerformanceMetrics = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin", "reviewer"]);
    
    // Calculate various performance metrics
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // Application processing time
    const recentApplications = await ctx.db
      .query("applications")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.gte(q.field("createdAt"), thirtyDaysAgo))
      .collect();
    
    const processedApplications = recentApplications.filter(a => 
      a.status === "approved" || a.status === "rejected"
    );
    
    let avgProcessingTime = 0;
    if (processedApplications.length > 0) {
      const totalTime = processedApplications.reduce((sum, app) => {
        const processTime = (app.updatedAt - app.createdAt) / (1000 * 60 * 60 * 24); // Convert to days
        return sum + processTime;
      }, 0);
      avgProcessingTime = Math.round(totalTime / processedApplications.length);
    }
    
    // Beneficiary retention rate
    const beneficiaries = await ctx.db
      .query("beneficiaries")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    const retentionRate = beneficiaries.length > 0 
      ? Math.round((beneficiaries.filter(b => b.status === "active").length / beneficiaries.length) * 100)
      : 0;
    
    // Academic performance average (using performanceRecords table)
    const performanceRecords = await ctx.db
      .query("performanceRecords")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    // Calculate average for all beneficiaries
    let totalGrade = 0;
    let recordCount = 0;
    
    for (const beneficiary of beneficiaries) {
      const records = await ctx.db
        .query("performanceRecords")
        .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", beneficiary._id))
        .collect();
      
      for (const record of records) {
        if (record.overallGrade) {
          totalGrade += record.overallGrade;
          recordCount++;
        }
      }
    }
    
    const academicAverage = recordCount > 0
      ? Math.round(totalGrade / recordCount)
      : 75; // Default placeholder
    
    // Financial disbursement rate (placeholder - would need actual payment data)
    const disbursementRate = 85; // Placeholder value
    
    return {
      avgProcessingTime: avgProcessingTime || 3, // Default 3 days
      processingTrend: avgProcessingTime > 5 ? -10 : 15, // Negative if taking too long
      retentionRate,
      academicAverage,
      disbursementRate,
    };
  },
});

/**
 * Get foundation configuration data (academic levels, fee categories, document types)
 */
export const getConfigurationData = query({
  args: { foundationId: v.id("foundations") },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["super_admin", "admin", "reviewer"]);
    
    // Get academic levels
    const academicLevels = await ctx.db
      .query("academicLevels")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    // Get fee categories
    const feeCategories = await ctx.db
      .query("feeCategories")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    // Get document types
    const documentTypes = await ctx.db
      .query("documentTypes")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    return {
      academicLevels: academicLevels.sort((a, b) => a.sortOrder - b.sortOrder),
      feeCategories,
      documentTypes
    };
  },
});

/**
 * Create default Nigerian academic levels
 */
export const createDefaultAcademicLevels = mutation({
  args: { foundationId: v.id("foundations") },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, ["super_admin", "admin"]);
    
    const defaultLevels = [
      // Nursery
      { id: "nursery-1", name: "Nursery 1", category: "nursery" as const, order: 1 },
      { id: "nursery-2", name: "Nursery 2", category: "nursery" as const, order: 2 },
      
      // Primary
      { id: "primary-1", name: "Primary 1", category: "primary" as const, order: 3 },
      { id: "primary-2", name: "Primary 2", category: "primary" as const, order: 4 },
      { id: "primary-3", name: "Primary 3", category: "primary" as const, order: 5 },
      { id: "primary-4", name: "Primary 4", category: "primary" as const, order: 6 },
      { id: "primary-5", name: "Primary 5", category: "primary" as const, order: 7 },
      { id: "primary-6", name: "Primary 6", category: "primary" as const, order: 8 },
      
      // Secondary (JSS)
      { id: "jss-1", name: "JSS 1", category: "secondary" as const, order: 9 },
      { id: "jss-2", name: "JSS 2", category: "secondary" as const, order: 10 },
      { id: "jss-3", name: "JSS 3", category: "secondary" as const, order: 11 },
      
      // Secondary (SSS)
      { id: "sss-1", name: "SSS 1", category: "secondary" as const, order: 12 },
      { id: "sss-2", name: "SSS 2", category: "secondary" as const, order: 13 },
      { id: "sss-3", name: "SSS 3", category: "secondary" as const, order: 14 },
      
      // Tertiary (University)
      { id: "year-1", name: "Year 1 (University)", category: "university" as const, order: 15 },
      { id: "year-2", name: "Year 2 (University)", category: "university" as const, order: 16 },
      { id: "year-3", name: "Year 3 (University)", category: "university" as const, order: 17 },
      { id: "year-4", name: "Year 4 (University)", category: "university" as const, order: 18 },
      { id: "year-5", name: "Year 5 (University)", category: "university" as const, order: 19 },
    ];
    
    for (const level of defaultLevels) {
      await ctx.db.insert("academicLevels", {
        foundationId: args.foundationId,
        name: level.name,
        category: level.category,
        sortOrder: level.order,
        isActive: true,
        createdAt: Date.now(),
      });
    }
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "default_academic_levels_created",
      entityType: "academicLevels",
      entityId: args.foundationId,
      description: `Created ${defaultLevels.length} default Nigerian academic levels`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });
    
    return { success: true, created: defaultLevels.length };
  },
});

/**
 * Create default fee categories
 */
export const createDefaultFeeCategories = mutation({
  args: { foundationId: v.id("foundations") },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, ["super_admin", "admin"]);
    
    const defaultCategories = [
      {
        name: "Tuition Fees",
        description: "Regular academic tuition fees",
        isRequired: true,
        sortOrder: 1
      },
      {
        name: "Books & Materials",
        description: "Textbooks and learning materials",
        isRequired: true,
        sortOrder: 2
      },
      {
        name: "School Uniform",
        description: "School uniforms and clothing",
        isRequired: false,
        sortOrder: 3
      },
      {
        name: "Transportation",
        description: "Transportation to and from school",
        isRequired: false,
        sortOrder: 4
      },
      {
        name: "Upkeep Allowance",
        description: "Monthly upkeep and living expenses",
        isRequired: false,
        sortOrder: 5
      },
      {
        name: "Examination Fees",
        description: "WAEC, JAMB, NECO and other examination fees",
        isRequired: false,
        sortOrder: 6
      },
      {
        name: "Medical & Health",
        description: "Medical expenses and health insurance",
        isRequired: false,
        sortOrder: 7
      },
      {
        name: "Other Expenses",
        description: "Miscellaneous educational expenses",
        isRequired: false,
        sortOrder: 8
      }
    ];
    
    for (const category of defaultCategories) {
      await ctx.db.insert("feeCategories", {
        foundationId: args.foundationId,
        name: category.name,
        description: category.description,
        isRequired: category.isRequired,
        sortOrder: category.sortOrder,
        isActive: true,
        createdAt: Date.now(),
      });
    }
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "default_fee_categories_created",
      entityType: "feeCategories",
      entityId: args.foundationId,
      description: `Created ${defaultCategories.length} default fee categories`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });
    
    return { success: true, created: defaultCategories.length };
  },
});

/**
 * Create default document types
 */
export const createDefaultDocumentTypes = mutation({
  args: { foundationId: v.id("foundations") },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, ["super_admin", "admin"]);
    
    const defaultDocuments = [
      {
        name: "Birth Certificate",
        description: "Official birth certificate",
        isRequired: true,
        requiredFor: ["application"],
        allowedFormats: ["pdf", "jpg", "jpeg", "png"],
        maxFileSize: 5,
        category: "personal" as const,
        requiresApproval: false
      },
      {
        name: "Passport Photograph",
        description: "Recent passport-sized photograph",
        isRequired: true,
        requiredFor: ["application"],
        allowedFormats: ["jpg", "jpeg", "png"],
        maxFileSize: 2,
        category: "personal" as const,
        requiresApproval: false
      },
      {
        name: "School Certificate",
        description: "Current or most recent school certificate/report card",
        isRequired: true,
        requiredFor: ["application"],
        allowedFormats: ["pdf", "jpg", "jpeg", "png"],
        maxFileSize: 5,
        category: "academic" as const,
        requiresApproval: false
      },
      {
        name: "Admission Letter",
        description: "Letter of admission to current school",
        isRequired: false,
        requiredFor: ["application"],
        allowedFormats: ["pdf", "jpg", "jpeg", "png"],
        maxFileSize: 5,
        category: "academic" as const,
        requiresApproval: false
      },
      {
        name: "Guardian ID Document",
        description: "Valid ID document of parent/guardian",
        isRequired: true,
        requiredFor: ["application"],
        allowedFormats: ["pdf", "jpg", "jpeg", "png"],
        maxFileSize: 5,
        category: "legal" as const,
        requiresApproval: false
      },
      {
        name: "Income Verification",
        description: "Proof of family income (salary slip, business registration, etc.)",
        isRequired: false,
        requiredFor: ["application"],
        allowedFormats: ["pdf", "jpg", "jpeg", "png"],
        maxFileSize: 5,
        category: "financial" as const,
        requiresApproval: false
      },
      {
        name: "Bank Statement",
        description: "Recent bank statement (if applicable)",
        isRequired: false,
        requiredFor: ["application"],
        allowedFormats: ["pdf"],
        maxFileSize: 10,
        category: "financial" as const,
        requiresApproval: false
      },
      {
        name: "Medical Report",
        description: "Recent medical examination report",
        isRequired: false,
        requiredFor: ["application"],
        allowedFormats: ["pdf", "jpg", "jpeg", "png"],
        maxFileSize: 5,
        category: "medical" as const,
        requiresApproval: false
      }
    ];
    
    for (const docType of defaultDocuments) {
      await ctx.db.insert("documentTypes", {
        foundationId: args.foundationId,
        name: docType.name,
        description: docType.description,
        isRequired: docType.isRequired,
        requiredFor: docType.requiredFor,
        allowedFormats: docType.allowedFormats,
        maxFileSize: docType.maxFileSize,
        category: docType.category,
        requiresApproval: docType.requiresApproval,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "default_document_types_created",
      entityType: "documentTypes",
      entityId: args.foundationId,
      description: `Created ${defaultDocuments.length} default document types`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });
    
    return { success: true, created: defaultDocuments.length };
  },
});

/**
 * Setup foundation with all default data
 */
export const setupFoundationDefaults = mutation({
  args: { foundationId: v.id("foundations") },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, ["super_admin", "admin"]);
    
    // Check if foundation exists
    const foundation = await ctx.db.get(args.foundationId);
    if (!foundation) {
      throw new Error("Foundation not found");
    }
    
    // Check if data already exists to avoid duplicates
    const existingLevels = await ctx.db
      .query("academicLevels")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .first();
    
    if (existingLevels) {
      throw new Error("Foundation data already exists. Use individual creation functions to add more data.");
    }
    
    let createdCounts = {
      academicLevels: 0,
      feeCategories: 0,
      documentTypes: 0
    };
    
    // Create academic levels
    const defaultLevels = [
      { id: "nursery-1", name: "Nursery 1", category: "nursery" as const, order: 1 },
      { id: "nursery-2", name: "Nursery 2", category: "nursery" as const, order: 2 },
      { id: "primary-1", name: "Primary 1", category: "primary" as const, order: 3 },
      { id: "primary-2", name: "Primary 2", category: "primary" as const, order: 4 },
      { id: "primary-3", name: "Primary 3", category: "primary" as const, order: 5 },
      { id: "primary-4", name: "Primary 4", category: "primary" as const, order: 6 },
      { id: "primary-5", name: "Primary 5", category: "primary" as const, order: 7 },
      { id: "primary-6", name: "Primary 6", category: "primary" as const, order: 8 },
      { id: "jss-1", name: "JSS 1", category: "secondary" as const, order: 9 },
      { id: "jss-2", name: "JSS 2", category: "secondary" as const, order: 10 },
      { id: "jss-3", name: "JSS 3", category: "secondary" as const, order: 11 },
      { id: "sss-1", name: "SSS 1", category: "secondary" as const, order: 12 },
      { id: "sss-2", name: "SSS 2", category: "secondary" as const, order: 13 },
      { id: "sss-3", name: "SSS 3", category: "secondary" as const, order: 14 },
      { id: "year-1", name: "Year 1 (University)", category: "university" as const, order: 15 },
      { id: "year-2", name: "Year 2 (University)", category: "university" as const, order: 16 },
      { id: "year-3", name: "Year 3 (University)", category: "university" as const, order: 17 },
      { id: "year-4", name: "Year 4 (University)", category: "university" as const, order: 18 },
      { id: "year-5", name: "Year 5 (University)", category: "university" as const, order: 19 },
    ];
    
    for (const level of defaultLevels) {
      await ctx.db.insert("academicLevels", {
        foundationId: args.foundationId,
        name: level.name,
        category: level.category,
        sortOrder: level.order,
        isActive: true,
        createdAt: Date.now(),
      });
      createdCounts.academicLevels++;
    }
    
    // Create fee categories
    const defaultCategories = [
      { name: "Tuition Fees", description: "Regular academic tuition fees", isRequired: true, sortOrder: 1 },
      { name: "Books & Materials", description: "Textbooks and learning materials", isRequired: true, sortOrder: 2 },
      { name: "School Uniform", description: "School uniforms and clothing", isRequired: false, sortOrder: 3 },
      { name: "Transportation", description: "Transportation to and from school", isRequired: false, sortOrder: 4 },
      { name: "Upkeep Allowance", description: "Monthly upkeep and living expenses", isRequired: false, sortOrder: 5 },
      { name: "Examination Fees", description: "WAEC, JAMB, NECO and other examination fees", isRequired: false, sortOrder: 6 },
      { name: "Medical & Health", description: "Medical expenses and health insurance", isRequired: false, sortOrder: 7 },
      { name: "Other Expenses", description: "Miscellaneous educational expenses", isRequired: false, sortOrder: 8 }
    ];
    
    for (const category of defaultCategories) {
      await ctx.db.insert("feeCategories", {
        foundationId: args.foundationId,
        name: category.name,
        description: category.description,
        isRequired: category.isRequired,
        sortOrder: category.sortOrder,
        isActive: true,
        createdAt: Date.now(),
      });
      createdCounts.feeCategories++;
    }
    
    // Create document types
    const defaultDocuments = [
      { name: "Birth Certificate", description: "Official birth certificate", isRequired: true, requiredFor: ["application"], allowedFormats: ["pdf", "jpg", "jpeg", "png"], maxFileSize: 5, category: "personal" as const, requiresApproval: false },
      { name: "Passport Photograph", description: "Recent passport-sized photograph", isRequired: true, requiredFor: ["application"], allowedFormats: ["jpg", "jpeg", "png"], maxFileSize: 2, category: "personal" as const, requiresApproval: false },
      { name: "School Certificate", description: "Current or most recent school certificate/report card", isRequired: true, requiredFor: ["application"], allowedFormats: ["pdf", "jpg", "jpeg", "png"], maxFileSize: 5, category: "academic" as const, requiresApproval: false },
      { name: "Admission Letter", description: "Letter of admission to current school", isRequired: false, requiredFor: ["application"], allowedFormats: ["pdf", "jpg", "jpeg", "png"], maxFileSize: 5, category: "academic" as const, requiresApproval: false },
      { name: "Guardian ID Document", description: "Valid ID document of parent/guardian", isRequired: true, requiredFor: ["application"], allowedFormats: ["pdf", "jpg", "jpeg", "png"], maxFileSize: 5, category: "legal" as const, requiresApproval: false },
      { name: "Income Verification", description: "Proof of family income", isRequired: false, requiredFor: ["application"], allowedFormats: ["pdf", "jpg", "jpeg", "png"], maxFileSize: 5, category: "financial" as const, requiresApproval: false },
      { name: "Bank Statement", description: "Recent bank statement", isRequired: false, requiredFor: ["application"], allowedFormats: ["pdf"], maxFileSize: 10, category: "financial" as const, requiresApproval: false },
      { name: "Medical Report", description: "Recent medical examination report", isRequired: false, requiredFor: ["application"], allowedFormats: ["pdf", "jpg", "jpeg", "png"], maxFileSize: 5, category: "medical" as const, requiresApproval: false }
    ];
    
    for (const docType of defaultDocuments) {
      await ctx.db.insert("documentTypes", {
        foundationId: args.foundationId,
        name: docType.name,
        description: docType.description,
        isRequired: docType.isRequired,
        requiredFor: docType.requiredFor,
        allowedFormats: docType.allowedFormats,
        maxFileSize: docType.maxFileSize,
        category: docType.category,
        requiresApproval: docType.requiresApproval,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      createdCounts.documentTypes++;
    }
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "foundation_setup_completed",
      entityType: "foundations",
      entityId: args.foundationId,
      description: `Foundation setup completed: ${createdCounts.academicLevels} academic levels, ${createdCounts.feeCategories} fee categories, ${createdCounts.documentTypes} document types`,
      riskLevel: "high",
      createdAt: Date.now(),
    });
    
    return { 
      success: true, 
      created: createdCounts,
      total: createdCounts.academicLevels + createdCounts.feeCategories + createdCounts.documentTypes
    };
  },
});