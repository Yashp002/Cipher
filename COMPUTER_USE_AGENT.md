# 🤖 Computer Use Agent - Complete Documentation

## Overview

The **Computer Use Agent** is an advanced AI-powered automation system that can see your screen and control your
computer like a human. It implements Anthropic's Computer Use pattern using Google Gemini Vision AI for visual analysis
and nut.js for mouse/keyboard automation.

---

## 🎯 What Can It Do?

The Computer Use Agent can accomplish **ANY visual task** by:

- 📸 Seeing your screen in real-time
- 🧠 Understanding what's on the screen using AI vision
- 🖱️ Moving the mouse and clicking
- ⌨️ Typing text and pressing keys
- 📜 Scrolling and navigating
- 🎯 Completing multi-step tasks automatically
- 🔄 Retrying on failures
- ✅ Detecting task completion

---

## 🏗️ Architecture

### **1. Screenshot Loop**

- Captures screen every 3 seconds using `screenshot-desktop`
- Compresses images to 1280x720 for efficiency
- Converts to base64 for API transmission

### **2. Vision Analysis**

- Sends screenshot to Gemini Vision API
- Provides full task context and history
- Asks: "What do you see? What action should I take next?"
- Receives structured JSON response

### **3. Action Executor**

Parses and executes structured actions:

```typescript
{action: "mouse_move", x: 450, y: 200}
{action: "click", button: "left"}
{action: "double_click", button: "right"}
{action: "type", text: "hello world"}
{action: "key_press", key: "Enter"}
{action: "scroll", direction: "down", amount: 3}
{action: "wait", duration: 1000}
{action: "task_complete", reason: "Goal achieved"}
{action: "task_failed", reason: "Cannot proceed"}
```

### **4. State Manager**

- Tracks task progress
- Records every action taken
- Detects completion/failure
- Handles errors with retry logic
- Maximum 100 steps per task (prevents infinite loops)

---

## 🚀 How It Works

### **Complete Flow:**

1. **User Creates Task**
    - Opens Computer Use interface
    - Enters task goal (e.g., "Open Notepad and write a poem")
    - Clicks "Start Agent"

2. **Agent Initialization**
    - Creates task record in database
    - Starts Node.js agent server
    - Begins screenshot loop

3. **Continuous Analysis Loop**
   ```
   Loop (every 3 seconds):
     1. Capture screenshot
     2. Send to Gemini Vision API with context
     3. Receive AI analysis and next action
     4. Execute the action
     5. Record step in database
     6. Check if task complete/failed
     7. Repeat until done
   ```

4. **Action Execution**
    - Uses nut.js to control mouse/keyboard
    - Smooth mouse movements (1000px/s)
    - 100ms delay between actions
    - Error handling with retries

5. **Task Completion**
    - AI determines when goal is achieved
    - Returns `task_complete` action
    - Updates status in database
    - Stops loop

---

## 📊 System Components

### **Frontend Components**

#### `ComputerUseInterface.tsx`

- React component for user interaction
- Purple-themed floating panel
- Task creation form
- Real-time task status
- Recent tasks history
- Start/stop controls

### **Backend Services**

#### `convex/computerUse.ts`

- Convex mutations for task management
- `createTask` - Initialize new task
- `updateTaskStatus` - Update progress
- `addTaskStep` - Record actions
- `getTask` - Retrieve task details
- `analyzeScreenshot` - Gemini Vision API integration

#### `src/computerUse/ComputerUseAgent.ts`

- Core agent engine
- Screenshot capture
- Action execution
- State management
- Retry logic
- Error handling

#### `server/computerUseServer.ts`

- Express server on port 3001
- REST API endpoints
- Agent lifecycle management
- Convex client integration

---

## 🎮 Available Actions

### **Mouse Actions**

```typescript
// Move mouse to coordinates
{
  action: "mouse_move",
  x: 500,
  y: 300
}

// Click mouse button
{
  action: "click",
  button: "left" | "right" | "middle"
}

// Double click
{
  action: "double_click",
  button: "left"
}
```

### **Keyboard Actions**

```typescript
// Type text
{
  action: "type",
  text: "Hello, World!"
}

// Press special key
{
  action: "key_press",
  key: "Enter" | "Backspace" | "Tab" | "Escape" | 
       "Space" | "Delete" | "Home" | "End" |
       "PageUp" | "PageDown" | "ArrowUp" | "ArrowDown" |
       "ArrowLeft" | "ArrowRight" | "F1-F12"
}
```

### **Scroll Actions**

```typescript
// Scroll in direction
{
  action: "scroll",
  direction: "up" | "down" | "left" | "right",
  amount: 3  // multiplied by 100 for visibility
}
```

