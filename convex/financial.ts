import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authenticateAndAuthorize } from "./auth";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

/**
 * Get all fee categories for a foundation
 */
export const getFeeCategories = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);
    
    const feeCategories = await ctx.db
      .query("feeCategories")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    return feeCategories.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

/**
 * Get active fee categories for a foundation
 */
export const getActiveFeeCategories = query({
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
    
    const feeCategories = await ctx.db
      .query("feeCategories")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    return feeCategories.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

/**
 * Create a new fee category
 */
export const createFeeCategory = mutation({
  args: {
    foundationId: v.id("foundations"),
    name: v.string(),
    description: v.optional(v.string()),
    isRequired: v.boolean(),
    sortOrder: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, ["super_admin", "admin"]);
    
    // Create fee category
    const feeCategoryId = await ctx.db.insert("feeCategories", {
      foundationId: args.foundationId,
      name: args.name,
      description: args.description,
      isRequired: args.isRequired,
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
      action: "fee_category_created",
      entityType: "feeCategories",
      entityId: feeCategoryId,
      description: `Created new fee category: ${args.name}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });
    
    return feeCategoryId;
  },
});

/**
 * Update a fee category
 */
export const updateFeeCategory = mutation({
  args: {
    feeCategoryId: v.id("feeCategories"),
    foundationId: v.id("foundations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isRequired: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, ["super_admin", "admin"]);
    
    const feeCategory = await ctx.db.get(args.feeCategoryId);
    if (!feeCategory) {
      throw new Error("Fee category not found");
    }
    
    if (feeCategory.foundationId !== args.foundationId) {
      throw new Error("Access denied");
    }
    
    const { feeCategoryId, foundationId, ...updates } = args;
    
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
    
    // Update fee category
    await ctx.db.patch(args.feeCategoryId, {
      ...cleanUpdates,
      updatedAt: Date.now(),
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "fee_category_updated",
      entityType: "feeCategories",
      entityId: args.feeCategoryId,
      description: `Updated fee category: ${feeCategory.name}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Delete a fee category
 */
export const deleteFeeCategory = mutation({
  args: {
    feeCategoryId: v.id("feeCategories"),
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, ["super_admin", "admin"]);
    
    const feeCategory = await ctx.db.get(args.feeCategoryId);
    if (!feeCategory) {
      throw new Error("Fee category not found");
    }
    
    if (feeCategory.foundationId !== args.foundationId) {
      throw new Error("Access denied");
    }
    
    // Check if fee category is in use
    const financialRecords = await ctx.db
      .query("financialRecords")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("feeCategoryId"), args.feeCategoryId))
      .collect();
    
    if (financialRecords.length > 0) {
      throw new Error("Cannot delete fee category that is in use by financial records");
    }
    
    // Delete fee category
    await ctx.db.delete(args.feeCategoryId);
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "fee_category_deleted",
      entityType: "feeCategories",
      entityId: args.feeCategoryId,
      description: `Deleted fee category: ${feeCategory.name}`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Get all financial records for a foundation
 */
export const getFinancialRecords = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);
    
    const financialRecords = await ctx.db
      .query("financialRecords")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    return financialRecords;
  },
});

/**
 * Get financial records by beneficiary
 */
export const getFinancialRecordsByBeneficiary = query({
  args: {
    beneficiaryId: v.id("beneficiaries"),
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "beneficiary",
      "guardian",
    ]);
    
    const financialRecords = await ctx.db
      .query("financialRecords")
      .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", args.beneficiaryId))
      .collect();
    
    return financialRecords;
  },
});

// ===================================
// FINANCIAL RECORDS MANAGEMENT
// ===================================

