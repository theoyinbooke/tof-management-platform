import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authenticateAndAuthorize } from "./auth";
import { internal } from "./_generated/api";

/**
 * Generate invitation email content
 */
function generateInvitationEmailContent(data: {
  inviteeName: string;
  inviterName: string;
  role: string;
  foundationName: string;
  signUpUrl: string;
  expiresInDays?: number;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #16a34a; color: white; padding: 20px; text-align: center;">
        <h1>You're Invited!</h1>
        <p>TheOyinbooke Foundation Management Platform</p>
      </div>
      
      <div style="padding: 30px; background-color: #f9fafb;">
        <h2>Dear ${data.inviteeName},</h2>
        
        <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.foundationName}</strong> as a <strong>${data.role}</strong>.</p>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h3 style="margin-top: 0; color: #16a34a;">Your Role: ${data.role.replace('_', ' ').toUpperCase()}</h3>
          <p>You'll have access to the foundation's management platform where you can:</p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${data.role === 'admin' ? `
              <li>Manage beneficiaries and applications</li>
              <li>Review financial records</li>
              <li>Oversee programs and activities</li>
              <li>Generate reports and analytics</li>
            ` : data.role === 'reviewer' ? `
              <li>Review scholarship applications</li>
              <li>Evaluate beneficiary documents</li>
              <li>Provide assessment feedback</li>
              <li>Track review progress</li>
            ` : data.role === 'beneficiary' ? `
              <li>Access your student portal</li>
              <li>View financial support details</li>
              <li>Track academic progress</li>
              <li>Participate in programs</li>
            ` : data.role === 'guardian' ? `
              <li>Monitor your child's progress</li>
              <li>View financial statements</li>
              <li>Communicate with foundation staff</li>
              <li>Access important updates</li>
            ` : `
              <li>Access the foundation platform</li>
              <li>Collaborate with the team</li>
              <li>Contribute to the mission</li>
            `}
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.signUpUrl}" style="background-color: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">
            Accept Invitation & Sign Up
          </a>
        </div>
        
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>⏰ Important:</strong> This invitation ${data.expiresInDays ? `expires in ${data.expiresInDays} days` : 'expires soon'}. Please accept it as soon as possible.
          </p>
        </div>
        
        <p style="font-size: 14px; color: #6b7280;">
          If you have any questions about this invitation or need assistance with the sign-up process, please don't hesitate to contact us.
        </p>
        
        <p>We look forward to having you as part of our team!</p>
        
        <p>Best regards,<br>
        <strong>${data.inviterName}</strong><br>
        ${data.foundationName}</p>
      </div>
      
      <div style="background-color: #374151; color: white; padding: 20px; text-align: center; font-size: 12px;">
        <p>© 2024 TheOyinbooke Foundation. All rights reserved.</p>
        <p>If you did not expect this invitation, you can safely ignore this email.</p>
        <p style="margin-top: 10px; color: #9ca3af;">
          Invitation link: <span style="font-family: monospace; font-size: 11px;">${data.signUpUrl}</span>
        </p>
      </div>
    </div>
  `;
}

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
    
    // Create invitation record (you might want to add an invitations table)
    // Generate secure invitation token
    const invitationToken = crypto.randomUUID();
    const invitationExpiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    // Create pending user record with invitation token
    const userId = await ctx.db.insert("users", {
      clerkId: "", // Will be filled when they accept invitation
      foundationId: args.foundationId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      role: args.role,
      isActive: false, // Inactive until they accept invitation
      invitationToken,
      invitationExpiresAt,
      invitedBy: args.invitedBy,
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
    
    // Get foundation details for email
    const foundation = await ctx.db.get(args.foundationId);
    if (!foundation) {
      throw new Error("Foundation not found");
    }
    
    // Get inviter details
    const inviter = await ctx.db.get(args.invitedBy);
    if (!inviter) {
      throw new Error("Inviter not found");
    }
    
    // Send invitation email
    console.log(`Attempting to send invitation email to ${args.email} for foundation ${foundation.name}`);
    
    try {
      const emailContent = generateInvitationEmailContent({
        inviteeName: `${args.firstName} ${args.lastName}`,
        inviterName: `${inviter.firstName} ${inviter.lastName}`,
        role: args.role,
        foundationName: foundation.name,
        signUpUrl: `${process.env.SITE_URL || 'https://theoyinbookefoundation.com'}/accept-invitation?token=${invitationToken}`,
        expiresInDays: 7,
      });
      
      console.log(`Generated email content for ${args.email}, scheduling email send...`);
      
      await ctx.scheduler.runAfter(0, internal.communications.sendEmail, {
        foundationId: args.foundationId,
        to: args.email,
        subject: `You're invited to join ${foundation.name}`,
        content: emailContent,
        priority: "normal",
        templateData: {
          inviteeName: `${args.firstName} ${args.lastName}`,
          inviterName: `${inviter.firstName} ${inviter.lastName}`,
          role: args.role,
          foundationName: foundation.name,
        },
      });
      
      console.log(`Invitation email scheduled successfully for ${args.email} (role: ${args.role})`);
    } catch (error) {
      console.error(`Failed to send invitation email to ${args.email}:`, error);
      // Don't throw error - user record is already created
    }
    
    return { success: true, userId };
  },
});

