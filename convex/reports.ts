import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { authenticateAndAuthorize } from "./auth";
import { Id } from "./_generated/dataModel";

/**
 * Generate comprehensive beneficiary report
 */
export const getBeneficiaryReport = query({
  args: {
    foundationId: v.id("foundations"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    status: v.optional(v.string()),
    academicLevel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Authenticate user
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin", "reviewer"]);

    // Get beneficiaries with filters
    let beneficiariesQuery = ctx.db
      .query("beneficiaries")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));

    if (args.status) {
      beneficiariesQuery = beneficiariesQuery.filter((q) => q.eq(q.field("status"), args.status));
    }

    const beneficiaries = await beneficiariesQuery.collect();

    // Enrich with user data, academic sessions, and programs
    const enrichedBeneficiaries = await Promise.all(
      beneficiaries.map(async (beneficiary) => {
        // Get user details
        const user = beneficiary.userId ? await ctx.db.get(beneficiary.userId) : null;

        // Get academic sessions
        const academicSessions = await ctx.db
          .query("academicSessions")
          .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", beneficiary._id))
          .collect();

        // Get program enrollments
        const programEnrollments = await ctx.db
          .query("programEnrollments")
          .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", beneficiary._id))
          .collect();

        // Get programs details
        const programs = await Promise.all(
          programEnrollments.map(async (enrollment) => {
            const program = await ctx.db.get(enrollment.programId);
            return { ...program, enrollment };
          })
        );

        // Calculate statistics
        const totalAcademicSessions = academicSessions.length;
        const completedSessions = academicSessions.filter(s => s.status === "completed").length;
        const activePrograms = programs.filter(p => p.status === "active").length;
        const completedPrograms = programs.filter(p => p.enrollment.completionStatus === "completed").length;

        // Get performance records for this beneficiary
        const performanceRecords = await ctx.db
          .query("performanceRecords")
          .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", beneficiary._id))
          .collect();
        
        const gradesWithValues = performanceRecords.filter(p => p.overallGrade != null);
        const averageGrade = gradesWithValues.length > 0 
          ? gradesWithValues.reduce((sum, record) => sum + record.overallGrade!, 0) / gradesWithValues.length
          : null;

        return {
          ...beneficiary,
          user,
          statistics: {
            totalAcademicSessions,
            completedSessions,
            activePrograms,
            completedPrograms,
            averageGrade: averageGrade ? Math.round(averageGrade * 10) / 10 : null,
          },
          academicSessions: academicSessions.slice(0, 5), // Latest 5 sessions
          programs: programs.slice(0, 3), // Latest 3 programs
        };
      })
    );

    // Calculate summary statistics
    const totalBeneficiaries = enrichedBeneficiaries.length;
    const activeBeneficiaries = enrichedBeneficiaries.filter(b => b.status === "active").length;
    const graduatedBeneficiaries = enrichedBeneficiaries.filter(b => b.status === "graduated").length;
    
    const beneficiariesWithGrades = enrichedBeneficiaries.filter(b => b.statistics.averageGrade !== null);
    const overallAverageGrade = beneficiariesWithGrades.length > 0
      ? beneficiariesWithGrades.reduce((sum, b) => sum + (b.statistics.averageGrade || 0), 0) / beneficiariesWithGrades.length
      : null;

    // Academic level distribution
    const academicLevels = await ctx.db.query("academicLevels").collect();
    const academicLevelDistribution = enrichedBeneficiaries.reduce((acc, beneficiary) => {
      const level = academicLevels.find(l => l._id === beneficiary.currentAcademicLevel);
      const levelName = level?.name || "Unknown";
      acc[levelName] = (acc[levelName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Support type distribution
    const supportTypeDistribution = enrichedBeneficiaries.reduce((acc, beneficiary) => {
      beneficiary.supportTypes.forEach(type => {
        acc[type] = (acc[type] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return {
      summary: {
        totalBeneficiaries,
        activeBeneficiaries,
        graduatedBeneficiaries,
        overallAverageGrade: overallAverageGrade ? Math.round(overallAverageGrade * 10) / 10 : null,
        academicLevelDistribution,
        supportTypeDistribution,
      },
      beneficiaries: enrichedBeneficiaries,
      generatedAt: Date.now(),
    };
  },
});

/**
 * Generate financial report
 */
export const getFinancialReport = query({
  args: {
    foundationId: v.id("foundations"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Authenticate user
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);

    const startDate = args.startDate || (Date.now() - (365 * 24 * 60 * 60 * 1000)); // Last year
    const endDate = args.endDate || Date.now();

    // Get financial records within date range
    const financialRecords = await ctx.db
      .query("financialRecords")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.gte(q.field("createdAt"), startDate))
      .filter((q) => q.lte(q.field("createdAt"), endDate))
      .collect();

    // Get invoices within date range
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.gte(q.field("createdAt"), startDate))
      .filter((q) => q.lte(q.field("createdAt"), endDate))
      .collect();

    // Get program budgets
    const programs = await ctx.db
      .query("programs")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();

    // Get fee categories for categorization
    const feeCategories = await ctx.db.query("feeCategories").collect();
    
    // Calculate totals by transaction type
    const incomeRecords = financialRecords.filter(record => 
      record.transactionType === "budget_allocation" || record.transactionType === "reimbursement"
    );
    const expenseRecords = financialRecords.filter(record => 
      record.transactionType === "fee_invoice" || record.transactionType === "payment_made"
    );
    
    const incomeByCategory = incomeRecords.reduce((acc, record) => {
      const category = feeCategories.find(c => c._id === record.feeCategoryId);
      const categoryName = category?.name || "Other";
      acc[categoryName] = (acc[categoryName] || 0) + record.amount;
      return acc;
    }, {} as Record<string, number>);

    const expensesByCategory = expenseRecords.reduce((acc, record) => {
      const category = feeCategories.find(c => c._id === record.feeCategoryId);
      const categoryName = category?.name || "Other";
      acc[categoryName] = (acc[categoryName] || 0) + record.amount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate invoice statistics
    const totalInvoiceAmount = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const paidInvoices = invoices.filter(invoice => invoice.status === "paid");
    const totalPaidAmount = paidInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const pendingAmount = totalInvoiceAmount - totalPaidAmount;

    // Program budget utilization - simplified for now
    const programBudgetData = programs.map(program => ({
      programId: program._id,
      programName: program.name,
      budgetAllocated: 0,
      budgetSpent: 0,
      budgetRemaining: 0,
      utilizationRate: 0,
    }));

    const totalBudgetAllocated = programBudgetData.reduce((sum, p) => sum + p.budgetAllocated, 0);
    const totalBudgetSpent = programBudgetData.reduce((sum, p) => sum + p.budgetSpent, 0);

    // Monthly breakdown
    const monthlyData = financialRecords.reduce((acc, record) => {
      const month = new Date(record.createdAt).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = { income: 0, expenses: 0, net: 0 };
      }
      if (record.transactionType === "budget_allocation" || record.transactionType === "reimbursement") {
        acc[month].income += record.amount;
      } else {
        acc[month].expenses += record.amount;
      }
      acc[month].net = acc[month].income - acc[month].expenses;
      return acc;
    }, {} as Record<string, { income: number; expenses: number; net: number }>);

    return {
      summary: {
        totalIncome: Object.values(incomeByCategory).reduce((sum, amount) => sum + amount, 0),
        totalExpenses: Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0),
        netIncome: Object.values(incomeByCategory).reduce((sum, amount) => sum + amount, 0) - 
                   Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0),
        totalInvoiceAmount,
        totalPaidAmount,
        pendingAmount,
        paymentRate: totalInvoiceAmount > 0 ? (totalPaidAmount / totalInvoiceAmount) * 100 : 0,
        totalBudgetAllocated,
        totalBudgetSpent,
        budgetUtilizationRate: totalBudgetAllocated > 0 ? (totalBudgetSpent / totalBudgetAllocated) * 100 : 0,
      },
      breakdown: {
        incomeByCategory,
        expensesByCategory,
        monthlyData,
        programBudgetData,
      },
      invoiceStatistics: {
        total: invoices.length,
        paid: paidInvoices.length,
        pending: invoices.filter(i => i.status === "pending").length,
        overdue: invoices.filter(i => i.status === "overdue").length,
      },
      generatedAt: Date.now(),
      dateRange: { startDate, endDate },
    };
  },
});

/**
 * Generate program effectiveness report
 */
export const getProgramReport = query({
  args: {
    foundationId: v.id("foundations"),
    programId: v.optional(v.id("programs")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Authenticate user
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin", "reviewer"]);

    // Get programs (all or specific one)
    let programsQuery = ctx.db
      .query("programs")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));

    if (args.programId) {
      const specificProgram = await ctx.db.get(args.programId);
      if (!specificProgram) throw new Error("Program not found");
    }

    const programs = args.programId 
      ? [await ctx.db.get(args.programId)].filter(Boolean)
      : await programsQuery.collect();

    // Analyze each program
    const programAnalysis = await Promise.all(
      programs.filter(Boolean).map(async (program) => {
        if (!program) return null;
        
        // Get enrollments
        const enrollments = await ctx.db
          .query("programEnrollments")
          .withIndex("by_program", (q) => q.eq("programId", program._id))
          .collect();

        // Get sessions
        const sessions = await ctx.db
          .query("programSessions")
          .withIndex("by_program", (q) => q.eq("programId", program._id))
          .collect();

        // Calculate attendance statistics
        const sessionsWithAttendance = sessions.filter(s => s.attendanceRecorded && s.attendance);
        let totalAttendanceRecords = 0;
        let presentCount = 0;

        sessionsWithAttendance.forEach(session => {
          session.attendance?.forEach((record: any) => {
            totalAttendanceRecords++;
            if (record.status === "present") {
              presentCount++;
            }
          });
        });

        const attendanceRate = totalAttendanceRecords > 0 
          ? (presentCount / totalAttendanceRecords) * 100 
          : 0;

        // Calculate completion rates
        const completedEnrollments = enrollments.filter(e => e.completionStatus === "completed").length;
        const completionRate = enrollments.length > 0 
          ? (completedEnrollments / enrollments.length) * 100 
          : 0;

        // Enrollment trends (by month)
        const enrollmentTrends = enrollments.reduce((acc, enrollment) => {
          const month = new Date(enrollment.enrolledAt).toISOString().slice(0, 7);
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Get coordinator details
        const coordinator = program.coordinatorId 
          ? await ctx.db.get(program.coordinatorId)
          : null;

        return {
          program: {
            ...program,
            coordinator,
          },
          statistics: {
            totalEnrollments: enrollments.length,
            activeEnrollments: enrollments.filter(e => e.status === "enrolled").length,
            completedEnrollments,
            completionRate: Math.round(completionRate * 10) / 10,
            totalSessions: sessions.length,
            completedSessions: sessions.filter(s => s.status === "completed").length,
            attendanceRate: Math.round(attendanceRate * 10) / 10,
            averageSessionAttendance: sessionsWithAttendance.length > 0 
              ? Math.round((presentCount / sessionsWithAttendance.length) * 10) / 10
              : 0,
          },
          trends: {
            enrollmentTrends,
          },
          sessions: sessions.slice(0, 10), // Latest 10 sessions
          topPerformers: enrollments
            .filter(e => e.performance && e.performance.score)
            .sort((a, b) => b.performance!.score - a.performance!.score)
            .slice(0, 5),
        };
      })
    ).then(results => results.filter(Boolean));

    // Overall program statistics
    const totalEnrollments = programAnalysis.reduce((sum, p) => sum + (p?.statistics?.totalEnrollments || 0), 0);
    const totalCompletions = programAnalysis.reduce((sum, p) => sum + (p?.statistics?.completedEnrollments || 0), 0);
    const overallCompletionRate = totalEnrollments > 0 ? (totalCompletions / totalEnrollments) * 100 : 0;

    const totalSessions = programAnalysis.reduce((sum, p) => sum + (p?.statistics?.totalSessions || 0), 0);
    const attendanceRates = programAnalysis
      .filter(p => p && p.statistics.attendanceRate > 0)
      .map(p => p!.statistics.attendanceRate);
    const overallAttendanceRate = attendanceRates.length > 0
      ? attendanceRates.reduce((sum, rate) => sum + rate, 0) / attendanceRates.length
      : 0;

    // Program type effectiveness
    const programTypes = await ctx.db.query("programTypes").collect();
    const programTypeStats = programAnalysis.reduce((acc, p) => {
      if (!p) return acc;
      
      const programType = programTypes.find(pt => pt._id === p.program.programTypeId);
      const typeName = programType?.name || "Unknown";
      if (!acc[typeName]) {
        acc[typeName] = {
          count: 0,
          totalEnrollments: 0,
          completionRate: 0,
          attendanceRate: 0,
        };
      }
      acc[typeName].count++;
      acc[typeName].totalEnrollments += p.statistics.totalEnrollments;
      acc[typeName].completionRate += p.statistics.completionRate;
      acc[typeName].attendanceRate += p.statistics.attendanceRate;
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages for each type
    Object.keys(programTypeStats).forEach(type => {
      const stats = programTypeStats[type];
      stats.avgCompletionRate = Math.round((stats.completionRate / stats.count) * 10) / 10;
      stats.avgAttendanceRate = Math.round((stats.attendanceRate / stats.count) * 10) / 10;
    });

    return {
      summary: {
        totalPrograms: programs.length,
        activePrograms: programs.filter(p => p && p.status === "active").length,
        totalEnrollments,
        overallCompletionRate: Math.round(overallCompletionRate * 10) / 10,
        totalSessions,
        overallAttendanceRate: Math.round(overallAttendanceRate * 10) / 10,
        programTypeStats,
      },
      programs: programAnalysis,
      generatedAt: Date.now(),
      dateRange: {
        startDate: args.startDate,
        endDate: args.endDate,
      },
    };
  },
});

/**
 * Generate academic performance report
 */
export const getAcademicReport = query({
  args: {
    foundationId: v.id("foundations"),
    beneficiaryId: v.optional(v.id("beneficiaries")),
    academicLevel: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Authenticate user
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin", "reviewer"]);

    // Get academic sessions
    let sessionsQuery = ctx.db
      .query("academicSessions")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));

    if (args.beneficiaryId) {
      sessionsQuery = sessionsQuery.filter((q) => q.eq(q.field("beneficiaryId"), args.beneficiaryId));
    }

    const sessions = await sessionsQuery.collect();

    // Filter by date if provided
    const filteredSessions = sessions.filter(session => {
      if (args.startDate && new Date(session.startDate).getTime() < args.startDate) return false;
      if (args.endDate && new Date(session.endDate).getTime() > args.endDate) return false;
      return true;
    });

    // Enrich sessions with beneficiary data
    const enrichedSessions = await Promise.all(
      filteredSessions.map(async (session) => {
        const beneficiary = await ctx.db.get(session.beneficiaryId);
        const user = beneficiary?.userId ? await ctx.db.get(beneficiary.userId) : null;
        const academicLevel = beneficiary?.currentAcademicLevel ? await ctx.db.get(beneficiary.currentAcademicLevel) : null;
        
        return {
          ...session,
          beneficiary: beneficiary ? {
            ...beneficiary,
            user,
            academicLevel,
          } : null,
        };
      })
    );

    // Get performance records for these sessions
    const performanceRecords = await ctx.db
      .query("performanceRecords")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    const sessionPerformanceMap = new Map();
    performanceRecords.forEach(record => {
      sessionPerformanceMap.set(record.academicSessionId, record);
    });
    
    const sessionsWithGrades = enrichedSessions.filter(s => {
      const performance = sessionPerformanceMap.get(s._id);
      return performance && performance.overallGrade != null;
    });
    
    const averageGrade = sessionsWithGrades.length > 0
      ? sessionsWithGrades.reduce((sum, s) => {
          const performance = sessionPerformanceMap.get(s._id);
          return sum + (performance?.overallGrade || 0);
        }, 0) / sessionsWithGrades.length
      : null;

    // Grade distribution
    const gradeDistribution = sessionsWithGrades.reduce((acc, session) => {
      const performance = sessionPerformanceMap.get(session._id);
      const grade = performance?.overallGrade || 0;
      let range = "";
      if (grade >= 90) range = "90-100";
      else if (grade >= 80) range = "80-89";
      else if (grade >= 70) range = "70-79";
      else if (grade >= 60) range = "60-69";
      else if (grade >= 50) range = "50-59";
      else range = "Below 50";
      
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Academic level performance
    const levelPerformance = enrichedSessions.reduce((acc, session) => {
      const performance = sessionPerformanceMap.get(session._id);
      if (!session.beneficiary?.academicLevel || !performance?.overallGrade) return acc;
      
      const levelName = session.beneficiary.academicLevel.name;
      if (!acc[levelName]) {
        acc[levelName] = {
          count: 0,
          totalGrade: 0,
          averageGrade: 0,
          topGrade: 0,
          lowGrade: 100,
        };
      }
      
      acc[levelName].count++;
      acc[levelName].totalGrade += performance.overallGrade;
      acc[levelName].topGrade = Math.max(acc[levelName].topGrade, performance.overallGrade);
      acc[levelName].lowGrade = Math.min(acc[levelName].lowGrade, performance.overallGrade);
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate averages
    Object.keys(levelPerformance).forEach(level => {
      const stats = levelPerformance[level];
      stats.averageGrade = Math.round((stats.totalGrade / stats.count) * 10) / 10;
    });

    // Performance trends over time
    const performanceTrends = sessionsWithGrades.reduce((acc, session) => {
      const performance = sessionPerformanceMap.get(session._id);
      const month = new Date(session.startDate).toISOString().slice(0, 7);
      if (!acc[month]) {
        acc[month] = {
          sessions: 0,
          totalGrade: 0,
          averageGrade: 0,
        };
      }
      acc[month].sessions++;
      acc[month].totalGrade += (performance?.overallGrade || 0);
      return acc;
    }, {} as Record<string, any>);

    // Calculate monthly averages
    Object.keys(performanceTrends).forEach(month => {
      const data = performanceTrends[month];
      data.averageGrade = Math.round((data.totalGrade / data.sessions) * 10) / 10;
    });

    // Identify students needing intervention
    const studentsNeedingIntervention = enrichedSessions
      .filter(session => {
        const performance = sessionPerformanceMap.get(session._id);
        return performance?.needsIntervention;
      })
      .map(session => {
        const performance = sessionPerformanceMap.get(session._id);
        return {
          beneficiary: session.beneficiary,
          session: {
            sessionName: session.sessionName,
            overallGrade: performance?.overallGrade,
            startDate: session.startDate,
            endDate: session.endDate,
          },
        };
      });

    return {
      summary: {
        totalSessions: enrichedSessions.length,
        sessionsWithGrades: sessionsWithGrades.length,
        averageGrade: averageGrade ? Math.round(averageGrade * 10) / 10 : null,
        studentsNeedingIntervention: studentsNeedingIntervention.length,
        gradeDistribution,
        levelPerformance,
      },
      trends: {
        performanceTrends,
      },
      sessions: enrichedSessions.slice(0, 20), // Latest 20 sessions
      interventionCases: studentsNeedingIntervention.slice(0, 10),
      generatedAt: Date.now(),
      dateRange: {
        startDate: args.startDate,
        endDate: args.endDate,
      },
    };
  },
});

/**
 * Generate impact assessment report
 */
export const getImpactReport = query({
  args: {
    foundationId: v.id("foundations"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Authenticate user
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin", "reviewer"]);

    const startDate = args.startDate || (Date.now() - (365 * 24 * 60 * 60 * 1000)); // Last year
    const endDate = args.endDate || Date.now();

    // Get all data for impact analysis
    const beneficiaries = await ctx.db
      .query("beneficiaries")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();

    const programs = await ctx.db
      .query("programs")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();

    const academicSessions = await ctx.db
      .query("academicSessions")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();

    const programEnrollments = await ctx.db
      .query("programEnrollments")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();

    // Calculate impact metrics
    const totalBeneficiariesSupported = beneficiaries.length;
    const graduatedBeneficiaries = beneficiaries.filter(b => b.status === "graduated").length;
    const graduationRate = totalBeneficiariesSupported > 0 
      ? (graduatedBeneficiaries / totalBeneficiariesSupported) * 100 
      : 0;

    const totalProgramsDelivered = programs.filter(p => p.status === "completed").length;
    const totalProgramParticipations = programEnrollments.length;

    // Get all performance records for impact analysis
    const allPerformanceRecords = await ctx.db
      .query("performanceRecords")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    // Academic improvement tracking
    const academicImprovements = allPerformanceRecords.filter(record => 
      record.hasImproved === true
    ).length;

    const totalAcademicAssessments = allPerformanceRecords.filter(record => 
      record.overallGrade != null
    ).length;

    const improvementRate = totalAcademicAssessments > 0 
      ? (academicImprovements / totalAcademicAssessments) * 100 
      : 0;

    // Long-term outcomes (beneficiaries supported for > 2 years)
    const twoYearsAgo = Date.now() - (2 * 365 * 24 * 60 * 60 * 1000);
    const longTermBeneficiaries = beneficiaries.filter(b => 
      new Date(b.supportStartDate).getTime() < twoYearsAgo
    );

    const longTermSuccess = longTermBeneficiaries.filter(b => 
      b.status === "graduated" || (
        b.status === "active" && 
        allPerformanceRecords.some(record => 
          record.beneficiaryId === b._id && 
          record.overallGrade != null && 
          record.overallGrade >= 70
        )
      )
    ).length;

    const longTermSuccessRate = longTermBeneficiaries.length > 0 
      ? (longTermSuccess / longTermBeneficiaries.length) * 100 
      : 0;

    // Support type effectiveness
    const supportTypeImpact = beneficiaries.reduce((acc, beneficiary) => {
      const hasGoodPerformance = allPerformanceRecords.some(record => 
        record.beneficiaryId === beneficiary._id && 
        record.overallGrade != null && 
        record.overallGrade >= 70
      );

      beneficiary.supportTypes.forEach(type => {
        if (!acc[type]) {
          acc[type] = {
            total: 0,
            successful: 0,
            successRate: 0,
          };
        }
        acc[type].total++;
        if (hasGoodPerformance || beneficiary.status === "graduated") {
          acc[type].successful++;
        }
      });

      return acc;
    }, {} as Record<string, any>);

    // Calculate success rates
    Object.keys(supportTypeImpact).forEach(type => {
      const data = supportTypeImpact[type];
      data.successRate = data.total > 0 ? (data.successful / data.total) * 100 : 0;
    });

    // Geographic impact - get applications for address data
    const applications = await ctx.db
      .query("applications")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    const applicationMap = new Map();
    applications.forEach(app => applicationMap.set(app._id, app));
    
    // Geographic impact (by state/LGA)
    const geographicImpact = beneficiaries.reduce((acc, beneficiary) => {
      const application = applicationMap.get(beneficiary.applicationId);
      if (application?.address?.state) {
        const state = application.address.state;
        if (!acc[state]) {
          acc[state] = {
            total: 0,
            graduated: 0,
            active: 0,
          };
        }
        acc[state].total++;
        if (beneficiary.status === "graduated") {
          acc[state].graduated++;
        } else if (beneficiary.status === "active") {
          acc[state].active++;
        }
      }
      return acc;
    }, {} as Record<string, any>);

    // Year-over-year growth
    const yearlyImpact = beneficiaries.reduce((acc, beneficiary) => {
      const year = new Date(beneficiary.supportStartDate).getFullYear();
      if (!acc[year]) {
        acc[year] = {
          newBeneficiaries: 0,
          graduations: 0,
        };
      }
      acc[year].newBeneficiaries++;
      
      // Check if graduated in the same year (for completion tracking)
      if (beneficiary.supportEndDate) {
        const graduationYear = new Date(beneficiary.supportEndDate).getFullYear();
        if (acc[graduationYear]) {
          acc[graduationYear].graduations++;
        } else {
          acc[graduationYear] = { newBeneficiaries: 0, graduations: 1 };
        }
      }
      
      return acc;
    }, {} as Record<string, any>);

    return {
      summary: {
        totalBeneficiariesSupported,
        graduatedBeneficiaries,
        graduationRate: Math.round(graduationRate * 10) / 10,
        totalProgramsDelivered,
        totalProgramParticipations,
        improvementRate: Math.round(improvementRate * 10) / 10,
        longTermSuccessRate: Math.round(longTermSuccessRate * 10) / 10,
      },
      impact: {
        supportTypeImpact,
        geographicImpact,
        yearlyImpact,
      },
      outcomes: {
        academicImprovements,
        totalAcademicAssessments,
        longTermBeneficiaries: longTermBeneficiaries.length,
        longTermSuccess,
      },
      generatedAt: Date.now(),
      dateRange: {
        startDate,
        endDate,
      },
    };
  },
});