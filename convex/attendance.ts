// convex/attendance.ts
// Attendance Tracking System - Convex Functions
// TheOyinbooke Foundation Management Platform

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { authenticateAndAuthorize } from "./auth";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// ===================================
// ATTENDANCE RECORDS MANAGEMENT
// ===================================

/**
 * Get attendance records for a beneficiary
 */
export const getAttendanceByBeneficiary = query({
  args: {
    beneficiaryId: v.id("beneficiaries"),
    foundationId: v.id("foundations"),
    academicSessionId: v.optional(v.id("academicSessions")),
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
      "beneficiary",
      "guardian",
    ]);

    // Get academic sessions for the beneficiary
    let sessionQuery = ctx.db
      .query("academicSessions")
      .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", args.beneficiaryId));

    if (args.academicSessionId) {
      sessionQuery = sessionQuery.filter((q) => q.eq(q.field("_id"), args.academicSessionId));
    }

    const sessions = await sessionQuery.collect();
    const sessionIds = sessions.map(s => s._id);

    if (sessionIds.length === 0) {
      return [];
    }

    // Get program enrollments for these sessions
    const enrollments = await ctx.db
      .query("programEnrollments")
      .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", args.beneficiaryId))
      .collect();

    // Get attendance records
    const attendanceRecords = [];
    
    for (const enrollment of enrollments) {
      if (enrollment.attendance) {
        for (const record of enrollment.attendance) {
          // Filter by date range if provided
          if (args.dateRange) {
            const recordDate = new Date(record.sessionDate);
            const startDate = new Date(args.dateRange.start);
            const endDate = new Date(args.dateRange.end);
            
            if (recordDate < startDate || recordDate > endDate) {
              continue;
            }
          }

          const session = await ctx.db.get(record.sessionId);
          const program = await ctx.db.get(enrollment.programId);
          
          attendanceRecords.push({
            ...record,
            enrollmentId: enrollment._id,
            programSession: session,
            program,
            beneficiaryId: args.beneficiaryId,
          });
        }
      }
    }

    return attendanceRecords.sort((a, b) => b.sessionDate - a.sessionDate);
  },
});

/**
 * Get attendance summary for a beneficiary
 */
export const getAttendanceSummary = query({
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

    // Get all attendance records for the beneficiary
    const attendanceRecords = await ctx.runQuery("attendance:getAttendanceByBeneficiary" as any, {
      beneficiaryId: args.beneficiaryId,
      foundationId: args.foundationId,
      academicSessionId: args.academicSessionId,
    });

    // Calculate summary statistics
    const totalSessions = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((r: any) => r.status === "present").length;
    const absentCount = attendanceRecords.filter((r: any) => r.status === "absent").length;
    const lateCount = attendanceRecords.filter((r: any) => r.status === "late").length;

    const attendanceRate = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;
    const lateRate = totalSessions > 0 ? (lateCount / totalSessions) * 100 : 0;

    // Group by program
    const programSummary = new Map();
    for (const record of attendanceRecords) {
      const programId = record.program?._id;
      if (!programId) continue;

      if (!programSummary.has(programId)) {
        programSummary.set(programId, {
          program: record.program,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
        });
      }

      const summary = programSummary.get(programId);
      summary.total++;
      summary[record.status]++;
    }

    // Convert map to array and calculate rates
    const programStats = Array.from(programSummary.values()).map(summary => ({
      ...summary,
      attendanceRate: summary.total > 0 ? (summary.present / summary.total) * 100 : 0,
      lateRate: summary.total > 0 ? (summary.late / summary.total) * 100 : 0,
    }));

    return {
      totalSessions,
      presentCount,
      absentCount,
      lateCount,
      attendanceRate,
      lateRate,
      programStats,
      recentRecords: attendanceRecords.slice(0, 10),
    };
  },
});

/**
 * Get attendance records for a program session
 */