### **Control Actions**

```typescript
// Wait/delay
{
  action: "wait",
  duration: 2000  // milliseconds
}

// Task complete
{
  action: "task_complete",
  reason: "Successfully opened Notepad and wrote poem"
}

// Task failed
{
  action: "task_failed",
  reason: "Application not found"
}
```

---

## 🧠 AI Prompt Engineering

The agent uses a carefully crafted prompt for Gemini Vision:

```
You are an AI assistant that can control a computer by seeing the screen.

GOAL: [User's task goal]
Current Step: [Step number]
Previous actions: [History of what was done]

Your Task: Analyze the screenshot and determine the next action.

Available Actions: [Full action list]

Response Format (JSON ONLY):
{
  "observation": "What you see on screen",
  "thinking": "Your reasoning",
  "action": { ... },
  "confidence": 0.0-1.0,
  "estimated_progress": 0-100
}
```

### **Key Prompt Features:**

- Provides full context and history
- Lists all available actions
- Requests structured JSON response
- Asks for reasoning (thinking)
- Tracks confidence and progress
- Emphasizes precision with coordinates

---

## 💾 Database Schema

### `computerUseTasks` Table

```typescript
{
  userId: Id<"users">,              // Task owner
  goal: string,                     // What to accomplish
  description?: string,             // Optional details
  status: "pending" | "running" | 
          "completed" | "failed" | 
          "cancelled",              // Current status
  createdAt: number,                // Timestamp
  updatedAt: number,                // Last update
  error?: string,                   // Error message if failed
  steps: Array<{
    timestamp: number,              // When action occurred
    analysis: string,               // AI observation + thinking
    action: {
      type: string,                 // Action type
      details: any,                 // Action parameters
    },
    result?: string,                // Execution result
  }>,
}
```

**Index**: `by_user` for fast user queries

---

## 🔧 Configuration

### **Agent Settings**

```typescript
class ComputerUseAgent {
  screenshotInterval = 3000;  // 3 seconds between screenshots
  maxRetries = 3;             // Retry failed actions 3 times
  maxSteps = 100;             // Maximum steps per task
  
  mouse.config = {
    autoDelayMs: 100,         // 100ms delay between actions
    mouseSpeed: 1000,         // 1000 pixels per second
  };
}
```

### **Image Processing**

```typescript
// Screenshot compression
sharp(screenshot)
  .resize(1280, 720, { 
    fit: 'inside', 
    withoutEnlargement: true 
  })
  .png({ 
    quality: 80, 
    compressionLevel: 9 
  })
```

---

## 🎯 Example Tasks

### **Simple Task**

```
Goal: "Open Calculator and compute 25 * 4"

Steps:
1. Look for Start menu
2. Click Start menu button
3. Type "calculator"
4. Click Calculator app
5. Click "2"
6. Click "5"
7. Click "*"
8. Click "4"
9. Click "="
10. Task complete
```

### **Complex Task**

```
Goal: "Open Notepad, write a haiku about AI, and save it"

Steps:
1. Open Start menu
2. Search for Notepad
3. Launch Notepad
4. Wait for window to open
5. Type haiku (3 lines)
6. Click File menu
7. Click Save As
8. Type filename "ai_haiku.txt"
9. Click Save button
10. Task complete
```

### **Web Task**

```
Goal: "Search YouTube for 'programming tutorials'"

Steps:
1. Detect browser icon
2. Click browser
3. Wait for browser to load
4. Click address bar
5. Type "youtube.com"
6. Press Enter
7. Wait for YouTube to load
8. Click search box
9. Type "programming tutorials"
10. Press Enter
11. Task complete
```

---

## 🛡️ Safety Features

### **Built-in Protections:**

1. **Step Limit**
    - Maximum 100 steps per task
    - Prevents infinite loops
    - Automatically fails if exceeded

2. **Retry Logic**
    - 3 automatic retries on failure
    - Prevents single-error failures
    - Logs each attempt

3. **User Control**
    - Stop button always available
    - Manual cancellation anytime
    - Graceful shutdown

4. **Error Handling**
    - Try-catch on every action
    - Detailed error messages
    - Database error tracking

5. **Scope Limiting**
    - No file system access beyond standard UI
    - No direct system commands
    - Only mouse/keyboard actions

---

## 🚀 Running the Agent

### **Start Everything:**

```bash
npm run dev
```

This starts:

- Frontend (Vite) on http://localhost:5173
- Backend (Convex)
- Agent Server (Express) on http://localhost:3001

### **Start Agent Server Only:**

```bash
npm run dev:agent
```

### **API Endpoints:**

