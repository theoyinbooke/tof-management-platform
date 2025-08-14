import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authenticateAndAuthorize } from "./auth";
import { internal } from "./_generated/api";

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
 * Create user invitation using Clerk's invitation system
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
    
    // Check if user already exists in any foundation (global check)
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    console.log(`Creating invitation for ${args.email}: existing user found =`, existingUser ? {
      id: existingUser._id,
      foundationId: existingUser.foundationId,
      isActive: existingUser.isActive,
      clerkId: existingUser.clerkId
    } : null);
    
    if (existingUser) {
      // If user exists in the same foundation, it's a conflict
      if (existingUser.foundationId === args.foundationId) {
        throw new Error("A user with this email already exists in this foundation");
      }
      // If user exists in a different foundation, it's still a conflict for now
      // (Later you might want to allow the same email in different foundations)
      throw new Error("A user with this email already exists in another foundation");
    }
    
    // Get foundation details for the invitation
    const foundation = await ctx.db.get(args.foundationId);
    if (!foundation) {
      throw new Error("Foundation not found");
    }
    
    // Get inviter details
    const inviter = await ctx.db.get(args.invitedBy);
    if (!inviter) {
      throw new Error("Inviter not found");
    }
    
    // Create invitation using Clerk's Backend API
    console.log(`Creating Clerk invitation for ${args.email}...`);
    
    try {
      // Import Clerk client dynamically to avoid issues
      const { createClerkClient } = await import('@clerk/backend');
      
      const clerkClient = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY!,
        publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
      });
      
      // Create the invitation through Clerk
      const invitation = await clerkClient.invitations.createInvitation({
        emailAddress: args.email,
        redirectUrl: `${process.env.SITE_URL || 'https://theoyinbookefoundation.com'}/sign-up?invitation-accepted=true`,
        publicMetadata: {
          foundationId: args.foundationId,
          role: args.role,
          firstName: args.firstName,
          lastName: args.lastName,
          invitedBy: args.invitedBy,
        },
        notify: true, // Let Clerk send the invitation email
      });
      
      console.log(`Clerk invitation created with ID: ${invitation.id}`);
      
      // Store pending invitation record for tracking
      const pendingInvitationId = await ctx.db.insert("pendingInvitations", {
        clerkInvitationId: invitation.id,
        foundationId: args.foundationId,
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        role: args.role,
        invitedBy: args.invitedBy,
        status: "pending",
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
        entityType: "pendingInvitations",
        entityId: pendingInvitationId,
        description: `Invited ${args.firstName} ${args.lastName} (${args.email}) as ${args.role} via Clerk`,
        riskLevel: args.role === "admin" ? "high" : "low",
        createdAt: Date.now(),
      });
      
      console.log(`Invitation created successfully for ${args.email} (role: ${args.role})`);
      
      return { 
        success: true, 
        clerkInvitationId: invitation.id,
        pendingInvitationId 
      };
    } catch (error) {
      console.error(`Failed to create Clerk invitation for ${args.email}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create invitation: ${errorMessage}`);
    }
  },
});

/**
 * Revoke user invitation using Clerk's system
 */
export const revokeInvitation = mutation({
  args: {
    foundationId: v.id("foundations"),
    pendingInvitationId: v.id("pendingInvitations"),
  },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);
    
    // Get the pending invitation record
    const pendingInvitation = await ctx.db.get(args.pendingInvitationId);
    if (!pendingInvitation) {
      throw new Error("Pending invitation not found");
    }
    
    // Check if invitation belongs to the same foundation
    if (pendingInvitation.foundationId !== args.foundationId) {
      throw new Error("Invitation does not belong to this foundation");
    }
    
    // Check if invitation is still pending
    if (pendingInvitation.status !== "pending") {
      throw new Error("Can only revoke pending invitations");
    }
    
    try {
      // Revoke the invitation in Clerk
      const { createClerkClient } = await import('@clerk/backend');
      
      const clerkClient = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY!,
        publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
      });
      
      await clerkClient.invitations.revokeInvitation(
        pendingInvitation.clerkInvitationId
      );
      
      console.log(`Clerk invitation ${pendingInvitation.clerkInvitationId} revoked`);
      
    } catch (clerkError) {
      console.error(`Failed to revoke Clerk invitation ${pendingInvitation.clerkInvitationId}:`, clerkError);
      // Continue anyway - update our local record
    }
    
    // Update the pending invitation status
    await ctx.db.patch(args.pendingInvitationId, {
      status: "revoked",
      updatedAt: Date.now(),
    });
    
    console.log(`Invitation revoked for ${pendingInvitation.email}`);
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "invitation_revoked",
      entityType: "pendingInvitations",
      entityId: args.pendingInvitationId,
      description: `Revoked invitation for ${pendingInvitation.firstName} ${pendingInvitation.lastName} (${pendingInvitation.email})`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Resend user invitation - create a new Clerk invitation
 */
