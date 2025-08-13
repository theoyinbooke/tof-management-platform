import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authenticateAndAuthorize } from "./auth";

/**
 * Get all academic levels for a foundation (alias for consistency)
 */
export const getAcademicLevels = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);
    
    const academicLevels = await ctx.db
      .query("academicLevels")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    return academicLevels.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

/**
 * Get all academic levels for a foundation
 */
export const getByFoundation = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);
    
    const academicLevels = await ctx.db
      .query("academicLevels")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    return academicLevels.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

/**
 * Get active academic levels for a foundation
 */
export const getActiveByFoundation = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);
    
    const academicLevels = await ctx.db
      .query("academicLevels")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    return academicLevels.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

/**
 * Create a new academic level
 */
export const create = mutation({
  args: {
    foundationId: v.id("foundations"),
    name: v.string(),
    category: v.union(
      v.literal("nursery"),
      v.literal("primary"),
      v.literal("secondary"),
      v.literal("university")
    ),
    sortOrder: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, ["super_admin", "admin"]);
    
    // Create academic level
    const academicLevelId = await ctx.db.insert("academicLevels", {
      foundationId: args.foundationId,
      name: args.name,
      category: args.category,
      sortOrder: args.sortOrder,
      isActive: args.isActive,
      createdAt: Date.now(),
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "academic_level_created",
      entityType: "academicLevels",
      entityId: academicLevelId,
      description: `Created new academic level: ${args.name}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });
    
    return academicLevelId;
  },
});

/**
 * Update an academic level
 */
export const update = mutation({
  args: {
    academicLevelId: v.id("academicLevels"),
    foundationId: v.id("foundations"),
    name: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("nursery"),
        v.literal("primary"),
        v.literal("secondary"),
        v.literal("university")
      )
    ),
    sortOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, ["super_admin", "admin"]);
    
    const academicLevel = await ctx.db.get(args.academicLevelId);
    if (!academicLevel) {
      throw new Error("Academic level not found");
    }
    
    if (academicLevel.foundationId !== args.foundationId) {
      throw new Error("Access denied");
    }
    
    const { academicLevelId, foundationId, ...updates } = args;
    
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
    
    // Update academic level
    await ctx.db.patch(args.academicLevelId, {
      ...cleanUpdates,
      updatedAt: Date.now(),
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "academic_level_updated",
      entityType: "academicLevels",
      entityId: args.academicLevelId,
      description: `Updated academic level: ${academicLevel.name}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Delete an academic level
 */
export const remove = mutation({
  args: {
    academicLevelId: v.id("academicLevels"),
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, ["super_admin", "admin"]);
    
    const academicLevel = await ctx.db.get(args.academicLevelId);
    if (!academicLevel) {
      throw new Error("Academic level not found");
    }
    
    if (academicLevel.foundationId !== args.foundationId) {
      throw new Error("Access denied");
    }
    
    // Check if academic level is in use
    const beneficiaries = await ctx.db
      .query("beneficiaries")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("currentAcademicLevel"), args.academicLevelId))
      .collect();
    
    if (beneficiaries.length > 0) {
      throw new Error("Cannot delete academic level that is in use by beneficiaries");
    }
    
    // Delete academic level
    await ctx.db.delete(args.academicLevelId);
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "academic_level_deleted",
      entityType: "academicLevels",
      entityId: args.academicLevelId,
      description: `Deleted academic level: ${academicLevel.name}`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

// ===================================
// ACADEMIC SESSIONS MANAGEMENT
// ===================================

/**
 * Get academic sessions for a beneficiary
 */
export const getSessionsByBeneficiary = query({
  args: {
    beneficiaryId: v.id("beneficiaries"),
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);

    const sessions = await ctx.db
      .query("academicSessions")
      .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", args.beneficiaryId))
      .collect();

    // Enrich with academic level details
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        const academicLevel = await ctx.db.get(session.academicLevelId);

        return {
          ...session,
          academicLevel,
        };
      })
    );

    return enrichedSessions.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get all academic sessions for a foundation
 */
export const getSessionsByFoundation = query({
  args: {
    foundationId: v.id("foundations"),
    status: v.optional(v.union(
      v.literal("planned"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    )),
    academicLevelId: v.optional(v.id("academicLevels")),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
    ]);

    let query = ctx.db
      .query("academicSessions")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    if (args.academicLevelId) {
      query = query.filter((q) => q.eq(q.field("academicLevelId"), args.academicLevelId));
    }

    const sessions = await query.collect();

    // Enrich with related data
    const enrichedSessions = await Promise.all(
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

    return enrichedSessions.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Create a new academic session
 */
export const createAcademicSession = mutation({
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
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
    ]);

    // Verify beneficiary belongs to foundation
    const beneficiary = await ctx.db.get(args.beneficiaryId);
    if (!beneficiary || beneficiary.foundationId !== args.foundationId) {
      throw new Error("Beneficiary not found or access denied");
    }

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
      status: "planned",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "academic_session_created",
      entityType: "academicSessions",
      entityId: sessionId,
      description: `Created academic session: ${args.sessionName}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return sessionId;
  },
});

/**
 * Update academic session status
 */
export const updateSessionStatus = mutation({
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

    const user = await authenticateAndAuthorize(ctx, session.foundationId, [
      "admin",
      "super_admin",
    ]);

    const updates: any = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.status === "completed" && args.isPromoted !== undefined) {
      updates.isPromoted = args.isPromoted;
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
      description: `Updated session status to ${args.status}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// ===================================
// PERFORMANCE RECORDS MANAGEMENT
// ===================================

/**
 * Get performance records for a beneficiary
 */
export const getPerformanceByBeneficiary = query({
  args: {
    beneficiaryId: v.id("beneficiaries"),
    foundationId: v.id("foundations"),
    academicSessionId: v.optional(v.id("academicSessions")),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);

    let query = ctx.db
      .query("performanceRecords")
      .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", args.beneficiaryId));

    if (args.academicSessionId) {
      query = query.filter((q) => q.eq(q.field("academicSessionId"), args.academicSessionId));
    }

    const records = await query.collect();

    // Enrich with session details
    const enrichedRecords = await Promise.all(
      records.map(async (record) => {
        const session = record.academicSessionId ? await ctx.db.get(record.academicSessionId) : null;
        const academicLevel = session ? await ctx.db.get(session.academicLevelId) : null;

        return {
          ...record,
          session,
          academicLevel,
        };
      })
    );

    return enrichedRecords.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get performance records for a foundation with analytics
 */
export const getPerformanceAnalytics = query({
  args: {
    foundationId: v.id("foundations"),
    academicLevelId: v.optional(v.id("academicLevels")),
    dateRange: v.optional(v.object({
      start: v.string(),
      end: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
    ]);

    let query = ctx.db
      .query("performanceRecords")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));

    const records = await query.collect();

    // Filter by date range if provided
    let filteredRecords = records;
    if (args.dateRange) {
      const startTime = new Date(args.dateRange.start).getTime();
      const endTime = new Date(args.dateRange.end).getTime();
      filteredRecords = records.filter(r => 
        r.createdAt >= startTime && r.createdAt <= endTime
      );
    }

    // Filter by academic level if provided
    if (args.academicLevelId) {
      const sessionsForLevel = await ctx.db
        .query("academicSessions")
        .withIndex("by_academic_level", (q) => q.eq("academicLevelId", args.academicLevelId))
        .collect();
      
      const sessionIds = new Set(sessionsForLevel.map(s => s._id));
      filteredRecords = filteredRecords.filter(r => 
        r.academicSessionId && sessionIds.has(r.academicSessionId)
      );
    }

    // Calculate analytics
    const totalRecords = filteredRecords.length;
    const recordsWithGrades = filteredRecords.filter(r => r.overallGrade !== undefined);
    const averageGrade = recordsWithGrades.length > 0 
      ? recordsWithGrades.reduce((sum, r) => sum + (r.overallGrade || 0), 0) / recordsWithGrades.length
      : 0;

    const gradeDistribution = {
      excellent: recordsWithGrades.filter(r => (r.overallGrade || 0) >= 80).length,
      good: recordsWithGrades.filter(r => (r.overallGrade || 0) >= 70 && (r.overallGrade || 0) < 80).length,
      average: recordsWithGrades.filter(r => (r.overallGrade || 0) >= 60 && (r.overallGrade || 0) < 70).length,
      poor: recordsWithGrades.filter(r => (r.overallGrade || 0) < 60).length,
    };

    const needsIntervention = filteredRecords.filter(r => r.needsIntervention).length;
    const improved = filteredRecords.filter(r => r.hasImproved).length;

    return {
      totalRecords,
      averageGrade,
      gradeDistribution,
      needsIntervention,
      improved,
      recentRecords: filteredRecords.slice(0, 10),
    };
  },
});

/**
 * Create or update performance record
 */
export const createPerformanceRecord = mutation({
  args: {
    foundationId: v.id("foundations"),
    beneficiaryId: v.id("beneficiaries"),
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
    needsIntervention: v.boolean(),
    interventionReason: v.optional(v.string()),
    hasImproved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
    ]);

    // Verify session belongs to beneficiary and foundation
    const session = await ctx.db.get(args.academicSessionId);
    if (!session || session.foundationId !== args.foundationId || session.beneficiaryId !== args.beneficiaryId) {
      throw new Error("Academic session not found or access denied");
    }

    // Check if performance record already exists for this session
    const existingRecord = await ctx.db
      .query("performanceRecords")
      .withIndex("by_session", (q) => q.eq("academicSessionId", args.academicSessionId))
      .filter((q) => q.eq(q.field("beneficiaryId"), args.beneficiaryId))
      .unique();

    let recordId: v.Id<"performanceRecords">;

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
        needsIntervention: args.needsIntervention,
        interventionReason: args.interventionReason,
        hasImproved: args.hasImproved,
        updatedAt: Date.now(),
      });
      recordId = existingRecord._id;
    } else {
      // Create new record
      recordId = await ctx.db.insert("performanceRecords", {
        foundationId: args.foundationId,
        beneficiaryId: args.beneficiaryId,
        academicSessionId: args.academicSessionId,
        overallGrade: args.overallGrade,
        gradeClass: args.gradeClass,
        position: args.position,
        totalStudents: args.totalStudents,
        attendance: args.attendance,
        subjects: args.subjects,
        teacherComments: args.teacherComments,
        principalComments: args.principalComments,
        needsIntervention: args.needsIntervention,
        interventionReason: args.interventionReason,
        hasImproved: args.hasImproved,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: existingRecord ? "performance_updated" : "performance_created",
      entityType: "performanceRecords",
      entityId: recordId,
      description: `${existingRecord ? "Updated" : "Created"} performance record for ${session.sessionName}`,
      riskLevel: args.needsIntervention ? "high" : "low",
      createdAt: Date.now(),
    });

    return recordId;
  },
});

// ===================================
// PERFORMANCE ALERTS
// ===================================

/**
 * Get performance alerts
 */
export const getPerformanceAlerts = query({
  args: {
    foundationId: v.id("foundations"),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("acknowledged"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("dismissed")
    )),
    severity: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical")
    )),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
    ]);

    let query = ctx.db
      .query("performanceAlerts")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    if (args.severity) {
      query = query.filter((q) => q.eq(q.field("severity"), args.severity));
    }

    const alerts = await query.order("desc").collect();

    // Enrich with beneficiary details and session info
    const enrichedAlerts = await Promise.all(
      alerts.map(async (alert) => {
        const beneficiary = await ctx.db.get(alert.beneficiaryId);
        const beneficiaryUser = beneficiary ? await ctx.db.get(beneficiary.userId) : null;
        
        // Get session info if related to performance record
        let session = null;
        if (alert.relatedEntity === "performance_record" && alert.relatedEntityId) {
          const performanceRecord = await ctx.db.get(alert.relatedEntityId as v.Id<"performanceRecords">);
          if (performanceRecord?.academicSessionId) {
            session = await ctx.db.get(performanceRecord.academicSessionId);
          }
        }

        return {
          ...alert,
          beneficiary,
          beneficiaryUser,
          session,
        };
      })
    );

    return enrichedAlerts;
  },
});