export const getSessionAttendance = query({
  args: {
    sessionId: v.id("programSessions"),
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
    ]);

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.foundationId !== args.foundationId) {
      throw new Error("Session not found or access denied");
    }

    // Get program and enrollments
    const program = await ctx.db.get(session.programId);
    const enrollments = await ctx.db
      .query("programEnrollments")
      .withIndex("by_program", (q) => q.eq("programId", session.programId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Enrich enrollments with beneficiary info and attendance status
    const attendanceRecords = await Promise.all(
      enrollments.map(async (enrollment) => {
        const beneficiary = await ctx.db.get(enrollment.beneficiaryId);
        const beneficiaryUser = beneficiary ? await ctx.db.get(beneficiary.userId) : null;

        // Find attendance record for this session
        const attendanceRecord = enrollment.attendance?.find(
          record => record.sessionId === args.sessionId
        );

        return {
          enrollmentId: enrollment._id,
          beneficiary,
          beneficiaryUser,
          attendanceStatus: attendanceRecord?.status || "not_recorded",
          notes: attendanceRecord?.notes,
          program,
          session,
        };
      })
    );

    return attendanceRecords.sort((a, b) => 
      (a.beneficiaryUser?.firstName || "").localeCompare(b.beneficiaryUser?.firstName || "")
    );
  },
});

/**
 * Get attendance analytics for foundation
 */
export const getAttendanceAnalytics = query({
  args: {
    foundationId: v.id("foundations"),
    programId: v.optional(v.id("programs")),
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

    // Get program enrollments
    let enrollmentQuery = ctx.db
      .query("programEnrollments")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));

    if (args.programId) {
      enrollmentQuery = enrollmentQuery.filter((q) => q.eq(q.field("programId"), args.programId));
    }

    const enrollments = await enrollmentQuery.collect();

    // Aggregate attendance data
    let totalSessions = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    const beneficiaryStats = new Map();
    const programStats = new Map();

    for (const enrollment of enrollments) {
      if (enrollment.attendance) {
        for (const record of enrollment.attendance) {
          // Filter by date range if provided
          if (args.dateRange) {
            const recordDate = new Date(record.sessionDate);
            const startDate = new Date(args.dateRange.start);
            const endDate = new Date(args.dateRange.end);
            
            if (recordDate < startDate || recordDate > endDate) {
              continue;
            }
          }

          totalSessions++;
          
          // Count by status
          if (record.status === "present") totalPresent++;
          else if (record.status === "absent") totalAbsent++;
          else if (record.status === "late") totalLate++;

          // Track by beneficiary
          const beneficiaryId = enrollment.beneficiaryId;
          if (!beneficiaryStats.has(beneficiaryId)) {
            beneficiaryStats.set(beneficiaryId, {
              total: 0,
              present: 0,
              absent: 0,
              late: 0,
            });
          }
          const beneficiaryStat = beneficiaryStats.get(beneficiaryId);
          beneficiaryStat.total++;
          beneficiaryStat[record.status]++;

          // Track by program
          const programId = enrollment.programId;
          if (!programStats.has(programId)) {
            programStats.set(programId, {
              total: 0,
              present: 0,
              absent: 0,
              late: 0,
            });
          }
          const programStat = programStats.get(programId);
          programStat.total++;
          programStat[record.status]++;
        }
      }
    }

    // Calculate overall rates
    const overallAttendanceRate = totalSessions > 0 ? (totalPresent / totalSessions) * 100 : 0;
    const overallLateRate = totalSessions > 0 ? (totalLate / totalSessions) * 100 : 0;
    const overallAbsentRate = totalSessions > 0 ? (totalAbsent / totalSessions) * 100 : 0;

    // Identify beneficiaries with poor attendance (below 75%)
    const poorAttendance = Array.from(beneficiaryStats.entries())
      .filter(([_, stats]) => {
        const rate = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;
        return rate < 75 && stats.total >= 5; // Only flag if they have attended at least 5 sessions
      })
      .map(([beneficiaryId, stats]) => ({
        beneficiaryId,
        attendanceRate: (stats.present / stats.total) * 100,
        totalSessions: stats.total,
      }));

    return {
      overview: {
        totalSessions,
        totalPresent,
        totalAbsent,
        totalLate,
        overallAttendanceRate,
        overallLateRate,
        overallAbsentRate,
      },
      poorAttendanceCount: poorAttendance.length,
      poorAttendance: poorAttendance.slice(0, 10), // Top 10 worst attendance
      programCount: programStats.size,
      beneficiaryCount: beneficiaryStats.size,
    };
  },
});

