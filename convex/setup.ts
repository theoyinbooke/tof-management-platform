import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Setup function to create the initial admin user
 * This should be called once to bootstrap the system
 */
export const createInitialAdmin = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      // Update existing user to be super admin
      await ctx.db.patch(existingUser._id, {
        role: "super_admin",
        updatedAt: Date.now(),
      });
      return { success: true, message: "Updated existing user to super_admin", userId: existingUser._id };
    }

    // Check if this is truly the first user in the system
    const userCount = await ctx.db.query("users").collect();
    const isFirstUser = userCount.length === 0;

    // Create default foundation if this is the first user
    let foundationId = null;
    
    if (isFirstUser) {
      foundationId = await ctx.db.insert("foundations", {
        name: "TheOyinbooke Foundation",
        description: "Educational support foundation management system",
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
      // Find the first active foundation
      const firstFoundation = await ctx.db
        .query("foundations")
        .filter((q) => q.eq(q.field("isActive"), true))
        .first();
      foundationId = firstFoundation?._id || null;
    }

    // Create the super admin user
    const userInsert: any = {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      role: "super_admin",
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    if (foundationId) {
      userInsert.foundationId = foundationId;
    }
    
    const userId = await ctx.db.insert("users", userInsert);

    // Create audit log for the super admin creation
    if (foundationId) {
      await ctx.db.insert("auditLogs", {
        foundationId,
        userId,
        userEmail: args.email,
        userRole: "super_admin",
        action: "super_admin_created",
        entityType: "users",
        entityId: userId,
        description: `Super admin account created for ${args.firstName} ${args.lastName}`,
        riskLevel: "critical",
        createdAt: Date.now(),
      });
    }

    return { 
      success: true, 
      message: "Created super admin user successfully", 
      userId,
      foundationId 
    };
  },
});

/**
 * Function to get user information by Clerk ID
 * Useful for debugging and verification
 */
export const getUserByClerkId = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) {
      return { found: false, message: "User not found" };
    }

    let foundation = null;
    if (user.foundationId) {
      foundation = await ctx.db.get(user.foundationId);
    }

    return {
      found: true,
      user: {
        ...user,
        foundation,
      },
    };
  },
});