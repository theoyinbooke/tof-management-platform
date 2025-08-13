import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { authenticateAndAuthorize } from "./auth";
import { Id } from "./_generated/dataModel";

/**
 * Create a new program
 */
export const createProgram = mutation({
  args: {
    foundationId: v.id("foundations"),
    name: v.string(),
    description: v.string(),
    programTypeId: v.id("programTypes"),
    status: v.union(
      v.literal("planned"),
      v.literal("open_for_registration"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    venue: v.optional(v.string()),
    isVirtual: v.boolean(),
    meetingLink: v.optional(v.string()),
    meetingSchedule: v.optional(v.string()),
    maxParticipants: v.optional(v.number()),
    requirements: v.optional(v.array(v.string())),
    objectives: v.optional(v.array(v.string())),
    coordinatorId: v.optional(v.id("users")),
    budget: v.optional(v.object({
      allocated: v.number(),
      spent: v.number(),
      currency: v.string(),
    })),
    isRecurring: v.optional(v.boolean()),
    recurrencePattern: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Authenticate and authorize
    const user = await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);

    const programId = await ctx.db.insert("programs", {
      foundationId: args.foundationId,
      programTypeId: args.programTypeId,
      name: args.name,
      description: args.description,
      status: args.status,
      startDate: args.startDate,
      endDate: args.endDate,
      venue: args.venue,
      isVirtual: args.isVirtual,
      meetingLink: args.meetingLink,
      meetingSchedule: args.meetingSchedule,
      maxParticipants: args.maxParticipants,
      currentParticipants: 0,
      coordinatorId: args.coordinatorId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "program_created",
      entityType: "programs",
      entityId: programId,
      description: `Created new program: ${args.name}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return programId;
  },
});

/**
 * Get all programs for a foundation
 */
export const getByFoundation = query({
  args: {
    foundationId: v.id("foundations"),
    status: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Authenticate user
    await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin", "super_admin", "reviewer", "beneficiary", "guardian"
    ]);

    let query = ctx.db
      .query("programs")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    if (args.type) {
      query = query.filter((q) => q.eq(q.field("programTypeId"), args.type));
    }

    const programs = await query.collect();

    // Enrich with coordinator details
    const enrichedPrograms = await Promise.all(
      programs.map(async (program) => {
        let coordinator = null;
        if (program.coordinatorId) {
          coordinator = await ctx.db.get(program.coordinatorId);
        }

        return {
          ...program,
          coordinator,
        };
      })
    );

    return enrichedPrograms;
  },
});

/**
 * Get program by ID with full details
 */
export const getById = query({
  args: {
    programId: v.id("programs"),
  },
  handler: async (ctx, args) => {
    const program = await ctx.db.get(args.programId);
    if (!program) return null;

    // Authenticate user
    await authenticateAndAuthorize(ctx, program.foundationId, [
      "admin", "super_admin", "reviewer", "beneficiary", "guardian"
    ]);

    // Get coordinator details
    let coordinator = null;
    if (program.coordinatorId) {
      coordinator = await ctx.db.get(program.coordinatorId);
    }

    // Get enrollments
    const enrollments = await ctx.db
      .query("programEnrollments")
      .withIndex("by_program", (q) => q.eq("programId", args.programId))
      .collect();

    // Get enrollment details with beneficiary info
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const beneficiary = await ctx.db.get(enrollment.beneficiaryId);
        let user = null;
        if (beneficiary?.userId) {
          user = await ctx.db.get(beneficiary.userId);
        }
        
        return {
          ...enrollment,
          beneficiary: {
            ...beneficiary,
            user,
          },
        };
      })
    );

    // Get sessions
    const sessions = await ctx.db
      .query("programSessions")
      .withIndex("by_program", (q) => q.eq("programId", args.programId))
      .order("asc")
      .collect();

    return {
      ...program,
      coordinator,
      enrollments: enrichedEnrollments,
      sessions,
    };
  },
});

/**
 * Update program
 */
export const updateProgram = mutation({
  args: {
    programId: v.id("programs"),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      status: v.optional(v.union(
        v.literal("planned"),
        v.literal("open_for_registration"),
        v.literal("active"),
        v.literal("completed"),
        v.literal("cancelled")
      )),
      startDate: v.optional(v.string()),
      endDate: v.optional(v.string()),
      venue: v.optional(v.string()),
      isVirtual: v.optional(v.boolean()),
      meetingLink: v.optional(v.string()),
      meetingSchedule: v.optional(v.string()),
      maxParticipants: v.optional(v.number()),
      requirements: v.optional(v.array(v.string())),
      objectives: v.optional(v.array(v.string())),
      coordinatorId: v.optional(v.id("users")),
    }),
  },
  handler: async (ctx, args) => {
    const program = await ctx.db.get(args.programId);
    if (!program) throw new Error("Program not found");

    // Authenticate and authorize
    const user = await authenticateAndAuthorize(ctx, program.foundationId, ["admin", "super_admin"]);

    await ctx.db.patch(args.programId, {
      ...args.updates,
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: program.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "program_updated",
      entityType: "programs",
      entityId: args.programId,
      description: `Updated program: ${program.name}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Enroll beneficiary in program
 */
export const enrollBeneficiary = mutation({
  args: {
    programId: v.id("programs"),
    beneficiaryId: v.id("beneficiaries"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const program = await ctx.db.get(args.programId);
    if (!program) throw new Error("Program not found");

    const beneficiary = await ctx.db.get(args.beneficiaryId);
    if (!beneficiary) throw new Error("Beneficiary not found");

    // Authenticate and authorize
    const user = await authenticateAndAuthorize(ctx, program.foundationId, [
      "admin", "super_admin", "beneficiary", "guardian"
    ]);

    // Check if already enrolled
    const existingEnrollment = await ctx.db
      .query("programEnrollments")
      .withIndex("by_program_beneficiary", (q) => 
        q.eq("programId", args.programId).eq("beneficiaryId", args.beneficiaryId)
      )
      .unique();

    if (existingEnrollment) {
      throw new Error("Beneficiary is already enrolled in this program");
    }

    // Check max participants
    if (program.maxParticipants) {
      const currentEnrollments = await ctx.db
        .query("programEnrollments")
        .withIndex("by_program", (q) => q.eq("programId", args.programId))
        .collect();

      if (currentEnrollments.length >= program.maxParticipants) {
        throw new Error("Program has reached maximum capacity");
      }
    }

    // Create enrollment
    const enrollmentId = await ctx.db.insert("programEnrollments", {
      programId: args.programId,
      beneficiaryId: args.beneficiaryId,
      foundationId: program.foundationId,
      status: "enrolled",
      enrolledAt: Date.now(),
      enrolledBy: user._id,
      notes: args.notes,
      attendance: [],
      performance: undefined,
      completionStatus: "in_progress",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update program participant count
    await ctx.db.patch(args.programId, {
      currentParticipants: program.currentParticipants + 1,
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: program.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "program_enrollment",
      entityType: "programEnrollments",
      entityId: enrollmentId,
      description: `Enrolled ${beneficiary.beneficiaryNumber} in program: ${program.name}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return enrollmentId;
  },
});

/**
 * Create program session
 */
export const createSession = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const program = await ctx.db.get(args.programId);
    if (!program) throw new Error("Program not found");

    // Authenticate and authorize
    const user = await authenticateAndAuthorize(ctx, program.foundationId, ["admin", "super_admin"]);

    const sessionId = await ctx.db.insert("programSessions", {
      programId: args.programId,
      foundationId: program.foundationId,
      title: args.title,
      description: args.description,
      sessionDate: args.sessionDate,
      startTime: args.startTime,
      endTime: args.endTime,
      location: args.location,
      facilitator: args.facilitator,
      materials: args.materials || [],
      objectives: args.objectives || [],
      status: "scheduled",
      attendanceRecorded: false,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: program.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "session_created",
      entityType: "programSessions",
      entityId: sessionId,
      description: `Created session: ${args.title} for program: ${program.name}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return sessionId;
  },
});

/**
 * Record attendance for a session
 */
export const recordAttendance = mutation({
  args: {
    sessionId: v.id("programSessions"),
    attendance: v.array(v.object({
      enrollmentId: v.id("programEnrollments"),
      status: v.union(v.literal("present"), v.literal("absent"), v.literal("late")),
      notes: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const program = await ctx.db.get(session.programId);
    if (!program) throw new Error("Program not found");

    // Authenticate and authorize
    const user = await authenticateAndAuthorize(ctx, program.foundationId, ["admin", "super_admin"]);

    // Update session attendance
    await ctx.db.patch(args.sessionId, {
      attendance: args.attendance,
      attendanceRecorded: true,
      attendanceRecordedBy: user._id,
      attendanceRecordedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update individual enrollment attendance records
    for (const record of args.attendance) {
      const enrollment = await ctx.db.get(record.enrollmentId);
      if (enrollment) {
        const updatedAttendance = [
          ...(enrollment.attendance || []),
          {
            sessionId: args.sessionId,
            sessionDate: session.sessionDate,
            status: record.status,
            notes: record.notes,
          },
        ];

        await ctx.db.patch(record.enrollmentId, {
          attendance: updatedAttendance,
          updatedAt: Date.now(),
        });
      }
    }

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: program.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "attendance_recorded",
      entityType: "programSessions",
      entityId: args.sessionId,
      description: `Recorded attendance for session: ${session.title}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get program statistics
 */
export const getStatistics = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    // Authenticate user
    await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin", "super_admin", "reviewer"
    ]);

    const programs = await ctx.db
      .query("programs")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();

    const enrollments = await ctx.db
      .query("programEnrollments")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();

    const sessions = await ctx.db
      .query("programSessions")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();

    // Calculate statistics
    const activePrograms = programs.filter(p => p.status === "active").length;
    const totalEnrollments = enrollments.length;
    const completedSessions = sessions.filter(s => s.status === "completed").length;
    const attendanceRate = sessions.length > 0 
      ? sessions.filter(s => s.attendanceRecorded).length / sessions.length * 100 
      : 0;

    // Program type distribution
    const programTypes = programs.reduce((acc, program) => {
      const typeId = program.programTypeId;
      acc[typeId] = (acc[typeId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalPrograms: programs.length,
      activePrograms,
      totalEnrollments,
      totalSessions: sessions.length,
      completedSessions,
      attendanceRate: Math.round(attendanceRate),
      programTypes,
    };
  },
});