# 🎯 How to Use Cipher Voice Assistant - Complete Guide

## ✅ **ALL ISSUES FIXED!**

### What Was Wrong:

1. ❌ Auto Mode started before services were ready
2. ❌ No visual indication of service status
3. ❌ Voice input taken but not processed
4. ❌ No feedback when services unavailable

### What's Fixed:

1. ✅ System status indicator shows if services are running
2. ✅ Auto Mode only enables when services are ready
3. ✅ Clear error messages if services missing
4. ✅ Proper voice-to-automation pipeline

---

## 🚀 **Step-by-Step Setup**

### **Step 1: Start the Application**

Open your terminal in the project directory and run:

```bash
npm run dev
```

This will start:

- ✅ **Vite frontend** (port 5173)
- ✅ **Convex backend** (your deployment)
- ✅ **Agent Server** (port 3001)
- ✅ **Python Bridge** (port 5000) - Auto-starts!

### **Step 2: Wait for Everything to Start**

**First Time (2-5 minutes):**

```
🔧 Checking Python Bridge setup...
📦 First-time setup required...
⏳ Installing Python dependencies...
[Wait for installation...]
✅ Python Bridge setup complete!
🐍 Starting Python Bridge...
✅ Python Bridge ready on http://localhost:5000

🚀 CIPHER - All Systems Ready!
```

**Every Other Time (~5 seconds):**

```
✅ Python Bridge already set up
🐍 Starting Python Bridge...
✅ Python Bridge ready on http://localhost:5000

🚀 CIPHER - All Systems Ready!
```

### **Step 3: Open the Application**

1. Go to **http://localhost:5173** in your browser
2. **Sign in** (or use anonymous mode)

### **Step 4: Check System Status**

1. Look for the **red circle** in the top-left corner
2. Click it to **expand** the Cipher interface
3. Check the **🔌 System Status** section:

```
🔌 System Status
Agent Server:    ✅ Running
Python Bridge:   ✅ Running
```

**Both must be green!** ✅

If either shows **❌ Offline**, make sure `npm run dev` is running.

### **Step 5: Enable Auto Mode**

1. Toggle **"Auto Mode"** to ON (red switch)
2. You'll see a toast: **"🎤 Auto Mode enabled - Just speak!"**
3. The interface turns **blue** (listening state)

### **Step 6: Start Speaking!**

Now just **speak naturally**:

---

## 🎤 **Example Commands**

### **Voice Responses (No Automation):**

```
YOU: "What time is it?"
CIPHER: "The current time is 3:45 PM"

YOU: "Calculate 25 times 4"
CIPHER: "100"

YOU: "What's the weather in New York?"
[Opens weather search]
```

### **Computer Automation:**

```
YOU: "Open Calculator"
[Cipher detects "open" → Computer automation]
CIPHER: "Starting automation: Open Calculator"
[Calculator opens automatically!]

YOU: "Open Notepad"
[Notepad opens]

YOU: "Type Hello World"
[Types in active window]

YOU: "Open Notepad and type Hello AI"
[Opens Notepad, then types "Hello AI"]
```

---

## 🎯 **How It Works**

### **The Intelligence:**

Cipher analyzes every command and decides:

**Contains automation keywords?** → Computer automation

- open, launch, click, type, navigate, etc.

**Doesn't?** → Voice response

- calculate, what, search, tell me, etc.

### **The Flow:**

```
1. You speak → "Open Calculator"
   ↓
2. Voice Recognition detects silence (1-2 seconds)
   ↓
3. Cipher analyzes: "Contains 'open' → Needs automation!"
   ↓
4. Sends to Gemini Vision AI:
   - Takes screenshot
   - "Where is Calculator? How do I open it?"
   ↓
5. Gemini responds:
   {action: "key_press", key: "cmd", description: "Open Start menu"}
   ↓
6. Python Bridge executes:
   - Presses Windows key
   - Types "calculator"
   - Presses Enter
   ↓
7. Calculator opens! ✅
   ↓
8. Cipher returns to listening mode
```

---

## 🔧 **Troubleshooting**

### **Problem: "Agent server not running"**

**Solution:**

```bash
# Make sure npm run dev is running
npm run dev
```

Wait for:

```
✅ Python Bridge ready on http://localhost:5000
🚀 CIPHER - All Systems Ready!
```

