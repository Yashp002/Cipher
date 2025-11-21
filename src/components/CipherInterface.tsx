import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { VoiceRecognition } from "./VoiceRecognition";
import { toast } from "sonner";

type CipherState = "idle" | "listening" | "processing" | "speaking";

export function CipherInterface() {
  const [state, setState] = useState<CipherState>("idle");
  const [currentCommand, setCurrentCommand] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [manualListening, setManualListening] = useState(false);
  const isProcessingRef = useRef(false);
  const lastCommandRef = useRef("");
  const lastCommandTimeRef = useRef(0);
  
  const interfaceRef = useRef<HTMLDivElement>(null);
  
  const saveCommand = useMutation(api.cipher.saveCommand);
  const processCommand = useAction(api.cipher.processCommand);
  const voiceSettings = useQuery(api.cipher.getVoiceSettings);
  const saveVoiceSettings = useMutation(api.cipher.saveVoiceSettings);
  
  const defaultSettings = {
    noiseThreshold: 30,
    sensitivity: 0.8,
    wakeWordEnabled: false, // Disabled by default for manual control
  };
  
  const settings = voiceSettings || defaultSettings;

  const handleCommand = async (command: string, confidence: number) => {
    // Prevent spam: ignore if already processing or if same command within 3 seconds
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
    setManualListening(false);
    
    try {
      const result = await processCommand({ command });
      
      await saveCommand({
        command,
        response: result.response,
        confidence,
      });
      
      setState("speaking");
      
      // Execute the action
      if (result.action === "openUrl" && result.url) {
        window.open(result.url, "_blank");
      } else if (result.action === "multiAction" && result.urls) {
        result.urls.forEach(url => window.open(url, "_blank"));
      }
      
      // Speak the response
      if ("speechSynthesis" in window) {
        // Cancel any ongoing speech
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(result.response);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
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
      console.error("Command processing error:", error);
      toast.error("Failed to process command");
      setState("idle");
      setCurrentCommand("");
      setManualListening(false);
      isProcessingRef.current = false;
    }
  };

  const handleListening = (listening: boolean) => {
    setState(listening ? "listening" : "idle");
  };

  const startManualListening = () => {
    setManualListening(true);
    setState("listening");
  };

  const stopManualListening = () => {
    setManualListening(false);
    setState("idle");
  };

  const getStateColor = () => {
    switch (state) {
      case "listening": return "from-blue-600 to-blue-800";
      case "processing": return "from-yellow-600 to-yellow-800";
      case "speaking": return "from-green-600 to-green-800";
      default: return "from-red-600 to-red-800";
    }
  };

  const getStateText = () => {
    switch (state) {
      case "listening": return "Listening...";
      case "processing": return "Processing...";
      case "speaking": return "Speaking...";
      default: return "Ready";
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
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - (isExpanded ? 320 : 60);
    const maxY = window.innerHeight - (isExpanded ? 400 : 60);
    
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
        manualListening={manualListening}
        onManualStop={stopManualListening}
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
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getStateColor()} flex items-center justify-center shadow-lg`}>
                <span className="text-white font-bold text-sm">C</span>
              </div>
              {isExpanded && (
                <span className="text-white text-sm font-medium">Cipher</span>
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
              <div className="text-gray-300 text-xs">
                Status: <span className="text-white">{getStateText()}</span>
              </div>
              
              {/* Manual listening control */}
              <div className="flex gap-2">
                {state === "idle" ? (
                  <button
                    onClick={startManualListening}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg"
                  >
                    🎤 Start Listening
                  </button>
                ) : state === "listening" ? (
                  <button
                    onClick={stopManualListening}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg animate-pulse"
                  >
                    🔴 Stop Listening
                  </button>
                ) : (
                  <div className="flex-1 bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium text-center">
                    {state === "processing" ? "🔄 Processing..." : "🔊 Speaking..."}
                  </div>
                )}
              </div>
              
              {currentCommand && (
                <div className="bg-gray-900/70 rounded-lg p-3 border border-red-900/30">
                  <div className="text-red-400 text-xs mb-1">Command:</div>
                  <div className="text-white text-sm">{currentCommand}</div>
                </div>
              )}
              
              {/* Settings */}
              <div className="space-y-3 border-t border-gray-800 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-xs">Auto Wake Word</span>
                  <button
                    onClick={() => saveVoiceSettings({
                      noiseThreshold: settings.noiseThreshold,
                      sensitivity: settings.sensitivity,
                      wakeWordEnabled: !settings.wakeWordEnabled
                    })}
                    className={`w-10 h-5 rounded-full transition-colors ${
                      settings.wakeWordEnabled ? "bg-red-600" : "bg-gray-600"
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.wakeWordEnabled ? "translate-x-5" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
                
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
                Drag to move • Click to expand/collapse
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
