import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { authenticateAndAuthorize } from "./auth";

// Create new academic session for a beneficiary
export const create = mutation({
  args: {
    foundationId: v.id("foundations"),
    beneficiaryId: v.id("beneficiaries"),
    academicLevelId: v.id("academicLevels"),
    sessionName: v.string(),
    sessionType: v.union(v.literal("term"), v.literal("semester")),
    startDate: v.string(),
    endDate: v.string(),
    schoolName: v.string(),
    schoolAddress: v.optional(v.string()),
    schoolContact: v.optional(v.object({
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
      accountDetails: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);
    
    // Verify beneficiary exists and belongs to foundation
    const beneficiary = await ctx.db.get(args.beneficiaryId);
    if (!beneficiary || beneficiary.foundationId !== args.foundationId) {
      throw new Error("Beneficiary not found or access denied");
    }
    
    // Check for existing active session
    const existingActive = await ctx.db
      .query("academicSessions")
      .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", args.beneficiaryId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    
    if (existingActive) {
      throw new Error("Beneficiary already has an active academic session");
    }
    
    // Create the academic session
    const sessionId = await ctx.db.insert("academicSessions", {
      foundationId: args.foundationId,
      beneficiaryId: args.beneficiaryId,
      academicLevelId: args.academicLevelId,
      sessionName: args.sessionName,
      sessionType: args.sessionType,
      startDate: args.startDate,
      endDate: args.endDate,
      schoolName: args.schoolName,
      schoolAddress: args.schoolAddress,
      schoolContact: args.schoolContact,
      status: "active",
      isPromoted: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Update beneficiary's current school if different
    if (beneficiary.currentSchool !== args.schoolName) {
      await ctx.db.patch(args.beneficiaryId, {
        currentSchool: args.schoolName,
        updatedAt: Date.now(),
      });
    }
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "academic_session_created",
      entityType: "academicSessions",
      entityId: sessionId,
      description: `Created academic session "${args.sessionName}" for beneficiary`,
      riskLevel: "low",
      createdAt: Date.now(),
    });
    
    return sessionId;
  },
});

// Get academic sessions for a beneficiary
export const getByBeneficiary = query({
  args: {
    beneficiaryId: v.id("beneficiaries"),
  },
  handler: async (ctx, args) => {
    const beneficiary = await ctx.db.get(args.beneficiaryId);
    if (!beneficiary) {
      return [];
    }
    
    await authenticateAndAuthorize(ctx, beneficiary.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);
    
    const sessions = await ctx.db
      .query("academicSessions")
      .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", args.beneficiaryId))
      .order("desc")
      .collect();
    
    // Get academic level details and performance for each session
    const sessionsWithDetails = await Promise.all(
      sessions.map(async (session) => {
        const academicLevel = await ctx.db.get(session.academicLevelId);
        const performanceRecord = await ctx.db
          .query("performanceRecords")
          .withIndex("by_session", (q) => q.eq("academicSessionId", session._id))
          .first();
        
        return {
          ...session,
          academicLevel,
          performanceRecord,
        };
      })
    );
    
    return sessionsWithDetails;
  },
});

// Get all active sessions for a foundation
export const getActiveByFoundation = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin", "reviewer"]);
    
    const sessions = await ctx.db
      .query("academicSessions")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    // Get beneficiary and academic level details
    const sessionsWithDetails = await Promise.all(
      sessions.map(async (session) => {
        const beneficiary = await ctx.db.get(session.beneficiaryId);
        const beneficiaryUser = beneficiary ? await ctx.db.get(beneficiary.userId) : null;
        const academicLevel = await ctx.db.get(session.academicLevelId);
        
        return {
          ...session,
          beneficiary,
          beneficiaryUser,
          academicLevel,
        };
      })
    );
    
    return sessionsWithDetails;
  },
});