### **Problem: "Python Bridge not running"**

**Check if Python Bridge started:**

```bash
# In your npm run dev output, look for:
✅ Python Bridge ready on http://localhost:5000
```

**If not starting:**

```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# If something is using it, kill it:
taskkill /PID <PID_NUMBER> /F

# Then restart
npm run dev
```

### **Problem: Voice input not working**

**Check:**

1. ✅ Auto Mode is **ON** (red switch)
2. ✅ System Status shows **both green**
3. ✅ Interface is **blue** (listening)
4. ✅ Browser has **microphone permissions**

**To fix:**

- Click the lock icon in browser address bar
- Enable microphone permissions
- Refresh the page

### **Problem: "Nothing happens when I speak"**

**Checklist:**

1. Is Auto Mode **ON**? (Toggle it)
2. Is the interface **blue**? (Should be listening)
3. Are you speaking **clearly** into the mic?
4. Wait **1-2 seconds of silence** after speaking
5. Check the browser console for errors (F12)

### **Problem: Automation doesn't work**

**Check Python Bridge:**

```bash
# Test if Python Bridge is responsive
curl http://localhost:5000/health
```

Should return:

```json
{
  "status": "ok",
  "service": "PythonBridge",
  "version": "1.0.0"
}
```

**If not working:**

- Port 5000 might be in use
- Python dependencies not installed
- Try deleting `python_bridge/venv` folder and restart

---

## 🎭 **Best Practices**

### **For Best Results:**

1. **Speak clearly** - Enunciate your words
2. **Wait for silence** - Pause 1-2 seconds after speaking
3. **One command at a time** - Don't rush
4. **Be specific** - "Open Calculator" not "Open calc"
5. **Check status** - Make sure services are running

### **Command Tips:**

✅ **Good:**

- "Open Calculator"
- "Launch Notepad"
- "Type Hello World"
- "What time is it?"

❌ **Avoid:**

- "Uh... open... um... calculator"
- Speaking while music is playing
- Multiple commands without pausing
- Mumbling or too quiet

---

## 🏆 **For Your Hackathon Demo**

### **Demo Script (2 minutes):**

**1. Introduction (20s)**

```
"Meet Cipher - a true AI assistant that sees and controls 
your computer like a human. Let me show you."
```

**2. Simple Voice (20s)**

```
[Enable Auto Mode]
"What time is it?"
[Cipher responds]

"Calculate 25 times 4"
[Cipher says "100"]
```

**3. Computer Automation (40s)**

```
"Open Calculator"
[Calculator opens - WOW!]

"Open Notepad"
[Notepad opens]

"Type Hello Judges"
[Types in Notepad - AMAZING!]
```

**4. Explain Technology (20s)**

```
"Cipher uses Gemini Vision AI to see the screen,
Python automation to control the computer,
and intelligent routing to decide what needs automation."
```

**5. Key Points (20s)**

```
"One command to start. No coding required.
Works on any computer. Safe with FAILSAFE.
Voice + Vision + Automation = Future of AI assistants!"
```

---

## 📊 **What Makes This Special**

### **Unique Features:**

1. **🧠 Intelligent Routing** - Automatically decides voice vs automation
2. **👀 Computer Vision** - Sees screen like a human
3. **🤖 Full Automation** - Controls mouse, keyboard, everything
4. **🎤 Continuous Listening** - No button clicks needed
5. **🔒 Safe** - FAILSAFE protection (move mouse to corner = abort)
6. **🚀 One Command** - Just `npm run dev` and go!

### **Technology Stack:**

- **Frontend**: React + TypeScript + Vite
- **Backend**: Convex (serverless)
- **AI**: Google Gemini Vision API
- **Automation**: Python + PyAutoGUI + OpenCV
- **Voice**: Web Speech API
- **Architecture**: Hybrid Node.js + Python

---

## ✅ **You're Ready!**

Everything is fixed and working! Now:

1. Run `npm run dev`
2. Enable Auto Mode
3. Start speaking
4. Watch the magic happen! ✨

**For hackathon - this will absolutely stand out! 🏆**

Questions? Issues? Check the troubleshooting section above or look at the error messages in the console - they're
designed to be helpful!

**Go crush that hackathon! 🚀**
