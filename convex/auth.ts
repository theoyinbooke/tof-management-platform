import { v } from "convex/values";
import { mutation, query, QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Helper type for user roles
export type UserRole = "super_admin" | "admin" | "reviewer" | "beneficiary" | "guardian";

/**
 * Helper function to authenticate and authorize users
 * Returns the user document if authenticated and authorized
 */
export async function authenticateAndAuthorize(
  ctx: QueryCtx | MutationCtx,
  foundationId: Id<"foundations"> | null,
  allowedRoles: UserRole[]
): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.isActive) {
    throw new Error("User account is deactivated");
  }

  // Super admins can access any foundation
  if (user.role !== "super_admin" && foundationId && user.foundationId !== foundationId) {
    throw new Error("Access denied: Wrong foundation");
  }

  if (!allowedRoles.includes(user.role as UserRole)) {
    throw new Error("Insufficient permissions");
  }

  return user;
}

/**
 * Get current authenticated user
 */
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || !user.isActive) {
      return null;
    }

    // Fetch foundation details if user has one
    let foundation = null;
    if (user.foundationId) {
      foundation = await ctx.db.get(user.foundationId);
    }

    return {
      ...user,
      foundation,
    };
  },
});

/**
 * Store or update user from Clerk webhook
 */
export const storeUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // First check if user already exists by Clerk ID
    const existingUserByClerkId = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUserByClerkId) {
      // Update existing user
      await ctx.db.patch(existingUserByClerkId._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        updatedAt: Date.now(),
      });
      return existingUserByClerkId._id;
    }

    // Check if this is an invited user (exists by email but no clerkId)
    const invitedUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("clerkId"), ""))
      .unique();

    if (invitedUser) {
      // This is an invited user - update their record with Clerk ID
      console.log(`User ${args.email} is an invited user, updating with Clerk ID ${args.clerkId}`);
      
      // Update the invited user with Clerk ID and activate if not already done
      await ctx.db.patch(invitedUser._id, {
        clerkId: args.clerkId,
        firstName: args.firstName || invitedUser.firstName,
        lastName: args.lastName || invitedUser.lastName,
        isActive: true, // Ensure user is activated
        invitationAcceptedAt: invitedUser.invitationAcceptedAt || Date.now(),
        lastLogin: Date.now(),
        invitationToken: undefined, // Clear invitation token
        updatedAt: Date.now(),
        
        // Set default communication preferences if not set
        communicationPreferences: invitedUser.communicationPreferences || {
          emailNotifications: true,
          smsNotifications: true,
          academicAlerts: true,
          financialAlerts: true,
          administrativeNotifications: true,
          marketingCommunications: false,
        },
      });

      console.log(`Successfully activated invited user ${args.email} with Clerk ID ${args.clerkId}`);
      return invitedUser._id;
    }

    // Check if this is the first user (make them super admin)
    const userCount = await ctx.db.query("users").collect();
    const isFirstUser = userCount.length === 0;

    // For the first user (super_admin), try to create or find a default foundation
    let foundationId: Id<"foundations"> | null = null;
    
    if (isFirstUser) {
      // Create a default foundation for the first user
      foundationId = await ctx.db.insert("foundations", {
        name: "TheOyinbooke Foundation",
        description: "Default foundation for educational support system",
        settings: {
          defaultCurrency: "NGN",
          exchangeRate: 1500,
          academicYearStart: "September",
          academicYearEnd: "July",
          applicationDeadline: "March 31",
          paymentTerms: "30 days",
        },
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      // For non-admin users, find the first active foundation or leave null for onboarding
      const firstFoundation = await ctx.db
        .query("foundations")
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();
      foundationId = firstFoundation?._id || null;
    }

    // Create new user
    const userInsert: any = {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      role: isFirstUser ? "super_admin" : "beneficiary", // Default role
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    // Only add foundationId if we have one
    if (foundationId) {
      userInsert.foundationId = foundationId;
    }
    
    const userId = await ctx.db.insert("users", userInsert);

    // Create audit log for user creation
    if (!isFirstUser && foundationId) {
      await ctx.db.insert("auditLogs", {
        foundationId,
        userId,
        userEmail: args.email,
        userRole: "beneficiary",
        action: "user_created",
        entityType: "users",
        entityId: userId,
        description: `New user account created for ${args.firstName} ${args.lastName}`,
        riskLevel: "low",
        createdAt: Date.now(),
      });
    }

    return userId;
  },
});