// Update academic session status
export const updateStatus = mutation({
  args: {
    sessionId: v.id("academicSessions"),
    status: v.union(
      v.literal("planned"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    isPromoted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error("Academic session not found");
    }
    
    const user = await authenticateAndAuthorize(ctx, session.foundationId, ["admin", "super_admin"]);
    
    const updates: any = {
      status: args.status,
      updatedAt: Date.now(),
    };
    
    if (args.status === "completed" && args.isPromoted !== undefined) {
      updates.isPromoted = args.isPromoted;
      
      // If promoted, update beneficiary's academic level
      if (args.isPromoted) {
        const beneficiary = await ctx.db.get(session.beneficiaryId);
        if (beneficiary) {
          // Get next academic level
          const currentLevel = await ctx.db.get(session.academicLevelId);
          if (currentLevel) {
            const nextLevel = await ctx.db
              .query("academicLevels")
              .withIndex("by_foundation", (q) => q.eq("foundationId", session.foundationId))
              .filter((q) => q.gt(q.field("sortOrder"), currentLevel.sortOrder))
              .order("asc")
              .first();
            
            if (nextLevel) {
              await ctx.db.patch(session.beneficiaryId, {
                currentAcademicLevel: nextLevel._id,
                updatedAt: Date.now(),
              });
            }
          }
        }
      }
    }
    
    await ctx.db.patch(args.sessionId, updates);
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: session.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "academic_session_updated",
      entityType: "academicSessions",
      entityId: args.sessionId,
      description: `Updated academic session status to ${args.status}${args.isPromoted !== undefined ? ` (Promoted: ${args.isPromoted})` : ""}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

// Record performance for an academic session
export const recordPerformance = mutation({
  args: {
    academicSessionId: v.id("academicSessions"),
    overallGrade: v.optional(v.number()),
    gradeClass: v.optional(v.string()),
    position: v.optional(v.number()),
    totalStudents: v.optional(v.number()),
    attendance: v.optional(v.number()),
    subjects: v.optional(v.array(v.object({
      name: v.string(),
      grade: v.number(),
      comment: v.optional(v.string()),
    }))),
    teacherComments: v.optional(v.string()),
    principalComments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.academicSessionId);
    if (!session) {
      throw new Error("Academic session not found");
    }
    
    const user = await authenticateAndAuthorize(ctx, session.foundationId, ["admin", "super_admin"]);
    
    // Check if performance record already exists
    const existingRecord = await ctx.db
      .query("performanceRecords")
      .withIndex("by_session", (q) => q.eq("academicSessionId", args.academicSessionId))
      .first();
    
    // Determine if intervention is needed
    const needsIntervention = args.overallGrade !== undefined && args.overallGrade < 50;
    const interventionReason = needsIntervention
      ? `Poor performance: ${args.overallGrade}%`
      : undefined;
    
    if (existingRecord) {
      // Update existing record
      await ctx.db.patch(existingRecord._id, {
        overallGrade: args.overallGrade,
        gradeClass: args.gradeClass,
        position: args.position,
        totalStudents: args.totalStudents,
        attendance: args.attendance,
        subjects: args.subjects,
        teacherComments: args.teacherComments,
        principalComments: args.principalComments,
        hasImproved: existingRecord.overallGrade && args.overallGrade
          ? args.overallGrade > existingRecord.overallGrade
          : undefined,
        needsIntervention,
        interventionReason,
        updatedAt: Date.now(),
      });
    } else {
      // Create new performance record
      await ctx.db.insert("performanceRecords", {
        foundationId: session.foundationId,
        beneficiaryId: session.beneficiaryId,
        academicSessionId: args.academicSessionId,
        overallGrade: args.overallGrade,
        gradeClass: args.gradeClass,
        position: args.position,
        totalStudents: args.totalStudents,
        attendance: args.attendance,
        subjects: args.subjects,
        teacherComments: args.teacherComments,
        principalComments: args.principalComments,
        hasImproved: undefined,
        needsIntervention,
        interventionReason,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // Create performance alert if needed
    if (needsIntervention) {
      await ctx.db.insert("performanceAlerts", {
        foundationId: session.foundationId,
        beneficiaryId: session.beneficiaryId,
        ruleId: undefined as any, // Will be updated when rules are implemented
        alertType: "poor_performance",
        severity: args.overallGrade! < 40 ? "high" : "medium",
        title: "Poor Academic Performance",
        description: `Student scored ${args.overallGrade}% in ${session.sessionName}`,
        relatedEntity: "academicSessions",
        relatedEntityId: args.academicSessionId,
        status: "active",
        actionTaken: undefined,
        actionBy: undefined,
        actionDate: undefined,
        autoResolveDate: undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: session.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "performance_recorded",
      entityType: "performanceRecords",
      entityId: existingRecord?._id || args.academicSessionId,
      description: `Recorded performance for ${session.sessionName}: ${args.overallGrade}%`,
      riskLevel: needsIntervention ? "medium" : "low",
      createdAt: Date.now(),
    });
    
    return { success: true, needsIntervention };
  },
});

// Get performance history for a beneficiary
export const getPerformanceHistory = query({
  args: {
    beneficiaryId: v.id("beneficiaries"),
  },
  handler: async (ctx, args) => {
    const beneficiary = await ctx.db.get(args.beneficiaryId);
    if (!beneficiary) {
      return [];
    }
    
    await authenticateAndAuthorize(ctx, beneficiary.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);
    
    const performanceRecords = await ctx.db
      .query("performanceRecords")
      .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", args.beneficiaryId))
      .order("desc")
      .collect();
    
    // Get session details for each record
    const recordsWithSessions = await Promise.all(
      performanceRecords.map(async (record) => {
        const session = await ctx.db.get(record.academicSessionId);
        const academicLevel = session ? await ctx.db.get(session.academicLevelId) : null;
        
        return {
          ...record,
          session,
          academicLevel,
        };
      })
    );
    
    return recordsWithSessions;
  },
});

// Get sessions needing performance updates
export const getSessionsNeedingPerformance = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);
    
    const sessions = await ctx.db
      .query("academicSessions")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    const sessionsNeedingUpdate = [];
    
    for (const session of sessions) {
      // Check if session has a performance record
      const performanceRecord = await ctx.db
        .query("performanceRecords")
        .withIndex("by_session", (q) => q.eq("academicSessionId", session._id))
        .first();
      
      // Calculate if update is needed (e.g., no record or record is old)
      const needsUpdate = !performanceRecord || 
        (performanceRecord.updatedAt < Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
      
      if (needsUpdate) {
        const beneficiary = await ctx.db.get(session.beneficiaryId);
        const beneficiaryUser = beneficiary ? await ctx.db.get(beneficiary.userId) : null;
        const academicLevel = await ctx.db.get(session.academicLevelId);
        
        sessionsNeedingUpdate.push({
          session,
          beneficiary,
          beneficiaryUser,
          academicLevel,
          lastPerformanceUpdate: performanceRecord?.updatedAt,
        });
      }
    }
    
    return sessionsNeedingUpdate;
  },
});

// Get all academic sessions for a foundation
export const getByFoundation = query({
  args: {
    foundationId: v.id("foundations"),
    status: v.optional(v.union(
      v.literal("planned"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin", "reviewer"]);
    
    let query = ctx.db
      .query("academicSessions")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));
    
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    const sessions = await query.order("desc").collect();
    
    // Get beneficiary and academic level details
    const sessionsWithDetails = await Promise.all(
      sessions.map(async (session) => {
        const beneficiary = await ctx.db.get(session.beneficiaryId);
        const beneficiaryUser = beneficiary ? await ctx.db.get(beneficiary.userId) : null;
        const academicLevel = await ctx.db.get(session.academicLevelId);
        
        return {
          ...session,
          beneficiary,
          beneficiaryUser,
          academicLevel,
        };
      })
    );
    
    return sessionsWithDetails;
  },
});