// Generate invoice number
function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${year}${month}-${random}`;
}

// Create financial record (invoice)
export const createInvoice = mutation({
  args: {
    foundationId: v.id("foundations"),
    beneficiaryId: v.id("beneficiaries"),
    academicSessionId: v.optional(v.id("academicSessions")),
    feeCategoryId: v.id("feeCategories"),
    amount: v.number(),
    currency: v.union(v.literal("NGN"), v.literal("USD")),
    dueDate: v.string(),
    invoiceDate: v.string(),
    schoolId: v.optional(v.id("schools")),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);
    
    // Verify beneficiary exists and belongs to foundation
    const beneficiary = await ctx.db.get(args.beneficiaryId);
    if (!beneficiary || beneficiary.foundationId !== args.foundationId) {
      throw new Error("Beneficiary not found or access denied");
    }
    
    // Get foundation settings for exchange rate
    const foundation = await ctx.db.get(args.foundationId);
    if (!foundation) {
      throw new Error("Foundation not found");
    }
    
    // Create the financial record
    const recordId = await ctx.db.insert("financialRecords", {
      foundationId: args.foundationId,
      beneficiaryId: args.beneficiaryId,
      academicSessionId: args.academicSessionId,
      feeCategoryId: args.feeCategoryId,
      amount: args.amount,
      currency: args.currency,
      exchangeRateUsed: args.currency === "USD" ? foundation.settings.exchangeRate : 1,
      transactionType: "fee_invoice",
      status: "pending",
      dueDate: args.dueDate,
      invoiceDate: args.invoiceDate,
      invoiceNumber: generateInvoiceNumber(),
      schoolId: args.schoolId,
      requestedBy: user._id,
      description: args.description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "invoice_created",
      entityType: "financialRecords",
      entityId: recordId,
      description: `Created invoice for ${args.amount} ${args.currency}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });
    
    return recordId;
  },
});

// Get financial records with detailed information
export const getByFoundationDetailed = query({
  args: {
    foundationId: v.id("foundations"),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("paid"),
      v.literal("cancelled"),
      v.literal("overdue")
    )),
    transactionType: v.optional(v.union(
      v.literal("fee_invoice"),
      v.literal("payment_made"),
      v.literal("reimbursement"),
      v.literal("budget_allocation")
    )),
    beneficiaryId: v.optional(v.id("beneficiaries")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin", "reviewer"]);
    
    let query = ctx.db
      .query("financialRecords")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));
    
    const records = await query.order("desc").collect();
    
    // Apply filters
    let filteredRecords = records;
    
    if (args.status) {
      filteredRecords = filteredRecords.filter((r) => r.status === args.status);
    }
    
    if (args.transactionType) {
      filteredRecords = filteredRecords.filter((r) => r.transactionType === args.transactionType);
    }
    
    if (args.beneficiaryId) {
      filteredRecords = filteredRecords.filter((r) => r.beneficiaryId === args.beneficiaryId);
    }
    
    if (args.startDate) {
      const startTime = new Date(args.startDate).getTime();
      filteredRecords = filteredRecords.filter((r) => r.createdAt >= startTime);
    }
    
    if (args.endDate) {
      const endTime = new Date(args.endDate).getTime();
      filteredRecords = filteredRecords.filter((r) => r.createdAt <= endTime);
    }
    
    // Get related data
    const recordsWithDetails = await Promise.all(
      filteredRecords.map(async (record) => {
        const beneficiary = await ctx.db.get(record.beneficiaryId);
        const beneficiaryUser = beneficiary ? await ctx.db.get(beneficiary.userId) : null;
        const feeCategory = await ctx.db.get(record.feeCategoryId);
        const school = record.schoolId ? await ctx.db.get(record.schoolId) : null;
        const session = record.academicSessionId ? await ctx.db.get(record.academicSessionId) : null;
        const requestedByUser = await ctx.db.get(record.requestedBy);
        const approvedByUser = record.approvedBy ? await ctx.db.get(record.approvedBy) : null;
        
        return {
          ...record,
          beneficiary,
          beneficiaryUser,
          feeCategory,
          school,
          session,
          requestedByUser,
          approvedByUser,
        };
      })
    );
    
    return recordsWithDetails;
  },
});

