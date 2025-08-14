import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get audit logs for a specific entity (like a document)
 */
export const getByEntity = query({
  args: {
    foundationId: v.id("foundations"),
    entityType: v.string(),
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.foundationId !== args.foundationId) {
      return [];
    }

    return await ctx.db
      .query("auditLogs")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => 
        q.and(
          q.eq(q.field("entityType"), args.entityType),
          q.eq(q.field("entityId"), args.entityId)
        )
      )
      .order("desc")
      .take(50); // Limit to last 50 audit entries
  },
});

/**
 * Get recent audit logs for the foundation
 */
export const getRecent = query({
  args: {
    foundationId: v.id("foundations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.foundationId !== args.foundationId) {
      return [];
    }

    // Only admins and super_admins can view all audit logs
    if (!["admin", "super_admin"].includes(user.role)) {
      return [];
    }

    return await ctx.db
      .query("auditLogs")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .order("desc")
      .take(args.limit || 100);
  },
});