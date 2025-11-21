import { useState, useEffect, useRef, useCallback } from "react";

interface VoiceRecognitionProps {
  onCommand: (command: string, confidence: number) => void;
  onListening: (listening: boolean) => void;
  noiseThreshold: number;
  sensitivity: number;
  wakeWordEnabled: boolean;
  manualListening: boolean;
  onManualStop: () => void;
}

export function VoiceRecognition({
  onCommand,
  onListening,
  noiseThreshold,
  sensitivity,
  wakeWordEnabled,
  manualListening,
  onManualStop,
}: VoiceRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [isWaitingForWakeWord, setIsWaitingForWakeWord] = useState(wakeWordEnabled);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isStartingRef = useRef(false);
  const hasProcessedResultRef = useRef(false);

  const initializeAudioContext = useCallback(async () => {
    try {
      // Clean up existing audio context if it exists
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 256;
      microphoneRef.current.connect(analyserRef.current);
      
      return true;
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
      return false;
    }
  }, []);

  const getAudioLevel = useCallback(() => {
    if (!analyserRef.current) return 0;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    return average;
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isStartingRef.current) return;
    
    try {
      isStartingRef.current = true;
      hasProcessedResultRef.current = false;
      setIsListening(true);
      onListening(true);
      recognitionRef.current.start();
      
      // Reset the starting flag after a short delay
      setTimeout(() => {
        isStartingRef.current = false;
      }, 500);
    } catch (error) {
      console.error("Error starting recognition:", error);
      isStartingRef.current = false;
      setIsListening(false);
      onListening(false);
    }
  }, [onListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    onListening(false);
    
    if (wakeWordEnabled) {
      setIsWaitingForWakeWord(true);
    }
  }, [wakeWordEnabled, onListening]);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      console.error("Speech recognition not supported");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    if (recognitionRef.current) {
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event) => {
        // Prevent processing the same result multiple times
        if (hasProcessedResultRef.current) {
          console.log("Result already processed, ignoring");
          return;
        }
        
        hasProcessedResultRef.current = true;
        
        const result = event.results[0];
        const transcript = result[0].transcript.toLowerCase().trim();
        const confidence = result[0].confidence;

        console.log("Voice recognition result:", transcript, "confidence:", confidence);

        if (isWaitingForWakeWord && wakeWordEnabled) {
          if (transcript.includes("cipher") || transcript.includes("sai-fuh")) {
            setIsWaitingForWakeWord(false);
            hasProcessedResultRef.current = false;
            setTimeout(startListening, 500);
          }
        } else {
          // Only process if confidence is reasonable and transcript is not empty
          if (transcript && transcript.length > 0 && confidence > 0.3) {
            onCommand(transcript, confidence);
          }
          stopListening();
        }
      };

      recognitionRef.current.onend = () => {
        console.log("Recognition ended");
        isStartingRef.current = false;
        setIsListening(false);
        onListening(false);
        
        if (wakeWordEnabled && !isWaitingForWakeWord) {
          setIsWaitingForWakeWord(true);
        }
        
        if (manualListening) {
          onManualStop();
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        isStartingRef.current = false;
        setIsListening(false);
        onListening(false);
        
        // Don't restart on 'no-speech' or 'aborted' errors
        if (event.error === 'no-speech' || event.error === 'aborted') {
          console.log("Recognition error (no-speech/aborted), not restarting");
        }
        
        if (manualListening) {
          onManualStop();
        }
      };
    }

    initializeAudioContext();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [isWaitingForWakeWord, wakeWordEnabled, startListening, stopListening, onCommand, onListening, initializeAudioContext, manualListening, onManualStop]);

  // Handle manual listening
  useEffect(() => {
    if (manualListening && !isListening && !isStartingRef.current) {
      startListening();
    } else if (!manualListening && isListening && !wakeWordEnabled) {
      stopListening();
    }
  }, [manualListening, isListening, startListening, stopListening, wakeWordEnabled]);

  // Start continuous listening for wake word
  useEffect(() => {
    if (wakeWordEnabled && isWaitingForWakeWord && !isListening && !manualListening && !isStartingRef.current) {
      const timer = setTimeout(() => {
        if (recognitionRef.current && !isListening && !isStartingRef.current) {
          try {
            isStartingRef.current = true;
            recognitionRef.current.start();
            setIsListening(true);
            setTimeout(() => {
              isStartingRef.current = false;
            }, 500);
          } catch (error) {
            console.error("Failed to start wake word listening:", error);
            isStartingRef.current = false;
          }
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [wakeWordEnabled, isWaitingForWakeWord, isListening, manualListening]);

  return null;
}
