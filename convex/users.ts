import { v } from "convex/values";
import { mutation, query, action, internalQuery, internalMutation } from "./_generated/server";
import { authenticateAndAuthorize } from "./auth";
import { internal } from "./_generated/api";
import { createClerkClient } from "@clerk/backend";

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
 * Check if user profile is complete based on role
 */
export const checkProfileCompletion = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Required fields for all users - add to requiredFields list
    const requiredFields: string[] = ["First Name", "Last Name", "Email", "Phone Number"];
    const missingFields: string[] = [];

    // Check basic fields
    if (!user.firstName) missingFields.push("First Name");
    if (!user.lastName) missingFields.push("Last Name");
    if (!user.email) missingFields.push("Email");
    if (!user.phone) missingFields.push("Phone Number");

    const basicFieldsComplete = !!(
      user.firstName &&
      user.lastName &&
      user.email &&
      user.phone
    );

    // Role-specific requirements
    let roleSpecificComplete = true;

    if (user.role === "beneficiary") {
      // Add beneficiary-specific required fields
      requiredFields.push(
        "Date of Birth",
        "Gender", 
        "Street Address",
        "City",
        "State",
        "Current Academic Level",
        "Current School"
      );

      // Check beneficiary-specific fields
      if (!user.profile?.dateOfBirth) missingFields.push("Date of Birth");
      if (!user.profile?.gender) missingFields.push("Gender");
      if (!user.profile?.address?.street) missingFields.push("Street Address");
      if (!user.profile?.address?.city) missingFields.push("City");
      if (!user.profile?.address?.state) missingFields.push("State");
      if (!user.profile?.beneficiaryInfo?.currentLevel) missingFields.push("Current Academic Level");
      if (!user.profile?.beneficiaryInfo?.currentSchool) missingFields.push("Current School");

      roleSpecificComplete = !!(
        user.profile?.dateOfBirth && 
        user.profile?.gender && 
        user.profile?.address?.street &&
        user.profile?.address?.city &&
        user.profile?.address?.state &&
        user.profile?.beneficiaryInfo?.currentLevel &&
        user.profile?.beneficiaryInfo?.currentSchool
      );
    }

    if (user.role === "guardian") {
      // Add guardian-specific required fields
      requiredFields.push(
        "Date of Birth",
        "Gender", 
        "Street Address",
        "City",
        "State"
      );

      // Check guardian-specific fields
      if (!user.profile?.dateOfBirth) missingFields.push("Date of Birth");
      if (!user.profile?.gender) missingFields.push("Gender");
      if (!user.profile?.address?.street) missingFields.push("Street Address");
      if (!user.profile?.address?.city) missingFields.push("City");
      if (!user.profile?.address?.state) missingFields.push("State");

      roleSpecificComplete = !!(
        user.profile?.dateOfBirth && 
        user.profile?.gender && 
        user.profile?.address?.street &&
        user.profile?.address?.city &&
        user.profile?.address?.state
      );
    }

    const isComplete = basicFieldsComplete && roleSpecificComplete;
    
    // Calculate percentage correctly
    const completedFields = requiredFields.length - missingFields.length;
    const completionPercentage = requiredFields.length > 0 
      ? Math.max(0, Math.round((completedFields / requiredFields.length) * 100))
      : 0;

    return {
      isComplete,
      basicFieldsComplete,
      roleSpecificComplete,
      requiredFields,
      missingFields,
      completionPercentage,
    };
  },
});

/**
 * Complete profile setup for new users
 */
