import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  commands: defineTable({
    userId: v.id("users"),
    command: v.string(),
    response: v.string(),
    timestamp: v.number(),
    confidence: v.number(),
  }).index("by_user", ["userId"]),
  
  voiceSettings: defineTable({
    userId: v.id("users"),
    noiseThreshold: v.number(),
    sensitivity: v.number(),
    wakeWordEnabled: v.boolean(),
  }).index("by_user", ["userId"]),
  
  computerUseTasks: defineTable({
    userId: v.id("users"),
    goal: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    error: v.optional(v.string()),
    steps: v.array(
      v.object({
        timestamp: v.number(),
        analysis: v.string(),
        action: v.object({
          type: v.string(),
          details: v.any(),
        }),
        result: v.optional(v.string()),
      })
    ),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
