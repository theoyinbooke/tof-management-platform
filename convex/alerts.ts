import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authenticateAndAuthorize } from "./auth";

/**
 * Get all performance rules for a foundation
 */
export const getPerformanceRules = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);
    
    const performanceRules = await ctx.db
      .query("performanceRules")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    return performanceRules;
  },
});

/**
 * Get active performance rules for a foundation
 */
export const getActivePerformanceRules = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);
    
    const performanceRules = await ctx.db
      .query("performanceRules")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    return performanceRules;
  },
});

/**
 * Create a new performance rule
 */
export const createPerformanceRule = mutation({
  args: {
    foundationId: v.id("foundations"),
    name: v.string(),
    description: v.string(),
    conditions: v.object({
      consecutiveTermsBelow: v.optional(v.number()),
      gradeThreshold: v.optional(v.number()),
      attendanceThreshold: v.optional(v.number()),
      missedUploads: v.optional(v.number()),
    }),
    actions: v.array(
      v.union(
        v.literal("notify_admin"),
        v.literal("flag_for_review"),
        v.literal("schedule_intervention")
      )
    ),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, ["super_admin", "admin"]);
    
    // Create performance rule
    const performanceRuleId = await ctx.db.insert("performanceRules", {
      foundationId: args.foundationId,
      name: args.name,
      description: args.description,
      conditions: args.conditions,
      actions: args.actions,
      isActive: args.isActive,
      createdAt: Date.now(),
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "performance_rule_created",
      entityType: "performanceRules",
      entityId: performanceRuleId,
      description: `Created new performance rule: ${args.name}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });
    
    return performanceRuleId;
  },
});

/**
 * Update a performance rule
 */
export const updatePerformanceRule = mutation({
  args: {
    ruleId: v.id("performanceRules"),
    foundationId: v.id("foundations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    conditions: v.optional(
      v.object({
        consecutiveTermsBelow: v.optional(v.number()),
        gradeThreshold: v.optional(v.number()),
        attendanceThreshold: v.optional(v.number()),
        missedUploads: v.optional(v.number()),
      })
    ),
    actions: v.optional(
      v.array(
        v.union(
          v.literal("notify_admin"),
          v.literal("flag_for_review"),
          v.literal("schedule_intervention")
        )
      )
    ),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, ["super_admin", "admin"]);
    
    const performanceRule = await ctx.db.get(args.ruleId);
    if (!performanceRule) {
      throw new Error("Performance rule not found");
    }
    
    if (performanceRule.foundationId !== args.foundationId) {
      throw new Error("Access denied");
    }
    
    const { ruleId, foundationId, ...updates } = args;
    
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
    
    // Update performance rule
    await ctx.db.patch(args.ruleId, {
      ...cleanUpdates,
      updatedAt: Date.now(),
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "performance_rule_updated",
      entityType: "performanceRules",
      entityId: args.ruleId,
      description: `Updated performance rule: ${performanceRule.name}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Delete a performance rule
 */
export const deletePerformanceRule = mutation({
  args: {
    ruleId: v.id("performanceRules"),
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, ["super_admin", "admin"]);
    
    const performanceRule = await ctx.db.get(args.ruleId);
    if (!performanceRule) {
      throw new Error("Performance rule not found");
    }
    
    if (performanceRule.foundationId !== args.foundationId) {
      throw new Error("Access denied");
    }
    
    // Delete performance rule
    await ctx.db.delete(args.ruleId);
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "performance_rule_deleted",
      entityType: "performanceRules",
      entityId: args.ruleId,
      description: `Deleted performance rule: ${performanceRule.name}`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Get active alerts for a beneficiary
 */
export const getActiveAlerts = query({
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
    
    const alerts = await ctx.db
      .query("performanceAlerts")
      .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", args.beneficiaryId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    return alerts;
  },
});

/**
 * Get all alerts for a beneficiary
 */
export const getAlertsByBeneficiary = query({
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
    
    const alerts = await ctx.db
      .query("performanceAlerts")
      .withIndex("by_beneficiary", (q) => q.eq("beneficiaryId", args.beneficiaryId))
      .collect();
    
    return alerts;
  },
});

/**
 * Acknowledge an alert
 */
export const acknowledgeAlert = mutation({
  args: {
    alertId: v.id("performanceAlerts"),
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "beneficiary",
      "guardian",
    ]);
    
    const alert = await ctx.db.get(args.alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }
    
    if (alert.foundationId !== args.foundationId) {
      throw new Error("Access denied");
    }
    
    // Update alert status
    await ctx.db.patch(args.alertId, {
      status: "acknowledged",
      actionBy: currentUser._id,
      actionDate: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "alert_acknowledged",
      entityType: "performanceAlerts",
      entityId: args.alertId,
      description: `Acknowledged alert: ${alert.title}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});