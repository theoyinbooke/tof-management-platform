import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authenticateAndAuthorize } from "./auth";

/**
 * Generate upload URL for document storage
 */
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

/**
 * Get or create document type
 */
async function getOrCreateDocumentType(
  ctx: any,
  foundationId: any,
  typeName: string
) {
  // Check if document type exists
  const existingType = await ctx.db
    .query("documentTypes")
    .withIndex("by_foundation", (q: any) => q.eq("foundationId", foundationId))
    .filter((q: any) => q.eq(q.field("name"), typeName))
    .unique();

  if (existingType) {
    return existingType._id;
  }

  // Map document type to category
  const getCategoryForType = (type: string) => {
    switch (type) {
      case "academic_transcript":
      case "school_certificate":
        return "academic";
      case "financial_document":
      case "proof_of_income":
        return "financial";
      case "identity_document":
      case "recommendation_letter":
        return "personal";
      case "medical_document":
        return "medical";
      default:
        return "personal";
    }
  };

  // Create new document type with all required fields
  return await ctx.db.insert("documentTypes", {
    foundationId,
    name: typeName,
    description: `${typeName.replace(/_/g, ' ')} documents`,
    isRequired: false,
    requiredFor: [],
    allowedFormats: ["pdf", "jpg", "jpeg", "png", "doc", "docx"],
    maxFileSize: 10, // 10MB
    category: getCategoryForType(typeName) as any,
    requiresApproval: true,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

/**
 * Create a new document record after upload
 */
export const createDocument = mutation({
  args: {
    foundationId: v.id("foundations"),
    beneficiaryId: v.optional(v.id("beneficiaries")),
    applicationId: v.optional(v.id("applications")),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    documentType: v.union(
      v.literal("application_document"),
      v.literal("academic_transcript"),
      v.literal("financial_document"),
      v.literal("identity_document"),
      v.literal("medical_document"),
      v.literal("recommendation_letter"),
      v.literal("proof_of_income"),
      v.literal("school_certificate"),
      v.literal("other")
    ),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);

    // Verify beneficiary access if specified
    if (args.beneficiaryId) {
      const beneficiary = await ctx.db.get(args.beneficiaryId);
      if (!beneficiary || beneficiary.foundationId !== args.foundationId) {
        throw new Error("Beneficiary not found or access denied");
      }

      // Beneficiaries and guardians can only upload their own documents
      if (user.role === "beneficiary" || user.role === "guardian") {
        const userBeneficiary = await ctx.db
          .query("beneficiaries")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .unique();
        
        if (!userBeneficiary || userBeneficiary._id !== args.beneficiaryId) {
          throw new Error("Access denied - can only upload your own documents");
        }
      }
    }

    // Get or create document type
    const documentTypeId = await getOrCreateDocumentType(
      ctx,
      args.foundationId,
      args.documentType
    );

    // Determine belongsTo and entityId based on what's provided
    let belongsTo: "application" | "beneficiary" | "program" | "financial_record" = "beneficiary";
    let entityId = "";

    if (args.applicationId) {
      belongsTo = "application";
      entityId = args.applicationId;
    } else if (args.beneficiaryId) {
      belongsTo = "beneficiary";
      entityId = args.beneficiaryId;
    }

    // Create document record
    const documentId = await ctx.db.insert("documents", {
      foundationId: args.foundationId,
      documentTypeId,
      uploadedBy: user._id,
      belongsTo,
      entityId,
      fileId: args.storageId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      fileType: args.fileType,
      title: args.fileName,
      description: args.description,
      status: "pending_review",
      isConfidential: !args.isPublic,
      accessLevel: args.isPublic ? "public" : "beneficiary_only",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "document_uploaded",
      entityType: "documents",
      entityId: documentId,
      description: `Uploaded document: ${args.fileName} (${args.documentType})`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return documentId;
  },
});

/**
 * Get documents by foundation with filtering
 */
export const getByFoundation = query({
  args: {
    foundationId: v.id("foundations"),
    beneficiaryId: v.optional(v.id("beneficiaries")),
    documentType: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);

    let query = ctx.db
      .query("documents")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));

    const documents = await query.order("desc").collect();

    // Apply filters
    let filteredDocuments = documents;

    // Role-based filtering
    if (user.role === "beneficiary" || user.role === "guardian") {
      const userBeneficiary = await ctx.db
        .query("beneficiaries")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique();
      
      if (userBeneficiary) {
        filteredDocuments = filteredDocuments.filter(
          (doc) => doc.entityId === userBeneficiary._id || doc.accessLevel === "public"
        );
      } else {
        filteredDocuments = filteredDocuments.filter((doc) => doc.accessLevel === "public");
      }
    }

    if (args.beneficiaryId) {
      filteredDocuments = filteredDocuments.filter(
        (doc) => doc.belongsTo === "beneficiary" && doc.entityId === args.beneficiaryId
      );
    }

    if (args.status) {
      filteredDocuments = filteredDocuments.filter(
        (doc) => doc.status === args.status
      );
    }

    // Get related data
    const documentsWithDetails = await Promise.all(
      filteredDocuments.map(async (doc) => {
        const beneficiary = doc.belongsTo === "beneficiary" && doc.entityId 
          ? await ctx.db.get(doc.entityId as any) 
          : null;
        const beneficiaryUser = beneficiary ? await ctx.db.get((beneficiary as any).userId) : null;
        const uploadedByUser = await ctx.db.get(doc.uploadedBy);
        const reviewedByUser = doc.reviewedBy ? await ctx.db.get(doc.reviewedBy) : null;
        const documentType = await ctx.db.get(doc.documentTypeId);

        return {
          ...doc,
          beneficiary,
          beneficiaryUser,
          uploadedByUser,
          reviewedByUser,
          documentType: documentType?.name || "unknown",
          documentTypeName: documentType?.name || "unknown",
        };
      })
    );

    return documentsWithDetails;
  },
});

/**
 * Get documents by beneficiary
 */
export const getByBeneficiary = query({
  args: {
    beneficiaryId: v.id("beneficiaries"),
    foundationId: v.id("foundations"),
    documentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);

    // Verify beneficiary access
    const beneficiary = await ctx.db.get(args.beneficiaryId);
    if (!beneficiary || beneficiary.foundationId !== args.foundationId) {
      throw new Error("Beneficiary not found or access denied");
    }

    // Check if user can access this beneficiary's documents
    if (user.role === "beneficiary" || user.role === "guardian") {
      const userBeneficiary = await ctx.db
        .query("beneficiaries")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique();
      
      if (!userBeneficiary || userBeneficiary._id !== args.beneficiaryId) {
        throw new Error("Access denied");
      }
    }

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .filter((q) => 
        q.and(
          q.eq(q.field("belongsTo"), "beneficiary"),
          q.eq(q.field("entityId"), args.beneficiaryId)
        )
      )
      .order("desc")
      .collect();

    // Get related data
    const documentsWithDetails = await Promise.all(
      documents.map(async (doc) => {
        const uploadedByUser = await ctx.db.get(doc.uploadedBy);
        const reviewedByUser = doc.reviewedBy ? await ctx.db.get(doc.reviewedBy) : null;
        const documentType = await ctx.db.get(doc.documentTypeId);

        return {
          ...doc,
          uploadedByUser,
          reviewedByUser,
          documentType: documentType?.name || "unknown",
          documentTypeName: documentType?.name || "unknown",
        };
      })
    );

    return documentsWithDetails;
  },
});