export const completeProfileSetup = mutation({
  args: {
    userId: v.id("users"),
    phone: v.string(),
    profile: v.object({
      middleName: v.optional(v.string()),
      dateOfBirth: v.string(),
      gender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
      address: v.object({
        street: v.string(),
        city: v.string(),
        state: v.string(),
        country: v.string(),
        postalCode: v.optional(v.string()),
      }),
      beneficiaryInfo: v.optional(v.object({
        currentLevel: v.string(),
        currentSchool: v.string(),
        hasRepeatedClass: v.optional(v.boolean()),
        specialNeeds: v.optional(v.string()),
        emergencyContact: v.optional(v.object({
          name: v.string(),
          relationship: v.string(),
          phone: v.string(),
        })),
      })),
      guardianInfo: v.optional(v.object({
        occupation: v.optional(v.string()),
        relationship: v.optional(v.string()),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Authenticate current user
    const currentUser = await authenticateAndAuthorize(
      ctx,
      user.foundationId ?? null,
      ["super_admin", "admin", "reviewer", "beneficiary", "guardian"]
    );

    // Users can update their own profile or admins can update any user
    if (
      currentUser._id !== args.userId &&
      currentUser.role !== "admin" &&
      currentUser.role !== "super_admin"
    ) {
      throw new Error("Access denied");
    }

    // Update user profile
    await ctx.db.patch(args.userId, {
      phone: args.phone,
      profile: args.profile,
      profileCompleted: true,
      profileCompletedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log if user has a foundation
    if (user.foundationId) {
      await ctx.db.insert("auditLogs", {
        foundationId: user.foundationId,
        userId: currentUser._id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        action: "profile_completed",
        entityType: "users",
        entityId: args.userId,
        description: `Completed profile setup for ${user.firstName} ${user.lastName}`,
        riskLevel: "low",
        createdAt: Date.now(),
      });
    }

    return { success: true };
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
    profile: v.optional(v.object({
      middleName: v.optional(v.string()),
      dateOfBirth: v.optional(v.string()),
      gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"))),
      profileImageUrl: v.optional(v.string()),
      bio: v.optional(v.string()),
      address: v.optional(v.object({
        street: v.string(),
        city: v.string(),
        state: v.string(),
        country: v.string(),
        postalCode: v.optional(v.string()),
      })),
      beneficiaryInfo: v.optional(v.object({
        currentLevel: v.optional(v.string()),
        currentSchool: v.optional(v.string()),
        hasRepeatedClass: v.optional(v.boolean()),
        specialNeeds: v.optional(v.string()),
        emergencyContact: v.optional(v.object({
          name: v.string(),
          relationship: v.string(),
          phone: v.string(),
        })),
      })),
      guardianInfo: v.optional(v.object({
        occupation: v.optional(v.string()),
        relationship: v.optional(v.string()),
      })),
    })),
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
export const createInvitation = action({
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
  handler: async (ctx, args): Promise<{ 
    success: boolean; 
    clerkInvitationId: string;
    pendingInvitationId: string;
  }> => {
    // Use runQuery and runMutation for database operations in actions
    const currentUser: any = await ctx.runQuery(internal.auth.getCurrentUserWithAuth, {
      foundationId: args.foundationId,
      requiredRoles: ["admin", "super_admin"]
    });
    
    if (!currentUser) {
      throw new Error("Unauthorized: Admin access required");
    }
    
    // Check if user already exists in any foundation (global check)
    const existingUser = await ctx.runQuery(internal.users.getUserByEmail, {
      email: args.email
    });
    
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
    const foundation = await ctx.runQuery(internal.users.getFoundationById, {
      foundationId: args.foundationId
    });
    if (!foundation) {
      throw new Error("Foundation not found");
    }
    
    // Create invitation using Clerk's Backend API
    console.log(`Creating Clerk invitation for ${args.email}...`);
    
    try {
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
      const result: any = await ctx.runMutation(internal.users.storePendingInvitation, {
        clerkInvitationId: invitation.id,
        foundationId: args.foundationId,
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        role: args.role,
        invitedBy: args.invitedBy,
        inviterInfo: {
          id: currentUser._id,
          email: currentUser.email,
          role: currentUser.role
        }
      });
      
      console.log(`Invitation created successfully for ${args.email} (role: ${args.role})`);
      
      return { 
        success: true, 
        clerkInvitationId: invitation.id,
        pendingInvitationId: result.pendingInvitationId
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
export const revokeInvitation = action({
  args: {
    foundationId: v.id("foundations"),
    pendingInvitationId: v.id("pendingInvitations"),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const currentUser: any = await ctx.runQuery(internal.auth.getCurrentUserWithAuth, {
      foundationId: args.foundationId,
      requiredRoles: ["admin", "super_admin"]
    });
    
    if (!currentUser) {
      throw new Error("Unauthorized: Admin access required");
    }
    
    // Get the pending invitation record
    const pendingInvitation = await ctx.runQuery(internal.users.getPendingInvitationById, {
      pendingInvitationId: args.pendingInvitationId
    });
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
    
    // Update the pending invitation status and create audit log
    await ctx.runMutation(internal.users.updatePendingInvitationStatus, {
      pendingInvitationId: args.pendingInvitationId,
      status: "revoked",
      auditInfo: {
        foundationId: args.foundationId,
        userId: currentUser._id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        action: "invitation_revoked",
        description: `Revoked invitation for ${pendingInvitation.firstName} ${pendingInvitation.lastName} (${pendingInvitation.email})`
      }
    });
    
    console.log(`Invitation revoked for ${pendingInvitation.email}`);
    
    return { success: true };
  },
});

/**
 * Resend user invitation - create a new Clerk invitation
 */
export const resendInvitation = action({
  args: {
    foundationId: v.id("foundations"),
    pendingInvitationId: v.id("pendingInvitations"),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    const currentUser: any = await ctx.runQuery(internal.auth.getCurrentUserWithAuth, {
      foundationId: args.foundationId,
      requiredRoles: ["admin", "super_admin"]
    });
    
    if (!currentUser) {
      throw new Error("Unauthorized: Admin access required");
    }
    
    // Get the pending invitation record
    const pendingInvitation = await ctx.runQuery(internal.users.getPendingInvitationById, {
      pendingInvitationId: args.pendingInvitationId
    });
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
    const foundation = await ctx.runQuery(internal.users.getFoundationById, {
      foundationId: args.foundationId
    });
    if (!foundation) {
      throw new Error("Foundation not found");
    }
    
    try {
      // Create a new Clerk invitation (since you can't resend the same one)
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
      
      // Update the pending invitation with new Clerk ID and create audit log
      await ctx.runMutation(internal.users.updatePendingInvitationWithNewClerkId, {
        pendingInvitationId: args.pendingInvitationId,
        clerkInvitationId: newInvitation.id,
        auditInfo: {
          foundationId: args.foundationId,
          userId: currentUser._id,
          userEmail: currentUser.email,
          userRole: currentUser.role,
          action: "invitation_resent",
          description: `Resent invitation to ${pendingInvitation.firstName} ${pendingInvitation.lastName} (${pendingInvitation.email})`
        }
      });
      
      console.log(`Invitation resent to ${pendingInvitation.email}`);
      
    } catch (error) {
      console.error(`Failed to resend Clerk invitation for ${pendingInvitation.email}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to resend invitation: ${errorMessage}`);
    }
    
    return { success: true };
  },
});

/**
 * Internal: Update pending invitation with new Clerk ID
 */
export const updatePendingInvitationWithNewClerkId = internalMutation({
  args: {
    pendingInvitationId: v.id("pendingInvitations"),
    clerkInvitationId: v.string(),
    auditInfo: v.object({
      foundationId: v.id("foundations"),
      userId: v.id("users"),
      userEmail: v.string(),
      userRole: v.string(),
      action: v.string(),
      description: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    // Update the pending invitation
    await ctx.db.patch(args.pendingInvitationId, {
      clerkInvitationId: args.clerkInvitationId,
      updatedAt: Date.now(),
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.auditInfo.foundationId,
      userId: args.auditInfo.userId,
      userEmail: args.auditInfo.userEmail,
      userRole: args.auditInfo.userRole as any,
      action: args.auditInfo.action,
      entityType: "pendingInvitations",
      entityId: args.pendingInvitationId,
      description: args.auditInfo.description,
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
 * Check if user can submit applications (profile must be complete)
 */
export const canSubmitApplications = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { canSubmit: false, reason: "User not found" };
    }

    // Only beneficiaries can submit applications
    if (user.role !== "beneficiary") {
      return { canSubmit: false, reason: "Only beneficiaries can submit applications" };
    }

    // Check if user is active
    if (!user.isActive) {
      return { canSubmit: false, reason: "User account is not active" };
    }

    // Check if profile is complete
    if (!user.profileCompleted) {
      return { 
        canSubmit: false, 
        reason: "Profile must be completed before submitting applications",
        actionRequired: "complete_profile"
      };
    }

    // Check required profile fields for beneficiaries
    const requiredFieldsComplete = !!(
      user.firstName &&
      user.lastName &&
      user.email &&
      user.phone &&
      user.profile?.dateOfBirth &&
      user.profile?.gender &&
      user.profile?.address?.street &&
      user.profile?.address?.city &&
      user.profile?.address?.state &&
      user.profile?.beneficiaryInfo?.currentLevel &&
      user.profile?.beneficiaryInfo?.currentSchool
    );

    if (!requiredFieldsComplete) {
      return { 
        canSubmit: false, 
        reason: "Complete profile information is required",
        actionRequired: "complete_profile"
      };
    }

    return { 
      canSubmit: true, 
      reason: "All requirements met" 
    };
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

// ===================================
// INTERNAL HELPER FUNCTIONS FOR ACTIONS
// ===================================

/**
 * Internal: Get user by email
 */
export const getUserByEmail = internalQuery({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

/**
 * Internal: Get foundation by ID (for use in actions)
 */
export const getFoundationById = internalQuery({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.foundationId);
  },
});

/**
 * Internal: Store pending invitation
 */
export const storePendingInvitation = internalMutation({
  args: {
    clerkInvitationId: v.string(),
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
    inviterInfo: v.object({
      id: v.id("users"),
      email: v.string(),
      role: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    // Store pending invitation record for tracking
    const pendingInvitationId = await ctx.db.insert("pendingInvitations", {
      clerkInvitationId: args.clerkInvitationId,
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
      userId: args.inviterInfo.id,
      userEmail: args.inviterInfo.email,
      userRole: args.inviterInfo.role as any,
      action: "user_invited",
      entityType: "pendingInvitations",
      entityId: pendingInvitationId,
      description: `Invited ${args.firstName} ${args.lastName} (${args.email}) as ${args.role} via Clerk`,
      riskLevel: args.role === "admin" ? "high" : "low",
      createdAt: Date.now(),
    });

    return { pendingInvitationId };
  },
});

/**
 * Internal: Get pending invitation by ID
 */
export const getPendingInvitationById = internalQuery({
  args: {
    pendingInvitationId: v.id("pendingInvitations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.pendingInvitationId);
  },
});

/**
 * Internal: Update pending invitation status with audit log
 */
export const updatePendingInvitationStatus = internalMutation({
  args: {
    pendingInvitationId: v.id("pendingInvitations"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("expired"),
      v.literal("revoked")
    ),
    auditInfo: v.object({
      foundationId: v.id("foundations"),
      userId: v.id("users"),
      userEmail: v.string(),
      userRole: v.string(),
      action: v.string(),
      description: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    // Update the pending invitation status
    await ctx.db.patch(args.pendingInvitationId, {
      status: args.status,
      updatedAt: Date.now(),
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.auditInfo.foundationId,
      userId: args.auditInfo.userId,
      userEmail: args.auditInfo.userEmail,
      userRole: args.auditInfo.userRole as any,
      action: args.auditInfo.action,
      entityType: "pendingInvitations",
      entityId: args.pendingInvitationId,
      description: args.auditInfo.description,
      riskLevel: "medium",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});
