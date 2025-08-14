// convex/clerk.ts
// Clerk webhook handlers for user management

import { v } from "convex/values";
import { httpAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// Define WebhookEvent type since we don't have @clerk/clerk-sdk-node in Convex
type WebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ email_address: string }>;
    first_name?: string;
    last_name?: string;
    public_metadata?: Record<string, any>;
  };
};

/**
 * Handle Clerk webhooks for user events
 */
export const webhook = httpAction(async (ctx, request) => {
  const payload = await request.text();
  const headers = request.headers;

  try {
    // Verify the webhook signature (in production, you should verify this)
    const svix_id = headers.get("svix-id");
    const svix_timestamp = headers.get("svix-timestamp");
    const svix_signature = headers.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error("Missing Svix headers");
      return new Response("Missing Svix headers", { status: 400 });
    }

    // Parse the webhook payload
    const event: WebhookEvent = JSON.parse(payload);
    
    console.log(`Received Clerk webhook: ${event.type}`);

    switch (event.type) {
      case "user.created":
        await ctx.runMutation(internal.clerk.handleUserCreated, {
          userId: event.data.id,
          email: event.data.email_addresses?.[0]?.email_address || "",
          firstName: event.data.first_name || "",
          lastName: event.data.last_name || "",
          publicMetadata: event.data.public_metadata || {},
        });
        break;

      case "user.updated":
        await ctx.runMutation(internal.clerk.handleUserUpdated, {
          userId: event.data.id,
          email: event.data.email_addresses?.[0]?.email_address || "",
          firstName: event.data.first_name || "",
          lastName: event.data.last_name || "",
          publicMetadata: event.data.public_metadata || {},
        });
        break;

      case "user.deleted":
        await ctx.runMutation(internal.clerk.handleUserDeleted, {
          userId: event.data.id || "",
        });
        break;

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return new Response("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response("Webhook error", { status: 500 });
  }
});

/**
 * Handle user creation from Clerk
 */
export const handleUserCreated = internalMutation({
  args: {
    userId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    publicMetadata: v.any(),
  },
  handler: async (ctx, args) => {
    console.log(`Processing user creation for ${args.email} (Clerk ID: ${args.userId})`);

    // Check if we have a pending invitation for this email
    const pendingInvitation = await ctx.db
      .query("pendingInvitations")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (!pendingInvitation) {
      console.log(`No pending invitation found for ${args.email}, creating basic user record`);
      
      // Create a basic user record (might be a direct sign-up)
      const userId = await ctx.db.insert("users", {
        clerkId: args.userId,
        foundationId: undefined, // No foundation assignment
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        role: "beneficiary", // Default role for direct signups
        isActive: true,
        lastLogin: Date.now(),
        communicationPreferences: {
          emailNotifications: true,
          smsNotifications: true,
          academicAlerts: true,
          financialAlerts: true,
          administrativeNotifications: true,
          marketingCommunications: false,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      console.log(`Created basic user record for ${args.email}: ${userId}`);
      return;
    }

    console.log(`Found pending invitation for ${args.email}, creating full user record`);

    // Use invitation metadata if available, otherwise use webhook data
    const metadata = args.publicMetadata as any;
    const foundationId = metadata?.foundationId || pendingInvitation.foundationId;
    const role = metadata?.role || pendingInvitation.role;
    const firstName = metadata?.firstName || args.firstName || pendingInvitation.firstName;
    const lastName = metadata?.lastName || args.lastName || pendingInvitation.lastName;

    // Create the user record with invitation details
    const userId = await ctx.db.insert("users", {
      clerkId: args.userId,
      foundationId: foundationId,
      email: args.email,
      firstName: firstName,
      lastName: lastName,
      role: role as any,
      isActive: true,
      lastLogin: Date.now(),
      communicationPreferences: {
        emailNotifications: true,
        smsNotifications: true,
        academicAlerts: true,
        financialAlerts: true,
        administrativeNotifications: true,
        marketingCommunications: false,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update the pending invitation
    await ctx.db.patch(pendingInvitation._id, {
      status: "accepted",
      acceptedAt: Date.now(),
      createdUserId: userId,
      updatedAt: Date.now(),
    });

    // Create audit log
    if (foundationId) {
      await ctx.db.insert("auditLogs", {
        foundationId: foundationId,
        userId: userId,
        userEmail: args.email,
        userRole: role as any,
        action: "user_account_created",
        entityType: "users",
        entityId: userId,
        description: `User account created via invitation acceptance`,
        riskLevel: "low",
        createdAt: Date.now(),
      });
    }

    // Send welcome notification
    if (foundationId) {
      await ctx.scheduler.runAfter(0, internal.notifications.sendNewUserWelcomeEmail, {
        foundationId: foundationId,
        userEmail: args.email,
        userName: `${firstName} ${lastName}`,
        userRole: role,
      });
    }

    console.log(`Created user record for ${args.email}: ${userId}, updated pending invitation`);
  },
});

/**
 * Handle user updates from Clerk
 */
export const handleUserUpdated = internalMutation({
  args: {
    userId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    publicMetadata: v.any(),
  },
  handler: async (ctx, args) => {
    console.log(`Processing user update for ${args.email} (Clerk ID: ${args.userId})`);

    // Find the user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.userId))
      .unique();

    if (!user) {
      console.log(`User not found for Clerk ID: ${args.userId}`);
      return;
    }

    // Update user record
    await ctx.db.patch(user._id, {
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      updatedAt: Date.now(),
    });

    console.log(`Updated user record for ${args.email}`);
  },
});

/**
 * Handle user deletion from Clerk
 */
export const handleUserDeleted = internalMutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`Processing user deletion for Clerk ID: ${args.userId}`);

    // Find the user by Clerk ID
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.userId))
      .unique();

    if (!user) {
      console.log(`User not found for deletion: ${args.userId}`);
      return;
    }

    // Deactivate the user instead of deleting (preserve data integrity)
    await ctx.db.patch(user._id, {
      isActive: false,
      updatedAt: Date.now(),
    });

    // Create audit log if user belongs to a foundation
    if (user.foundationId) {
      await ctx.db.insert("auditLogs", {
        foundationId: user.foundationId,
        userId: user._id,
        userEmail: user.email,
        userRole: user.role,
        action: "user_account_deleted",
        entityType: "users",
        entityId: user._id,
        description: `User account deleted in Clerk`,
        riskLevel: "high",
        createdAt: Date.now(),
      });
    }

    console.log(`Deactivated user account for Clerk ID: ${args.userId}`);
  },
});