/**
 * Update alert status
 */
export const updateAlertStatus = mutation({
  args: {
    alertId: v.id("performanceAlerts"),
    status: v.union(
      v.literal("active"),
      v.literal("acknowledged"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("dismissed")
    ),
    actionTaken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const alert = await ctx.db.get(args.alertId);
    if (!alert) {
      throw new Error("Performance alert not found");
    }

    const user = await authenticateAndAuthorize(ctx, alert.foundationId, [
      "admin",
      "super_admin",
    ]);

    await ctx.db.patch(args.alertId, {
      status: args.status,
      actionTaken: args.actionTaken,
      actionBy: user._id,
      actionDate: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: alert.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "alert_status_updated",
      entityType: "performanceAlerts",
      entityId: args.alertId,
      description: `Updated alert status to ${args.status}`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get alerts analytics for dashboard
 */
export const getAlertsAnalytics = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
    ]);

    const alerts = await ctx.db
      .query("performanceAlerts")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();

    const totalActive = alerts.filter(a => a.status === "active").length;
    const criticalCount = alerts.filter(a => a.severity === "critical").length;
    const highCount = alerts.filter(a => a.severity === "high").length;
    const mediumCount = alerts.filter(a => a.severity === "medium").length;
    const lowCount = alerts.filter(a => a.severity === "low").length;
    const inProgressCount = alerts.filter(a => a.status === "in_progress").length;
    
    // Resolved today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const resolvedToday = alerts.filter(a => 
      a.status === "resolved" && 
      a.actionDate && 
      a.actionDate >= todayStart.getTime()
    ).length;

    // Alert types
    const performanceAlerts = alerts.filter(a => 
      a.alertType === "performance_low" || a.alertType === "grade_drop"
    ).length;
    const attendanceAlerts = alerts.filter(a => 
      a.alertType === "attendance_low" || a.alertType === "session_missed"
    ).length;

    return {
      totalActive,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      inProgressCount,
      resolvedToday,
      performanceAlerts,
      attendanceAlerts,
    };
  },
});

