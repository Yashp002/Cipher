import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type CipherState = "idle" | "listening" | "processing" | "speaking" | "automating";

export function SimplifiedCipherInterface() {
  const [state, setState] = useState<CipherState>("idle");
  const [currentCommand, setCurrentCommand] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [autoMode, setAutoMode] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const isProcessingRef = useRef(false);
  const interfaceRef = useRef<HTMLDivElement>(null);
  
  const saveCommand = useMutation(api.cipher.saveCommand);
  const processCommand = useAction(api.cipher.processCommand);
  const voiceSettings = useQuery(api.cipher.getVoiceSettings);
  const createTask = useMutation(api.computerUse.createTask);
  
  // Initialize Speech Recognition
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = false; // Stop after one result
    recognitionRef.current.interimResults = false; // Only final results
    recognitionRef.current.lang = "en-US";
    recognitionRef.current.maxAlternatives = 1;

    recognitionRef.current.onstart = () => {
      console.log("🎤 Recognition started");
      setState("listening");
    };

    recognitionRef.current.onresult = (event: any) => {
      const result = event.results[0];
      const transcript = result[0].transcript.trim();
      const confidence = result[0].confidence;

      console.log("📝 Recognized:", transcript, "Confidence:", confidence);

      if (transcript && transcript.length > 0) {
        handleVoiceCommand(transcript, confidence);
      }
    };

    recognitionRef.current.onend = () => {
      console.log("🛑 Recognition ended");
      
      // If we're in auto mode and not processing, restart listening after 1.5 seconds
      if (autoMode && !isProcessingRef.current && state !== "processing" && state !== "speaking" && state !== "automating") {
        console.log("🔄 Auto-restarting in 1.5s...");
        setTimeout(() => {
          if (autoMode && !isProcessingRef.current) {
            startListening();
          }
        }, 1500);
      } else {
        setState("idle");
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("❌ Recognition error:", event.error);
      
      // Handle specific errors
      if (event.error === "no-speech") {
        toast.error("No speech detected. Please try again.");
      } else if (event.error === "network") {
        toast.error("Network error. Check your connection.");
      }
      
      setState("idle");
      
      // Auto-restart on certain errors if in auto mode
      if (autoMode && !isProcessingRef.current) {
        setTimeout(() => {
          if (autoMode) {
            startListening();
          }
        }, 2000);
      }
    };

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, [autoMode, state]);

  // Start listening function
  const startListening = () => {
    if (!recognitionRef.current || state === "processing" || state === "speaking" || state === "automating") {
      return;
    }

    try {
      recognitionRef.current.start();
      console.log("🎤 Starting to listen...");
    } catch (error: any) {
      if (error.message !== "recognition has already started") {
        console.error("Failed to start recognition:", error);
      }
    }
  };

  // Stop listening function
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setState("idle");
      } catch (e) {
        // Ignore errors
      }
    }
  };

  // Handle auto mode toggle
  const toggleAutoMode = () => {
    const newMode = !autoMode;
    setAutoMode(newMode);
    
    if (newMode) {
      toast.success("🎤 Auto Mode ON - Just speak!");
      startListening();
    } else {
      toast.success("⏸️ Auto Mode OFF");
      stopListening();
    }
  };

  // Check if command requires computer automation
  const requiresAutomation = (command: string): boolean => {
    const automationKeywords = [
      'open', 'launch', 'start', 'run', 'execute',
      'click', 'type', 'write', 'press',
      'navigate', 'go to', 'find', 'locate',
      'close', 'minimize', 'maximize', 'resize',
      'save', 'download', 'upload', 'copy', 'paste',
      'scroll', 'drag', 'move', 'select',
      'notepad', 'calculator', 'browser', 'chrome', 'firefox',
      'explorer', 'folder', 'file', 'paint', 'word', 'excel'
    ];
    
    const lowerCommand = command.toLowerCase();
    return automationKeywords.some(keyword => lowerCommand.includes(keyword));
  };

  // Handle voice command
  const handleVoiceCommand = async (command: string, confidence: number) => {
    if (isProcessingRef.current) {
      console.log("⚠️ Already processing a command");
      return;
    }

    isProcessingRef.current = true;
    setCurrentCommand(command);
    setState("processing");

    try {
      const needsAutomation = requiresAutomation(command);

      if (needsAutomation) {
        await handleAutomationCommand(command, confidence);
      } else {
        await handleVoiceResponse(command, confidence);
      }
    } catch (error) {
      console.error("Error processing command:", error);
      toast.error("Failed to process command");
      setState("idle");
      setCurrentCommand("");
      isProcessingRef.current = false;
    }
  };

  // Handle voice-only response
  const handleVoiceResponse = async (command: string, confidence: number) => {
    try {
      const result = await processCommand({ command });

      // Save to history
      await saveCommand({
        command,
        response: result.response,
        confidence,
      });

      setState("speaking");

      // Execute URL actions
      if (result.action === "openUrl" && result.url) {
        window.open(result.url, "_blank");
      } else if (result.action === "multiAction" && result.urls) {
        result.urls.forEach(url => window.open(url, "_blank"));
      }

      // Speak the response
      if ("speechSynthesis" in window) {
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(result.response);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 0.9;

        utterance.onend = () => {
          setState("idle");
          setCurrentCommand("");
          isProcessingRef.current = false;
        };

        utterance.onerror = () => {
          setState("idle");
          setCurrentCommand("");
          isProcessingRef.current = false;
        };

        speechSynthesis.speak(utterance);
      } else {
        toast.success(result.response);
        setTimeout(() => {
          setState("idle");
          setCurrentCommand("");
          isProcessingRef.current = false;
        }, 2000);
      }
    } catch (error) {
      console.error("Voice response error:", error);
      throw error;
    }
  };

  // Handle computer automation
  const handleAutomationCommand = async (command: string, confidence: number) => {
    try {
      setState("automating");

      // Check if services are running
      let healthCheck;
      try {
        healthCheck = await fetch('http://localhost:3001/api/health');
      } catch (e) {
        toast.error("⚠️ Agent server not running. Start with: npm run dev");
        setState("idle");
        setCurrentCommand("");
        isProcessingRef.current = false;
        return;
      }

      if (!healthCheck.ok) {
        toast.error("⚠️ Agent server not responding");
        setState("idle");
        setCurrentCommand("");
        isProcessingRef.current = false;
        return;
      }

      const healthData = await healthCheck.json();

      if (!healthData.pythonBridge?.available) {
        toast.error("⚠️ Python Bridge offline. It's starting up, please wait...");
        setState("idle");
        setCurrentCommand("");
        isProcessingRef.current = false;
        return;
      }

      // Create automation task
      const taskId = await createTask({ goal: command });

      // Start automation
      const response = await fetch('http://localhost:3001/api/computer-use/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, goal: command }),
      });

      if (!response.ok) {
        throw new Error('Failed to start automation');
      }

      // Speak confirmation
      if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`Starting automation: ${command}`);
        utterance.rate = 0.95;
        speechSynthesis.speak(utterance);
      }

      toast.success("🤖 Automation started!");

      // Save to history
      await saveCommand({
        command,
        response: `Automated: ${command}`,
        confidence,
      });

      // Return to idle
      setTimeout(() => {
        setState("idle");
        setCurrentCommand("");
        isProcessingRef.current = false;
      }, 2000);

    } catch (error) {
      console.error("Automation error:", error);
      toast.error("Automation failed: " + (error as Error).message);
      setState("idle");
      setCurrentCommand("");
      isProcessingRef.current = false;
    }
  };

  // Get state styling
  const getStateColor = () => {
    switch (state) {
      case "listening": return "from-blue-500 to-blue-700";
      case "processing": return "from-yellow-500 to-yellow-700";
      case "speaking": return "from-green-500 to-green-700";
      case "automating": return "from-purple-500 to-purple-700";
      default: return "from-red-600 to-red-800";
    }
  };

  const getStateIcon = () => {
    switch (state) {
      case "listening": return "🎤";
      case "processing": return "🧠";
      case "speaking": return "🔊";
      case "automating": return "🤖";
      default: return "💤";
    }
  };

  const getStateText = () => {
    switch (state) {
      case "listening": return "Listening...";
      case "processing": return "Thinking...";
      case "speaking": return "Speaking...";
      case "automating": return "Automating...";
      default: return "Ready";
    }
  };

  // Dragging logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input')) return;

    setIsDragging(true);
    const rect = interfaceRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    const maxX = window.innerWidth - (isExpanded ? 350 : 60);
    const maxY = window.innerHeight - (isExpanded ? 500 : 60);

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <div
      ref={interfaceRef}
      className={`fixed z-50 transition-all duration-300 select-none ${
        isExpanded ? "w-[350px]" : "w-14 h-14"
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="bg-black/95 backdrop-blur-md rounded-2xl border-2 border-red-900/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer"
          onClick={() => !isDragging && setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getStateColor()} flex items-center justify-center shadow-lg ${
                state === "listening" ? "animate-pulse" : ""
              }`}
            >
              <span className="text-xl">{getStateIcon()}</span>
            </div>
            {isExpanded && (
              <div>
                <span className="text-white text-base font-bold block">Cipher</span>
                <span className="text-gray-400 text-sm">{getStateText()}</span>
              </div>
            )}
          </div>
          {isExpanded && (
            <button
              className="text-red-400 hover:text-red-300 text-2xl font-bold leading-none"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Expanded Panel */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4">
            {/* Auto Mode Toggle */}
            <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white text-base font-semibold block">Auto Mode</span>
                  <span className="text-gray-400 text-sm">Continuous listening</span>
                </div>
                <button
                  onClick={toggleAutoMode}
                  className={`w-14 h-7 rounded-full transition-all duration-300 ${
                    autoMode ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-gray-600"
                  }`}
                >
                  <div
                    className={`w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 ${
                      autoMode ? "translate-x-7" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Current Command */}
            {currentCommand && (
              <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl p-4 border border-blue-700/40">
                <div className="text-blue-300 text-xs font-semibold mb-2">Command:</div>
                <div className="text-white text-sm font-medium">{currentCommand}</div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 rounded-xl p-4 border border-red-700/30">
              <h4 className="text-red-300 text-sm font-bold mb-3">🎯 How It Works</h4>
              <ul className="text-gray-300 text-sm space-y-2">
                <li>✅ Toggle Auto Mode ON</li>
                <li>🎤 Just speak naturally</li>
                <li>🤖 "Open Calculator" → Automates</li>
                <li>💬 "What time?" → Responds</li>
                <li>🔄 Listens continuously</li>
              </ul>
            </div>

            {/* Manual Control (when auto mode is off) */}
            {!autoMode && (
              <button
                onClick={() => {
                  if (state === "idle") {
                    startListening();
                  } else if (state === "listening") {
                    stopListening();
                  }
                }}
                disabled={state === "processing" || state === "speaking" || state === "automating"}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all ${
                  state === "listening"
                    ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {state === "listening" ? "⏹️ Stop" : "🎤 Start Listening"}
              </button>
            )}

            <div className="text-gray-500 text-xs text-center pt-2 border-t border-gray-800">
              Drag to move anywhere • {autoMode ? "Auto Mode Active" : "Manual Mode"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