/**
 * Revoke user invitation
 */
export const revokeInvitation = mutation({
  args: {
    foundationId: v.id("foundations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);
    
    // Get the user record to revoke
    const userToRevoke = await ctx.db.get(args.userId);
    if (!userToRevoke) {
      throw new Error("User not found");
    }
    
    // Check if user belongs to the same foundation
    if (userToRevoke.foundationId !== args.foundationId) {
      throw new Error("User does not belong to this foundation");
    }
    
    // Check if this is actually an invitation (user has no clerkId and is inactive)
    if (userToRevoke.clerkId || userToRevoke.isActive) {
      throw new Error("Cannot revoke invitation - user has already activated their account");
    }
    
    // Delete the user record (this revokes the invitation)
    await ctx.db.delete(args.userId);
    
    console.log(`Invitation revoked: Deleted user record for ${userToRevoke.email} (ID: ${args.userId})`);
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "invitation_revoked",
      entityType: "users",
      entityId: args.userId,
      description: `Revoked invitation for ${userToRevoke.firstName} ${userToRevoke.lastName} (${userToRevoke.email})`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Resend user invitation
 */
export const resendInvitation = mutation({
  args: {
    foundationId: v.id("foundations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);
    
    // Get the user record to resend invitation to
    const userToResend = await ctx.db.get(args.userId);
    if (!userToResend) {
      throw new Error("User not found");
    }
    
    // Check if user belongs to the same foundation
    if (userToResend.foundationId !== args.foundationId) {
      throw new Error("User does not belong to this foundation");
    }
    
    // Check if this is actually an invitation (user has no clerkId and is inactive)
    if (userToResend.clerkId || userToResend.isActive) {
      throw new Error("Cannot resend invitation - user has already activated their account");
    }
    
    // Generate new invitation token and extend expiration
    const newInvitationToken = crypto.randomUUID();
    const newExpiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    // Update user with new token
    await ctx.db.patch(args.userId, {
      invitationToken: newInvitationToken,
      invitationExpiresAt: newExpiresAt,
      updatedAt: Date.now(),
    });
    
    // Get foundation details for email
    const foundation = await ctx.db.get(args.foundationId);
    if (!foundation) {
      throw new Error("Foundation not found");
    }
    
    // Get inviter details (current user)
    const inviter = currentUser;
    
    // Resend invitation email
    try {
      await ctx.scheduler.runAfter(0, internal.communications.sendEmail, {
        foundationId: args.foundationId,
        to: userToResend.email,
        subject: `You're invited to join ${foundation.name} (Resent)`,
        content: generateInvitationEmailContent({
          inviteeName: `${userToResend.firstName} ${userToResend.lastName}`,
          inviterName: `${inviter.firstName} ${inviter.lastName}`,
          role: userToResend.role,
          foundationName: foundation.name,
          signUpUrl: `${process.env.SITE_URL || 'https://theoyinbookefoundation.com'}/accept-invitation?token=${newInvitationToken}`,
          expiresInDays: 7,
        }),
        templateData: {
          inviteeName: `${userToResend.firstName} ${userToResend.lastName}`,
          inviterName: `${inviter.firstName} ${inviter.lastName}`,
          role: userToResend.role,
          foundationName: foundation.name,
        },
      });
      
      console.log(`Invitation email resent to ${userToResend.email} for role ${userToResend.role}`);
    } catch (error) {
      console.error(`Failed to resend invitation email to ${userToResend.email}:`, error);
      throw new Error("Failed to resend invitation email");
    }
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: currentUser._id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "invitation_resent",
      entityType: "users",
      entityId: args.userId,
      description: `Resent invitation to ${userToResend.firstName} ${userToResend.lastName} (${userToResend.email})`,
      riskLevel: "low",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Get all users with incomplete invitations (have invitation token but no Clerk account)
 */
export const getIncompleteInvitations = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    const currentUser = await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);

    // Find users who have invitation tokens but no Clerk ID (incomplete registrations)
    const incompleteUsers = await ctx.db
      .query("users")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), false),
          q.eq(q.field("clerkId"), ""),
          q.neq(q.field("invitationToken"), undefined)
        )
      )
      .collect();

    return incompleteUsers.map(user => ({
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      invitationSentAt: user.createdAt,
      invitationExpiresAt: user.invitationExpiresAt,
      invitationToken: user.invitationToken,
    }));
  },
});