// Update financial record status
export const updateStatus = mutation({
  args: {
    recordId: v.id("financialRecords"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("paid"),
      v.literal("cancelled"),
      v.literal("overdue")
    ),
    paidDate: v.optional(v.string()),
    receiptNumber: v.optional(v.string()),
    paymentReference: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.recordId);
    if (!record) {
      throw new Error("Financial record not found");
    }
    
    const user = await authenticateAndAuthorize(ctx, record.foundationId, ["admin", "super_admin"]);
    
    const updates: any = {
      status: args.status,
      updatedAt: Date.now(),
    };
    
    if (args.status === "paid") {
      updates.paidDate = args.paidDate || new Date().toISOString();
      updates.receiptNumber = args.receiptNumber;
      updates.paymentReference = args.paymentReference;
    }
    
    if (args.status === "approved") {
      updates.approvedBy = user._id;
      updates.approvalDate = Date.now();
    }
    
    if (args.notes) {
      updates.internalNotes = args.notes;
    }
    
    await ctx.db.patch(args.recordId, updates);
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: record.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "payment_status_updated",
      entityType: "financialRecords",
      entityId: args.recordId,
      description: `Updated payment status to ${args.status}`,
      riskLevel: args.status === "paid" ? "low" : "medium",
      createdAt: Date.now(),
    });

    // Create notification for status changes
    if (record.beneficiaryId) {
      const beneficiary = await ctx.db.get(record.beneficiaryId);
      if (beneficiary) {
        let notificationTitle = "";
        let notificationMessage = "";
        let priority: "low" | "medium" | "high" | "urgent" = "medium";

        switch (args.status) {
          case "approved":
            notificationTitle = "Payment Approved";
            notificationMessage = `Your payment request for ${record.amount.toLocaleString()} ${record.currency} has been approved.`;
            priority = "medium";
            break;
          case "paid":
            notificationTitle = "Payment Completed";
            notificationMessage = `Your payment of ${record.amount.toLocaleString()} ${record.currency} has been processed successfully.`;
            priority = "low";
            break;
          case "overdue":
            notificationTitle = "Payment Overdue";
            notificationMessage = `Your payment of ${record.amount.toLocaleString()} ${record.currency} is now overdue. Please make payment as soon as possible.`;
            priority = "high";
            break;
          case "cancelled":
            notificationTitle = "Payment Cancelled";
            notificationMessage = `Your payment request for ${record.amount.toLocaleString()} ${record.currency} has been cancelled.`;
            priority = "medium";
            break;
        }

        if (notificationTitle) {
          await ctx.scheduler.runAfter(0, internal.notifications.createSystemNotification, {
            foundationId: record.foundationId,
            recipientId: beneficiary.userId,
            type: "financial",
            priority,
            title: notificationTitle,
            message: notificationMessage,
            actionUrl: `/financial/payments/${args.recordId}`,
            actionText: "View Payment",
            relatedEntityType: "financial_records",
            relatedEntityId: args.recordId,
            metadata: {
              beneficiaryId: record.beneficiaryId,
            },
            channels: ["in_app", args.status === "overdue" ? "email" : undefined].filter(Boolean) as any,
          });
        }
      }
    }
    
    return { success: true };
  },
});

// Get financial summary/statistics
export const getFinancialSummary = query({
  args: {
    foundationId: v.id("foundations"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);
    
    let query = ctx.db
      .query("financialRecords")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));
    
    const records = await query.collect();
    
    // Apply date filters
    let filteredRecords = records;
    if (args.startDate) {
      const startTime = new Date(args.startDate).getTime();
      filteredRecords = filteredRecords.filter((r) => r.createdAt >= startTime);
    }
    if (args.endDate) {
      const endTime = new Date(args.endDate).getTime();
      filteredRecords = filteredRecords.filter((r) => r.createdAt <= endTime);
    }
    
    // Calculate totals by currency
    const ngnRecords = filteredRecords.filter((r) => r.currency === "NGN");
    const usdRecords = filteredRecords.filter((r) => r.currency === "USD");
    
    const summary = {
      totalRecords: filteredRecords.length,
      byStatus: {
        pending: filteredRecords.filter((r) => r.status === "pending").length,
        approved: filteredRecords.filter((r) => r.status === "approved").length,
        paid: filteredRecords.filter((r) => r.status === "paid").length,
        overdue: filteredRecords.filter((r) => r.status === "overdue").length,
        cancelled: filteredRecords.filter((r) => r.status === "cancelled").length,
      },
      byTransactionType: {
        fee_invoice: filteredRecords.filter((r) => r.transactionType === "fee_invoice").length,
        payment_made: filteredRecords.filter((r) => r.transactionType === "payment_made").length,
        reimbursement: filteredRecords.filter((r) => r.transactionType === "reimbursement").length,
        budget_allocation: filteredRecords.filter((r) => r.transactionType === "budget_allocation").length,
      },
      totals: {
        NGN: {
          pending: ngnRecords.filter((r) => r.status === "pending").reduce((sum, r) => sum + r.amount, 0),
          approved: ngnRecords.filter((r) => r.status === "approved").reduce((sum, r) => sum + r.amount, 0),
          paid: ngnRecords.filter((r) => r.status === "paid").reduce((sum, r) => sum + r.amount, 0),
          total: ngnRecords.reduce((sum, r) => sum + r.amount, 0),
        },
        USD: {
          pending: usdRecords.filter((r) => r.status === "pending").reduce((sum, r) => sum + r.amount, 0),
          approved: usdRecords.filter((r) => r.status === "approved").reduce((sum, r) => sum + r.amount, 0),
          paid: usdRecords.filter((r) => r.status === "paid").reduce((sum, r) => sum + r.amount, 0),
          total: usdRecords.reduce((sum, r) => sum + r.amount, 0),
        },
      },
    };
    
    return summary;
  },
});

