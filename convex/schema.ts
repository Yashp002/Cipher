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
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
