import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authenticateAndAuthorize } from "./auth";

/**
 * Get all users for a foundation (admin only)
 */
export const getByFoundation = query({
  args: {
    foundationId: v.id("foundations"),
    role: v.optional(
      v.union(
        v.literal("super_admin"),
        v.literal("admin"),
        v.literal("reviewer"),
        v.literal("beneficiary"),
        v.literal("guardian")
      )
    ),
    search: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Only admins can view all users
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);
    
    let query = ctx.db
      .query("users")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));
    
    const users = await query.collect();
    
    // Apply filters
    let filteredUsers = users;
    
    if (args.role) {
      filteredUsers = filteredUsers.filter((u) => u.role === args.role);
    }
    
    if (args.isActive !== undefined) {
      filteredUsers = filteredUsers.filter((u) => u.isActive === args.isActive);
    }
    
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (u) =>
          u.firstName.toLowerCase().includes(searchLower) ||
          u.lastName.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower) ||
          (u.phone && u.phone.includes(args.search || ""))
      );
    }
    
    // Sort by creation date (newest first)
    filteredUsers.sort((a, b) => b.createdAt - a.createdAt);
    
    return filteredUsers;
  },
});

/**
 * Get user by ID
 */
export const getById = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    
    if (!user) {
      return null;
    }
    
    // Check if current user can view this user
    const currentUser = await authenticateAndAuthorize(
      ctx,
      user.foundationId ?? null,
      ["super_admin", "admin", "reviewer", "beneficiary", "guardian"]
    );
    
    // Users can view their own profile
    // Admins can view all users in their foundation
    // Reviewers can view beneficiaries
    if (
      currentUser._id !== args.userId &&
      currentUser.role !== "admin" &&
      currentUser.role !== "super_admin" &&
      !(currentUser.role === "reviewer" && user.role === "beneficiary")
    ) {
      throw new Error("Access denied");
    }
    
    return user;
  },
});