// Get overdue payments
export const getOverduePayments = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);
    
    const today = new Date().toISOString().split('T')[0];
    
    const records = await ctx.db
      .query("financialRecords")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => 
        q.and(
          q.neq(q.field("status"), "paid"),
          q.neq(q.field("status"), "cancelled"),
          q.lt(q.field("dueDate"), today)
        )
      )
      .collect();
    
    // Get related data
    const overdueWithDetails = await Promise.all(
      records.map(async (record) => {
        const beneficiary = await ctx.db.get(record.beneficiaryId);
        const beneficiaryUser = beneficiary ? await ctx.db.get(beneficiary.userId) : null;
        const feeCategory = await ctx.db.get(record.feeCategoryId);
        
        return {
          ...record,
          beneficiary,
          beneficiaryUser,
          feeCategory,
          daysPastDue: record.dueDate ? Math.floor((Date.now() - new Date(record.dueDate).getTime()) / (24 * 60 * 60 * 1000)) : 0,
        };
      })
    );
    
    return overdueWithDetails;
  },
});

// ===================================
// BUDGET MANAGEMENT
// ===================================

/**
 * Get budget plans for a foundation
 */
export const getBudgetPlans = query({
  args: {
    foundationId: v.id("foundations"),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("approved"),
      v.literal("active"),
      v.literal("completed")
    )),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin", "reviewer"]);
    
    let query = ctx.db
      .query("budgetPlan")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));
    
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    
    const plans = await query.order("desc").collect();
    
    // Enrich with user and fee category details
    const enrichedPlans = await Promise.all(
      plans.map(async (plan) => {
        const createdByUser = await ctx.db.get(plan.createdBy);
        const approvedByUser = plan.approvedBy ? await ctx.db.get(plan.approvedBy) : null;
        
        const categoriesWithDetails = await Promise.all(
          plan.categories.map(async (category) => {
            const feeCategory = await ctx.db.get(category.feeCategoryId);
            return {
              ...category,
              feeCategory,
            };
          })
        );
        
        return {
          ...plan,
          createdByUser,
          approvedByUser,
          categories: categoriesWithDetails,
        };
      })
    );
    
    return enrichedPlans;
  },
});

/**
 * Create a new budget plan
 */
export const createBudgetPlan = mutation({
  args: {
    foundationId: v.id("foundations"),
    planName: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    categories: v.array(v.object({
      feeCategoryId: v.id("feeCategories"),
      budgetedAmount: v.number(),
      currency: v.union(v.literal("NGN"), v.literal("USD")),
      expectedBeneficiaries: v.number(),
      notes: v.optional(v.string()),
    })),
    totalBudget: v.number(),
    currency: v.union(v.literal("NGN"), v.literal("USD")),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);
    
    const planId = await ctx.db.insert("budgetPlan", {
      foundationId: args.foundationId,
      planName: args.planName,
      startDate: args.startDate,
      endDate: args.endDate,
      categories: args.categories,
      totalBudget: args.totalBudget,
      currency: args.currency,
      status: "draft",
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "budget_plan_created",
      entityType: "budgetPlan",
      entityId: planId,
      description: `Created budget plan: ${args.planName}`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });
    
    return planId;
  },
});

/**
 * Update budget plan status
 */