```
POST /api/computer-use/start
Body: { taskId, goal }
Response: { success: true }

POST /api/computer-use/stop
Response: { success: true }

GET /api/computer-use/status
Response: { isRunning, currentTask }

GET /api/health
Response: { status, timestamp, agentRunning }
```

---

## 📱 User Interface

### **Floating Button**

- Purple robot icon (🤖)
- Bottom-right corner
- Click to expand panel

### **Expanded Panel**

- **Header**: Title and close button
- **Active Task**: Current task status and steps
- **New Task Form**: Goal and description inputs
- **Recent Tasks**: Last 5 tasks with status
- **Info Box**: Capabilities and features

### **Status Indicators**

- 🔄 Running (Blue)
- ✅ Completed (Green)
- ❌ Failed (Red)
- ⏸️ Cancelled (Yellow)
- ⏳ Pending (Gray)

---

## 🔍 Debugging

### **Logs to Check:**

1. **Agent Server Console**
   ```
   === Step 1 ===
   AI Analysis: { observation, thinking, action }
   Executing action: mouse_move
   Moved mouse to (500, 300)
   ```

2. **Browser Console**
   ```
   Task started: [taskId]
   Status update: running
   Step added: [step details]
   ```

3. **Database (Convex Dashboard)**
    - View all tasks
    - Check step history
    - See error messages

---

## ⚙️ Technical Stack

### **Dependencies:**

```json
{
  "screenshot-desktop": "^1.15.3",    // Screen capture
  "@nut-tree-fork/nut-js": "^4.2.6",  // Mouse/keyboard control
  "sharp": "^0.34.5",                 // Image processing
  "@google/generative-ai": "^0.24.1", // Gemini AI SDK
  "express": "^5.1.0",                // HTTP server
  "cors": "^2.8.5",                   // CORS middleware
  "tsx": "^4.20.6"                    // TypeScript execution
}
```

### **Platform Support:**

- ✅ Windows (fully tested)
- ✅ macOS (supported by nut.js)
- ✅ Linux (supported by nut.js)

---

## 🎓 How It Learns

The agent doesn't learn in traditional ML sense, but it adapts through:

1. **Context Awareness**
    - Previous steps inform future decisions
    - Builds understanding of the task state
    - Avoids repeating failed actions

2. **Visual Understanding**
    - Gemini Vision analyzes each screenshot
    - Identifies UI elements
    - Understands visual context

3. **Reasoning Chain**
    - Each response includes "thinking"
    - AI explains its reasoning
    - Builds logical action sequences

---

## 🚀 Future Enhancements

Potential improvements:

1. **Voice Integration**
    - Start tasks via voice command
    - Voice progress updates
    - Natural language task descriptions

2. **Learning from History**
    - Optimize repeated tasks
    - Remember successful patterns
    - User-specific adaptations

3. **Multi-Monitor Support**
    - Detect and use multiple screens
    - Cross-monitor actions

4. **Application-Specific Plugins**
    - Pre-built task templates
    - Application shortcuts
    - Common workflow automation

5. **Collaborative Tasks**
    - Multiple agents working together
    - Parallel task execution
    - Distributed computing

6. **Advanced Vision**
    - OCR for text extraction
    - Icon/button detection
    - UI element recognition

---

## ⚠️ Limitations

### **Current Limitations:**

1. **Speed**: 3-second intervals between actions (can be adjusted)
2. **Complexity**: Best for UI-based tasks, not system administration
3. **Context**: Limited to visible screen content
4. **Cost**: Gemini API calls per screenshot
5. **Precision**: Coordinate-based clicking (no native element detection)
6. **Windows Only (nut.js)**: Prebuilt binaries primarily for Windows

### **Not Suitable For:**

- Real-time gaming
- Video editing
- Complex system administration
- Security-sensitive operations
- Tasks requiring instant response

---

## 🎉 Success Stories

Example tasks successfully completed:

✅ Opening applications and typing documents
✅ Searching and navigating websites
✅ Filling out forms
✅ Moving and organizing files (via File Explorer)
✅ Creating and editing notes
✅ Searching and playing media
✅ Basic calculator operations
✅ Taking and organizing screenshots
✅ Opening multiple applications sequentially

---

## 📞 Support

If you encounter issues:

1. Check agent server logs
2. Verify Gemini API key in `.env.local`
3. Ensure port 3001 is available
4. Check screenshot permissions
5. Review task history in Convex dashboard

---

## 🏆 The Vision

This Computer Use Agent brings Cipher closer to being a true **JARVIS/FRIDAY-like AI assistant** that can:

- Understand natural language goals
- See and interpret your screen
- Take autonomous actions
- Complete complex multi-step tasks
- Learn from experience
- Assist with ANYTHING on your computer

**Welcome to the future of computer automation! 🚀**
