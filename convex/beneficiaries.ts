import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { authenticateAndAuthorize } from "./auth";

// Generate beneficiary number
function generateBeneficiaryNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TOF-BEN-${year}-${random}`;
}

// Create beneficiary from approved application
export const createFromApplication = mutation({
  args: {
    applicationId: v.id("applications"),
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);
    
    // Get the application
    const application = await ctx.db.get(args.applicationId);
    if (!application) {
      throw new Error("Application not found");
    }
    
    if (application.status !== "approved") {
      throw new Error("Only approved applications can be converted to beneficiaries");
    }
    
    // Check if beneficiary already exists for this application
    const existingBeneficiary = await ctx.db
      .query("beneficiaries")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("applicationId"), args.applicationId))
      .first();
    
    if (existingBeneficiary) {
      throw new Error("Beneficiary already exists for this application");
    }
    
    // Get or create user account for the beneficiary
    let beneficiaryUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", application.email || ""))
      .first();
    
    if (!beneficiaryUser) {
      // Create user account for beneficiary
      const userId = await ctx.db.insert("users", {
        clerkId: `pending_${application.applicationNumber}`, // Will be updated when they sign up
        foundationId: args.foundationId,
        email: application.email || `${application.applicationNumber}@placeholder.com`,
        firstName: application.firstName,
        lastName: application.lastName,
        phone: application.phone,
        role: "beneficiary",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      beneficiaryUser = await ctx.db.get(userId);
    }
    
    if (!beneficiaryUser) {
      throw new Error("Failed to create user account");
    }
    
    // Get the first academic level for the foundation
    const academicLevel = await ctx.db
      .query("academicLevels")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .first();
    
    if (!academicLevel) {
      throw new Error("No academic levels configured for this foundation");
    }
    
    // Create beneficiary record
    const beneficiaryId = await ctx.db.insert("beneficiaries", {
      foundationId: args.foundationId,
      userId: beneficiaryUser._id,
      applicationId: args.applicationId,
      beneficiaryNumber: generateBeneficiaryNumber(),
      status: "active",
      currentAcademicLevel: academicLevel._id,
      currentSchool: application.education.currentSchool,
      expectedGraduation: undefined,
      supportStartDate: new Date().toISOString(),
      supportEndDate: undefined,
      supportTypes: ["tuition", "books", "uniforms"],
      emergencyContact: {
        name: application.guardian?.firstName + " " + application.guardian?.lastName || "",
        relationship: application.guardian?.relationship || "Guardian",
        phone: application.guardian?.phone || "",
        email: application.guardian?.email,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "beneficiary_created",
      entityType: "beneficiaries",
      entityId: beneficiaryId,
      description: `Created beneficiary from application ${application.applicationNumber}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });
    
    return beneficiaryId;
  },
});

// Get all beneficiaries for a foundation
export const getByFoundation = query({
  args: {
    foundationId: v.id("foundations"),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("graduated"),
      v.literal("withdrawn"),
      v.literal("suspended")
    )),
    search: v.optional(v.string()),
    academicLevelId: v.optional(v.id("academicLevels")),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin", "reviewer"]);
    
    let query = ctx.db
      .query("beneficiaries")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));
    
    const beneficiaries = await query.collect();
    
    // Apply filters
    let filtered = beneficiaries;
    
    if (args.status) {
      filtered = filtered.filter((b) => b.status === args.status);
    }
    
    if (args.academicLevelId) {
      filtered = filtered.filter((b) => b.currentAcademicLevel === args.academicLevelId);
    }
    
    // Get user details for each beneficiary
    const beneficiariesWithDetails = await Promise.all(
      filtered.map(async (beneficiary) => {
        const user = await ctx.db.get(beneficiary.userId);
        const academicLevel = await ctx.db.get(beneficiary.currentAcademicLevel);
        const application = await ctx.db.get(beneficiary.applicationId);
        
        // Get current academic session
        const currentSession = await ctx.db
          .query("academicSessions")
          .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", beneficiary._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .first();
        
        // Get latest performance record
        const latestPerformance = await ctx.db
          .query("performanceRecords")
          .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", beneficiary._id))
          .order("desc")
          .first();
        
        return {
          ...beneficiary,
          user,
          academicLevel,
          application,
          currentSession,
          latestPerformance,
        };
      })
    );
    
    // Apply search filter
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      return beneficiariesWithDetails.filter(
        (b) =>
          b.user?.firstName.toLowerCase().includes(searchLower) ||
          b.user?.lastName.toLowerCase().includes(searchLower) ||
          b.beneficiaryNumber.toLowerCase().includes(searchLower) ||
          b.currentSchool.toLowerCase().includes(searchLower)
      );
    }
    
    return beneficiariesWithDetails;
  },
});

// Get single beneficiary with full details
export const getById = query({
  args: {
    beneficiaryId: v.id("beneficiaries"),
  },
  handler: async (ctx, args) => {
    const beneficiary = await ctx.db.get(args.beneficiaryId);
    if (!beneficiary) {
      return null;
    }
    
    await authenticateAndAuthorize(ctx, beneficiary.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);
    
    // Get related data
    const user = await ctx.db.get(beneficiary.userId);
    const academicLevel = await ctx.db.get(beneficiary.currentAcademicLevel);
    const application = await ctx.db.get(beneficiary.applicationId);
    const foundation = await ctx.db.get(beneficiary.foundationId);
    
    // Get academic sessions
    const academicSessions = await ctx.db
      .query("academicSessions")
      .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", beneficiary._id))
      .collect();
    
    // Get performance records
    const performanceRecords = await ctx.db
      .query("performanceRecords")
      .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", beneficiary._id))
      .collect();
    
    // Get financial records
    const financialRecords = await ctx.db
      .query("financialRecords")
      .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", beneficiary._id))
      .collect();
    
    // Get program participations
    const programParticipations = await ctx.db
      .query("programParticipants")
      .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", beneficiary._id))
      .collect();
    
    // Get documents
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_entity", (q) => 
        q.eq("belongsTo", "beneficiary").eq("entityId", beneficiary._id)
      )
      .collect();
    
    return {
      ...beneficiary,
      user,
      academicLevel,
      application,
      foundation,
      academicSessions,
      performanceRecords,
      financialRecords,
      programParticipations,
      documents,
    };
  },
});

