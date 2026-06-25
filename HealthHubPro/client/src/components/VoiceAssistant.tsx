import { useState, useEffect, useRef } from 'react';
import { useLocation, useRoute } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeech } from '@/lib/speech';
import { useTheme } from '@/lib/theme-provider';
import { audioManager } from '@/lib/AudioManager';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Sliders, 
  X, 
  HelpCircle,
  Settings,
  BellOff 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface VoiceAssistantSettings {
  volume: number;
  pitch: number;
  rate: number;
  voice: SpeechSynthesisVoice | null;
  enabled: boolean;
  availableVoices: SpeechSynthesisVoice[];
}

interface VoiceAssistantProps {
  className?: string;
}

export default function VoiceAssistant({ className }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [settings, setSettings] = useState<VoiceAssistantSettings>({
    volume: 1.0,
    pitch: 1.0,
    rate: 1.0,
    voice: null,
    enabled: true,
    availableVoices: []
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const { speak, cancel } = useSpeech();
  const micButtonRef = useRef<HTMLButtonElement>(null);
  
  // Command handlers for Healyn assistant
  const commandHandlers: Record<string, () => void> = {
    'go to dashboard': () => setLocation('/'),
    'go to prescriptions': () => setLocation('/prescriptions'),
    'go to price comparison': () => setLocation('/price-comparison'),
    'go to profile': () => setLocation('/profile'),
    'go to settings': () => setLocation('/settings'),
    'change theme to dark': () => setTheme('dark'),
    'change theme to light': () => setTheme('light'),
    'toggle theme': () => setTheme(theme === 'light' ? 'dark' : 'light'),
    'snooze all reminders': () => {
      toast.success('All reminders snoozed for 30 minutes');
      // This would typically interact with your reminder system to snooze all active reminders
    },
    'show help': () => setShowCommands(true),
    'hide help': () => setShowCommands(false),
    'open settings': () => setShowSettings(true),
    'close settings': () => setShowSettings(false),
    'stop speaking': () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      cancel();
      setIsSpeaking(false);
    }
  };

  // Welcome the user on first load
  useEffect(() => {
    // Wait a bit before greeting to ensure other components have loaded
    const timer = setTimeout(() => {
      if (settings.enabled) {
        healynSpeak("Hi, I'm Healyn. Your voice assistant for MediCare. Say 'Hey Healyn' to activate me.");
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Initialize speech recognition when component mounts
  useEffect(() => {
    const initSpeechRecognition = () => {
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        // @ts-ignore - TypeScript doesn't recognize the WebSpeechAPI properly even with declarations
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();
        
        recognitionInstance.continuous = true; // Change to true for longer listening periods
        recognitionInstance.interimResults = true; // Enable interim results for real-time feedback
        recognitionInstance.lang = 'en-US';
        
        recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
          // Get the latest result
          const resultIndex = event.resultIndex;
          const transcript = event.results[resultIndex][0].transcript.toLowerCase().trim();
          
          // Update the UI with the real-time transcript
          setTranscript(transcript);
          
          // Only process complete commands when final
          if (event.results[resultIndex].isFinal) {
            processCommand(transcript);
            
            // Stop listening after processing a final command
            if (recognition) {
              recognition.stop();
            }
          }
        };
        
        recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          
          if (event.error === 'not-allowed') {
            healynSpeak('I need microphone permission to help you. Please allow microphone access.');
          }
        };
        
        recognitionInstance.onend = () => {
          setIsListening(false);
        };
        
        setRecognition(recognitionInstance);
      } else {
        toast.error('Speech recognition is not supported in your browser.');
      }
    };
    
    initSpeechRecognition();
    
    // Load available voices
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        
        if (voices.length > 0) {
          // Prefer a female voice if available
          const femaleVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('female') || 
            voice.name.toLowerCase().includes('zira') || 
            voice.name.toLowerCase().includes('samantha')
          );
          
          setSettings(prev => ({
            ...prev,
            availableVoices: voices,
            voice: femaleVoice || voices[0]
          }));
        }
      }
    };
    
    // Voice list might not be available immediately
    if ('speechSynthesis' in window) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Cleanup when component unmounts
    return () => {
      if (recognition) {
        recognition.abort();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  
  // Apply speech synthesis settings
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance();
      utterance.volume = settings.volume;
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      
      if (settings.voice) {
        utterance.voice = settings.voice;
      }
      
      // Store the settings in sessionStorage
      try {
        sessionStorage.setItem('healyn_settings', JSON.stringify({
          volume: settings.volume,
          pitch: settings.pitch,
          rate: settings.rate,
          voiceURI: settings.voice?.voiceURI,
          enabled: settings.enabled
        }));
      } catch (e) {
        console.error('Failed to save Healyn settings', e);
      }
    }
  }, [settings]);
  
  // Load settings from storage on first render
  useEffect(() => {
    try {
      const storedSettings = sessionStorage.getItem('healyn_settings');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        setSettings(prev => {
          // Find the saved voice by URI if available
          let savedVoice = prev.voice;
          if (parsed.voiceURI && prev.availableVoices.length > 0) {
            savedVoice = prev.availableVoices.find(v => v.voiceURI === parsed.voiceURI) || prev.voice;
          }
          
          return {
            ...prev,
            volume: parsed.volume || prev.volume,
            pitch: parsed.pitch || prev.pitch,
            rate: parsed.rate || prev.rate,
            voice: savedVoice,
            enabled: parsed.enabled !== undefined ? parsed.enabled : prev.enabled
          };
        });
      }
    } catch (e) {
      console.error('Failed to load Healyn settings', e);
    }
  }, []);
  
  // Process the spoken command
  const processCommand = (command: string) => {
    console.log('Processing command:', command);
    
    // Normalize input by removing filler words and phrases
    const normalizedCommand = command
      .replace(/^(hey|hi|hello|ok|okay|healyn|hey healyn|hi healyn|hello healyn|okay healyn)(\s+)/i, '')
      .trim();
    
    // Check for direct command matches
    for (const [key, handler] of Object.entries(commandHandlers)) {
      if (normalizedCommand === key || normalizedCommand.includes(key)) {
        handler();
        respondToCommand(key);
        return;
      }
    }
    
    // Handle queries and questions
    if (normalizedCommand.match(/^(what|who|how|when|where|why|can you|could you|would you|tell me about)/i)) {
      handleQuestion(normalizedCommand);
      return;
    }
    
    // If no command matched, provide a fallback response
    healynSpeak("I'm sorry, I didn't understand that command. Say 'show help' for a list of commands I can respond to.");
  };
  
  // Handle questions about the app or medications
  const handleQuestion = (question: string) => {
    const responses: Record<string, string> = {
      'what can you do': "I can help you navigate the app, change settings, set reminders, and answer questions about your medications. Try saying 'go to dashboard' or 'show help' for more commands.",
      'who are you': "I'm Healyn, your voice assistant for the MediCare Assistant app. I'm here to make managing your medications easier.",
      'how do I add a prescription': "To add a prescription, go to the prescriptions page and click the 'Add Prescription' button. You'll need to enter the medication name, dosage, and schedule.",
      'what is medicare assistant': "MediCare Assistant is a healthcare application that helps you manage prescriptions, set medication reminders, compare prices, and track medication adherence.",
      'how do I compare prices': "Go to the price comparison page, search for your medication, and I'll show you prices across different pharmacies.",
      'what time is it': `The current time is ${new Date().toLocaleTimeString()}.`,
    };
    
    let foundResponse = false;
    for (const [key, response] of Object.entries(responses)) {
      if (question.toLowerCase().includes(key)) {
        healynSpeak(response);
        foundResponse = true;
        break;
      }
    }
    
    if (!foundResponse) {
      healynSpeak("I'm not sure about that. I'm still learning and can only answer basic questions about the MediCare Assistant app and your medications.");
    }
  };
  
  // Respond to commands with voice
  const respondToCommand = (command: string) => {
    const responses: Record<string, string> = {
      'go to dashboard': "Going to dashboard.",
      'go to prescriptions': "Opening prescriptions page.",
      'go to price comparison': "Going to price comparison.",
      'go to profile': "Opening your profile.",
      'go to settings': "Opening settings.",
      'change theme to dark': "Dark theme activated.",
      'change theme to light': "Light theme activated.",
      'toggle theme': `Theme changed to ${theme === 'light' ? 'dark' : 'light'}.`,
      'snooze all reminders': "All reminders have been snoozed for 30 minutes.",
      'show help': "Showing available commands.",
      'hide help': "Hiding command list.",
      'open settings': "Opening voice assistant settings.",
      'close settings': "Closing settings.",
      'stop speaking': "Audio stopped."
    };
    
    if (responses[command]) {
      healynSpeak(responses[command]);
    }
  };
  
  // Speak with Healyn's voice settings
  const healynSpeak = (text: string) => {
    if (!settings.enabled) return;
    
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.volume = settings.volume;
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    
    if (settings.voice) {
      utterance.voice = settings.voice;
    }
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      window.speechSynthesis.speak(utterance);
    }
  };
  
  // Toggle listening state
  const toggleListening = () => {
    if (!settings.enabled) {
      toast.error('Voice assistant is disabled. Enable it in settings.');
      return;
    }
    
    if (isListening) {
      if (recognition) {
        recognition.abort();
      }
      setIsListening(false);
    } else {
      setTranscript('');
      if (recognition) {
        recognition.start();
        setIsListening(true);
        
        // Play a short beep to indicate listening started
        audioManager.playAlarm(200, 1200).catch(console.error);
      } else {
        toast.error('Speech recognition failed to initialize');
      }
    }
  };
  
  // Command list for help section
  const availableCommands = [
    { command: 'Go to [page]', description: 'Navigate to a specific page (dashboard, prescriptions, etc.)' },
    { command: 'Change theme to [light/dark]', description: 'Switch between light and dark themes' },
    { command: 'Toggle theme', description: 'Switch to the opposite theme' },
    { command: 'Snooze all reminders', description: 'Snooze all active medication reminders' },
    { command: 'Show/hide help', description: 'Display or hide this command list' },
    { command: 'Open/close settings', description: 'Manage voice assistant settings' },
    { command: 'Stop speaking', description: 'Stop Healyn from speaking' },
    { command: 'What can you do?', description: 'Learn about Healyn\'s capabilities' },
    { command: 'How do I [task]?', description: 'Get help with specific tasks' },
  ];
  
  return (
    <div className={`relative ${className}`}>
      {/* Main mic button */}
      <motion.div 
        className="relative"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          ref={micButtonRef}
          variant="ghost"
          size="icon"
          className={`rounded-full h-14 w-14 border-2 relative z-10 shadow-xl ${
            isListening 
              ? 'bg-red-500/90 border-red-400 hover:bg-red-600/90 text-white' 
              : 'bg-black/40 backdrop-blur-sm border-blue-500/30 hover:bg-black/60 hover:border-blue-400 text-blue-400'
          }`}
          onClick={toggleListening}
          aria-label={isListening ? "Stop listening" : "Start voice assistant"}
        >
          {isListening ? (
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, -10, 0, 10, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                ease: "easeInOut" 
              }}
            >
              <MicOff className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Mic className="h-6 w-6" />
            </motion.div>
          )}
        </Button>
        
        {/* Ripple effect when listening */}
        <AnimatePresence>
          {isListening && (
            <>
              <motion.div
                className="absolute top-0 left-0 h-full w-full rounded-full border-2 border-red-500 z-0"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.5, opacity: 0 }}
                exit={{ scale: 1, opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <motion.div
                className="absolute top-0 left-0 h-full w-full rounded-full border-2 border-red-500 z-0"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: 2, opacity: 0 }}
                exit={{ scale: 1, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              />
            </>
          )}
        </AnimatePresence>
        
        {/* Healyn glowing shadow when not listening to indicate it's available */}
        {!isListening && (
          <motion.div 
            className="absolute inset-0 bg-blue-500 rounded-full filter blur-md z-0 opacity-30"
            animate={{ 
              scale: [0.8, 1.1, 0.8],
              opacity: [0.2, 0.3, 0.2]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 3,
              ease: "easeInOut"
            }}
          />
        )}
        
        {/* Speaking indicator */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              className="absolute -right-1 -top-1 bg-green-500 rounded-full p-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Volume2 className="h-3 w-3 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Transcript display */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 min-w-[250px] max-w-[300px] text-center border border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              <span className="text-primary font-semibold">Healyn heard:</span> {transcript}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Quick action buttons */}
      <div className="absolute top-0 right-full mr-2 space-y-2">
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-8 w-8 bg-white dark:bg-gray-800 shadow-sm border-gray-200 dark:border-gray-700"
            onClick={() => setShowCommands(!showCommands)}
            aria-label="Show commands"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-8 w-8 bg-white dark:bg-gray-800 shadow-sm border-gray-200 dark:border-gray-700"
            onClick={() => setShowSettings(!showSettings)}
            aria-label="Voice settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
      
      {/* Commands help dialog */}
      <Sheet open={showCommands} onOpenChange={setShowCommands}>
        <SheetContent side="right" className="w-[350px] sm:w-[450px] bg-black/95 border-l border-blue-500/30 backdrop-blur-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-white">
              <Mic className="h-5 w-5 text-blue-400" />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Healyn Voice Commands</span>
            </SheetTitle>
            <SheetDescription className="text-gray-300">
              Here are the commands I can recognize. Just say "Hey Healyn" followed by any of these.
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-3">
            {availableCommands.map((cmd, index) => (
              <motion.div 
                key={index} 
                className="bg-gray-900/50 border border-blue-500/20 rounded-lg p-3 hover:border-blue-400/30 transition-all duration-200"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(30, 41, 59, 0.7)' }}
              >
                <p className="text-sm font-medium bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">{cmd.command}</p>
                <p className="text-xs text-gray-400 mt-1">{cmd.description}</p>
              </motion.div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Settings dialog */}
      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetContent side="right" className="w-[350px] sm:w-[450px] bg-black/95 border-l border-blue-500/30 backdrop-blur-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-white">
              <Sliders className="h-5 w-5 text-blue-400" />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Healyn Voice Settings</span>
            </SheetTitle>
            <SheetDescription className="text-gray-300">
              Customize Healyn's voice and behavior
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            {/* Enable/disable toggle */}
            <div className="flex items-center justify-between p-3 border border-blue-500/20 rounded-lg bg-gray-900/50">
              <div>
                <Label htmlFor="voice-enabled" className="text-white">Enable Voice Assistant</Label>
                <p className="text-sm text-gray-400">Turn Healyn on or off</p>
              </div>
              <Switch 
                id="voice-enabled" 
                checked={settings.enabled}
                onCheckedChange={(checked) => {
                  setSettings(prev => ({ ...prev, enabled: checked }));
                  if (!checked) {
                    cancel(); // Stop speaking if turning off
                  }
                }}
                className="data-[state=checked]:bg-blue-500"
              />
            </div>
            
            {/* Volume control */}
            <div className="space-y-3 p-3 border border-blue-500/20 rounded-lg bg-gray-900/50">
              <div className="flex items-center justify-between">
                <Label htmlFor="voice-volume" className="text-white">Volume</Label>
                <span className="text-sm text-blue-400 px-2 py-1 rounded bg-blue-900/30 font-mono">
                  {Math.round(settings.volume * 100)}%
                </span>
              </div>
              <Slider 
                id="voice-volume" 
                min={0} 
                max={1} 
                step={0.1} 
                value={[settings.volume]} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, volume: value[0] }))}
                disabled={!settings.enabled}
                className="[&>span]:bg-blue-500"
              />
            </div>
            
            {/* Pitch control */}
            <div className="space-y-3 p-3 border border-blue-500/20 rounded-lg bg-gray-900/50">
              <div className="flex items-center justify-between">
                <Label htmlFor="voice-pitch" className="text-white">Pitch</Label>
                <span className="text-sm text-blue-400 px-2 py-1 rounded bg-blue-900/30 font-mono">
                  {settings.pitch.toFixed(1)}
                </span>
              </div>
              <Slider 
                id="voice-pitch" 
                min={0.5} 
                max={2} 
                step={0.1} 
                value={[settings.pitch]} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, pitch: value[0] }))}
                disabled={!settings.enabled}
                className="[&>span]:bg-blue-500"
              />
            </div>
            
            {/* Speed control */}
            <div className="space-y-3 p-3 border border-blue-500/20 rounded-lg bg-gray-900/50">
              <div className="flex items-center justify-between">
                <Label htmlFor="voice-rate" className="text-white">Speaking Rate</Label>
                <span className="text-sm text-blue-400 px-2 py-1 rounded bg-blue-900/30 font-mono">
                  {settings.rate.toFixed(1)}x
                </span>
              </div>
              <Slider 
                id="voice-rate" 
                min={0.5} 
                max={2} 
                step={0.1} 
                value={[settings.rate]} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, rate: value[0] }))}
                disabled={!settings.enabled}
                className="[&>span]:bg-blue-500"
              />
            </div>
            
            {/* Voice selection */}
            {settings.availableVoices.length > 0 && (
              <div className="space-y-2 p-3 border border-blue-500/20 rounded-lg bg-gray-900/50">
                <Label htmlFor="voice-selection" className="text-white">Voice Selection</Label>
                <select
                  id="voice-selection"
                  className="w-full rounded-md border border-blue-500/30 bg-black/80 p-2 text-sm text-white mt-2"
                  value={settings.voice?.voiceURI || ''}
                  onChange={(e) => {
                    const selectedVoice = settings.availableVoices.find(
                      voice => voice.voiceURI === e.target.value
                    );
                    setSettings(prev => ({ ...prev, voice: selectedVoice || null }));
                  }}
                  disabled={!settings.enabled}
                >
                  {settings.availableVoices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Test button */}
            <Button 
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium border-none" 
              onClick={() => healynSpeak("Hello, I'm Healyn, your voice assistant. How can I help you today?")}
              disabled={!settings.enabled}
            >
              <Volume2 className="mr-2 h-4 w-4" />
              Test Voice
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}