export const updateBudgetPlanStatus = mutation({
  args: {
    planId: v.id("budgetPlan"),
    status: v.union(
      v.literal("draft"),
      v.literal("approved"),
      v.literal("active"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      throw new Error("Budget plan not found");
    }
    
    const user = await authenticateAndAuthorize(ctx, plan.foundationId, ["admin", "super_admin"]);
    
    const updates: any = {
      status: args.status,
      updatedAt: Date.now(),
    };
    
    if (args.status === "approved") {
      updates.approvedBy = user._id;
      updates.approvalDate = Date.now();
    }
    
    await ctx.db.patch(args.planId, updates);
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: plan.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "budget_plan_status_updated",
      entityType: "budgetPlan",
      entityId: args.planId,
      description: `Updated budget plan status to ${args.status}`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

// ===================================
// PAYMENT APPROVALS WORKFLOW
// ===================================

/**
 * Get payment approvals for a foundation
 */
export const getPaymentApprovals = query({
  args: {
    foundationId: v.id("foundations"),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("cancelled")
    )),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin", "reviewer"]);
    
    let query = ctx.db
      .query("paymentApprovals")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));
    
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("overallStatus"), args.status));
    }
    
    const approvals = await query.order("desc").collect();
    
    // Enrich with related data
    const enrichedApprovals = await Promise.all(
      approvals.map(async (approval) => {
        const financialRecord = await ctx.db.get(approval.financialRecordId);
        const requestedByUser = await ctx.db.get(approval.requestedBy);
        const finalApproverUser = approval.finalApprover ? await ctx.db.get(approval.finalApprover) : null;
        
        // Get beneficiary info from financial record
        const beneficiary = financialRecord ? await ctx.db.get(financialRecord.beneficiaryId) : null;
        const feeCategory = financialRecord ? await ctx.db.get(financialRecord.feeCategoryId) : null;
        
        // Enrich approver details
        const approversWithDetails = await Promise.all(
          approval.approvers.map(async (approver) => {
            const user = await ctx.db.get(approver.userId);
            return {
              ...approver,
              user,
            };
          })
        );
        
        return {
          ...approval,
          financialRecord,
          beneficiary,
          feeCategory,
          requestedByUser,
          finalApproverUser,
          approvers: approversWithDetails,
        };
      })
    );
    
    return enrichedApprovals;
  },
});

/**
 * Create payment approval request
 */
export const createPaymentApproval = mutation({
  args: {
    foundationId: v.id("foundations"),
    financialRecordId: v.id("financialRecords"),
    requestedAmount: v.number(),
    currency: v.union(v.literal("NGN"), v.literal("USD")),
    justification: v.string(),
    approvers: v.array(v.object({
      userId: v.id("users"),
      order: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);
    
    // Verify financial record exists
    const financialRecord = await ctx.db.get(args.financialRecordId);
    if (!financialRecord || financialRecord.foundationId !== args.foundationId) {
      throw new Error("Financial record not found or access denied");
    }
    
    const approvers = args.approvers.map(approver => ({
      userId: approver.userId,
      order: approver.order,
      status: "pending" as const,
    }));
    
    const approvalId = await ctx.db.insert("paymentApprovals", {
      foundationId: args.foundationId,
      financialRecordId: args.financialRecordId,
      requestedBy: user._id,
      requestedAmount: args.requestedAmount,
      currency: args.currency,
      justification: args.justification,
      approvers,
      overallStatus: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "payment_approval_requested",
      entityType: "paymentApprovals",
      entityId: approvalId,
      description: `Requested payment approval for ${args.currency} ${args.requestedAmount}`,
      riskLevel: "high",
      createdAt: Date.now(),
    });
    
    return approvalId;
  },
});

/**
 * Process approval action (approve/reject)
 */
export const processApprovalAction = mutation({
  args: {
    approvalId: v.id("paymentApprovals"),
    action: v.union(v.literal("approved"), v.literal("rejected")),
    comments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const approval = await ctx.db.get(args.approvalId);
    if (!approval) {
      throw new Error("Payment approval not found");
    }
    
    const user = await authenticateAndAuthorize(ctx, approval.foundationId, ["admin", "super_admin"]);
    
    // Find user in approvers list
    const approverIndex = approval.approvers.findIndex(a => a.userId === user._id);
    if (approverIndex === -1) {
      throw new Error("User not authorized to approve this payment");
    }
    
    const currentApprover = approval.approvers[approverIndex];
    if (currentApprover.status !== "pending") {
      throw new Error("Already processed this approval");
    }
    
    // Update approver status
    const updatedApprovers = [...approval.approvers];
    updatedApprovers[approverIndex] = {
      ...currentApprover,
      status: args.action,
      comments: args.comments,
      actionDate: Date.now(),
    };
    
    // Determine overall status
    let overallStatus = approval.overallStatus;
    let finalApprover = approval.finalApprover;
    let finalActionDate = approval.finalActionDate;
    let finalComments = approval.finalComments;
    
    if (args.action === "rejected") {
      overallStatus = "rejected";
      finalApprover = user._id;
      finalActionDate = Date.now();
      finalComments = args.comments;
    } else {
      // Check if all approvers have approved
      const allApproved = updatedApprovers.every(a => a.status === "approved");
      if (allApproved) {
        overallStatus = "approved";
        finalApprover = user._id;
        finalActionDate = Date.now();
        finalComments = "All approvers have approved";
      }
    }
    
    await ctx.db.patch(args.approvalId, {
      approvers: updatedApprovers,
      overallStatus,
      finalApprover,
      finalActionDate,
      finalComments,
      updatedAt: Date.now(),
    });
    
    // If approved, update the financial record
    if (overallStatus === "approved") {
      await ctx.db.patch(approval.financialRecordId, {
        status: "approved",
        approvedBy: user._id,
        approvalDate: Date.now(),
        updatedAt: Date.now(),
      });
    }
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: approval.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "payment_approval_processed",
      entityType: "paymentApprovals",
      entityId: args.approvalId,
      description: `${args.action} payment approval`,
      riskLevel: "high",
      createdAt: Date.now(),
    });
    
    return { success: true, overallStatus };
  },
});

