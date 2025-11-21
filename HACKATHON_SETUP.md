# 🏆 Cipher AI Assistant - Hackathon Setup Guide

## The Complete JARVIS/FRIDAY AI Assistant for Your Hackathon Demo!

---

## 🎯 What Is This?

**Cipher** is a complete AI-powered voice assistant with **autonomous computer control**. It can:

- 🎤 **Voice Commands** - Natural language understanding
- 👀 **See Your Screen** - Gemini Vision AI
- 🖱️ **Control Mouse** - Click, drag, move
- ⌨️ **Control Keyboard** - Type, shortcuts
- 🤖 **Autonomous Tasks** - Multi-step workflows
- 🐍 **Python Backend** - Reliable PyAutoGUI automation

**Perfect for hackathon demos!**

---

## 🚀 Quick Start (5 Minutes)

### **Step 1: Clone & Install**

```bash
git clone https://github.com/Yashp002/Cipher.git
cd Cipher
git checkout Yash-model  # Use the hackathon branch!
npm install
```

### **Step 2: Configure Environment**

Create `.env.local` in root directory:

```env
# Convex Backend
CONVEX_DEPLOY_KEY=your_key_here
CONVEX_DEPLOYMENT=your_deployment_here
VITE_CONVEX_URL=your_url_here

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
```

Get Gemini API key: https://makersuite.google.com/app/apikey

### **Step 3: Start Python Bridge** (NEW!)

**Windows:**

```bash
cd python_bridge
start_python_bridge.bat
```

**Mac/Linux:**

```bash
cd python_bridge
chmod +x start_python_bridge.sh
./start_python_bridge.sh
```

This starts the Python automation server on port 5000.

### **Step 4: Start Cipher**

In a **new terminal**:

```bash
npm run dev
```

This starts:

- ✅ Frontend (port 5173)
- ✅ Convex backend
- ✅ Agent server (port 3001)

### **Step 5: Demo Time!**

1. Open http://localhost:5173
2. Sign in (anonymous works)
3. **Voice Commands**: Click red interface, say "What time is it?"
4. **Computer Control**: Click purple robot icon, enter task!

---

## 🎭 Demo Tasks for Judges

### **Level 1: Simple Voice Commands** (30 seconds)

1. Click voice interface (red)
2. Say: "What time is it?"
3. Say: "Calculate 25 times 4"
4. Say: "Search YouTube for AI tutorials"

### **Level 2: Computer Automation** (2 minutes)

1. Click robot icon (purple, bottom-right)
2. Task: "Open Calculator"
3. Watch it work automatically!
4. Try: "Open Notepad and type 'Hello Hackathon!'"

### **Level 3: Complex Workflows** (3-5 minutes)

1. Task: "Open Calculator, compute 100 + 250, then open Notepad and type the answer"
2. Task: "Search Google for 'AI automation'"
3. Task: "Open File Explorer and navigate to Documents"

### **The WOW Factor:**

- Show the AI **seeing** the screen
- Show it **thinking** about what to do
- Show it **executing** actions automatically
- Show **progress tracking** in real-time

---

## 🎨 Unique Features (Impress the Judges!)

### **1. Dual Interface System**

- **Red Interface**: Voice commands
- **Purple Interface**: Computer automation
- Both work simultaneously!

### **2. AI Vision + Reasoning**

- Gemini Vision sees the screen
- Provides reasoning ("thinking" field)
- Shows confidence scores
- Tracks progress percentage

### **3. Python + TypeScript Hybrid**

- Node.js frontend/backend
- Python for desktop automation
- REST API bridge
- Best of both worlds!

### **4. Safety Features**

- FAILSAFE: Mouse to corner = emergency stop
- Max 100 steps per task
- 3 automatic retries
- User can stop anytime

### **5. Complete Task History**

- Every action recorded
- View past tasks
- See what AI thought
- Full transparency

---

## 📊 Architecture Diagram (Show This!)

```
┌─────────────────────────────────────────────┐
│         User Interface (React)              │
│  • Voice Commands (Red)                     │
│  • Computer Control (Purple)                │
└────────────┬────────────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
┌──────────┐  ┌──────────────────┐
│  Convex  │  │  Express Server  │
│ Backend  │  │   (Port 3001)    │
└──────────┘  └─────────┬────────┘
                        │
                        ▼
              ┌──────────────────┐
              │  Python Bridge   │
              │  (Port 5000)     │
              │  • PyAutoGUI     │
              │  • OpenCV        │
              │  • FAILSAFE      │
              └──────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │  Your Computer   │
              │  • Mouse/Keyboard│
              │  • Screen Capture│
              │  • Applications  │
              └──────────────────┘
```

---

## 🎤 Pitch Points for Judges

### **Problem:**

"People waste hours on repetitive computer tasks. Current automation tools require coding skills or are unreliable."

### **Solution:**

"Cipher is a true AI assistant that sees your screen like a human, understands natural language, and controls your
computer autonomously."

### **Technology:**

- Gemini Vision AI for visual understanding
- PyAutoGUI for reliable cross-platform control
- React + Convex for modern web stack
- TypeScript + Python hybrid architecture

### **Unique Value:**

1. **No coding required** - Just tell it what to do
2. **Sees the screen** - Understands visual context
3. **Safe & reliable** - FAILSAFE protection, retry logic
4. **Cross-platform** - Works on Windows, Mac, Linux
5. **Complete transparency** - See every action, every decision

### **Market:**

- Accessibility (people with disabilities)
- Productivity (automate repetitive work)
- Testing (automated UI testing)
- Data extraction (legacy applications)

---

## 🐛 Quick Fixes

