import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Enhanced function to get current user and create if needed
 * This ensures users are automatically created on first authentication
 */
export const getCurrentUserOrCreate = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // First, try to get existing user
    let user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    // If user doesn't exist, create them
    if (!user) {
      console.log(`Creating new user for Clerk ID: ${args.clerkId}`);
      
      try {
        // Check if this is the first user in the system
        const userCount = await ctx.db.query("users").collect();
        const isFirstUser = userCount.length === 0;

      // Create or find foundation
      let foundationId: Id<"foundations"> | null = null;
      
      if (isFirstUser) {
        // Create default foundation for first user
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
        // Find first active foundation
        const firstFoundation = await ctx.db
          .query("foundations")
          .filter((q) => q.eq(q.field("isActive"), true))
          .first();
        foundationId = firstFoundation?._id || null;
      }

      // Special handling: if email matches admin email, make them super_admin
      const isAdminEmail = args.email === "horllsey@gmail.com";
      
      // Create user record
      const userInsert: any = {
        clerkId: args.clerkId,
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        role: isFirstUser || isAdminEmail ? "super_admin" : "beneficiary",
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
        if (foundationId) {
          userInsert.foundationId = foundationId;
        }
        
        const userId = await ctx.db.insert("users", userInsert);

        // Create audit log
        if (foundationId) {
          await ctx.db.insert("auditLogs", {
            foundationId,
            userId,
            userEmail: args.email,
            userRole: userInsert.role,
            action: "user_created",
            entityType: "users",
            entityId: userId,
            description: `New user account created for ${args.firstName} ${args.lastName}`,
            riskLevel: isFirstUser || isAdminEmail ? "critical" : "low",
            createdAt: Date.now(),
          });
        }

        // Fetch the created user
        user = await ctx.db.get(userId);
      } catch (error) {
        console.log(`User creation failed, possibly due to race condition. Trying to fetch existing user for: ${args.clerkId}`);
        // If creation failed (possibly due to race condition), try to get the user again
        user = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
          .unique();
      }
    }

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