/**
 * Update document status (review/approve/reject)
 */
export const updateStatus = mutation({
  args: {
    documentId: v.id("documents"),
    status: v.union(
      v.literal("pending_review"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("expired")
    ),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    const user = await authenticateAndAuthorize(ctx, document.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
    ]);

    const updates: any = {
      status: args.status,
      reviewedBy: user._id,
      reviewedAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (args.reviewNotes) {
      updates.reviewComments = args.reviewNotes;
    }

    await ctx.db.patch(args.documentId, updates);

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: document.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "document_reviewed",
      entityType: "documents",
      entityId: args.documentId,
      description: `Updated document status to ${args.status}`,
      riskLevel: args.status === "rejected" ? "low" : "low",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Delete a document
 */
export const deleteDocument = mutation({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    const user = await authenticateAndAuthorize(ctx, document.foundationId, [
      "admin",
      "super_admin",
    ]);

    // Delete from storage
    await ctx.storage.delete(document.fileId);

    // Delete document record
    await ctx.db.delete(args.documentId);

    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: document.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "document_deleted",
      entityType: "documents",
      entityId: args.documentId,
      description: `Deleted document: ${document.fileName}`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get document download URL
 */
export const getDownloadUrl = mutation({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    const user = await authenticateAndAuthorize(ctx, document.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);

    // Check access permissions
    if (user.role === "beneficiary" || user.role === "guardian") {
      if (document.accessLevel !== "public") {
        const userBeneficiary = await ctx.db
          .query("beneficiaries")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .unique();
        
        if (!userBeneficiary || 
            (document.belongsTo === "beneficiary" && document.entityId !== userBeneficiary._id)) {
          throw new Error("Access denied");
        }
      }
    }

    // Generate download URL
    const downloadUrl = await ctx.storage.getUrl(document.fileId);

    // Log download activity
    await ctx.db.insert("auditLogs", {
      foundationId: document.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "document_downloaded",
      entityType: "documents",
      entityId: args.documentId,
      description: `Downloaded document: ${document.fileName}`,
      riskLevel: "low",
      createdAt: Date.now(),
    });

    return downloadUrl;
  },
});

/**
 * Get document by ID
 */
export const getById = query({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      return null;
    }

    const user = await authenticateAndAuthorize(ctx, document.foundationId, [
      "admin",
      "super_admin",
      "reviewer",
      "beneficiary",
      "guardian",
    ]);

    // Check access permissions
    if (user.role === "beneficiary" || user.role === "guardian") {
      if (document.accessLevel !== "public") {
        const userBeneficiary = await ctx.db
          .query("beneficiaries")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .unique();
        
        if (!userBeneficiary || 
            (document.belongsTo === "beneficiary" && document.entityId !== userBeneficiary._id)) {
          throw new Error("Access denied");
        }
      }
    }

    // Get related data
    const beneficiary = document.belongsTo === "beneficiary" && document.entityId 
      ? await ctx.db.get(document.entityId as any) 
      : null;
    const beneficiaryUser = beneficiary ? await ctx.db.get((beneficiary as any).userId) : null;
    const uploadedByUser = await ctx.db.get(document.uploadedBy);
    const reviewedByUser = document.reviewedBy ? await ctx.db.get(document.reviewedBy) : null;
    const documentType = await ctx.db.get(document.documentTypeId);

    return {
      ...document,
      beneficiary,
      beneficiaryUser,
      uploadedByUser,
      reviewedByUser,
      documentType: documentType?.name || "unknown",
      documentTypeName: documentType?.name || "unknown",
      // Map field names for compatibility with UI components
      reviewDate: document.reviewedAt,
      reviewNotes: document.reviewComments,
    };
  },
});

/**
 * Get document statistics
 */
export const getStatistics = query({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    await authenticateAndAuthorize(ctx, args.foundationId, [
      "admin", "super_admin", "reviewer", "beneficiary", "guardian"
    ]);

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();

    // Get document types
    const documentTypes = await ctx.db
      .query("documentTypes")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId))
      .collect();

    const typeStats: Record<string, number> = {};
    for (const type of documentTypes) {
      typeStats[type.name] = documents.filter(d => d.documentTypeId === type._id).length;
    }

    return {
      total: documents.length,
      byStatus: {
        pending_review: documents.filter((d) => d.status === "pending_review").length,
        approved: documents.filter((d) => d.status === "approved").length,
        rejected: documents.filter((d) => d.status === "rejected").length,
        expired: documents.filter((d) => d.status === "expired").length,
      },
      byType: typeStats,
      totalSize: documents.reduce((sum, doc) => sum + doc.fileSize, 0),
    };
  },
});