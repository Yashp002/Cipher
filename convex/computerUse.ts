import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Store computer use tasks
export const createTask = mutation({
  args: {
    goal: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const taskId = await ctx.db.insert("computerUseTasks", {
      userId,
      goal: args.goal,
      description: args.description,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      steps: [],
    });

    return taskId;
  },
});

// Update task status
export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("computerUseTasks"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) {
      throw new Error("Task not found or unauthorized");
    }

    await ctx.db.patch(args.taskId, {
      status: args.status,
      error: args.error,
      updatedAt: Date.now(),
    });
  },
});

// Add a step to the task
export const addTaskStep = mutation({
  args: {
    taskId: v.id("computerUseTasks"),
    step: v.object({
      timestamp: v.number(),
      analysis: v.string(),
      action: v.object({
        type: v.string(),
        details: v.any(),
      }),
      result: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) {
      throw new Error("Task not found or unauthorized");
    }

    const steps = task.steps || [];
    steps.push(args.step);

    await ctx.db.patch(args.taskId, {
      steps,
      updatedAt: Date.now(),
    });
  },
});

// Get task details
export const getTask = query({
  args: {
    taskId: v.id("computerUseTasks"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) {
      return null;
    }

    return task;
  },
});

// Get all user tasks
export const getUserTasks = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const tasks = await ctx.db
      .query("computerUseTasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit || 10);

    return tasks;
  },
});

// Process screenshot and get AI analysis
export const analyzeScreenshot = action({
  args: {
    taskId: v.id("computerUseTasks"),
    screenshotBase64: v.string(),
    goal: v.string(),
    stepNumber: v.number(),
    previousSteps: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
    const GEMINI_VISION_URL = 
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    const contextPrompt = buildContextPrompt(
      args.goal,
      args.stepNumber,
      args.previousSteps
    );

    try {
      const response = await fetch(`${GEMINI_VISION_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: contextPrompt
              },
              {
                inlineData: {
                  mimeType: "image/png",
                  data: args.screenshotBase64
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const geminiText = data.candidates[0].content.parts[0].text;
      
      // Extract JSON from the response
      const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in Gemini response");
      }
      
      const analysis = JSON.parse(jsonMatch[0]);
      
      return analysis;
    } catch (error) {
      console.error("Gemini Vision API error:", error);
      throw error;
    }
  },
});

function buildContextPrompt(
  goal: string,
  stepNumber: number,
  previousSteps: string[]
): string {
  const previousContext = previousSteps.length > 0
    ? `\n\nPrevious actions taken:\n${previousSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}`
    : '';

  return `You are an AI assistant that can control a computer by seeing the screen and taking actions.

**GOAL**: ${goal}

**Current Step**: ${stepNumber}${previousContext}

**Your Task**: Analyze the screenshot and determine the next action to take to accomplish the goal.

**Available Actions**:
1. mouse_move: {action: "mouse_move", x: <number>, y: <number>}
2. click: {action: "click", button: "left" | "right" | "middle"}
3. double_click: {action: "double_click", button: "left" | "right" | "middle"}
4. type: {action: "type", text: "<text to type>"}
5. key_press: {action: "key_press", key: "<key name>"}  // Keys: Enter, Backspace, Tab, Escape, Space, Delete, Home, End, PageUp, PageDown, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, etc.
6. scroll: {action: "scroll", direction: "up" | "down" | "left" | "right", amount: <number>}
7. wait: {action: "wait", duration: <milliseconds>}
8. task_complete: {action: "task_complete", reason: "<why task is done>"}
9. task_failed: {action: "task_failed", reason: "<why task failed>"}

**Response Format** (JSON ONLY):
{
  "observation": "What you see on the screen and what elements are visible",
  "thinking": "Your reasoning about what to do next",
  "action": {
    "type": "<action type>",
    "x": <number if mouse_move>,
    "y": <number if mouse_move>,
    "button": "<button if click/double_click>",
    "text": "<text if type>",
    "key": "<key if key_press>",
    "direction": "<direction if scroll>",
    "amount": <amount if scroll>,
    "duration": <duration if wait>,
    "reason": "<reason if task_complete/task_failed>"
  },
  "confidence": <0.0-1.0>,
  "estimated_progress": <0-100 percentage>
}

**Important Guidelines**:
- Be precise with coordinates - look carefully at element positions
- If you need to click something, move the mouse there first
- Type text slowly and accurately
- If you see an error or unexpected state, explain it in your thinking
- If the task appears complete, use task_complete action
- If the task is impossible or failed, use task_failed action
- Return ONLY valid JSON, no other text

Analyze the screenshot and provide your response:`;
}
