import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { VoiceRecognition } from "./VoiceRecognition";
import { toast } from "sonner";

type CipherState = "idle" | "listening" | "processing" | "speaking" | "automating";

export function IntelligentCipherInterface() {
  const [state, setState] = useState<CipherState>("idle");
  const [currentCommand, setCurrentCommand] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [autoListening, setAutoListening] = useState(false); // Start with auto mode OFF
  const isProcessingRef = useRef(false);
  const lastCommandRef = useRef("");
  const lastCommandTimeRef = useRef(0);
  const [systemStatus, setSystemStatus] = useState({ agentServer: false, pythonBridge: false });
  
  const interfaceRef = useRef<HTMLDivElement>(null);
  
  const saveCommand = useMutation(api.cipher.saveCommand);
  const processCommand = useAction(api.cipher.processCommand);
  const voiceSettings = useQuery(api.cipher.getVoiceSettings);
  const saveVoiceSettings = useMutation(api.cipher.saveVoiceSettings);
  const createTask = useMutation(api.computerUse.createTask);
  
  const defaultSettings = {
    noiseThreshold: 30,
    sensitivity: 0.8,
    wakeWordEnabled: false,
  };
  
  const settings = voiceSettings || defaultSettings;

  // Check system status periodically
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health').catch(() => null);
        if (response && response.ok) {
          const data = await response.json();
          setSystemStatus({
            agentServer: true,
            pythonBridge: data.pythonBridge?.available || false
          });
        } else {
          setSystemStatus({ agentServer: false, pythonBridge: false });
        }
      } catch {
        setSystemStatus({ agentServer: false, pythonBridge: false });
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Check if command requires computer automation
  const requiresAutomation = (command: string): boolean => {
    const automationKeywords = [
      'open', 'launch', 'start', 'run', 'execute',
      'click', 'type', 'write', 'enter',
      'navigate', 'go to', 'find',
      'close', 'minimize', 'maximize',
      'save', 'download', 'upload',
      'select', 'copy', 'paste', 'cut',
      'scroll', 'drag', 'move',
      'notepad', 'calculator', 'browser', 'chrome', 'firefox',
      'file explorer', 'folder', 'file',
      'paint', 'excel', 'word', 'powerpoint'
    ];
    
    const lowerCommand = command.toLowerCase();
    return automationKeywords.some(keyword => lowerCommand.includes(keyword));
  };

  const handleCommand = async (command: string, confidence: number) => {
    // Prevent spam
    const now = Date.now();
    const isSameCommand = lastCommandRef.current === command;
    const isRecentCommand = now - lastCommandTimeRef.current < 3000;
    
    if (isProcessingRef.current) {
      console.log("Already processing a command, ignoring:", command);
      return;
    }
    
    if (isSameCommand && isRecentCommand) {
      console.log("Duplicate command detected, ignoring:", command);
      return;
    }
    
    // Update refs
    isProcessingRef.current = true;
    lastCommandRef.current = command;
    lastCommandTimeRef.current = now;
    
    setCurrentCommand(command);
    setState("processing");
    
    try {
      // Decide: automation or voice response?
      const needsAutomation = requiresAutomation(command);
      
      if (needsAutomation) {
        // Computer automation path
        await handleAutomationCommand(command, confidence);
      } else {
        // Voice response path
        await handleVoiceCommand(command, confidence);
      }
    } catch (error) {
      console.error("Command processing error:", error);
      toast.error("Failed to process command");
      setState("idle");
      setCurrentCommand("");
      isProcessingRef.current = false;
    }
  };

  const handleVoiceCommand = async (command: string, confidence: number) => {
    try {
      const result = await processCommand({ command });
      
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
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        utterance.onend = () => {
          setState("idle");
          setCurrentCommand("");
          isProcessingRef.current = false;
          
          // Auto start listening again after 1 second
          if (autoListening) {
            setTimeout(() => {
              if (state === "idle") {
                setState("listening");
              }
            }, 1000);
          }
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
      throw error;
    }
  };

  const handleAutomationCommand = async (command: string, confidence: number) => {
    try {
      setState("automating");
      
      // Check if services are running
      const healthCheck = await fetch('http://localhost:3001/api/health').catch(() => null);
      
      if (!healthCheck || !healthCheck.ok) {
        toast.error("⚠️ Agent server not running");
        setState("idle");
        isProcessingRef.current = false;
        return;
      }

      const healthData = await healthCheck.json();
      
      if (!healthData.pythonBridge?.available) {
        toast.error("⚠️ Python Bridge not running");
        setState("idle");
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
        utterance.rate = 0.9;
        speechSynthesis.speak(utterance);
      }

      toast.success("🤖 Automation started!");
      
      // Save to command history
      await saveCommand({
        command,
        response: `Automated: ${command}`,
        confidence,
      });

      // Return to idle after a moment
      setTimeout(() => {
        setState("idle");
        setCurrentCommand("");
        isProcessingRef.current = false;
        
        // Auto start listening again
        if (autoListening) {
          setTimeout(() => {
            if (state === "idle") {
              setState("listening");
            }
          }, 1000);
        }
      }, 2000);

    } catch (error) {
      throw error;
    }
  };

  const handleListening = (listening: boolean) => {
    if (!isProcessingRef.current) {
      setState(listening ? "listening" : "idle");
    }
  };

  const toggleAutoListening = () => {
    const newValue = !autoListening;
    setAutoListening(newValue);
    
    // Check if services are available before enabling
    if (newValue) {
      if (!systemStatus.agentServer || !systemStatus.pythonBridge) {
        toast.error("⚠️ Please start the services first (npm run dev)");
        return;
      }
      setState("listening");
      toast.success("🎤 Auto Mode enabled - Just speak!");
    } else {
      setState("idle");
      toast.info("Auto Mode disabled");
    }
  };

  const getStateColor = () => {
    switch (state) {
      case "listening": return "from-blue-600 to-blue-800";
      case "processing": return "from-yellow-600 to-yellow-800";
      case "speaking": return "from-green-600 to-green-800";
      case "automating": return "from-purple-600 to-purple-800";
      default: return "from-red-600 to-red-800";
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

  const getStateIcon = () => {
    switch (state) {
      case "listening": return "🎤";
      case "processing": return "🧠";
      case "speaking": return "🔊";
      case "automating": return "🤖";
      default: return "💤";
    }
  };

  // Dragging functionality
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
    
    const maxX = window.innerWidth - (isExpanded ? 320 : 60);
    const maxY = window.innerHeight - (isExpanded ? 450 : 60);
    
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
    <>
      <VoiceRecognition
        onCommand={handleCommand}
        onListening={handleListening}
        noiseThreshold={settings.noiseThreshold}
        sensitivity={settings.sensitivity}
        wakeWordEnabled={false}
        manualListening={autoListening && state === "listening"}
        onManualStop={() => {}}
      />
      
      {/* Draggable floating interface */}
      <div 
        ref={interfaceRef}
        className={`fixed z-50 transition-all duration-300 cursor-move select-none ${
          isExpanded ? "w-80" : "w-14 h-14"
        }`}
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="bg-black/90 backdrop-blur-sm rounded-xl border border-red-900/50 shadow-2xl overflow-hidden">
          {/* Header */}
          <div 
            className="flex items-center justify-between p-3"
            onClick={() => !isDragging && setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getStateColor()} flex items-center justify-center shadow-lg ${
                state === "listening" ? "animate-pulse" : ""
              }`}>
                <span className="text-lg">{getStateIcon()}</span>
              </div>
              {isExpanded && (
                <div>
                  <span className="text-white text-sm font-medium block">Cipher</span>
                  <span className="text-gray-400 text-xs">{getStateText()}</span>
                </div>
              )}
            </div>
            {isExpanded && (
              <button 
                className="text-red-400 hover:text-red-300 text-lg font-bold"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
              >
                ×
              </button>
            )}
          </div>
          
          {/* Expanded content */}
          {isExpanded && (
            <div className="px-3 pb-3 space-y-4">
              {/* System Status */}
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                <div className="text-white text-xs font-semibold mb-2">🔌 System Status</div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Agent Server:</span>
                    <span className={systemStatus.agentServer ? "text-green-400" : "text-red-400"}>
                      {systemStatus.agentServer ? "✅ Running" : "❌ Offline"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Python Bridge:</span>
                    <span className={systemStatus.pythonBridge ? "text-green-400" : "text-red-400"}>
                      {systemStatus.pythonBridge ? "✅ Running" : "❌ Offline"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Auto listening toggle */}
              <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg">
                <div>
                  <span className="text-white text-sm font-medium block">Auto Mode</span>
                  <span className="text-gray-400 text-xs">Always listening for commands</span>
                </div>
                <button
                  onClick={toggleAutoListening}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    autoListening ? "bg-gradient-to-r from-red-600 to-red-700" : "bg-gray-600"
                  }`}
                  disabled={!systemStatus.agentServer || !systemStatus.pythonBridge}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow-lg ${
                    autoListening ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
              </div>

              {currentCommand && (
                <div className="bg-gray-900/70 rounded-lg p-3 border border-red-900/30">
                  <div className="text-red-400 text-xs mb-1">Command:</div>
                  <div className="text-white text-sm">{currentCommand}</div>
                </div>
              )}
              
              {/* Info */}
              <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg p-3 border border-blue-700/30">
                <h4 className="text-blue-300 text-xs font-semibold mb-2">
                  🎯 Intelligent Mode
                </h4>
                <ul className="text-gray-400 text-xs space-y-1">
                  <li>• Just speak - I'll decide if it needs automation</li>
                  <li>• "Open Calculator" → Computer automation</li>
                  <li>• "What time is it?" → Voice response</li>
                  <li>• Automatically continues listening</li>
                </ul>
              </div>
              
              {/* Settings */}
              <div className="space-y-3 border-t border-gray-800 pt-3">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Sensitivity</span>
                    <span className="text-white text-xs">{Math.round(settings.sensitivity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={settings.sensitivity}
                    onChange={(e) => saveVoiceSettings({
                      noiseThreshold: settings.noiseThreshold,
                      sensitivity: parseFloat(e.target.value),
                      wakeWordEnabled: settings.wakeWordEnabled
                    })}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
              
              <div className="text-gray-500 text-xs text-center">
                Drag to move • {autoListening ? "Listening..." : "Enable Auto Mode to start"}
              </div>
              
              {(!systemStatus.agentServer || !systemStatus.pythonBridge) && (
                <div className="bg-yellow-900/30 rounded-lg p-2 border border-yellow-700/50">
                  <div className="text-yellow-400 text-xs">
                    ⚠️ Services not running. Run: <code className="bg-black/30 px-1 rounded">npm run dev</code>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