// Update beneficiary status
export const updateStatus = mutation({
  args: {
    beneficiaryId: v.id("beneficiaries"),
    status: v.union(
      v.literal("active"),
      v.literal("graduated"),
      v.literal("withdrawn"),
      v.literal("suspended")
    ),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const beneficiary = await ctx.db.get(args.beneficiaryId);
    if (!beneficiary) {
      throw new Error("Beneficiary not found");
    }
    
    const user = await authenticateAndAuthorize(ctx, beneficiary.foundationId, ["admin", "super_admin"]);
    
    const previousStatus = beneficiary.status;
    
    await ctx.db.patch(args.beneficiaryId, {
      status: args.status,
      updatedAt: Date.now(),
      ...(args.status === "graduated" && { supportEndDate: new Date().toISOString() }),
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: beneficiary.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "beneficiary_status_changed",
      entityType: "beneficiaries",
      entityId: args.beneficiaryId,
      description: `Changed beneficiary status from ${previousStatus} to ${args.status}: ${args.reason}`,
      riskLevel: args.status === "suspended" ? "high" : "medium",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Update beneficiary academic level
export const updateAcademicLevel = mutation({
  args: {
    beneficiaryId: v.id("beneficiaries"),
    newAcademicLevelId: v.id("academicLevels"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const beneficiary = await ctx.db.get(args.beneficiaryId);
    if (!beneficiary) {
      throw new Error("Beneficiary not found");
    }
    
    const user = await authenticateAndAuthorize(ctx, beneficiary.foundationId, ["admin", "super_admin"]);
    
    const newLevel = await ctx.db.get(args.newAcademicLevelId);
    if (!newLevel) {
      throw new Error("Academic level not found");
    }
    
    const previousLevel = await ctx.db.get(beneficiary.currentAcademicLevel);
    
    await ctx.db.patch(args.beneficiaryId, {
      currentAcademicLevel: args.newAcademicLevelId,
      updatedAt: Date.now(),
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: beneficiary.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "academic_level_changed",
      entityType: "beneficiaries",
      entityId: args.beneficiaryId,
      description: `Changed academic level from ${previousLevel?.name} to ${newLevel.name}: ${args.reason}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Get beneficiary statistics
export const getStatistics = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin", "reviewer"]);
    
    const beneficiaries = await ctx.db
      .query("beneficiaries")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    // Get academic levels for categorization
    const academicLevels = await ctx.db
      .query("academicLevels")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    // Calculate statistics
    const stats = {
      total: beneficiaries.length,
      byStatus: {
        active: beneficiaries.filter((b) => b.status === "active").length,
        graduated: beneficiaries.filter((b) => b.status === "graduated").length,
        withdrawn: beneficiaries.filter((b) => b.status === "withdrawn").length,
        suspended: beneficiaries.filter((b) => b.status === "suspended").length,
      },
      byAcademicLevel: academicLevels.map((level) => ({
        levelId: level._id,
        levelName: level.name,
        category: level.category,
        count: beneficiaries.filter((b) => b.currentAcademicLevel === level._id).length,
      })),
      byCategory: {
        nursery: 0,
        primary: 0,
        secondary: 0,
        university: 0,
      },
    };
    
    // Calculate by category
    for (const level of academicLevels) {
      const count = beneficiaries.filter((b) => b.currentAcademicLevel === level._id).length;
      stats.byCategory[level.category] += count;
    }
    
    return stats;
  },
});

// Get beneficiaries needing attention
export const getNeedingAttention = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin", "reviewer"]);
    
    const beneficiaries = await ctx.db
      .query("beneficiaries")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    const needingAttention = [];
    
    for (const beneficiary of beneficiaries) {
      // Check for active alerts
      const alerts = await ctx.db
        .query("performanceAlerts")
        .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", beneficiary._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();
      
      // Check for missing documents
      const requiredDocs = await ctx.db
        .query("documentTypes")
        .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
        .filter((q) => q.eq(q.field("isRequired"), true))
        .collect();
      
      const uploadedDocs = await ctx.db
        .query("documents")
        .withIndex("by_entity", (q) => 
          q.eq("belongsTo", "beneficiary").eq("entityId", beneficiary._id)
        )
        .collect();
      
      const missingDocs = requiredDocs.filter(
        (req) => !uploadedDocs.some((doc) => doc.documentTypeId === req._id)
      );
      
      // Check for overdue payments
      const overduePayments = await ctx.db
        .query("financialRecords")
        .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", beneficiary._id))
        .filter((q) => q.eq(q.field("status"), "overdue"))
        .collect();
      
      if (alerts.length > 0 || missingDocs.length > 0 || overduePayments.length > 0) {
        const user = await ctx.db.get(beneficiary.userId);
        needingAttention.push({
          beneficiary,
          user,
          alerts,
          missingDocuments: missingDocs,
          overduePayments,
        });
      }
    }
    
    return needingAttention;
  },
});