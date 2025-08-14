import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { authenticateAndAuthorize } from "./auth";
import { Id } from "./_generated/dataModel";

/**
 * Get all users (admin only)
 */
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    // Authenticate as admin
    const currentUser = await authenticateAndAuthorize(ctx, null, ["super_admin", "admin"]);
    
    const users = await ctx.db.query("users").collect();
    
    return users.map(user => ({
      ...user,
      // Don't expose sensitive data
      clerkId: undefined
    }));
  },
});

/**
 * Get recent audit logs (admin only)
 */
export const getRecentAuditLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Authenticate as admin
    const currentUser = await authenticateAndAuthorize(ctx, null, ["super_admin", "admin"]);
    
    const logs = await ctx.db
      .query("auditLogs")
      .order("desc")
      .take(args.limit || 50);
    
    return logs;
  },
});

/**
 * Get system statistics (admin only)
 */
export const getSystemStats = query({
  args: {},
  handler: async (ctx) => {
    // Authenticate as admin
    const currentUser = await authenticateAndAuthorize(ctx, null, ["super_admin", "admin"]);
    
    // Get user stats
    const allUsers = await ctx.db.query("users").collect();
    const activeUsers = allUsers.filter(user => user.isActive);
    
    // Get beneficiary stats
    const allBeneficiaries = await ctx.db.query("beneficiaries").collect();
    const activeBeneficiaries = allBeneficiaries.filter(b => b.status === "active");
    
    // Get document stats
    const allDocuments = await ctx.db.query("documents").collect();
    const pendingDocuments = allDocuments.filter(doc => doc.status === "pending_review");
    
    // Get security alerts (high/critical risk audit logs in last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentLogs = await ctx.db
      .query("auditLogs")
      .filter((q) => q.gte(q.field("createdAt"), oneDayAgo))
      .collect();
    const securityAlerts = recentLogs.filter(log => 
      log.riskLevel === "high" || log.riskLevel === "critical"
    ).length;
    
    return {
      totalUsers: allUsers.length,
      activeUsers: activeUsers.length,
      totalBeneficiaries: allBeneficiaries.length,
      activeBeneficiaries: activeBeneficiaries.length,
      totalDocuments: allDocuments.length,
      pendingDocuments: pendingDocuments.length,
      securityAlerts,
    };
  },
});