// ===================================
// DASHBOARD ANALYTICS
// ===================================

/**
 * Get financial dashboard data
 */
export const getFinancialDashboard = query({
  args: {
    foundationId: v.id("foundations"),
    dateRange: v.optional(v.object({
      start: v.string(),
      end: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);
    
    // Get all financial records
    const allRecords = await ctx.db
      .query("financialRecords")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    // Filter by date range if provided
    let records = allRecords;
    if (args.dateRange) {
      const startTime = new Date(args.dateRange.start).getTime();
      const endTime = new Date(args.dateRange.end).getTime();
      records = allRecords.filter(r => r.createdAt >= startTime && r.createdAt <= endTime);
    }
    
    // Calculate key metrics
    const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
    const paidAmount = records.filter(r => r.status === "paid").reduce((sum, r) => sum + r.amount, 0);
    const pendingAmount = records.filter(r => r.status === "pending" || r.status === "approved").reduce((sum, r) => sum + r.amount, 0);
    const overdueAmount = records.filter(r => r.status === "overdue").reduce((sum, r) => sum + r.amount, 0);
    
    // Get overdue payments count
    const today = new Date().toISOString().split('T')[0];
    const overduePayments = records.filter(r => 
      r.dueDate && r.dueDate < today && r.status !== "paid" && r.status !== "cancelled"
    ).length;
    
    // Get recent transactions
    const recentTransactions = records
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);
    
    // Get pending approvals count
    const pendingApprovals = await ctx.db
      .query("paymentApprovals")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("overallStatus"), "pending"))
      .collect();
    
    // Category breakdown
    const categoryBreakdown = new Map();
    for (const record of records) {
      const categoryId = record.feeCategoryId;
      if (!categoryBreakdown.has(categoryId)) {
        categoryBreakdown.set(categoryId, { total: 0, paid: 0, pending: 0 });
      }
      const breakdown = categoryBreakdown.get(categoryId);
      breakdown.total += record.amount;
      
      if (record.status === "paid") {
        breakdown.paid += record.amount;
      } else if (record.status === "pending" || record.status === "approved") {
        breakdown.pending += record.amount;
      }
    }
    
    return {
      summary: {
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount,
        paymentRate: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0,
      },
      counts: {
        totalTransactions: records.length,
        overduePayments,
        pendingApprovals: pendingApprovals.length,
      },
      recentTransactions,
      categoryBreakdown: Array.from(categoryBreakdown.entries()).map(([categoryId, breakdown]) => ({
        categoryId,
        ...breakdown,
      })),
    };
  },
});