export const resendInvitation = mutation({
  args: {
    foundationId: v.id("foundations"),
    pendingInvitationId: v.id("pendingInvitations"),
  },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);
    
    // Get the pending invitation record
    const pendingInvitation = await ctx.db.get(args.pendingInvitationId);
    if (!pendingInvitation) {
      throw new Error("Pending invitation not found");
    }
    
    // Check if invitation belongs to the same foundation
    if (pendingInvitation.foundationId !== args.foundationId) {
      throw new Error("Invitation does not belong to this foundation");
    }
    
    // Check if invitation is still pending
    if (pendingInvitation.status !== "pending") {
      throw new Error("Can only resend pending invitations");
    }
    
    // Get foundation details
    const foundation = await ctx.db.get(args.foundationId);
    if (!foundation) {
      throw new Error("Foundation not found");
    }
    
    try {
      // Create a new Clerk invitation (since you can't resend the same one)
      const { createClerkClient } = await import('@clerk/backend');
      
      const clerkClient = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY!,
        publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
      });
      
      // First revoke the old invitation
      try {
        await clerkClient.invitations.revokeInvitation(
          pendingInvitation.clerkInvitationId
        );
      } catch (revokeError) {
        console.warn(`Failed to revoke old invitation (might be expired):`, revokeError);
      }
      
      // Create a new invitation
      const newInvitation = await clerkClient.invitations.createInvitation({
        emailAddress: pendingInvitation.email,
        redirectUrl: `${process.env.SITE_URL || 'https://theoyinbookefoundation.com'}/sign-up?invitation-accepted=true`,
        publicMetadata: {
          foundationId: pendingInvitation.foundationId,
          role: pendingInvitation.role,
          firstName: pendingInvitation.firstName,
          lastName: pendingInvitation.lastName,
          invitedBy: pendingInvitation.invitedBy,
        },
        notify: true, // Let Clerk send the invitation email
      });
      
      console.log(`New Clerk invitation created with ID: ${newInvitation.id}`);
      
      // Update the pending invitation with new Clerk ID
      await ctx.db.patch(args.pendingInvitationId, {
        clerkInvitationId: newInvitation.id,
        updatedAt: Date.now(),
      });
      
      console.log(`Invitation resent to ${pendingInvitation.email}`);
      
    } catch (error) {
      console.error(`Failed to resend Clerk invitation for ${pendingInvitation.email}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to resend invitation: ${errorMessage}`);
    }
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "invitation_resent",
      entityType: "pendingInvitations",
      entityId: args.pendingInvitationId,
      description: `Resent invitation to ${pendingInvitation.firstName} ${pendingInvitation.lastName} (${pendingInvitation.email})`,
      riskLevel: "low",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Get all pending invitations
 */
export const getPendingInvitations = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);

    // Get pending invitations
    const pendingInvitations = await ctx.db
      .query("pendingInvitations")
      .withIndex("by_status", (q) => 
        q.eq("foundationId", args.foundationId).eq("status", "pending")
      )
      .collect();

    // Get inviter details for each invitation
    const invitationsWithInviter = await Promise.all(
      pendingInvitations.map(async (invitation) => {
        const inviter = await ctx.db.get(invitation.invitedBy);
        return {
          _id: invitation._id,
          clerkInvitationId: invitation.clerkInvitationId,
          email: invitation.email,
          firstName: invitation.firstName,
          lastName: invitation.lastName,
          role: invitation.role,
          status: invitation.status,
          invitedBy: inviter ? `${inviter.firstName} ${inviter.lastName}` : 'Unknown',
          invitationSentAt: invitation.createdAt,
          updatedAt: invitation.updatedAt,
        };
      })
    );

    // Sort by creation date (newest first)
    invitationsWithInviter.sort((a, b) => b.invitationSentAt - a.invitationSentAt);

    return invitationsWithInviter;
  },
});

/**
 * Debug: Get user status by email (for troubleshooting)
 */
export const debugUserStatus = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .collect();

    return users.map(user => ({
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      clerkId: user.clerkId ? "***set***" : "empty",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  },
});

/**
 * Check if an email has a pending Clerk invitation (for sign-in error handling)
 */
export const checkPendingInvitation = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find pending Clerk invitation with this email
    const pendingInvitation = await ctx.db
      .query("pendingInvitations")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .unique();

    if (!pendingInvitation) {
      return null;
    }

    // Check if invitation has expired (Clerk invitations expire after 7 days)
    const daysSinceInvitation = Math.floor((Date.now() - pendingInvitation.createdAt) / (1000 * 60 * 60 * 24));
    const isExpired = daysSinceInvitation > 7;

    const foundation = await ctx.db.get(pendingInvitation.foundationId);

    return {
      hasPendingInvitation: true,
      isExpired,
      firstName: pendingInvitation.firstName,
      lastName: pendingInvitation.lastName,
      role: pendingInvitation.role,
      foundationName: foundation?.name || null,
    };
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