/**
 * Resolve performance alert
 */
export const resolvePerformanceAlert = mutation({
  args: {
    alertId: v.id("performanceAlerts"),
    foundationId: v.id("foundations"),
    resolutionNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
    ]);

    const alert = await ctx.db.get(args.alertId);
    if (!alert || alert.foundationId !== args.foundationId) {
      throw new Error("Alert not found or access denied");
    }

    await ctx.db.patch(args.alertId, {
      status: "resolved",
      resolutionNotes: args.resolutionNotes,
      resolvedBy: user._id,
      resolvedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "alert_resolved",
      entityType: "performanceAlerts",
      entityId: args.alertId,
      description: `Resolved alert: ${alert.title}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Generate academic performance alerts
 */
export const generateAcademicAlerts = mutation({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
    ]);

    // Get all performance records for the foundation
    const performanceRecords = await ctx.db
      .query("performanceRecords")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();

    let alertsCreated = 0;

    for (const record of performanceRecords) {
      // Check for low performance (below 60%)
      if (record.overallGrade !== undefined && record.overallGrade < 60) {
        // Check if alert already exists
        const existingAlert = await ctx.db
          .query("performanceAlerts")
          .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", record.beneficiaryId))
          .filter((q) => 
            q.and(
              q.eq(q.field("alertType"), "performance_low"),
              q.eq(q.field("status"), "active"),
              q.eq(q.field("relatedEntityId"), record._id)
            )
          )
          .first();

        if (!existingAlert) {
          const severity = record.overallGrade < 40 ? "critical" : 
                          record.overallGrade < 50 ? "high" : "medium";

          await ctx.db.insert("performanceAlerts", {
            foundationId: args.foundationId,
            beneficiaryId: record.beneficiaryId,
            ruleId: "performance_threshold" as v.Id<"performanceRules">,
            alertType: "performance_low",
            severity,
            title: "Low Academic Performance",
            description: `Overall grade of ${record.overallGrade}% is below the 60% threshold`,
            relatedEntity: "performance_record",
            relatedEntityId: record._id,
            status: "active",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });

          alertsCreated++;
        }
      }

      // Check if intervention is needed
      if (record.needsIntervention) {
        const existingAlert = await ctx.db
          .query("performanceAlerts")
          .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", record.beneficiaryId))
          .filter((q) => 
            q.and(
              q.eq(q.field("alertType"), "intervention_needed"),
              q.eq(q.field("status"), "active"),
              q.eq(q.field("relatedEntityId"), record._id)
            )
          )
          .first();

        if (!existingAlert) {
          await ctx.db.insert("performanceAlerts", {
            foundationId: args.foundationId,
            beneficiaryId: record.beneficiaryId,
            ruleId: "intervention_required" as v.Id<"performanceRules">,
            alertType: "intervention_needed",
            severity: "high",
            title: "Academic Intervention Required",
            description: record.interventionReason || "Student requires academic intervention support",
            relatedEntity: "performance_record",
            relatedEntityId: record._id,
            status: "active",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });

          alertsCreated++;
        }
      }
    }

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "academic_alerts_generated",
      entityType: "performanceAlerts",
      entityId: "batch_generation",
      description: `Generated ${alertsCreated} academic performance alerts`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return { alertsCreated };
  },
});