// ===================================
// ENHANCED PAYMENT MANAGEMENT
// ===================================

/**
 * Mark financial record as paid - FOR EXPENSES AND OTHER RECORDS
 */
export const markFinancialRecordPaid = mutation({
  args: {
    recordId: v.id("financialRecords"),
    paidDate: v.optional(v.string()),
    receiptNumber: v.optional(v.string()),
    paymentReference: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.recordId);
    if (!record) {
      throw new Error("Financial record not found");
    }
    
    const user = await authenticateAndAuthorize(ctx, record.foundationId, ["admin", "super_admin"]);
    
    // Update record status
    await ctx.db.patch(args.recordId, {
      status: "paid",
      paidDate: args.paidDate || new Date().toISOString(),
      receiptNumber: args.receiptNumber,
      paymentReference: args.paymentReference,
      internalNotes: args.notes,
      updatedAt: Date.now(),
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: record.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "mark_paid",
      entityType: "financial_records",
      entityId: args.recordId,
      description: `Marked ${record.transactionType} record as paid: ${record.amount} ${record.currency}`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

// ===================================
// PAYMENT PROCESSING SYSTEM
// ===================================

/**
 * Get financial record by ID with details
 */
export const getFinancialRecordById = query({
  args: {
    recordId: v.id("financialRecords"),
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "beneficiary",
      "guardian",
    ]);

    const record = await ctx.db.get(args.recordId);
    if (!record || record.foundationId !== args.foundationId) {
      throw new Error("Financial record not found");
    }

    // Get related data
    const beneficiary = record.beneficiaryId 
      ? await ctx.db.get(record.beneficiaryId)
      : null;
    
    const beneficiaryUser = beneficiary?.userId 
      ? await ctx.db.get(beneficiary.userId)
      : null;
    
    const feeCategory = record.feeCategoryId 
      ? await ctx.db.get(record.feeCategoryId)
      : null;
    
    const session = record.academicSessionId 
      ? await ctx.db.get(record.academicSessionId)
      : null;

    return {
      ...record,
      beneficiary,
      beneficiaryUser,
      feeCategory,
      session,
    };
  },
});

/**
 * Process manual payment
 */
export const processManualPayment = mutation({
  args: {
    financialRecordId: v.id("financialRecords"),
    foundationId: v.id("foundations"),
    amount: v.number(),
    currency: v.union(v.literal("NGN"), v.literal("USD")),
    paymentMethod: v.string(),
    referenceNumber: v.string(),
    notes: v.optional(v.string()),
    receiptId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
    ]);

    const financialRecord = await ctx.db.get(args.financialRecordId);
    if (!financialRecord || financialRecord.foundationId !== args.foundationId) {
      throw new Error("Financial record not found");
    }

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Update financial record
    await ctx.db.patch(args.financialRecordId, {
      status: "paid",
      paidDate: new Date().toISOString(),
      receiptNumber,
      paymentReference: args.referenceNumber,
      internalNotes: args.notes,
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "manual_payment_processed",
      entityType: "financialRecords",
      entityId: args.financialRecordId,
      description: `Processed manual payment of ${args.currency} ${args.amount}`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });

    return { 
      success: true, 
      receiptNumber,
      paidAmount: args.amount 
    };
  },
});

/**
 * Initiate Paystack payment
 */