### **Python Bridge Won't Start**

```bash
# Install Python 3.8+
python --version

# Install dependencies manually
pip install flask flask-cors pyautogui opencv-python numpy pillow
```

### **Port Already in Use**

```bash
# Kill process on port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### **Actions Not Working**

1. Check Python bridge is running (green terminal output)
2. Visit http://localhost:5000/health
3. Check computer use agent server (port 3001)
4. Look at browser console for errors

---

## 📹 Demo Script

**Opening (30 sec):**
"Hi, I'm [Name] and this is Cipher - a true AI assistant that can control your computer like a human."

**Voice Demo (1 min):**
"First, let me show you voice commands..." [Demo 3 voice commands]

**Computer Control Demo (2 min):**
"Now for the exciting part - autonomous computer control..." [Demo simple task]

**Complex Task Demo (2 min):**
"Watch as Cipher completes a multi-step task..." [Demo complex workflow]

**Show Technology (1 min):**
"Let me show you how it works..." [Show AI thinking, screen analysis]

**Closing (30 sec):**
"Cipher makes computer automation accessible to everyone. No coding needed - just tell it what you want."

**Total: ~7 minutes** (perfect for hackathon presentations)

---

## 🎯 Judging Criteria Alignment

### **Innovation:**

- ✅ Gemini Vision for screen analysis
- ✅ Hybrid Python/TypeScript architecture
- ✅ Autonomous multi-step execution
- ✅ Real-time reasoning transparency

### **Technical Complexity:**

- ✅ Multiple technologies integrated
- ✅ REST API bridge between languages
- ✅ Computer vision (OpenCV)
- ✅ AI reasoning and decision making
- ✅ State management and retry logic

### **User Experience:**

- ✅ Beautiful, intuitive UI
- ✅ Real-time progress tracking
- ✅ Natural language input
- ✅ Visual feedback
- ✅ Error handling

### **Practicality:**

- ✅ Solves real problem
- ✅ Works cross-platform
- ✅ Safety features
- ✅ Production-ready architecture

### **Presentation:**

- ✅ Live demo ready
- ✅ Clear value proposition
- ✅ Technical depth
- ✅ Market potential

---

## 🎨 UI Highlights

### **Main Screen:**

- Dark theme (professional)
- Red accent (voice commands)
- Purple accent (computer control)
- Clean, modern design

### **Voice Interface (Red):**

- Draggable
- Color-coded states (idle/listening/processing/speaking)
- Manual control
- Settings panel

### **Computer Use Interface (Purple):**

- Floating robot icon
- Task creation form
- Real-time step display
- Task history
- Status indicators

---

## 🔥 Power Features

### **1. Image Recognition**

```python
# Find button on screen
POST /locate/image
{
  "template_image": "base64_image_of_button",
  "confidence": 0.8
}
```

### **2. Keyboard Shortcuts**

```python
# Ctrl+C
POST /keyboard/hotkey
{
  "keys": ["ctrl", "c"]
}
```

### **3. Mouse Dragging**

```python
# Drag from point A to B
POST /mouse/drag
{
  "x1": 100, "y1": 100,
  "x2": 500, "y2": 300
}
```

### **4. Regional Screenshots**

```python
# Screenshot specific area
POST /screenshot
{
  "region": {
    "x": 0, "y": 0,
    "width": 800, "height": 600
  }
}
```

---

## 📦 What's Included

### **Frontend:**

- ✅ React 19
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ Modern UI components

### **Backend:**

- ✅ Convex (serverless)
- ✅ Convex Auth
- ✅ Express API server
- ✅ WebSocket support

### **AI:**

- ✅ Gemini Vision
- ✅ Gemini Pro
- ✅ Natural language processing
- ✅ Computer vision

### **Automation:**

- ✅ PyAutoGUI
- ✅ OpenCV
- ✅ Pillow
- ✅ MSS (screenshots)

### **Documentation:**

- ✅ Complete API docs
- ✅ Setup guides
- ✅ Architecture diagrams
- ✅ Example tasks

---

## 🏆 Win Strategy

1. **Start Strong**: Voice commands in first 30 seconds
2. **Show Autonomy**: Computer control demo
3. **Explain Tech**: Show AI reasoning
4. **Demonstrate Safety**: Show FAILSAFE
5. **End Big**: Complex multi-step task

**Key Message**: "This is the closest thing to JARVIS that exists today!"

---

## 📞 Support During Hackathon

### **Quick Checks:**

```bash
# Check Python bridge
curl http://localhost:5000/health

# Check agent server
curl http://localhost:3001/api/health

# Check frontend
curl http://localhost:5173
```

### **Logs to Watch:**

1. Python Bridge Terminal (server.py output)
2. npm run dev terminal (Vite/Convex/Express)
3. Browser Console (F12)

### **Emergency Reset:**

```bash
# Kill all
Ctrl+C on all terminals

# Restart
cd python_bridge && python server.py
# New terminal
npm run dev
```

---

## 🎉 You're Ready!

You now have:

- ✅ Complete AI assistant
- ✅ Voice commands
- ✅ Autonomous computer control
- ✅ Beautiful UI
- ✅ Safety features
- ✅ Demo script
- ✅ Technical depth

**Go win that hackathon! 🏆**

---

## 📚 Additional Resources

- **Full Documentation**: See `COMPLETE_APP_DOCUMENTATION.md`
- **Computer Use Guide**: See `COMPUTER_USE_AGENT.md`
- **Python Bridge Guide**: See `PYTHON_BRIDGE.md`
- **API Reference**: See `python_bridge/server.py`

**Questions during hackathon? Check the docs!**

Good luck! 🚀
