# 🚀 Setup Guide - Cipher Voice Assistant

## Prerequisites

You need to install Node.js and npm (Node Package Manager) to run this project.

### Step 1: Install Node.js

1. **Download Node.js:**
    - Go to: https://nodejs.org/
    - Download the **LTS version** (Long Term Support) - recommended for most users
    - Choose the Windows installer (.msi file)

2. **Install Node.js:**
    - Run the downloaded installer
    - Click "Next" through the setup wizard
    - Accept the license agreement
    - Use default installation options (it will install both Node.js and npm)
    - Click "Install"
    - Restart your computer after installation

3. **Verify Installation:**
    - Open a new PowerShell or Command Prompt window
    - Run these commands:
   ```bash
   node --version
   # Should show something like: v20.11.0
   
   npm --version
   # Should show something like: 10.2.4
   ```

## Step 2: Install Project Dependencies

Once Node.js is installed:

1. **Open PowerShell or Command Prompt**
2. **Navigate to the project folder:**
   ```bash
   cd D:/cipher_voice_assistant
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```
   This will download all required packages (React, Convex, Tailwind, etc.)
   It may take 2-5 minutes depending on your internet speed.

## Step 3: Set Up Convex (Backend)

This project uses Convex as its backend. You need to set it up:

1. **Login to Convex:**
   ```bash
   npx convex dev
   ```

2. **Follow the prompts:**
    - It will open a browser window for authentication
    - Sign in with your preferred method (GitHub, Google, etc.)
    - Create an account if you don't have one (it's free!)
    - The CLI will connect to your Convex deployment

3. **Note:** The project is already connected to deployment `shiny-robin-328`
    - If you want to use the existing deployment, you're all set
    - If you want your own deployment, you can create a new one

## Step 4: Run the Application

Once everything is installed:

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **What this does:**
    - Starts the **frontend** server (Vite) on http://localhost:5173
    - Starts the **backend** server (Convex)
    - Opens your browser automatically
    - Both servers run in watch mode (auto-reload on changes)

3. **You should see:**
    - Terminal showing both servers running
    - Browser opening to http://localhost:5173
    - The Cipher Voice Assistant interface

## Step 5: Using the Application

1. **Grant Microphone Permission:**
    - When prompted, click "Allow" for microphone access
    - This is required for voice recognition

2. **Sign In:**
    - Click "Sign in anonymously" for quick testing
    - Or create an account with email/password

3. **Start Using Cipher:**
    - Look for the floating red "C" icon (draggable)
    - Click it to expand the interface
    - Click "Start Listening" button
    - Speak your command!

## Quick Start Commands

After running `npm run dev`, the app will be live at:

- **Frontend:** http://localhost:5173
- **Convex Dashboard:** https://dashboard.convex.dev

## Example Voice Commands

Try saying these:

- "Play Riptide on YouTube"
- "What time is it?"
- "Search for weather forecast"
- "Calculate 25 times 4"
- "Open YouTube and Google"

## Troubleshooting

### "npm is not recognized"

- Node.js is not installed or not in PATH
- Restart your computer after installing Node.js
- Try opening a new terminal window

### "Port 5173 is already in use"

- Another app is using that port
- Stop the other app or change the port in `vite.config.ts`

### "Microphone not working"

- Check Windows microphone permissions
- Go to: Settings → Privacy → Microphone
- Ensure Chrome/Edge has microphone access
- Use Chrome or Edge browser (Safari/Firefox don't support Web Speech API)

### "Voice recognition not starting"

- Grant microphone permissions in browser
- Click the microphone icon in browser address bar
- Reload the page

### "Commands not working / API errors"

- Check your internet connection (Gemini API requires internet)
- The fallback system should work even if Gemini fails
- Check browser console (F12) for error messages

### Convex Connection Issues

- Make sure you're logged into Convex: `npx convex dev`
- Check the Convex dashboard: https://dashboard.convex.dev
- Verify you have internet connection

## Development Tips

### Stop the servers:

Press `Ctrl + C` in the terminal where `npm run dev` is running

### Run only frontend:

```bash
npm run dev:frontend
```

### Run only backend:

```bash
npm run dev:backend
```

### Build for production:

```bash
npm run build
```

### Deploy to production:

See Convex deployment docs: https://docs.convex.dev/production/hosting

## Project Structure

```
cipher_voice_assistant/
├── src/                      # Frontend React code
│   ├── App.tsx              # Main app component
│   ├── components/          # UI components
│   │   ├── CipherInterface.tsx    # Floating voice interface
│   │   └── VoiceRecognition.tsx   # Voice input handler
│   └── ...
├── convex/                   # Backend Convex code
│   ├── cipher.ts            # AI processing & commands
│   ├── schema.ts            # Database schema
│   └── auth.ts              # Authentication
├── package.json             # Dependencies
└── vite.config.ts           # Vite configuration
```

## Need Help?

- **Convex Docs:** https://docs.convex.dev
- **React Docs:** https://react.dev
- **Vite Docs:** https://vitejs.dev

## What's Next?

Once you have it running:

1. Try different voice commands
2. Check the command history in the database
3. Customize the UI colors/styles
4. Add new voice commands
5. Deploy to production!

---

**Note:** This project requires:

- Node.js 18+ (20+ recommended)
- Modern browser with Web Speech API support (Chrome/Edge)
- Internet connection for Convex and Gemini AI
- Microphone for voice input
