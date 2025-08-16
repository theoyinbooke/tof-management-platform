// convex/resources.ts
// Resources management functions

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { authenticateAndAuthorize } from "./auth";

// Get all resources for a foundation (with filters)
export const getResources = query({
  args: {
    foundationId: v.id("foundations"),
    filters: v.optional(v.object({
      resourceType: v.optional(v.string()),
      category: v.optional(v.string()),
      academicLevel: v.optional(v.id("academicLevels")),
      isPublished: v.optional(v.boolean()),
      search: v.optional(v.string()),
    }))
  },
  handler: async (ctx, args) => {
    // Authenticate user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.foundationId !== args.foundationId) {
      return null;
    }

    // Build base query
    let query = ctx.db
      .query("resources")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));

    const results = await query.collect();

    // Apply filters
    let filteredResults = results;

    if (args.filters?.resourceType) {
      filteredResults = filteredResults.filter(r => r.resourceType === args.filters!.resourceType);
    }

    if (args.filters?.isPublished !== undefined) {
      filteredResults = filteredResults.filter(r => r.isPublished === args.filters!.isPublished);
    }

    if (args.filters?.search) {
      const searchTerm = args.filters.search.toLowerCase();
      filteredResults = filteredResults.filter(r => 
        r.title.toLowerCase().includes(searchTerm) ||
        r.description.toLowerCase().includes(searchTerm) ||
        r.categories.some(cat => cat.toLowerCase().includes(searchTerm))
      );
    }

    if (args.filters?.category) {
      filteredResults = filteredResults.filter(r => 
        r.categories.includes(args.filters!.category!)
      );
    }

    if (args.filters?.academicLevel) {
      filteredResults = filteredResults.filter(r => 
        r.academicLevels.includes(args.filters!.academicLevel!)
      );
    }

    // For non-admin users, only show published resources
    if (user.role !== "admin" && user.role !== "super_admin") {
      filteredResults = filteredResults.filter(r => r.isPublished);
    }

    // Sort by creation date (newest first)
    return filteredResults.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get a single resource by ID
export const getResource = query({
  args: {
    resourceId: v.id("resources"),
    foundationId: v.id("foundations")
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.foundationId !== args.foundationId) {
      return null;
    }

    const resource = await ctx.db.get(args.resourceId);
    
    if (!resource || resource.foundationId !== args.foundationId) {
      return null;
    }

    // For non-admin users, only return published resources
    if ((user.role !== "admin" && user.role !== "super_admin") && !resource.isPublished) {
      return null;
    }

    return resource;
  },
});

// Create a new resource
export const createResource = mutation({
  args: {
    foundationId: v.id("foundations"),
    title: v.string(),
    description: v.string(),
    resourceType: v.union(
      v.literal("study_material"),
      v.literal("career_guide"),
      v.literal("scholarship_info"),
      v.literal("educational_video"),
      v.literal("tutorial"),
      v.literal("template"),
      v.literal("handbook")
    ),
    categories: v.array(v.string()),
    academicLevels: v.array(v.id("academicLevels")),
    fileId: v.optional(v.id("_storage")),
    externalUrl: v.optional(v.string()),
    content: v.optional(v.string()),
    isPublic: v.boolean(),
    accessLevel: v.union(
      v.literal("all_beneficiaries"),
      v.literal("specific_levels"),
      v.literal("specific_programs"),
      v.literal("admin_only")
    ),
    authorName: v.optional(v.string()),
    isPublished: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    // Authenticate and authorize (admin only)
    const user = await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);

    const resourceId = await ctx.db.insert("resources", {
      foundationId: args.foundationId,
      title: args.title,
      description: args.description,
      resourceType: args.resourceType,
      categories: args.categories,
      academicLevels: args.academicLevels,
      fileId: args.fileId,
      externalUrl: args.externalUrl,
      content: args.content,
      isPublic: args.isPublic,
      accessLevel: args.accessLevel,
      downloads: 0,
      views: 0,
      isPublished: args.isPublished ?? false,
      createdBy: user._id,
      authorName: args.authorName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "create",
      entityType: "resource",
      entityId: resourceId,
      description: `Created resource: ${args.title}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return resourceId;
  },
});

// Update a resource
export const updateResource = mutation({
  args: {
    resourceId: v.id("resources"),
    foundationId: v.id("foundations"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    resourceType: v.optional(v.union(
      v.literal("study_material"),
      v.literal("career_guide"),
      v.literal("scholarship_info"),
      v.literal("educational_video"),
      v.literal("tutorial"),
      v.literal("template"),
      v.literal("handbook")
    )),
    categories: v.optional(v.array(v.string())),
    academicLevels: v.optional(v.array(v.id("academicLevels"))),
    fileId: v.optional(v.id("_storage")),
    externalUrl: v.optional(v.string()),
    content: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    accessLevel: v.optional(v.union(
      v.literal("all_beneficiaries"),
      v.literal("specific_levels"),
      v.literal("specific_programs"),
      v.literal("admin_only")
    )),
    authorName: v.optional(v.string()),
    isPublished: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    // Authenticate and authorize (admin only)
    const user = await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);

    const existingResource = await ctx.db.get(args.resourceId);
    if (!existingResource || existingResource.foundationId !== args.foundationId) {
      throw new Error("Resource not found");
    }

    // Prepare update object
    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updateData.title = args.title;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.resourceType !== undefined) updateData.resourceType = args.resourceType;
    if (args.categories !== undefined) updateData.categories = args.categories;
    if (args.academicLevels !== undefined) updateData.academicLevels = args.academicLevels;
    if (args.fileId !== undefined) updateData.fileId = args.fileId;
    if (args.externalUrl !== undefined) updateData.externalUrl = args.externalUrl;
    if (args.content !== undefined) updateData.content = args.content;
    if (args.isPublic !== undefined) updateData.isPublic = args.isPublic;
    if (args.accessLevel !== undefined) updateData.accessLevel = args.accessLevel;
    if (args.authorName !== undefined) updateData.authorName = args.authorName;
    if (args.isPublished !== undefined) {
      updateData.isPublished = args.isPublished;
      if (args.isPublished && !existingResource.publishedAt) {
        updateData.publishedAt = Date.now();
      }
    }

    await ctx.db.patch(args.resourceId, updateData);

    // Audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "update",
      entityType: "resource",
      entityId: args.resourceId,
      description: `Updated resource: ${existingResource.title}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return args.resourceId;
  },
});

// Delete a resource
export const deleteResource = mutation({
  args: {
    resourceId: v.id("resources"),
    foundationId: v.id("foundations")
  },
  handler: async (ctx, args) => {
    // Authenticate and authorize (admin only)
    const user = await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);

    const resource = await ctx.db.get(args.resourceId);
    if (!resource || resource.foundationId !== args.foundationId) {
      throw new Error("Resource not found");
    }

    await ctx.db.delete(args.resourceId);

    // Audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "delete",
      entityType: "resource",
      entityId: args.resourceId,
      description: `Deleted resource: ${resource.title}`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });

    return true;
  },
});