/**
 * Delete user (from Clerk webhook)
 */
export const deleteUser = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      console.warn(`Attempted to delete non-existent user with Clerk ID: ${args.clerkId}`);
      return;
    }

    // Soft delete - just deactivate the user
    await ctx.db.patch(user._id, {
      isActive: false,
      updatedAt: Date.now(),
    });

    // Create audit log (only if user has a foundation)
    if (user.foundationId) {
      await ctx.db.insert("auditLogs", {
        foundationId: user.foundationId,
        userId: user._id,
        userEmail: user.email,
        userRole: user.role,
        action: "user_deactivated",
        entityType: "users",
        entityId: user._id,
        description: `User account deactivated`,
        riskLevel: "medium",
        createdAt: Date.now(),
      });
    }
  },
});

/**
 * Update user role (admin only)
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
    foundationId: v.optional(v.id("foundations")),
  },
  handler: async (ctx, args) => {
    // Authenticate and authorize (only admins can change roles)
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId ?? null, ["super_admin", "admin"]);

    // Get target user
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Only super admins can create other super admins
    if (args.newRole === "super_admin" && currentUser.role !== "super_admin") {
      throw new Error("Only super admins can create other super admins");
    }

    // Update user role
    const updates: any = {
      role: args.newRole,
      updatedAt: Date.now(),
    };

    // Set foundation for non-super-admin roles
    if (args.newRole !== "super_admin" && args.foundationId) {
      updates.foundationId = args.foundationId;
    }

    await ctx.db.patch(args.userId, updates);

    // Create audit log (only if we have a valid foundation)
    const auditFoundationId = args.foundationId || currentUser.foundationId;
    if (auditFoundationId) {
      await ctx.db.insert("auditLogs", {
        foundationId: auditFoundationId,
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
 * Check if current user has specific permission
 */
export const hasPermission = query({
  args: {
    permission: v.string(),
    foundationId: v.optional(v.id("foundations")),
  },
  handler: async (ctx, args) => {
    try {
      // Define permission mappings
      const permissionRoles: Record<string, UserRole[]> = {
        // Application permissions
        "applications.create": ["beneficiary", "guardian"],
        "applications.review": ["reviewer", "admin", "super_admin"],
        "applications.approve": ["admin", "super_admin"],
        
        // Beneficiary permissions
        "beneficiaries.view": ["reviewer", "admin", "super_admin", "beneficiary", "guardian"],
        "beneficiaries.edit": ["admin", "super_admin"],
        "beneficiaries.create": ["admin", "super_admin"],
        
        // Financial permissions
        "financial.view": ["admin", "super_admin"],
        "financial.approve": ["admin", "super_admin"],
        "financial.create": ["admin", "super_admin"],
        
        // Program permissions
        "programs.view": ["reviewer", "admin", "super_admin", "beneficiary"],
        "programs.manage": ["admin", "super_admin"],
        
        // Report permissions
        "reports.view": ["reviewer", "admin", "super_admin"],
        "reports.generate": ["admin", "super_admin"],
        
        // Admin permissions
        "admin.users": ["admin", "super_admin"],
        "admin.settings": ["admin", "super_admin"],
        "admin.audit": ["super_admin"],
      };

      const allowedRoles = permissionRoles[args.permission];
      if (!allowedRoles) {
        return false;
      }

      await authenticateAndAuthorize(ctx, args.foundationId ?? null, allowedRoles);
      return true;
    } catch {
      return false;
    }
  },
});