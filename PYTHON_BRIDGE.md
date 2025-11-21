# 🐍 PythonBridge - Desktop Automation Backend

## Overview

**PythonBridge** is a Flask-based REST API server that provides reliable, cross-platform desktop automation using
PyAutoGUI. It replaces the nut.js implementation with Python for superior compatibility and features.

---

## 🎯 Why Python Bridge?

### **Advantages over nut.js:**

1. **Better Cross-Platform Support**
    - ✅ Works perfectly on Windows, macOS, Linux
    - ✅ No native compilation required
    - ✅ No Visual Studio Build Tools needed

2. **More Reliable**
    - ✅ PyAutoGUI is battle-tested and widely used
    - ✅ Better error handling
    - ✅ FAILSAFE protection (mouse to corner = abort)

3. **More Features**
    - ✅ Image recognition with OpenCV template matching
    - ✅ Optional OCR text detection (pytesseract)
    - ✅ Mouse dragging
    - ✅ Keyboard shortcuts/hotkeys
    - ✅ Regional screenshots

4. **Easier Setup**
    - ✅ Simple pip install
    - ✅ No complex dependencies
    - ✅ Virtual environment support

---

## 🏗️ Architecture

```
┌──────────────────────────────────────┐
│   Cipher Frontend (React)           │
│   ComputerUseInterface               │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│   Node.js Server (Port 3001)        │
│   computerUseServer.ts               │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│   ComputerUseAgentPython             │
│   PythonBridgeClient.ts              │
└────────────┬─────────────────────────┘
             │ HTTP REST API
             ▼
┌──────────────────────────────────────┐
│   Python Flask Server (Port 5000)   │
│   server.py                          │
│   • PyAutoGUI                        │
│   • OpenCV                           │
│   • Pillow                           │
└──────────────────────────────────────┘
```

---

## 📦 Installation

### **Prerequisites:**

- Python 3.8 or higher
- pip (Python package manager)

### **Setup:**

#### **Windows:**

```bash
cd python_bridge
start_python_bridge.bat
```

#### **macOS/Linux:**

```bash
cd python_bridge
chmod +x start_python_bridge.sh
./start_python_bridge.sh
```

#### **Manual Setup:**

```bash
cd python_bridge
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python server.py
```

---

## 🎮 API Endpoints

### **Mouse Actions**

#### `POST /mouse/move`

Move mouse to coordinates

```json
{
  "x": 500,
  "y": 300,
  "duration": 0.5
}
```

#### `POST /mouse/click`

Click mouse button

```json
{
  "button": "left",  // "left", "right", "middle"
  "clicks": 1,
  "interval": 0.1
}
```

#### `POST /mouse/drag`

Drag mouse between points

```json
{
  "x1": 100,
  "y1": 100,
  "x2": 500,
  "y2": 300,
  "duration": 0.5,
  "button": "left"
}
```

#### `POST /mouse/scroll`

Scroll mouse wheel

```json
{
  "amount": 3,
  "direction": "down"  // "up" or "down"
}
```

#### `GET /mouse/position`

Get current mouse position

```json
Response: {
  "success": true,
  "x": 450,
  "y": 320
}
```

---

### **Keyboard Actions**

#### `POST /keyboard/type`

Type text

```json
{
  "text": "Hello, World!",
  "interval": 0.05  // Delay between characters
}
```

#### `POST /keyboard/press`

Press key(s)

```json
// Single key
{
  "keys": "enter"
}

// Key combo
{
  "keys": ["ctrl", "c"]
}

// Multiple presses
{
  "keys": "a",
  "presses": 3
}
```

#### `POST /keyboard/hotkey`

Press keyboard shortcut

```json
{
  "keys": ["ctrl", "shift", "s"]
}
```

**Supported Keys:**

- Letter keys: `a-z`
- Number keys: `0-9`
- Function keys: `f1-f12`
- Special keys: `enter`, `tab`, `space`, `backspace`, `delete`, `escape`
- Arrow keys: `up`, `down`, `left`, `right`
- Modifiers: `ctrl`, `alt`, `shift`, `win` (Windows), `command` (Mac)
- And many more...

---

### **Screen Actions**

#### `POST /screenshot` or `GET /screenshot`

