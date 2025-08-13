// convex/schools.ts
// Schools Management System - Convex Functions
// TheOyinbooke Foundation Management Platform

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { authenticateAndAuthorize } from "./auth";

// ===================================
// SCHOOLS MANAGEMENT
// ===================================

/**
 * Get schools for a foundation
 */
export const getByFoundation = query({
  args: {
    foundationId: v.id("foundations"),
    schoolType: v.optional(v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("federal")
    )),
    city: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
    ]);

    let query = ctx.db
      .query("schools")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));

    if (args.schoolType) {
      query = query.filter((q) => q.eq(q.field("schoolType"), args.schoolType));
    }

    if (args.city) {
      query = query.filter((q) => q.eq(q.field("city"), args.city));
    }

    const schools = await query
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return schools.sort((a, b) => a.name.localeCompare(b.name));
  },
});

/**
 * Get all schools for a foundation (including inactive)
 */
export const getAllByFoundation = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
    ]);

    const schools = await ctx.db
      .query("schools")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();

    return schools.sort((a, b) => a.name.localeCompare(b.name));
  },
});

/**
 * Create a new school
 */
export const create = mutation({
  args: {
    foundationId: v.id("foundations"),
    name: v.string(),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    schoolType: v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("federal")
    ),
    levels: v.array(v.string()),
    accountDetails: v.optional(v.object({
      bankName: v.string(),
      accountNumber: v.string(),
      accountName: v.string(),
    })),
    contacts: v.optional(v.array(v.object({
      name: v.string(),
      position: v.string(),
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
    ]);

    const schoolId = await ctx.db.insert("schools", {
      foundationId: args.foundationId,
      name: args.name,
      address: args.address,
      city: args.city,
      state: args.state,
      phone: args.phone,
      email: args.email,
      website: args.website,
      schoolType: args.schoolType,
      levels: args.levels,
      accountDetails: args.accountDetails,
      contacts: args.contacts,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "school_created",
      entityType: "schools",
      entityId: schoolId,
      description: `Created school: ${args.name}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return schoolId;
  },
});

/**
 * Update a school
 */
export const update = mutation({
  args: {
    schoolId: v.id("schools"),
    foundationId: v.id("foundations"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    website: v.optional(v.string()),
    schoolType: v.optional(v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("federal")
    )),
    levels: v.optional(v.array(v.string())),
    accountDetails: v.optional(v.object({
      bankName: v.string(),
      accountNumber: v.string(),
      accountName: v.string(),
    })),
    contacts: v.optional(v.array(v.object({
      name: v.string(),
      position: v.string(),
      phone: v.optional(v.string()),
      email: v.optional(v.string()),
    }))),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
    ]);

    const school = await ctx.db.get(args.schoolId);
    if (!school) {
      throw new Error("School not found");
    }

    if (school.foundationId !== args.foundationId) {
      throw new Error("Access denied");
    }

    const { schoolId, foundationId, ...updates } = args;

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

    // Update school
    await ctx.db.patch(args.schoolId, {
      ...cleanUpdates,
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "school_updated",
      entityType: "schools",
      entityId: args.schoolId,
      description: `Updated school: ${school.name}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a school
 */
export const remove = mutation({
  args: {
    schoolId: v.id("schools"),
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
    ]);

    const school = await ctx.db.get(args.schoolId);
    if (!school) {
      throw new Error("School not found");
    }

    if (school.foundationId !== args.foundationId) {
      throw new Error("Access denied");
    }

    // Check if school is referenced in academic sessions
    const sessions = await ctx.db
      .query("academicSessions")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("schoolName"), school.name))
      .collect();

    if (sessions.length > 0) {
      // Soft delete - mark as inactive instead of hard delete
      await ctx.db.patch(args.schoolId, {
        isActive: false,
        updatedAt: Date.now(),
      });
    } else {
      // Hard delete if no references
      await ctx.db.delete(args.schoolId);
    }

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "school_deleted",
      entityType: "schools",
      entityId: args.schoolId,
      description: `Deleted school: ${school.name}`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});