// Increment view count
export const incrementViews = mutation({
  args: {
    resourceId: v.id("resources"),
    foundationId: v.id("foundations")
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.foundationId !== args.foundationId) {
      throw new Error("Access denied");
    }

    const resource = await ctx.db.get(args.resourceId);
    if (!resource || resource.foundationId !== args.foundationId) {
      throw new Error("Resource not found");
    }

    await ctx.db.patch(args.resourceId, {
      views: (resource.views || 0) + 1,
      updatedAt: Date.now(),
    });

    return true;
  },
});

// Increment download count
export const incrementDownloads = mutation({
  args: {
    resourceId: v.id("resources"),
    foundationId: v.id("foundations")
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.foundationId !== args.foundationId) {
      throw new Error("Access denied");
    }

    const resource = await ctx.db.get(args.resourceId);
    if (!resource || resource.foundationId !== args.foundationId) {
      throw new Error("Resource not found");
    }

    await ctx.db.patch(args.resourceId, {
      downloads: (resource.downloads || 0) + 1,
      updatedAt: Date.now(),
    });

    return true;
  },
});

// Get resource categories
export const getResourceCategories = query({
  args: {
    foundationId: v.id("foundations")
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.foundationId !== args.foundationId) {
      return null;
    }

    return await ctx.db
      .query("resourceCategories")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get academic levels for resources
export const getAcademicLevels = query({
  args: {
    foundationId: v.id("foundations")
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user || user.foundationId !== args.foundationId) {
      return null;
    }

    return await ctx.db
      .query("academicLevels")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Generate upload URL for resource files
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.storage.generateUploadUrl();
  },
});

// Get resource statistics (for admin dashboard)
export const getResourceStats = query({
  args: {
    foundationId: v.id("foundations")
  },
  handler: async (ctx, args) => {
    // Authenticate and authorize (admin only)
    const user = await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);

    const resources = await ctx.db
      .query("resources")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();

    const totalResources = resources.length;
    const publishedResources = resources.filter(r => r.isPublished).length;
    const totalDownloads = resources.reduce((sum, r) => sum + (r.downloads || 0), 0);
    const totalViews = resources.reduce((sum, r) => sum + (r.views || 0), 0);

    const resourcesByType = resources.reduce((acc, r) => {
      acc[r.resourceType] = (acc[r.resourceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalResources,
      publishedResources,
      draftResources: totalResources - publishedResources,
      totalDownloads,
      totalViews,
      resourcesByType,
    };
  },
});

// Bulk publish/unpublish resources
export const bulkUpdateResourceStatus = mutation({
  args: {
    foundationId: v.id("foundations"),
    resourceIds: v.array(v.id("resources")),
    isPublished: v.boolean()
  },
  handler: async (ctx, args) => {
    // Authenticate and authorize (admin only)
    const user = await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);

    const updatePromises = args.resourceIds.map(async (resourceId) => {
      const resource = await ctx.db.get(resourceId);
      if (!resource || resource.foundationId !== args.foundationId) {
        return null;
      }

      const updateData: any = {
        isPublished: args.isPublished,
        updatedAt: Date.now(),
      };

      if (args.isPublished && !resource.publishedAt) {
        updateData.publishedAt = Date.now();
      }

      await ctx.db.patch(resourceId, updateData);
      return resourceId;
    });

    const updatedIds = (await Promise.all(updatePromises)).filter(Boolean);

    // Audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "bulk_update",
      entityType: "resource",
      description: `Bulk ${args.isPublished ? 'published' : 'unpublished'} ${updatedIds.length} resources`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });

    return updatedIds.length;
  },
});