/**
 * Update user profile
 */
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"))),
    address: v.optional(
      v.object({
        street: v.string(),
        city: v.string(),
        state: v.string(),
        country: v.string(),
        postalCode: v.optional(v.string()),
      })
    ),
    profileImageUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }
    
    // Authenticate current user
    const currentUser = await authenticateAndAuthorize(
      ctx,
      targetUser.foundationId ?? null,
      ["super_admin", "admin", "reviewer", "beneficiary", "guardian"]
    );
    
    // Users can update their own profile
    // Admins can update any user in their foundation
    if (
      currentUser._id !== args.userId &&
      currentUser.role !== "admin" &&
      currentUser.role !== "super_admin"
    ) {
      throw new Error("Access denied");
    }
    
    const { userId, ...updates } = args;
    
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
    
    // Update user
    await ctx.db.patch(args.userId, {
      ...cleanUpdates,
      updatedAt: Date.now(),
    });
    
    // Create audit log (only if target user has a foundation)
    if (targetUser.foundationId) {
      await ctx.db.insert("auditLogs", {
        foundationId: targetUser.foundationId,
        userId: currentUser._id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        action: "profile_updated",
        entityType: "users",
        entityId: args.userId,
        description: `Updated user profile for ${targetUser.firstName} ${targetUser.lastName}`,
        riskLevel: "low",
        createdAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

/**
 * Deactivate user (admin only)
 */
export const deactivate = mutation({
  args: {
    userId: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }
    
    // Only admins can deactivate users
    const currentUser = await authenticateAndAuthorize(
      ctx,
      targetUser.foundationId ?? null,
      ["admin", "super_admin"]
    );
    
    // Cannot deactivate yourself
    if (currentUser._id === args.userId) {
      throw new Error("Cannot deactivate your own account");
    }
    
    // Cannot deactivate super admins unless you are one
    if (targetUser.role === "super_admin" && currentUser.role !== "super_admin") {
      throw new Error("Only super admins can deactivate other super admins");
    }
    
    // Update user
    await ctx.db.patch(args.userId, {
      isActive: false,
      updatedAt: Date.now(),
    });
    
    // Create audit log (only if target user has a foundation)
    if (targetUser.foundationId) {
      await ctx.db.insert("auditLogs", {
        foundationId: targetUser.foundationId,
        userId: currentUser._id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        action: "user_deactivated",
        entityType: "users",
        entityId: args.userId,
        description: `Deactivated user account for ${targetUser.firstName} ${targetUser.lastName}`,
        riskLevel: "high",
        createdAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

/**
 * Reactivate user (admin only)
 */
export const reactivate = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }
    
    // Only admins can reactivate users
    const currentUser = await authenticateAndAuthorize(
      ctx,
      targetUser.foundationId ?? null,
      ["admin", "super_admin"]
    );
    
    // Update user
    await ctx.db.patch(args.userId, {
      isActive: true,
      updatedAt: Date.now(),
    });
    
    // Create audit log (only if target user has a foundation)
    if (targetUser.foundationId) {
      await ctx.db.insert("auditLogs", {
        foundationId: targetUser.foundationId,
        userId: currentUser._id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        action: "user_reactivated",
        entityType: "users",
        entityId: args.userId,
        description: `Reactivated user account for ${targetUser.firstName} ${targetUser.lastName}`,
        riskLevel: "medium",
        createdAt: Date.now(),
      });
    }
    
    return { success: true };
  },
});

/**
 * Assign user to foundation (super admin only)
 */
export const assignToFoundation = mutation({
  args: {
    userId: v.id("users"),
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    // Only super admins can assign users to foundations
    const currentUser = await authenticateAndAuthorize(ctx, null, ["super_admin"]);
    
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }
    
    const foundation = await ctx.db.get(args.foundationId);
    if (!foundation) {
      throw new Error("Foundation not found");
    }
    
    // Update user
    await ctx.db.patch(args.userId, {
      foundationId: args.foundationId,
      updatedAt: Date.now(),
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "user_assigned",
      entityType: "users",
      entityId: args.userId,
      description: `Assigned ${targetUser.firstName} ${targetUser.lastName} to ${foundation.name}`,
      riskLevel: "high",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Get user statistics for a foundation
 */
export const getStatistics = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);
    
    const users = await ctx.db
      .query("users")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    const stats = {
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      inactive: users.filter((u) => !u.isActive).length,
      byRole: {
        admin: users.filter((u) => u.role === "admin").length,
        reviewer: users.filter((u) => u.role === "reviewer").length,
        beneficiary: users.filter((u) => u.role === "beneficiary").length,
        guardian: users.filter((u) => u.role === "guardian").length,
      },
    };
    
    return stats;
  },
});

/**
 * Create user invitation
 */
export const createInvitation = mutation({
  args: {
    foundationId: v.id("foundations"),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("reviewer"),
      v.literal("beneficiary"),
      v.literal("guardian")
    ),
    invitedBy: v.id("users"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);
    
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existingUser) {
      throw new Error("A user with this email already exists");
    }
    
    // Create invitation record (you might want to add an invitations table)
    // For now, we'll create a pending user record
    const userId = await ctx.db.insert("users", {
      clerkId: "", // Will be filled when they sign up
      foundationId: args.foundationId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role,
      isActive: false, // Inactive until they accept invitation
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "user_invited",
      entityType: "users",
      entityId: userId,
      description: `Invited ${args.firstName} ${args.lastName} (${args.email}) as ${args.role}`,
      riskLevel: args.role === "admin" ? "high" : "low",
      createdAt: Date.now(),
    });
    
    // TODO: Send actual invitation email
    // For now, we'll just log it
    console.log(`Invitation would be sent to ${args.email} for role ${args.role}`);
    
    return { success: true, userId };
  },
});

/**
 * Get users by roles (for reviewer assignment, etc.)
 */
export const getByRoles = query({
  args: {
    foundationId: v.id("foundations"),
    roles: v.array(
      v.union(
        v.literal("super_admin"),
        v.literal("admin"),
        v.literal("reviewer"),
        v.literal("beneficiary"),
        v.literal("guardian")
      )
    ),
    isActive: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin", "reviewer"]);
    
    const users = await ctx.db
      .query("users")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();
    
    // Filter by roles and active status
    const filteredUsers = users.filter(user => {
      const matchesRole = args.roles.includes(user.role as any);
      const matchesActiveStatus = args.isActive === undefined || user.isActive === args.isActive;
      return matchesRole && matchesActiveStatus;
    });
    
    // Sort by name
    filteredUsers.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
    
    return filteredUsers;
  },
});

/**
 * Toggle user active status (admin only)
 */
export const toggleActiveStatus = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get target user first
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Authenticate and authorize
    const currentUser = await authenticateAndAuthorize(
      ctx,
      targetUser.foundationId ?? null,
      ["admin", "super_admin"]
    );
    
    // Cannot deactivate yourself
    if (currentUser._id === args.userId) {
      throw new Error("Cannot deactivate your own account");
    }
    
    // Cannot deactivate super admins unless you are one
    if (targetUser.role === "super_admin" && currentUser.role !== "super_admin") {
      throw new Error("Only super admins can deactivate other super admins");
    }
    
    const newStatus = !targetUser.isActive;
    
    // Update user
    await ctx.db.patch(args.userId, {
      isActive: newStatus,
      updatedAt: Date.now(),
    });
    
    // Create audit log (only if target user has a foundation)
    if (targetUser.foundationId) {
      await ctx.db.insert("auditLogs", {
        foundationId: targetUser.foundationId,
        userId: currentUser._id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        action: newStatus ? "user_reactivated" : "user_deactivated",
        entityType: "users",
        entityId: args.userId,
        description: `${newStatus ? "Reactivated" : "Deactivated"} user account for ${targetUser.firstName} ${targetUser.lastName}`,
        riskLevel: "high",
        createdAt: Date.now(),
      });
    }
    
    return { success: true, newStatus };
  },
});