Take screenshot (returns base64 PNG)

```json
// Full screen
{}

// Region
{
  "region": {
    "x": 0,
    "y": 0,
    "width": 1920,
    "height": 1080
  }
}

Response: {
  "success": true,
  "image": "iVBORw0KGgoAAAANSUhEUgAA...",
  "format": "png",
  "size": {
    "width": 1920,
    "height": 1080
  }
}
```

#### `GET /screen/size`

Get screen dimensions

```json
Response: {
  "success": true,
  "width": 1920,
  "height": 1080
}
```

---

### **Image Recognition**

#### `POST /locate/image`

Find image on screen using OpenCV template matching

```json
{
  "template_image": "base64_encoded_image",
  "confidence": 0.8,
  "region": {  // Optional
    "x": 0,
    "y": 0,
    "width": 1920,
    "height": 1080
  }
}

Response (found): {
  "success": true,
  "found": true,
  "x": 450,  // Center position
  "y": 320,
  "confidence": 0.92,
  "top_left": {
    "x": 425,
    "y": 305
  }
}

Response (not found): {
  "success": true,
  "found": false,
  "best_confidence": 0.65,
  "message": "Image not found..."
}
```

#### `POST /locate/text` (Optional - requires pytesseract)

Find text on screen using OCR

```json
{
  "text": "Search"
}

Response: {
  "success": true,
  "found": true,
  "x": 450,
  "y": 100,
  "text": "Search",
  "confidence": 88
}
```

---

### **Utility**

#### `POST /wait`

Sleep/pause execution

```json
{
  "duration": 2.5  // Seconds (max 60)
}
```

#### `POST /abort`

Emergency abort all actions

```json
{}
```

#### `GET /health`

Health check

```json
Response: {
  "status": "ok",
  "service": "PythonBridge",
  "version": "1.0.0",
  "screen_size": {
    "width": 1920,
    "height": 1080
  },
  "failsafe": true,
  "pause": 0.1
}
```

---

## 🛡️ Safety Features

### **FAILSAFE Protection**

Move your mouse to the **top-left corner** of your screen to immediately abort all PyAutoGUI actions!

```python
pyautogui.FAILSAFE = True
```

This acts as an emergency stop button. If anything goes wrong, just slam your mouse to the corner!

### **Action Pause**

100ms delay between actions by default:

```python
pyautogui.PAUSE = 0.1
```

Prevents actions from executing too quickly.

### **Coordinate Validation**

All mouse coordinates are validated against screen bounds before execution.

### **Duration Limits**

Wait duration capped at 60 seconds to prevent indefinite hangs.

---

## 🔧 TypeScript Client

Use the provided `PythonBridgeClient` class:

```typescript
import { pythonBridge } from './PythonBridgeClient';

// Check availability
const available = await pythonBridge.isAvailable();

// Move mouse
await pythonBridge.mouseMove({ x: 500, y: 300 });

// Click
await pythonBridge.mouseClick({ button: 'left' });

// Type text
await pythonBridge.keyboardType({ text: 'Hello!' });

// Press key
await pythonBridge.keyboardPress({ keys: 'enter' });

// Hotkey
await pythonBridge.keyboardHotkey({ keys: ['ctrl', 'c'] });

// Screenshot
const screenshot = await pythonBridge.screenshot();

// Helper methods
await pythonBridge.moveAndClick(500, 300);
await pythonBridge.typeAndSubmit('Search query');
await pythonBridge.findAndClick(templateImageBase64);
```

---

## 📊 Performance

| Operation | Time |
|-----------|------|
| Mouse Move | ~50-100ms |
| Click | ~50ms |
| Type Character | ~50ms |
| Screenshot | ~200-500ms |
| Image Match | ~100-300ms |
| HTTP Overhead | ~10-20ms |

**Total average per action: ~200-500ms**

---

## 🚀 Usage Examples

### **Open Calculator**

```typescript
// Take screenshot
const screen = await pythonBridge.screenshot();

// AI analyzes and finds "Start" button at (50, 1050)
await pythonBridge.mouseMove({ x: 50, y: 1050 });
await pythonBridge.mouseClick({ button: 'left' });

// Wait for menu
await pythonBridge.wait(0.5);

// Type "calc"
await pythonBridge.keyboardType({ text: 'calc' });

// Press Enter
await pythonBridge.keyboardPress({ keys: 'enter' });
```