/**
 * Update user role (super admin only)
 */
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    newRole: v.union(
      v.literal("super_admin"),
      v.literal("admin"),
      v.literal("reviewer"),
      v.literal("beneficiary"),
      v.literal("guardian")
    ),
  },
  handler: async (ctx, args) => {
    // Only super admins can change roles
    const currentUser = await authenticateAndAuthorize(ctx, null, ["super_admin"]);
    
    // Get target user
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }
    
    // Update user role
    await ctx.db.patch(args.userId, {
      role: args.newRole,
      updatedAt: Date.now(),
    });
    
    // Create audit log
    if (currentUser.foundationId) {
      await ctx.db.insert("auditLogs", {
        foundationId: currentUser.foundationId,
        userId: currentUser._id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        action: "role_changed",
        entityType: "users",
        entityId: args.userId,
        description: `Changed role from ${targetUser.role} to ${args.newRole} for ${targetUser.firstName} ${targetUser.lastName}`,
        riskLevel: "high",
        createdAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

/**
 * Deactivate user (admin only)
 */
export const deactivateUser = mutation({
  args: {
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Authenticate as admin
    const currentUser = await authenticateAndAuthorize(ctx, null, ["super_admin", "admin"]);
    
    // Get target user
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }
    
    // Cannot deactivate self
    if (targetUser._id === currentUser._id) {
      throw new Error("Cannot deactivate your own account");
    }

    // Only deactivate users who are currently active and have completed setup
    if (!targetUser.isActive) {
      throw new Error("User is already inactive");
    }

    if (!targetUser.clerkId || targetUser.clerkId.startsWith("manual_")) {
      throw new Error("Cannot deactivate user who hasn't completed account setup");
    }
    
    // Update user status - clear invitation token to distinguish from pending invitations
    await ctx.db.patch(args.userId, {
      isActive: false,
      invitationToken: undefined, // Clear token to distinguish from pending invitations
      updatedAt: Date.now(),
    });
    
    // Create audit log
    if (currentUser.foundationId) {
      await ctx.db.insert("auditLogs", {
        foundationId: currentUser.foundationId,
        userId: currentUser._id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        action: "user_deactivated",
        entityType: "users",
        entityId: args.userId,
        description: `Deactivated user account for ${targetUser.firstName} ${targetUser.lastName}${args.reason ? `. Reason: ${args.reason}` : ''}`,
        riskLevel: "medium",
        createdAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

/**
 * Reactivate user (admin only)
 */
export const reactivateUser = mutation({
  args: {
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Authenticate as admin
    const currentUser = await authenticateAndAuthorize(ctx, null, ["super_admin", "admin"]);
    
    // Get target user
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Only reactivate users who have completed setup (have Clerk ID)
    if (!targetUser.clerkId || targetUser.clerkId.startsWith("manual_")) {
      throw new Error("Cannot reactivate user who hasn't completed account setup");
    }

    if (targetUser.isActive) {
      throw new Error("User is already active");
    }
    
    // Update user status
    await ctx.db.patch(args.userId, {
      isActive: true,
      updatedAt: Date.now(),
    });
    
    // Create audit log
    if (currentUser.foundationId) {
      await ctx.db.insert("auditLogs", {
        foundationId: currentUser.foundationId,
        userId: currentUser._id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        action: "user_reactivated",
        entityType: "users",
        entityId: args.userId,
        description: `Reactivated user account for ${targetUser.firstName} ${targetUser.lastName}${args.reason ? `. Reason: ${args.reason}` : ''}`,
        riskLevel: "medium",
        createdAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

/**
 * Block user (super admin only) - prevents sign-in but keeps data
 */
export const blockUser = mutation({
  args: {
    userId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    // Only super admins can block users
    const currentUser = await authenticateAndAuthorize(ctx, null, ["super_admin"]);
    
    // Get target user
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }
    
    // Cannot block self
    if (targetUser._id === currentUser._id) {
      throw new Error("Cannot block your own account");
    }

    // Cannot block other super admins unless you're also super admin
    if (targetUser.role === "super_admin" && currentUser.role !== "super_admin") {
      throw new Error("Cannot block super admin");
    }
    
    // Update user status - blocked users are inactive with no invitation token
    await ctx.db.patch(args.userId, {
      isActive: false,
      invitationToken: undefined,
      updatedAt: Date.now(),
    });
    
    // Create audit log
    if (currentUser.foundationId) {
      await ctx.db.insert("auditLogs", {
        foundationId: currentUser.foundationId,
        userId: currentUser._id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        action: "user_blocked",
        entityType: "users",
        entityId: args.userId,
        description: `Blocked user account for ${targetUser.firstName} ${targetUser.lastName}. Reason: ${args.reason}`,
        riskLevel: "high",
        createdAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

/**
 * Delete user permanently (super admin only)
 */
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    // Only super admins can delete users
    const currentUser = await authenticateAndAuthorize(ctx, null, ["super_admin"]);
    
    // Get target user
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }
    
    // Cannot delete self
    if (targetUser._id === currentUser._id) {
      throw new Error("Cannot delete your own account");
    }

    // Cannot delete other super admins
    if (targetUser.role === "super_admin") {
      throw new Error("Cannot delete super admin accounts");
    }

    // Create final audit log before deletion
    if (currentUser.foundationId) {
      await ctx.db.insert("auditLogs", {
        foundationId: currentUser.foundationId,
        userId: currentUser._id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        action: "user_deleted",
        entityType: "users",
        entityId: args.userId,
        description: `Permanently deleted user account for ${targetUser.firstName} ${targetUser.lastName} (${targetUser.email}). Reason: ${args.reason}`,
        riskLevel: "critical",
        createdAt: Date.now(),
      });
    }
    
    // TODO: In a production system, you might want to:
    // 1. Anonymize related data instead of deleting
    // 2. Move to a "deleted_users" table for compliance
    // 3. Handle cascading deletes for related entities
    
    // Delete the user
    await ctx.db.delete(args.userId);
    
    return { success: true };
  },
});

/**
 * Get user by ID with full details (admin only)
 */
export const getUserById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Authenticate as admin
    const currentUser = await authenticateAndAuthorize(ctx, null, ["super_admin", "admin"]);
    
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }
    
    // Get foundation details if user has one
    let foundation = null;
    if (user.foundationId) {
      foundation = await ctx.db.get(user.foundationId);
    }
    
    // Get recent audit logs for this user
    const recentLogs = await ctx.db
      .query("auditLogs")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(20);
    
    return {
      ...user,
      foundation,
      recentActivity: recentLogs,
      // Don't expose sensitive data
      clerkId: undefined,
    };
  },
});

/**
 * Create manual user (admin only)
 */
export const createUser = mutation({
  args: {
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("reviewer"),
      v.literal("beneficiary"),
      v.literal("guardian")
    ),
    foundationId: v.optional(v.id("foundations")),
  },
  handler: async (ctx, args) => {
    // Authenticate as admin
    const currentUser = await authenticateAndAuthorize(ctx, null, ["super_admin", "admin"]);
    
    // Check if email already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
    
    if (existingUser) {
      throw new Error("User with this email already exists");
    }
    
    // Use current user's foundation if not specified
    const foundationId = args.foundationId || currentUser.foundationId;
    
    if (!foundationId) {
      throw new Error("Foundation must be specified");
    }
    
    // Create user
    const userId = await ctx.db.insert("users", {
      clerkId: `manual_${Date.now()}_${Math.random()}`, // Temporary clerk ID for manual users
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role,
      foundationId,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "user_created",
      entityType: "users",
      entityId: userId,
      description: `Manually created user account for ${args.firstName} ${args.lastName} (${args.email}) with role ${args.role}`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });
    
    return { success: true, userId };
  },
});

/**
 * Get audit logs for a specific user (admin only)
 */
export const getUserAuditLogs = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Authenticate as admin
    const currentUser = await authenticateAndAuthorize(ctx, null, ["super_admin", "admin"]);
    
    const logs = await ctx.db
      .query("auditLogs")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(args.limit || 50);
    
    return logs;
  },
});