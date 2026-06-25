import React, { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Prescription } from "@shared/schema";
import { Bell, Volume2, VolumeX, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { alarmManager } from "@/lib/AlarmManager";
import { audioManager } from "@/lib/AudioManager";
import { toast as sonnerToast, Toaster } from "sonner";

interface Medication {
  id: number;
  name: string;
  dosage: string;
  reminderTime: string; // "HH:MM"
}

// Convert Prescription to our Medication interface
function prescriptionToMedication(prescription: Prescription): Medication {
  return {
    id: prescription.id,
    name: prescription.medicineName,
    dosage: `${prescription.quantity} ${prescription.units}`,
    reminderTime: prescription.reminderTime,
  };
}

export default function MedicationReminder({ 
  medications,
  onReminderFired
}: { 
  medications: Prescription[];
  onReminderFired?: (medication: Medication) => void;
}) {
  const { toast } = useToast();
  const timersRef = useRef<Map<number, number>>(new Map());
  const [isMuted, setIsMuted] = useState<boolean>(false);
  // Refs for tracking active speech and audio instances
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio context on component mount
  useEffect(() => {
    // Initialize audio on component mount
    audioManager.initialize();
    
    return () => {
      // Clean up any ongoing audio
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Fire a reminder for a medication
  async function fireReminder(med: Medication): Promise<void> {
    console.log(`Firing reminder for ${med.name}`);
    
    // Function to mark medication as taken - can be called with either a function or mouse event
    const markAsTaken = (hideOrEvent: (() => void) | React.MouseEvent<HTMLButtonElement>) => {
      console.log('Marking medication as taken:', med.name);
      
      // Stop speech synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      
      // Stop audio manager sounds
      audioManager.stopAllAudio();
      
      // Clear any pending timeout for this medication
      if (timersRef.current.has(med.id)) {
        clearTimeout(timersRef.current.get(med.id));
        timersRef.current.delete(med.id);
      }
      
      // If hideOrEvent is a function, call it to hide the toast
      if (typeof hideOrEvent === 'function') {
        hideOrEvent();
      }
      
      // Clear refs
      speechRef.current = null;
      audioRef.current = null;
      
      toast({
        title: "Medication Taken",
        description: `You've taken ${med.name}`,
        duration: 3000,
      });
    };
    
    // Function to snooze the reminder - can be called with either a function or mouse event
    const snoozeReminder = (hideOrEvent: (() => void) | React.MouseEvent<HTMLButtonElement>) => {
      console.log('Snoozing reminder for:', med.name);
      
      // Stop speech synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      
      // Stop audio manager sounds
      audioManager.stopAllAudio();
      
      // Clear any pending timeout for this medication
      if (timersRef.current.has(med.id)) {
        clearTimeout(timersRef.current.get(med.id));
      }
      
      // Schedule to fire again in 10 minutes
      const snoozeDelay = 10 * 60 * 1000; // 10 minutes in milliseconds
      const timerId = window.setTimeout(() => fireReminder(med), snoozeDelay);
      timersRef.current.set(med.id, timerId);
      
      // If hideOrEvent is a function, call it to hide the toast
      if (typeof hideOrEvent === 'function') {
        hideOrEvent();
      }
      
      // Clear refs
      speechRef.current = null;
      audioRef.current = null;
      
      toast({
        title: "Reminder Snoozed",
        description: `Reminder for ${med.name} snoozed for 10 minutes`,
        duration: 3000,
      });
    };
    
    // Show medication reminder toast with Sonner
    sonnerToast.custom((id) => (
      <div className="flex flex-col p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-full">
              <Pill className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Medicine Reminder</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{`Time to take ${med.name} (${med.dosage})`}</p>
              <p className="text-xs text-gray-500 mt-1">Please select an action below</p>
            </div>
          </div>
          
          {/* Close button in header */}
          <button
            onClick={() => {
              // Stop all audio
              audioManager.stopAllAudio();
              
              // Stop speech synthesis
              if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              
              // Dismiss this toast
              sonnerToast.dismiss(id);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mt-6 flex justify-between gap-2">
          <button 
            onClick={() => snoozeReminder(() => sonnerToast.dismiss(id))}
            className="flex-1 py-2 px-3 bg-gray-100 dark:bg-gray-700 rounded text-sm font-medium"
          >
            Snooze 10 minutes
          </button>
          <button 
            onClick={() => markAsTaken(() => sonnerToast.dismiss(id))}
            className="flex-1 py-2 px-3 bg-primary text-white rounded text-sm font-medium"
          >
            Mark as taken
          </button>
        </div>
      </div>
    ), {
      duration: Infinity, // Persistent until dismissed
      id: `med-${med.id}`, // Use consistent ID pattern for easier dismissal
    });
    
    // Also show in the UI notification system for backup
    toast({
      title: `Medicine Reminder`,
      description: `Time to take ${med.name} (${med.dosage})`,
      duration: 10000,
    });
    
    if (!isMuted) {
      try {
        // Play alarm sound first to get attention
        await audioManager.playAlarmPattern();
        
        // Create a speech utterance and store reference
        const utterance = new SpeechSynthesisUtterance(`It's time to take your medication: ${med.name}, ${med.dosage}.`);
        speechRef.current = utterance;
        
        // Then speak the reminder
        if ('speechSynthesis' in window) {
          window.speechSynthesis.speak(utterance);
        }
      } catch (error) {
        console.error('Error playing reminder audio:', error);
      }
    }
    
    // Notify parent component if callback provided
    if (onReminderFired) {
      onReminderFired(med);
    }
    
    // Schedule for next day (using localStorage via AlarmManager)
    scheduleReminder(med);
  }
  
  // Schedule a single reminder
  function scheduleReminder(med: Medication): void {
    // Parse the reminder time
    const [hours, minutes] = med.reminderTime.split(':').map(Number);
    
    // Get the current date/time
    const now = new Date();
    
    // Create reminder date for today
    const reminderDate = new Date();
    reminderDate.setHours(hours, minutes, 0, 0);
    
    // If time already passed today, set for tomorrow
    let delay = reminderDate.getTime() - now.getTime();
    if (delay < 0) {
      delay += 24 * 60 * 60 * 1000; // Add 24 hours
      reminderDate.setDate(reminderDate.getDate() + 1);
    }
    
    // Calculate minutes until reminder
    const minutesUntil = Math.floor(delay / (60 * 1000));
    
    // Log the scheduling
    console.log(`Scheduling reminder for ${med.name} in ${delay}ms (at ${reminderDate.toLocaleTimeString()})`);
    console.log(`Scheduling reminder for ${med.name} in ${minutesUntil} minutes (at ${reminderDate.toLocaleTimeString()})`);
    
    // Clear any existing timer for this medication
    if (timersRef.current.has(med.id)) {
      window.clearTimeout(timersRef.current.get(med.id));
    }
    
    // Add to localStorage via AlarmManager
    alarmManager.addAlarm({
      id: med.id,
      name: med.name,
      dosage: med.dosage,
      time: med.reminderTime
    });
    
    // Set the timeout for the reminder
    const timerId = window.setTimeout(() => fireReminder(med), delay);
    timersRef.current.set(med.id, timerId);
    
    // Update the timeoutId in the alarm manager
    alarmManager.setAlarmTimeoutId(med.id, timerId);
  }
  
  // Schedule all reminders whenever medications change
  useEffect(() => {
    // Convert prescriptions to medication format
    const meds = medications.map(prescriptionToMedication);
    
    // Clear any existing timers
    timersRef.current.forEach(id => window.clearTimeout(id));
    timersRef.current.clear();
    
    // Schedule each medication
    meds.forEach(med => scheduleReminder(med));
    
    // Clean up all timers on component unmount
    return () => {
      timersRef.current.forEach(id => window.clearTimeout(id));
      timersRef.current.clear();
    };
  }, [medications]);
  
  // Test alarm functionality immediately
  const handleTestAlarm = async () => {
    try {
      // Initialize audio (needed for browsers that require user interaction)
      audioManager.initialize();
      
      // Play test pattern
      await audioManager.playAlarm(300, 700);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Speak test message
      await audioManager.speak("This is a test reminder. Your medication reminder system is working.");
      
      toast({
        title: "Test Successful",
        description: "The audio reminder system is working correctly.",
        duration: 5000,
      });
    } catch (error) {
      console.error('Test alarm error:', error);
      
      toast({
        title: "Audio Test Failed",
        description: "There was an issue with the audio system. Please try again or check browser permissions.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };
  
  const toggleMute = () => {
    setIsMuted(prev => !prev);
    toast({
      title: isMuted ? "Sound Enabled" : "Sound Muted",
      description: isMuted 
        ? "You will now hear audio alerts for your medication reminders." 
        : "Audio alerts for medication reminders have been muted.",
      duration: 3000,
    });
  };
  
  // Fire a reminder immediately for testing with actual medication
  const handleTestWithMedication = async () => {
    if (medications.length === 0) {
      toast({
        title: "No Medications",
        description: "Please add a medication first to test the reminder.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    
    // Take the first medication as a test
    const testMed = prescriptionToMedication(medications[0]);
    await fireReminder(testMed);
  };
  
  // Test the reminder system with a ready-made test reminder
  const handleTestNow = async () => {
    try {
      // Create a test reminder with current time
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Create a test medication reminder
      const testReminder = {
        id: -1, // Special ID to indicate test reminder
        name: "Test Medication",
        dosage: "1 pill",
        reminderTime: currentTime
      };
      
      // Log test reminder
      console.log(`Testing reminder immediately: ${testReminder.name} at ${currentTime}`);
      
      // Test with full reminder functionality (including action buttons)
      await fireReminder(testReminder);
      
      // Show success notification
      toast({
        title: "Test Reminder Fired",
        description: "The reminder system is working correctly.",
        duration: 5000,
      });
    } catch (error) {
      console.error('Test reminder error:', error);
      
      toast({
        title: "Test Failed",
        description: "There was an issue with the audio system. Please check browser permissions.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };
  
  return (
    <div className="flex flex-wrap justify-end gap-2 mb-4">
      <Button 
        onClick={toggleMute}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        title={isMuted ? "Enable sound" : "Mute sound"}
      >
        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        {isMuted ? "Unmute" : "Mute"}
      </Button>
      
      <Button 
        onClick={handleTestAlarm}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Bell className="h-4 w-4" />
        Test Sound
      </Button>
      
      <Button 
        onClick={handleTestNow}
        variant="default"
        size="sm"
        className="flex items-center gap-2"
      >
        <Bell className="h-4 w-4" />
        Test Now
      </Button>
      
      {medications.length > 0 && (
        <Button 
          onClick={handleTestWithMedication}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Bell className="h-4 w-4" />
          Test Reminder
        </Button>
      )}
    </div>
  );
}