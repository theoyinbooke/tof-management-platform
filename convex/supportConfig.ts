// convex/supportConfig.ts
// Support Configuration Management Functions

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authenticateAndAuthorize } from "./auth";
import { Id } from "./_generated/dataModel";

/**
 * Create a new support configuration
 */
export const createSupportConfig = mutation({
  args: {
    foundationId: v.id("foundations"),
    supportType: v.string(),
    displayName: v.string(),
    description: v.string(),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    
    eligibilityRules: v.object({
      minAcademicLevel: v.optional(v.string()),
      maxAcademicLevel: v.optional(v.string()),
      minAge: v.optional(v.number()),
      maxAge: v.optional(v.number()),
      requiresMinGrade: v.optional(v.number()),
      genderRestriction: v.optional(v.union(v.literal("male"), v.literal("female"))),
      schoolTypeRestriction: v.optional(v.array(v.string())),
      specialConditions: v.optional(v.array(v.string())),
    }),
    
    amountConfig: v.array(v.object({
      academicLevel: v.string(),
      minAmount: v.number(),
      maxAmount: v.number(),
      defaultAmount: v.number(),
      currency: v.union(v.literal("NGN"), v.literal("USD")),
      frequency: v.union(
        v.literal("once"),
        v.literal("termly"),
        v.literal("monthly"),
        v.literal("yearly"),
        v.literal("per_semester")
      ),
      schoolTypeMultipliers: v.optional(v.object({
        public: v.number(),
        private: v.number(),
        international: v.number(),
      })),
    })),
    
    requiredDocuments: v.array(v.object({
      documentType: v.string(),
      displayName: v.string(),
      description: v.optional(v.string()),
      isMandatory: v.boolean(),
      validityPeriod: v.optional(v.number()),
    })),
    
    applicationSettings: v.object({
      allowMultipleApplications: v.boolean(),
      applicationDeadline: v.optional(v.string()),
      autoApprovalThreshold: v.optional(v.number()),
      requiresGuardianConsent: v.boolean(),
      requiresAcademicVerification: v.boolean(),
      processingDays: v.number(),
    }),
    
    performanceRequirements: v.optional(v.object({
      minAttendance: v.optional(v.number()),
      minGradeForRenewal: v.optional(v.number()),
      improvementRequired: v.optional(v.boolean()),
      reviewFrequency: v.optional(v.string()),
    })),
    
    priorityWeights: v.object({
      academicPerformance: v.number(),
      financialNeed: v.number(),
      attendance: v.number(),
      specialCircumstances: v.number(),
      previousSupport: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, ["admin", "super_admin"]);
    
    // Check if support type already exists
    const existing = await ctx.db
      .query("supportConfigurations")
      .withIndex("by_support_type", (q) => 
        q.eq("foundationId", args.foundationId).eq("supportType", args.supportType)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    
    if (existing) {
      throw new Error(`Support configuration for ${args.supportType} already exists`);
    }
    
    // Create the configuration
    const configId = await ctx.db.insert("supportConfigurations", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: user._id,
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "create_support_config",
      entityType: "supportConfigurations",
      entityId: configId,
      description: `Created support configuration: ${args.displayName}`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });
    
    return configId;
  },
});

/**
 * Update an existing support configuration
 */
export const updateSupportConfig = mutation({
  args: {
    configId: v.id("supportConfigurations"),
    updates: v.object({
      displayName: v.optional(v.string()),
      description: v.optional(v.string()),
      icon: v.optional(v.string()),
      color: v.optional(v.string()),
      eligibilityRules: v.optional(v.any()),
      amountConfig: v.optional(v.any()),
      requiredDocuments: v.optional(v.any()),
      applicationSettings: v.optional(v.any()),
      performanceRequirements: v.optional(v.any()),
      priorityWeights: v.optional(v.any()),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.configId);
    if (!config) throw new Error("Configuration not found");
    
    const user = await authenticateAndAuthorize(ctx, config.foundationId, ["admin", "super_admin"]);
    
    // Update the configuration
    await ctx.db.patch(args.configId, {
      ...args.updates,
      updatedAt: Date.now(),
      updatedBy: user._id,
    });
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: config.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "update_support_config",
      entityType: "supportConfigurations",
      entityId: args.configId,
      description: `Updated support configuration: ${config.displayName}`,
      riskLevel: "medium",
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Get all support configurations for a foundation
 */
export const getSupportConfigurations = query({
  args: {
    foundationId: v.id("foundations"),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, [
      "super_admin",
      "admin",
      "reviewer",
      "beneficiary",
      "guardian"
    ]);
    
    let query = ctx.db
      .query("supportConfigurations")
      .withIndex("by_foundation", (q) => q.eq("foundationId", args.foundationId));
    
    const configs = await query.collect();
    
    // Filter by active status if requested
    const filteredConfigs = args.activeOnly 
      ? configs.filter(c => c.isActive)
      : configs;
    
    // For non-admin users, only return active configurations
    if (!["admin", "super_admin"].includes(user.role)) {
      return filteredConfigs.filter(c => c.isActive);
    }
    
    return filteredConfigs;
  },
});

/**
 * Get eligible support configurations for a specific user
 */
export const getEligibleSupports = query({
  args: {
    userId: v.id("users"),
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    const requestingUser = await authenticateAndAuthorize(ctx, args.foundationId, [
      "super_admin",
      "admin",
      "reviewer",
      "beneficiary",
      "guardian"
    ]);
    
    // Get the target user's profile
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("User not found");
    
    // Get all active support configurations
    const configs = await ctx.db
      .query("supportConfigurations")
      .withIndex("by_active", (q) => 
        q.eq("foundationId", args.foundationId).eq("isActive", true)
      )
      .collect();
    
    // Filter based on eligibility rules
    const eligibleConfigs = configs.filter(config => {
      const rules = config.eligibilityRules;
      const profile = targetUser.profile;
      
      // Check academic level
      if (profile?.beneficiaryInfo?.currentLevel) {
        const currentLevel = profile.beneficiaryInfo.currentLevel;
        
        if (rules.minAcademicLevel && 
            !isAcademicLevelGreaterOrEqual(currentLevel, rules.minAcademicLevel)) {
          return false;
        }
        
        if (rules.maxAcademicLevel && 
            !isAcademicLevelLessOrEqual(currentLevel, rules.maxAcademicLevel)) {
          return false;
        }
      }
      
      // Check age
      if (profile?.dateOfBirth) {
        const age = calculateAge(profile.dateOfBirth);
        
        if (rules.minAge && age < rules.minAge) return false;
        if (rules.maxAge && age > rules.maxAge) return false;
      }
      
      // Check gender
      if (rules.genderRestriction && profile?.gender) {
        if (rules.genderRestriction !== profile.gender) return false;
      }
      
      // Check special conditions
      if (rules.specialConditions && rules.specialConditions.length > 0) {
        // This would need to be expanded based on how special conditions are tracked
        // For now, we'll allow all if special conditions are specified
      }
      
      return true;
    });
    
    // Calculate estimated amounts based on user's profile
    const configsWithAmounts = eligibleConfigs.map(config => {
      const userLevel = targetUser.profile?.beneficiaryInfo?.currentLevel || "primary_1";
      const amountInfo = calculateSupportAmount(config, userLevel, targetUser.profile);
      
      return {
        ...config,
        estimatedAmount: amountInfo,
      };
    });
    
    return configsWithAmounts;
  },
});

/**
 * Calculate support amount based on user profile and configuration
 */
export const calculateSupportAmount = (
  config: any,
  academicLevel: string,
  profile: any
) => {
  // Find the appropriate amount configuration for the academic level
  const levelGroup = getAcademicLevelGroup(academicLevel);
  const amountConfig = config.amountConfig.find((ac: any) => 
    ac.academicLevel === levelGroup ||
    ac.academicLevel === "all"
  );
  
  if (!amountConfig) {
    return {
      min: 0,
      max: 0,
      default: 0,
      currency: "NGN",
      frequency: "once",
    };
  }
  
  // Apply school type multipliers if applicable
  let multiplier = 1.0;
  if (profile?.beneficiaryInfo?.schoolType && amountConfig.schoolTypeMultipliers) {
    const schoolType = profile.beneficiaryInfo.schoolType;
    multiplier = amountConfig.schoolTypeMultipliers[schoolType] || 1.0;
  }
  
  return {
    min: Math.round(amountConfig.minAmount * multiplier),
    max: Math.round(amountConfig.maxAmount * multiplier),
    default: Math.round(amountConfig.defaultAmount * multiplier),
    currency: amountConfig.currency,
    frequency: amountConfig.frequency,
  };
};

/**
 * Helper function to get academic level group
 */
const getAcademicLevelGroup = (level: string): string => {
  if (level.startsWith("nursery")) return "nursery";
  if (level.startsWith("primary")) return "primary";
  if (level.startsWith("jss")) return "jss";
  if (level.startsWith("sss")) return "sss";
  if (level.startsWith("university")) return "university";
  return "all";
};

/**
 * Helper function to calculate age from date of birth
 */
const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Helper functions for academic level comparison
 */
const academicLevelOrder = [
  "nursery_1", "nursery_2",
  "primary_1", "primary_2", "primary_3", "primary_4", "primary_5", "primary_6",
  "jss_1", "jss_2", "jss_3",
  "sss_1", "sss_2", "sss_3",
  "university_1", "university_2", "university_3", "university_4", "university_5", "university_6",
];

const isAcademicLevelGreaterOrEqual = (level1: string, level2: string): boolean => {
  const index1 = academicLevelOrder.indexOf(level1);
  const index2 = academicLevelOrder.indexOf(level2);
  return index1 >= index2;
};

const isAcademicLevelLessOrEqual = (level1: string, level2: string): boolean => {
  const index1 = academicLevelOrder.indexOf(level1);
  const index2 = academicLevelOrder.indexOf(level2);
  return index1 <= index2;
};

/**
 * Initialize default support configurations for a foundation
 */
export const initializeDefaultConfigs = mutation({
  args: {
    foundationId: v.id("foundations"),
  },
  handler: async (ctx, args) => {
    const user = await authenticateAndAuthorize(ctx, args.foundationId, ["super_admin"]);
    
    const defaultConfigs = [
      {
        supportType: "school_fees",
        displayName: "School Fees Support",
        description: "Financial assistance for tuition fees",
        icon: "GraduationCap",
        color: "emerald",
        eligibilityRules: {
          minAcademicLevel: "primary_1",
          maxAcademicLevel: "university_6",
          requiresMinGrade: 50,
        },
        amountConfig: [
          {
            academicLevel: "primary",
            minAmount: 30000,
            maxAmount: 150000,
            defaultAmount: 75000,
            currency: "NGN" as const,
            frequency: "termly" as const,
            schoolTypeMultipliers: {
              public: 1.0,
              private: 2.0,
              international: 3.0,
            },
          },
          {
            academicLevel: "jss",
            minAmount: 50000,
            maxAmount: 200000,
            defaultAmount: 100000,
            currency: "NGN" as const,
            frequency: "termly" as const,
            schoolTypeMultipliers: {
              public: 1.0,
              private: 2.0,
              international: 3.0,
            },
          },
          {
            academicLevel: "sss",
            minAmount: 60000,
            maxAmount: 250000,
            defaultAmount: 120000,
            currency: "NGN" as const,
            frequency: "termly" as const,
            schoolTypeMultipliers: {
              public: 1.0,
              private: 2.0,
              international: 3.0,
            },
          },
          {
            academicLevel: "university",
            minAmount: 100000,
            maxAmount: 500000,
            defaultAmount: 250000,
            currency: "NGN" as const,
            frequency: "per_semester" as const,
            schoolTypeMultipliers: {
              public: 1.0,
              private: 2.5,
              international: 4.0,
            },
          },
        ],
        requiredDocuments: [
          {
            documentType: "fee_invoice",
            displayName: "School Fee Invoice",
            description: "Official fee breakdown from school",
            isMandatory: true,
            validityPeriod: 90,
          },
          {
            documentType: "report_card",
            displayName: "Previous Report Card",
            description: "Most recent academic performance",
            isMandatory: true,
            validityPeriod: 180,
          },
        ],
        applicationSettings: {
          allowMultipleApplications: false,
          applicationDeadline: "30 days before term start",
          autoApprovalThreshold: 85,
          requiresGuardianConsent: true,
          requiresAcademicVerification: true,
          processingDays: 7,
        },
        performanceRequirements: {
          minAttendance: 75,
          minGradeForRenewal: 60,
          improvementRequired: false,
          reviewFrequency: "termly",
        },
        priorityWeights: {
          academicPerformance: 0.4,
          financialNeed: 0.3,
          attendance: 0.2,
          specialCircumstances: 0.1,
          previousSupport: -0.05,
        },
      },
      {
        supportType: "upkeep",
        displayName: "Monthly Upkeep Allowance",
        description: "Monthly allowance for books, transportation, and supplies",
        icon: "DollarSign",
        color: "blue",
        eligibilityRules: {
          minAcademicLevel: "jss_1",
          requiresMinGrade: 60,
        },
        amountConfig: [
          {
            academicLevel: "jss",
            minAmount: 10000,
            maxAmount: 20000,
            defaultAmount: 15000,
            currency: "NGN" as const,
            frequency: "monthly" as const,
          },
          {
            academicLevel: "sss",
            minAmount: 15000,
            maxAmount: 25000,
            defaultAmount: 20000,
            currency: "NGN" as const,
            frequency: "monthly" as const,
          },
          {
            academicLevel: "university",
            minAmount: 20000,
            maxAmount: 40000,
            defaultAmount: 30000,
            currency: "NGN" as const,
            frequency: "monthly" as const,
          },
        ],
        requiredDocuments: [
          {
            documentType: "expense_budget",
            displayName: "Monthly Expense Budget",
            description: "Breakdown of monthly expenses",
            isMandatory: true,
            validityPeriod: 30,
          },
        ],
        applicationSettings: {
          allowMultipleApplications: false,
          requiresGuardianConsent: true,
          requiresAcademicVerification: false,
          processingDays: 3,
        },
        performanceRequirements: {
          minAttendance: 80,
          minGradeForRenewal: 60,
          reviewFrequency: "termly",
        },
        priorityWeights: {
          academicPerformance: 0.3,
          financialNeed: 0.4,
          attendance: 0.2,
          specialCircumstances: 0.1,
          previousSupport: 0,
        },
      },
      {
        supportType: "exam_fees",
        displayName: "Examination Fees Support",
        description: "Support for WAEC, JAMB, Post-UTME and other examinations",
        icon: "FileText",
        color: "orange",
        eligibilityRules: {
          minAcademicLevel: "sss_3",
          maxAcademicLevel: "university_5",
        },
        amountConfig: [
          {
            academicLevel: "sss",
            minAmount: 10000,
            maxAmount: 50000,
            defaultAmount: 25000,
            currency: "NGN" as const,
            frequency: "once" as const,
          },
          {
            academicLevel: "university",
            minAmount: 5000,
            maxAmount: 30000,
            defaultAmount: 15000,
            currency: "NGN" as const,
            frequency: "once" as const,
          },
        ],
        requiredDocuments: [
          {
            documentType: "exam_registration",
            displayName: "Exam Registration Form",
            description: "Proof of exam registration",
            isMandatory: true,
            validityPeriod: 60,
          },
        ],
        applicationSettings: {
          allowMultipleApplications: true,
          requiresGuardianConsent: false,
          requiresAcademicVerification: true,
          processingDays: 5,
        },
        priorityWeights: {
          academicPerformance: 0.5,
          financialNeed: 0.3,
          attendance: 0.1,
          specialCircumstances: 0.1,
          previousSupport: 0,
        },
      },
    ];
    
    // Insert all default configurations
    const results = [];
    for (const config of defaultConfigs) {
      const configId = await ctx.db.insert("supportConfigurations", {
        foundationId: args.foundationId,
        ...config,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: user._id,
      });
      results.push(configId);
    }
    
    // Create audit log
    await ctx.db.insert("auditLogs", {
      foundationId: args.foundationId,
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: "initialize_support_configs",
      entityType: "supportConfigurations",
      entityId: results[0],
      description: `Initialized ${results.length} default support configurations`,
      riskLevel: "low",
      createdAt: Date.now(),
    });
    
    return { success: true, configurationsCreated: results.length };
  },
});