// ===================================
// ATTENDANCE RECORDING
// ===================================

/**
 * Record attendance for a program session
 */
export const recordSessionAttendance = mutation({
  args: {
    sessionId: v.id("programSessions"),
    foundationId: v.id("foundations"),
    attendanceData: v.array(v.object({
      enrollmentId: v.id("programEnrollments"),
      status: v.union(
        v.literal("present"),
        v.literal("absent"),
        v.literal("late")
      ),
      notes: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
    ]);

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.foundationId !== args.foundationId) {
      throw new Error("Session not found or access denied");
    }

    // Update each enrollment with attendance data
    for (const attendanceRecord of args.attendanceData) {
      const enrollment = await ctx.db.get(attendanceRecord.enrollmentId);
      if (!enrollment || enrollment.foundationId !== args.foundationId) {
        continue; // Skip invalid enrollments
      }

      // Get existing attendance array or create new one
      const existingAttendance = enrollment.attendance || [];
      
      // Remove any existing record for this session
      const filteredAttendance = existingAttendance.filter(
        record => record.sessionId !== args.sessionId
      );

      // Add new attendance record
      const newAttendanceRecord = {
        sessionId: args.sessionId,
        sessionDate: session.sessionDate,
        status: attendanceRecord.status,
        notes: attendanceRecord.notes,
      };

      const updatedAttendance = [...filteredAttendance, newAttendanceRecord];

      // Calculate new attendance rate
      const totalSessions = updatedAttendance.length;
      const presentSessions = updatedAttendance.filter(r => r.status === "present").length;
      const attendanceRate = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;

      // Update enrollment
      await ctx.db.patch(attendanceRecord.enrollmentId, {
        attendance: updatedAttendance,
        // attendanceRate field not in schema - calculated from attendance array
        updatedAt: Date.now(),
      });
    }

    // Mark session as having attendance recorded
    await ctx.db.patch(args.sessionId, {
      attendanceRecorded: true,
      attendanceRecordedBy: user._id,
      attendanceRecordedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "attendance_recorded",
      entityType: "programSessions",
      entityId: args.sessionId,
      description: `Recorded attendance for ${session.title} - ${args.attendanceData.length} students`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update individual attendance record
 */
export const updateAttendanceRecord = mutation({
  args: {
    enrollmentId: v.id("programEnrollments"),
    sessionId: v.id("programSessions"),
    foundationId: v.id("foundations"),
    status: v.union(
      v.literal("present"),
      v.literal("absent"),
      v.literal("late")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
    ]);

    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment || enrollment.foundationId !== args.foundationId) {
      throw new Error("Enrollment not found or access denied");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.foundationId !== args.foundationId) {
      throw new Error("Session not found or access denied");
    }

    // Get existing attendance array
    const existingAttendance = enrollment.attendance || [];
    
    // Find and update the specific record
    const updatedAttendance = existingAttendance.map(record => {
      if (record.sessionId === args.sessionId) {
        return {
          ...record,
          status: args.status,
          notes: args.notes,
        };
      }
      return record;
    });

    // If record doesn't exist, add it
    if (!existingAttendance.find(r => r.sessionId === args.sessionId)) {
      updatedAttendance.push({
        sessionId: args.sessionId,
        sessionDate: session.sessionDate,
        status: args.status,
        notes: args.notes,
      });
    }

    // Recalculate attendance rate
    const totalSessions = updatedAttendance.length;
    const presentSessions = updatedAttendance.filter(r => r.status === "present").length;
    const attendanceRate = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;

    // Update enrollment
    await ctx.db.patch(args.enrollmentId, {
      attendance: updatedAttendance,
      // attendanceRate field not in schema - calculated from attendance array
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "attendance_updated",
      entityType: "programEnrollments",
      entityId: args.enrollmentId,
      description: `Updated attendance record for ${session.title}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// ===================================
// ATTENDANCE ALERTS
// ===================================

/**
 * Generate attendance alerts for poor attendance
 */
export const generateAttendanceAlerts = mutation({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
    ]);

    // Get all program enrollments
    const enrollments = await ctx.db
      .query("programEnrollments")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    let alertsCreated = 0;

    for (const enrollment of enrollments) {
      // Calculate attendance rate from attendance array
      const attendanceRate = enrollment.attendance ? 
        enrollment.attendance.length > 0 ? 
          (enrollment.attendance.filter((a: any) => a.status === "present").length / enrollment.attendance.length) * 100 
          : 0 
        : 0;
      
      // Check if attendance rate is below threshold (75%) and has sufficient sessions
      if (attendanceRate < 75 && 
          enrollment.attendance && 
          enrollment.attendance.length >= 5) {

        // Check if alert already exists for this beneficiary
        const existingAlert = await ctx.db
          .query("performanceAlerts")
          .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", enrollment.beneficiaryId))
          .filter((q) => 
            q.and(
              q.eq(q.field("alertType"), "attendance_low"),
              q.eq(q.field("status"), "active")
            )
          )
          .first();

        if (!existingAlert) {
          // Create attendance alert
          await ctx.db.insert("performanceAlerts", {
            foundationId: args.foundationId,
            beneficiaryId: enrollment.beneficiaryId,
            ruleId: "attendance_threshold" as Id<"performanceRules">,
            alertType: "attendance_low",
            severity: attendanceRate < 50 ? "critical" : 
                     attendanceRate < 60 ? "high" : "medium",
            title: "Poor Attendance Alert",
            description: `Attendance rate is ${attendanceRate.toFixed(1)}% which is below the 75% threshold`,
            relatedEntity: "program_enrollment",
            relatedEntityId: enrollment._id,
            status: "active",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });

          alertsCreated++;

          // Get beneficiary details for notification
          const beneficiary = await ctx.db.get(enrollment.beneficiaryId);
          if (beneficiary) {
            // Create notification for the beneficiary
            await ctx.scheduler.runAfter(0, internal.notifications.createSystemNotification, {
              foundationId: args.foundationId,
              recipientId: beneficiary.userId,
              type: "alert",
              priority: attendanceRate < 50 ? "urgent" : "high",
              title: "Poor Attendance Alert",
              message: `Your attendance rate of ${attendanceRate.toFixed(1)}% is below the required 75% minimum. Please improve your attendance.`,
              actionUrl: `/attendance/dashboard`,
              actionText: "View Attendance",
              relatedEntityType: "program_enrollments",
              relatedEntityId: enrollment._id,
              metadata: {
                beneficiaryId: enrollment.beneficiaryId,
              },
              channels: ["in_app", "email"],
            });

            // Also notify foundation admins
            const admins = await ctx.db
              .query("users")
              .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
              .filter((q) => 
                q.or(
                  q.eq(q.field("role"), "admin"),
                  q.eq(q.field("role"), "super_admin")
                )
              )
              .collect();

            for (const admin of admins) {
              await ctx.scheduler.runAfter(0, internal.notifications.createSystemNotification, {
                foundationId: args.foundationId,
                recipientId: admin._id,
                type: "alert",
                priority: "medium",
                title: "Student Attendance Alert",
                message: `Beneficiary ${beneficiary.beneficiaryNumber} has poor attendance rate of ${attendanceRate.toFixed(1)}%`,
                actionUrl: `/attendance/dashboard`,
                actionText: "View Attendance",
                relatedEntityType: "program_enrollments",
                relatedEntityId: enrollment._id,
                metadata: {
                  beneficiaryId: enrollment.beneficiaryId,
                },
                channels: ["in_app"],
              });
            }
          }
        }
      }
    }

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "attendance_alerts_generated",
      entityType: "performanceAlerts",
      entityId: "batch_generation",
      description: `Generated ${alertsCreated} attendance alerts`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return { alertsCreated };
  },
});