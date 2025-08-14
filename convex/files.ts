import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Generate an upload URL for file uploads
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx, args) => {
    // Generate and return an upload URL
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Get file URL from storage ID
 */
export const getFileUrl = query({
  args: { 
    storageId: v.id("_storage") 
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * Store file metadata in the database
 */
export const storeFile = mutation({
  args: {
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.string(),
    size: v.number(),
    foundationId: v.optional(v.id("foundations")),
    applicationId: v.optional(v.id("applications")),
    documentType: v.optional(v.string()),
    uploadedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    const fileId = await ctx.db.insert("files", {
      storageId: args.storageId,
      name: args.name,
      type: args.type,
      size: args.size,
      foundationId: args.foundationId,
      applicationId: args.applicationId,
      documentType: args.documentType,
      uploadedBy: args.uploadedBy,
      uploadedAt: Date.now(),
      clerkUserId: identity?.subject,
    });

    return fileId;
  },
});

/**
 * Upload payment receipt
 */
export const uploadPaymentReceipt = mutation({
  args: {
    foundationId: v.id("foundations"),
    financialRecordId: v.id("financialRecords"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Generate upload URL for the receipt
    const uploadUrl = await ctx.storage.generateUploadUrl();
    
    // This would be the storage ID after upload is complete
    // In a real implementation, this would be returned from the upload process
    const storageId = await ctx.storage.generateUploadUrl(); // Placeholder

    return storageId;
  },
});

/**
 * Get files for an application
 */
export const getApplicationFiles = query({
  args: { 
    applicationId: v.id("applications") 
  },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .withIndex("by_application", (q) => q.eq("applicationId", args.applicationId))
      .collect();

    // Get URLs for all files
    const filesWithUrls = await Promise.all(
      files.map(async (file) => ({
        ...file,
        url: await ctx.storage.getUrl(file.storageId),
      }))
    );

    return filesWithUrls;
  },
});

/**
 * Delete a file
 */
export const deleteFile = mutation({
  args: { 
    fileId: v.id("files") 
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const file = await ctx.db.get(args.fileId);
    if (!file) throw new Error("File not found");

    // Delete from storage
    await ctx.storage.delete(file.storageId);
    
    // Delete from database
    await ctx.db.delete(args.fileId);

    return true;
  },
});

/**
 * Get file by storage ID
 */
export const getFileByStorageId = query({
  args: { 
    storageId: v.id("_storage") 
  },
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query("files")
      .withIndex("by_storage", (q) => q.eq("storageId", args.storageId))
      .unique();

    if (!file) return null;

    return {
      ...file,
      url: await ctx.storage.getUrl(file.storageId),
    };
  },
});