### **Copy Text**

```typescript
// Select all
await pythonBridge.keyboardHotkey({ keys: ['ctrl', 'a'] });

// Copy
await pythonBridge.keyboardHotkey({ keys: ['ctrl', 'c'] });
```

### **Find and Click Button**

```typescript
// Load button image
const buttonImage = 'base64_encoded_image_of_button';

// Find button
const result = await pythonBridge.locateImage({
  template_image: buttonImage,
  confidence: 0.8
});

if (result.found) {
  // Click center of button
  await pythonBridge.moveAndClick(result.x, result.y);
}
```

---

## 🐛 Troubleshooting

### **Python server won't start**

1. Check Python version:
   ```bash
   python --version  # Should be 3.8+
   ```

2. Install dependencies manually:
   ```bash
   pip install flask flask-cors pyautogui opencv-python numpy pillow mss
   ```

3. Check port 5000 isn't in use:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   
   # Mac/Linux
   lsof -i :5000
   ```

### **FAILSAFE triggered unexpectedly**

Your mouse accidentally went to the top-left corner. This is a safety feature!

To disable (not recommended):

```python
pyautogui.FAILSAFE = False
```

### **Actions are slow**

Reduce the pause duration:

```python
pyautogui.PAUSE = 0.05  # 50ms instead of 100ms
```

### **Image matching not working**

1. Increase confidence threshold (lower = more lenient):
   ```json
   { "confidence": 0.6 }
   ```

2. Make sure template image matches screen DPI
3. Use larger template regions
4. Check for transparency in template image

### **Connection refused**

Make sure Python bridge is running:

```bash
cd python_bridge
python server.py
```

Check logs for errors.

---

## 🔐 Security Notes

### **Local Only**

The Python bridge **only** listens on `127.0.0.1` (localhost) - it's not accessible from other machines.

### **No Authentication**

Since it's localhost-only, there's no authentication. Don't expose it to the network!

### **CORS Enabled**

CORS is enabled for localhost development. Remove for production if needed.

---

## 📈 Comparison: Python Bridge vs nut.js

| Feature | Python Bridge | nut.js |
|---------|--------------|---------|
| Cross-Platform | ✅ Perfect | ⚠️ Good |
| Setup Difficulty | ✅ Easy | ❌ Hard (needs VS Build Tools on Windows) |
| Mouse Control | ✅ Excellent | ✅ Excellent |
| Keyboard Control | ✅ Excellent | ✅ Excellent |
| Image Recognition | ✅ OpenCV | ❌ Not included |
| OCR | ✅ Optional (pytesseract) | ❌ Not included |
| FAILSAFE | ✅ Built-in | ❌ Manual |
| Hotkeys | ✅ Easy | ⚠️ Moderate |
| Performance | ⚠️ Good (HTTP overhead) | ✅ Excellent (native) |
| Reliability | ✅ Excellent | ⚠️ Good |
| Community | ✅ Large (PyAutoGUI) | ⚠️ Smaller |

---

## 🎓 Learning Resources

- [PyAutoGUI Documentation](https://pyautogui.readthedocs.io/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [OpenCV Template Matching](https://docs.opencv.org/4.x/d4/dc6/tutorial_py_template_matching.html)

---

## 🚀 Running Everything

### **Full Stack:**

**Terminal 1 - Python Bridge:**

```bash
cd python_bridge
python server.py
```

**Terminal 2 - Cipher:**

```bash
npm run dev
```

This starts:

- ✅ Python Bridge (port 5000)
- ✅ Frontend (port 5173)
- ✅ Convex backend
- ✅ Agent server (port 3001)

---

## 🏆 Success!

You now have a **robust, reliable, cross-platform desktop automation system** powered by Python!

**Benefits:**

- ✅ No compilation issues
- ✅ Easy setup
- ✅ FAILSAFE protection
- ✅ Image recognition
- ✅ Better error handling
- ✅ More features
- ✅ Battle-tested library

**Perfect for the hackathon! 🎉**
