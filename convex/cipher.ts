import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const GEMINI_API_KEY = "AIzaSyCmnge11kuE2QWmj_2OHYcpklDqq0QUcf8";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

export const saveCommand = mutation({
  args: {
    command: v.string(),
    response: v.string(),
    confidence: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    await ctx.db.insert("commands", {
      userId,
      command: args.command,
      response: args.response,
      confidence: args.confidence,
      timestamp: Date.now(),
    });
  },
});

export const getRecentCommands = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("commands")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10);
  },
});

export const saveVoiceSettings = mutation({
  args: {
    noiseThreshold: v.number(),
    sensitivity: v.number(),
    wakeWordEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const existing = await ctx.db
      .query("voiceSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        noiseThreshold: args.noiseThreshold,
        sensitivity: args.sensitivity,
        wakeWordEnabled: args.wakeWordEnabled,
      });
    } else {
      await ctx.db.insert("voiceSettings", {
        userId,
        noiseThreshold: args.noiseThreshold,
        sensitivity: args.sensitivity,
        wakeWordEnabled: args.wakeWordEnabled,
      });
    }
  },
});

export const getVoiceSettings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("voiceSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

interface GeminiResponse {
  action: "openUrl" | "speak" | "multiAction";
  url?: string;
  response: string;
  urls?: string[];
}

async function callGeminiAPI(command: string): Promise<GeminiResponse> {
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const systemPrompt = `You are Cipher, a helpful voice assistant. Analyze the user's voice command and return a JSON response with the appropriate action.

Current time: ${currentTime}
Current date: ${currentDate}

Available actions:
1. "openUrl" - For searches, opening websites, playing videos
2. "speak" - For answering questions, providing information
3. "multiAction" - For commands that need multiple URLs (like "open YouTube and Google")

Response format:
{
  "action": "openUrl" | "speak" | "multiAction",
  "response": "What you'll say to the user",
  "url": "URL to open (for openUrl)",
  "urls": ["url1", "url2"] (for multiAction)
}

Examples:
- "search YouTube for cats" → {"action": "openUrl", "url": "https://www.youtube.com/results?search_query=cats", "response": "Searching YouTube for cats"}
- "what time is it" → {"action": "speak", "response": "The current time is ${currentTime}"}
- "what's the weather" → {"action": "openUrl", "url": "https://www.google.com/search?q=weather", "response": "Let me check the weather for you"}
- "open YouTube and Google" → {"action": "multiAction", "urls": ["https://www.youtube.com", "https://www.google.com"], "response": "Opening YouTube and Google"}
- "play [song name]" → {"action": "openUrl", "url": "https://www.youtube.com/results?search_query=[song name]", "response": "Playing [song name] on YouTube"}
- "calculate 5 plus 3" → {"action": "speak", "response": "5 plus 3 equals 8"}

Be conversational and helpful. For searches, always open the appropriate website. Return ONLY valid JSON.

User command: "${command}"`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const geminiText = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from the response (it might be wrapped in markdown code blocks)
    const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in Gemini response");
    }
    
    const result = JSON.parse(jsonMatch[0]) as GeminiResponse;
    return result;
  } catch (error) {
    console.error("Gemini API error:", error);
    // Fallback to basic command processing
    return fallbackCommandProcessing(command);
  }
}

function fallbackCommandProcessing(command: string): GeminiResponse {
  const lowerCommand = command.toLowerCase();
  
  // YouTube search
  if (lowerCommand.includes("youtube") || lowerCommand.includes("play")) {
    const searchTerm = extractSearchTerm(command);
    return {
      action: "openUrl",
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchTerm)}`,
      response: `Searching YouTube for ${searchTerm}`,
    };
  }
  
  // Google search
  if (lowerCommand.includes("google") || lowerCommand.includes("search")) {
    const searchTerm = extractSearchTerm(command);
    return {
      action: "openUrl",
      url: `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`,
      response: `Searching for ${searchTerm}`,
    };
  }
  
  // Time
  if (lowerCommand.includes("time")) {
    return {
      action: "speak",
      response: `The current time is ${new Date().toLocaleTimeString()}`,
    };
  }
  
  // Date
  if (lowerCommand.includes("date") || lowerCommand.includes("today")) {
    return {
      action: "speak",
      response: `Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    };
  }
  
  return {
    action: "speak",
    response: "I couldn't process that command. Please try again.",
  };
}

function extractSearchTerm(command: string): string {
  const searchPatterns = [
    /(?:search|look up|find|google|youtube)\s+(?:for\s+)?(.+)/i,
    /play\s+(.+)/i,
    /open\s+(.+)/i,
  ];
  
  for (const pattern of searchPatterns) {
    const match = command.match(pattern);
    if (match) {
      return match[1]
        .replace(/\b(on|in)\s+(youtube|google)\b/gi, '')
        .replace(/['"]/g, "")
        .trim();
    }
  }
  
  return command;
}

export const processCommand = action({
  args: {
    command: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("Processing command:", args.command);
    
    // Use Gemini AI to process the command
    const result = await callGeminiAPI(args.command);
    
    console.log("Gemini result:", result);
    
    return result;
  },
});