/**
 * Check if an email has a pending invitation (for sign-in error handling)
 */
export const checkPendingInvitation = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user with this email who has an incomplete invitation
    const pendingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .filter((q) => 
        q.and(
          q.eq(q.field("isActive"), false),
          q.eq(q.field("clerkId"), ""),
          q.neq(q.field("invitationToken"), undefined)
        )
      )
      .unique();

    if (!pendingUser) {
      return null;
    }

    // Check if invitation has expired
    const isExpired = pendingUser.invitationExpiresAt && pendingUser.invitationExpiresAt < Date.now();

    return {
      hasPendingInvitation: true,
      isExpired,
      firstName: pendingUser.firstName,
      lastName: pendingUser.lastName,
      role: pendingUser.role,
      foundationName: pendingUser.foundationId ? 
        (await ctx.db.get(pendingUser.foundationId))?.name : null,
      // Don't return the actual token for security
    };
  },
});

/**
 * Validate invitation token and get user details
 */
export const validateInvitationToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_invitation_token", (q) => q.eq("invitationToken", args.token))
      .unique();

    if (!user) {
      return null; // Return null instead of throwing error
    }

    // Check if token is expired
    if (user.invitationExpiresAt && user.invitationExpiresAt < Date.now()) {
      return null; // Return null instead of throwing error
    }

    // Check if invitation was already accepted
    if (user.invitationAcceptedAt) {
      return null; // Return null instead of throwing error
    }

    // Check if user is already active
    if (user.isActive && user.clerkId) {
      return null; // Return null instead of throwing error
    }

    // Get foundation details
    const foundation = await ctx.db.get(user.foundationId!);
    
    return {
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      foundation: foundation ? {
        _id: foundation._id,
        name: foundation.name,
      } : null,
    };
  },
});

/**
 * Accept invitation and activate account
 */
export const acceptInvitation = mutation({
  args: {
    token: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_invitation_token", (q) => q.eq("invitationToken", args.token))
      .unique();

    if (!user) {
      throw new Error("Invalid invitation token");
    }

    // Check if token is expired
    if (user.invitationExpiresAt && user.invitationExpiresAt < Date.now()) {
      throw new Error("Invitation has expired");
    }

    // Check if invitation was already accepted
    if (user.invitationAcceptedAt) {
      throw new Error("Invitation has already been accepted");
    }

    // Update user record
    await ctx.db.patch(user._id, {
      clerkId: args.clerkId,
      isActive: true,
      invitationAcceptedAt: Date.now(),
      lastLogin: Date.now(),
      invitationToken: undefined, // Clear the token
      updatedAt: Date.now(),
      
      // Set default communication preferences
      communicationPreferences: {
        emailNotifications: true,
        smsNotifications: true,
        academicAlerts: true,
        financialAlerts: true,
        administrativeNotifications: true,
        marketingCommunications: false,
      },
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: user.foundationId!,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "invitation_accepted",
      entityType: "users",
      entityId: user._id,
      description: `User accepted invitation and activated account`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    // Send welcome email
    const foundation = await ctx.db.get(user.foundationId!);
    if (foundation) {
      await ctx.scheduler.runAfter(0, internal.notifications.sendNewUserWelcomeEmail, {
        foundationId: user.foundationId!,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        userRole: user.role,
      });
    }

    return { 
      success: true,
      user: {
        _id: user._id,
        foundationId: user.foundationId,
        role: user.role,
      }
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
