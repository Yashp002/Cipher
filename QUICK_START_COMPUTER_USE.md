# 🚀 Computer Use Agent - Quick Start Guide

## Get Started in 5 Minutes!

### Prerequisites

✅ Node.js 16+ installed
✅ Git repository cloned
✅ Gemini API key ready

---

## Step 1: Install Dependencies

All packages are already installed! If you need to reinstall:

```bash
npm install
```

---

## Step 2: Configure Environment

Your `.env.local` should already have:

```env
# Existing keys
CONVEX_DEPLOY_KEY=...
CONVEX_DEPLOYMENT=...
VITE_CONVEX_URL=...

# Gemini AI (already set)
GEMINI_API_KEY=your_key_here
```

---

## Step 3: Start All Services

```bash
npm run dev
```

This starts:

- ✅ Frontend (Vite) - http://localhost:5173
- ✅ Backend (Convex) - Database and auth
- ✅ Agent Server (Express) - http://localhost:3001

---

## Step 4: Use the Computer Use Agent

### In the Browser:

1. **Sign In**
    - Open http://localhost:5173
    - Sign in (email/password or anonymous)

2. **Open Computer Use Interface**
    - Look for purple robot icon (🤖) in bottom-right
    - Click to expand panel

3. **Create a Task**
   ```
   Goal: "Open Notepad and type 'Hello AI!'"
   ```

4. **Start Agent**
    - Click "🚀 Start Agent"
    - Watch it work!

5. **Monitor Progress**
    - See real-time step updates
    - View AI observations
    - Check completion status

---

## Example Tasks to Try

### Beginner Tasks:

```
✅ "Open Calculator and compute 100 + 250"
✅ "Open Notepad"
✅ "Type 'Testing Computer Use Agent'"
```

### Intermediate Tasks:

```
✅ "Open Notepad and write a short poem"
✅ "Open File Explorer and navigate to Documents"
✅ "Search Google for 'AI automation'"
```

### Advanced Tasks:

```
✅ "Open Notepad, write a haiku, and save it as poem.txt"
✅ "Search YouTube for AI tutorials and open the first result"
✅ "Open Calculator, compute 25*4, then open Notepad and type the answer"
```

---

## Troubleshooting

### Agent Not Starting?

1. **Check Port 3001**
   ```bash
   # Windows
   netstat -ano | findstr :3001
   
   # Kill if occupied
   taskkill /PID <PID> /F
   ```

2. **Check Logs**
    - Agent Server console
    - Browser DevTools console
    - Convex dashboard

3. **Verify API Key**
   ```bash
   # Check .env.local
   cat .env.local | grep GEMINI_API_KEY
   ```

### Screenshot Issues?

- Grant screen recording permissions (macOS)
- Run as administrator (Windows if needed)
- Check screenshot-desktop installation

### Actions Not Executing?

- Close any security software temporarily
- Verify nut.js installation
- Check mouse/keyboard permissions

---

## API Testing

Test the agent server directly:

```bash
# Health check
curl http://localhost:3001/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-11-21T...",
  "agentRunning": false
}
```

---

## File Structure

```
cipher_voice_assistant/
├── src/
│   ├── computerUse/
│   │   └── ComputerUseAgent.ts      # Core agent engine
│   └── components/
│       └── ComputerUseInterface.tsx  # UI component
├── server/
│   └── computerUseServer.ts          # Express API server
├── convex/
│   ├── computerUse.ts                # Backend logic
│   └── schema.ts                     # Database schema
└── COMPUTER_USE_AGENT.md             # Full documentation
```

---

## Development Tips

### Adjust Screenshot Interval

```typescript
// src/computerUse/ComputerUseAgent.ts
private screenshotInterval = 3000; // Change to 1000 for faster
```

### Adjust Mouse Speed

```typescript
// src/computerUse/ComputerUseAgent.ts
mouse.config.mouseSpeed = 1000; // Increase for faster movement
```

### Increase Max Steps

```typescript
// src/computerUse/ComputerUseAgent.ts
const maxSteps = 100; // Increase for complex tasks
```

---

## Common Patterns

### Sequential App Launch

```
Goal: "Open Calculator, then Notepad, then Chrome"
```

### Form Filling

```
Goal: "Open Notepad and write:
Name: John Doe
Email: john@example.com
Age: 30"
```

### File Operations

```
Goal: "Open File Explorer, go to Documents, create new folder named 'AI Test'"
```

### Web Navigation

```
Goal: "Open browser, go to google.com, search for 'AI automation'"
```

---

## Safety Tips

1. **Start Simple**: Test with basic tasks first
2. **Monitor Closely**: Watch the first few runs
3. **Use Stop Button**: Don't hesitate to stop if needed
4. **Backup Important Files**: Before automation
5. **Test in Safe Environment**: Use test accounts/files

---

## Performance Tips

1. **Reduce Screenshot Interval**: For faster execution
2. **Increase Mouse Speed**: For quicker movements
3. **Use Specific Coordinates**: More accurate than detection
4. **Close Unnecessary Apps**: Reduce screen complexity
5. **Maximize Target Windows**: Easier for AI to see

---

## Next Steps

### Learn More:

- Read [COMPUTER_USE_AGENT.md](./COMPUTER_USE_AGENT.md) for full docs
- Study the agent code in `src/computerUse/`
- Check Convex dashboard for task history

### Customize:

- Modify AI prompts for better accuracy
- Add custom action types
- Create task templates
- Build automation workflows

### Extend:

- Add voice command integration
- Build task scheduler
- Create application-specific plugins
- Implement learning/optimization

---

## 🎉 You're Ready!

The Computer Use Agent is now running and ready to automate ANY visual task on your computer!

**Try it out and watch the magic happen! 🚀**
