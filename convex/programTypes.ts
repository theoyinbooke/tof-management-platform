import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { authenticateAndAuthorize } from "./auth";

/**
 * Get all program types for a foundation
 */
export const getByFoundation = query({
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

    const programTypes = await ctx.db
      .query("programTypes")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();

    return programTypes.sort((a, b) => a.name.localeCompare(b.name));
  },
});

/**
 * Get active program types for a foundation
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

    const programTypes = await ctx.db
      .query("programTypes")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return programTypes.sort((a, b) => a.name.localeCompare(b.name));
  },
});

/**
 * Create a new program type
 */
export const create = mutation({
  args: {
    foundationId: v.id("foundations"),
    name: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, [
      "super_admin",
      "admin",
    ]);

    // Create program type
    const programTypeId = await ctx.db.insert("programTypes", {
      foundationId: args.foundationId,
      name: args.name,
      description: args.description || "",
      requiresApplication: false,
      hasCapacityLimit: false,
      hasFixedSchedule: false,
      requiresAttendance: false,
      requiresProgress: false,
      requiresFeedback: false,
      isActive: args.isActive,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "program_type_created",
      entityType: "programTypes",
      entityId: programTypeId,
      description: `Created new program type: ${args.name}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return programTypeId;
  },
});

/**
 * Update a program type
 */
export const update = mutation({
  args: {
    programTypeId: v.id("programTypes"),
    foundationId: v.id("foundations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("educational"),
        v.literal("mentorship"),
        v.literal("workshop"),
        v.literal("scholarship"),
        v.literal("career"),
        v.literal("life_skills"),
        v.literal("other")
      )
    ),
    sortOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, [
      "super_admin",
      "admin",
    ]);

    const programType = await ctx.db.get(args.programTypeId);
    if (!programType) {
      throw new Error("Program type not found");
    }

    if (programType.foundationId !== args.foundationId) {
      throw new Error("Access denied");
    }

    // Update program type
    await ctx.db.patch(args.programTypeId, {
      name: args.name || programType.name,
      description: args.description ?? programType.description,
      isActive: args.isActive ?? programType.isActive,
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "program_type_updated",
      entityType: "programTypes",
      entityId: args.programTypeId,
      description: `Updated program type: ${programType.name}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a program type
 */
export const remove = mutation({
  args: {
    programTypeId: v.id("programTypes"),
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, [
      "super_admin",
      "admin",
    ]);

    const programType = await ctx.db.get(args.programTypeId);
    if (!programType) {
      throw new Error("Program type not found");
    }

    if (programType.foundationId !== args.foundationId) {
      throw new Error("Access denied");
    }

    // Check if program type is in use
    const programs = await ctx.db
      .query("programs")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("programTypeId"), args.programTypeId))
      .collect();

    if (programs.length > 0) {
      throw new Error("Cannot delete program type that is in use by programs");
    }

    // Delete program type
    await ctx.db.delete(args.programTypeId);

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "program_type_deleted",
      entityType: "programTypes",
      entityId: args.programTypeId,
      description: `Deleted program type: ${programType.name}`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});