export const initiatePaystackPayment = mutation({
  args: {
    financialRecordId: v.id("financialRecords"),
    foundationId: v.id("foundations"),
    amount: v.number(),
    currency: v.union(v.literal("NGN"), v.literal("USD")),
    callbackUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "beneficiary",
      "guardian",
    ]);

    const financialRecord = await ctx.db.get(args.financialRecordId);
    if (!financialRecord || financialRecord.foundationId !== args.foundationId) {
      throw new Error("Financial record not found");
    }

    // Check if Paystack is enabled
    const paystackConfig = {
      enabled: process.env.PAYSTACK_PUBLIC_KEY ? true : false,
      publicKey: process.env.PAYSTACK_PUBLIC_KEY,
      secretKey: process.env.PAYSTACK_SECRET_KEY,
    };

    if (!paystackConfig.enabled) {
      throw new Error("Paystack payment gateway is not configured");
    }

    // Generate payment reference
    const reference = `TOF-${args.foundationId}-${args.financialRecordId}-${Date.now()}`;

    // Create payment session (this would be implemented with actual Paystack API)
    const paymentSession = {
      reference,
      authorizationUrl: `https://checkout.paystack.com/${reference}`,
      amount: args.amount * 100, // Paystack expects kobo for NGN
      currency: args.currency,
    };

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "paystack_payment_initiated",
      entityType: "financialRecords",
      entityId: args.financialRecordId,
      description: `Initiated Paystack payment for ${args.currency} ${args.amount}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return paymentSession;
  },
});

/**
 * Initiate Flutterwave payment
 */
export const initiateFlutterwavePayment = mutation({
  args: {
    financialRecordId: v.id("financialRecords"),
    foundationId: v.id("foundations"),
    amount: v.number(),
    currency: v.union(v.literal("NGN"), v.literal("USD")),
    callbackUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "beneficiary",
      "guardian",
    ]);

    const financialRecord = await ctx.db.get(args.financialRecordId);
    if (!financialRecord || financialRecord.foundationId !== args.foundationId) {
      throw new Error("Financial record not found");
    }

    // Check if Flutterwave is enabled
    const flutterwaveConfig = {
      enabled: process.env.FLUTTERWAVE_PUBLIC_KEY ? true : false,
      publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
      secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
    };

    if (!flutterwaveConfig.enabled) {
      throw new Error("Flutterwave payment gateway is not configured");
    }

    // Generate payment reference
    const reference = `TOF-${args.foundationId}-${args.financialRecordId}-${Date.now()}`;

    // Create payment session (this would be implemented with actual Flutterwave API)
    const paymentSession = {
      reference,
      link: `https://checkout.flutterwave.com/v3/hosted/pay/${reference}`,
      amount: args.amount,
      currency: args.currency,
    };

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "flutterwave_payment_initiated",
      entityType: "financialRecords",
      entityId: args.financialRecordId,
      description: `Initiated Flutterwave payment for ${args.currency} ${args.amount}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return paymentSession;
  },
});

/**
 * Handle payment gateway callback
 */
export const handlePaymentCallback = mutation({
  args: {
    gateway: v.union(v.literal("paystack"), v.literal("flutterwave")),
    reference: v.string(),
    status: v.string(),
    transactionId: v.string(),
    amount: v.number(),
    currency: v.union(v.literal("NGN"), v.literal("USD")),
  },
  handler: async (ctx, args) => {
    // Parse reference to get foundation and financial record IDs
    const refParts = args.reference.split('-');
    if (refParts.length < 4 || refParts[0] !== 'TOF') {
      throw new Error("Invalid payment reference");
    }

    const foundationId = refParts[1] as Id<"foundations">;
    const financialRecordId = refParts[2] as Id<"financialRecords">;

    // Verify foundation and financial record exist
    const foundation = await ctx.db.get(foundationId);
    const financialRecord = await ctx.db.get(financialRecordId);

    if (!foundation || !financialRecord) {
      throw new Error("Invalid payment reference");
    }

    if (args.status === "successful" || args.status === "success") {
      // Update financial record as paid
      await ctx.db.patch(financialRecordId, {
        status: "paid",
        paidDate: new Date().toISOString(),
        paymentReference: args.transactionId,
        receiptNumber: `${args.gateway.toUpperCase()}-${args.transactionId}`,
        updatedAt: Date.now(),
      });

      // Create audit log
      await ctx.db.insert("auditLogs", {
        foundationId,
        action: `${args.gateway}_payment_completed`,
        entityType: "financialRecords",
        entityId: financialRecordId,
        description: `Payment completed via ${args.gateway}: ${args.currency} ${args.amount}`,
        riskLevel: "low",
        createdAt: Date.now(),
      });
    } else {
      // Handle failed payment
      await ctx.db.insert("auditLogs", {
        foundationId,
        action: `${args.gateway}_payment_failed`,
        entityType: "financialRecords",
        entityId: financialRecordId,
        description: `Payment failed via ${args.gateway}: ${args.currency} ${args.amount}`,
        riskLevel: "medium",
        createdAt: Date.now(),
      });
    }

    return { success: true, status: args.status };
  },
});