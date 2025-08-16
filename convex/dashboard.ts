import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Get comprehensive dashboard statistics for admin
export const getAdminDashboardStats = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    // Get user and check permissions
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
      return null;
    }

    // Get beneficiaries count
    const beneficiaries = await ctx.db
      .query("beneficiaries")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();

    const activeBeneficiaries = beneficiaries.filter(b => b.status === "active");
    
    // Get applications count
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();

    const pendingApplications = applications.filter(a => a.status === "submitted" || a.status === "under_review");
    const approvedApplications = applications.filter(a => a.status === "approved");
    const rejectedApplications = applications.filter(a => a.status === "rejected");
    const underReviewApplications = applications.filter(a => a.status === "under_review");

    // Get today's applications
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const todaysApplications = applications.filter(a => a.createdAt >= todayMs);

    // Get financial data
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();

    // Calculate current month's disbursements
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    const currentMonthMs = currentMonth.getTime();
    
    const monthlyPayments = invoices.filter(p => 
      p.createdAt >= currentMonthMs && p.status === "paid"
    );
    
    const monthlyDisbursement = monthlyPayments.reduce((sum, p) => sum + p.totalAmount, 0);

    // Get previous month's disbursements for comparison
    const previousMonth = new Date(currentMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const previousMonthMs = previousMonth.getTime();
    
    const previousMonthPayments = invoices.filter(p => 
      p.createdAt >= previousMonthMs && 
      p.createdAt < currentMonthMs && 
      p.status === "paid"
    );
    
    const previousMonthDisbursement = previousMonthPayments.reduce((sum, p) => sum + p.totalAmount, 0);
    
    // Calculate percentage change
    let disbursementChange = 0;
    if (previousMonthDisbursement > 0) {
      disbursementChange = ((monthlyDisbursement - previousMonthDisbursement) / previousMonthDisbursement) * 100;
    }

    // Get performance records instead of academicPerformance (which doesn't exist)
    const performanceRecords = await ctx.db
      .query("performanceRecords")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();

    // Calculate average performance using overallGrade field
    let averagePerformance = 0;
    if (performanceRecords.length > 0) {
      const recordsWithGrades = performanceRecords.filter(r => r.overallGrade !== undefined);
      if (recordsWithGrades.length > 0) {
        const totalScore = recordsWithGrades.reduce((sum, record) => {
          return sum + (record.overallGrade || 0);
        }, 0);
        averagePerformance = totalScore / recordsWithGrades.length;
      }
    }

    // Get documents statistics
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();

    const pendingDocuments = documents.filter(d => d.status === "pending_review");

    // Get program statistics
    const programs = await ctx.db
      .query("programs")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();

    const activePrograms = programs.filter(p => p.status === "active");

    // Get recent applications (last 5)
    const recentApplications = applications
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map(app => ({
        _id: app._id,
        firstName: app.firstName,
        lastName: app.lastName,
        email: app.email,
        status: app.status,
        academicLevel: app.education.currentLevel,
        createdAt: app.createdAt,
      }));

    // Get upcoming events
    const events = await ctx.db
      .query("events")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();

    const upcomingEvents = events
      .filter(e => new Date(e.startDateTime).getTime() > Date.now())
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
      .slice(0, 5);

    return {
      // Beneficiary statistics
      totalBeneficiaries: beneficiaries.length,
      activeBeneficiaries: activeBeneficiaries.length,
      beneficiariesChange: 12, // You can calculate this based on historical data

      // Application statistics
      totalApplications: applications.length,
      pendingApplications: pendingApplications.length,
      approvedApplications: approvedApplications.length,
      rejectedApplications: rejectedApplications.length,
      underReviewApplications: underReviewApplications.length,
      todaysApplications: todaysApplications.length,

      // Financial statistics
      monthlyDisbursement,
      disbursementChange: Math.round(disbursementChange),
      totalInvoices: invoices.length,
      pendingInvoices: invoices.filter(i => i.status === "pending").length,
      
      // Academic statistics
      averagePerformance: Math.round(averagePerformance),
      performanceChange: 3, // You can calculate this based on historical data

      // Document statistics
      totalDocuments: documents.length,
      pendingDocuments: pendingDocuments.length,

      // Program statistics
      totalPrograms: programs.length,
      activePrograms: activePrograms.length,

      // Recent data
      recentApplications,
      upcomingEvents,
    };
  },
});

// Get recent activity for the dashboard
export const getRecentActivity = query({
  args: {
    foundationId: v.id("foundations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const limit = args.limit || 10;

    // Get recent audit logs
    const auditLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .order("desc")
      .take(limit);

    return auditLogs.map(log => ({
      _id: log._id,
      action: log.action,
      description: log.description,
      userEmail: log.userEmail,
      entityType: log.entityType,
      createdAt: log.createdAt,
      riskLevel: log.riskLevel,
    }));
  },
});

// Get quick stats for dashboard cards
export const getQuickStats = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Get counts for various entities
    const [
      beneficiaries,
      applications,
      programs,
      documents,
      payments,
    ] = await Promise.all([
      ctx.db
        .query("beneficiaries")
        .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
        .collect(),
      ctx.db
        .query("applications")
        .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
        .collect(),
      ctx.db
        .query("programs")
        .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
        .collect(),
      ctx.db
        .query("documents")
        .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
        .collect(),
      // Note: Using invoices instead of payments table which doesn't exist yet
      ctx.db
        .query("invoices")
        .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
        .collect(),
    ]);

    return {
      totalBeneficiaries: beneficiaries.length,
      activeBeneficiaries: beneficiaries.filter(b => b.status === "active").length,
      pendingApplications: applications.filter(a => a.status === "submitted" || a.status === "under_review").length,
      activePrograms: programs.filter(p => p.status === "active").length,
      pendingDocuments: documents.filter(d => d.status === "pending_review").length,
      paidInvoices: payments.filter(p => p.status === "paid").length,
    };
  },
});