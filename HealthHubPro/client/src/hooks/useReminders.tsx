import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Prescription } from "@shared/schema";
import { audioManager } from "@/lib/AudioManager";
import { alarmManager } from "@/lib/AlarmManager";

export function useReminders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeReminders, setActiveReminders] = useState<(Prescription & { isAlertActive: boolean })[]>([]);
  const [nextReminder, setNextReminder] = useState<Prescription | null>(null);
  const timersRef = useRef<Map<number, number>>(new Map());

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['/api/prescriptions'],
    enabled: !!user,
  });

  // Function to speak a reminder using AudioManager
  const speakReminder = useCallback((text: string): void => {
    // Initialize audio manager if needed (for browsers that require user interaction)
    audioManager.initialize();
    
    // Use our AudioManager to speak the reminder
    audioManager.speak(text)
      .catch(error => {
        console.error('Failed to speak reminder:', error);
      });
  }, []);
  
  // Function to play alarm sound using AudioManager
  const playAlarm = useCallback(async(): Promise<void> => {
    try {
      // Initialize audio manager if needed (for browsers that require user interaction)
      audioManager.initialize();
      
      // Use our AudioManager to play alarm pattern
      await audioManager.playAlarmPattern();
    } catch (error) {
      console.error('Failed to play alarm sound:', error);
    }
  }, []);

  // Fire a reminder
  const fireReminder = useCallback(async (reminder: Prescription) => {
    console.log(`Firing reminder for ${reminder.medicineName}`);
    
    // Set reminder as active in state
    setActiveReminders(prev => 
      prev.map(r => 
        r.id === reminder.id ? { ...r, isAlertActive: true } : r
      )
    );
    
    try {
      // Play alarm sound first to get attention
      await playAlarm();
      
      // Then speak the reminder
      const speechText = `It's time to take your medication: ${reminder.medicineName}, ${reminder.quantity} ${reminder.units}.`;
      await speakReminder(speechText);
      
      // Show toast
      toast({
        title: "Medication Reminder",
        description: `Time to take ${reminder.medicineName} (${reminder.quantity} ${reminder.units})`,
        duration: 10000,
      });
    } catch (error) {
      console.error("Error playing reminder audio:", error);
    }
    
    // Schedule for tomorrow
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    const [hours, minutes] = reminder.reminderTime.split(':').map(Number);
    nextDay.setHours(hours, minutes, 0, 0);
    
    const delay = nextDay.getTime() - Date.now();
    
    // Add/update in localStorage via AlarmManager
    alarmManager.addAlarm({
      id: reminder.id,
      name: reminder.medicineName,
      dosage: `${reminder.quantity} ${reminder.units}`,
      time: reminder.reminderTime
    });
    
    // Set the timeout for the reminder
    const timerId = window.setTimeout(() => fireReminder(reminder), delay);
    timersRef.current.set(reminder.id, timerId);
    
    // Update the timeoutId in the alarm manager
    alarmManager.setAlarmTimeoutId(reminder.id, timerId);
    
    console.log(`Next reminder for ${reminder.medicineName} scheduled for ${nextDay.toLocaleString()}`);
  }, [speakReminder, playAlarm, toast]);

  // Initialize from localStorage on component mount
  useEffect(() => {
    // Initialize audio manager
    audioManager.initialize();
    
    // Load any existing alarms from localStorage
    const existingAlarms = alarmManager.getAlarms();
    console.log('Loaded existing alarms from localStorage:', existingAlarms);

    // If we have existing alarms in localStorage but no prescriptions data yet,
    // we can schedule those alarms to ensure continuity across page refreshes
    if (existingAlarms.length > 0 && (!prescriptions || !Array.isArray(prescriptions) || prescriptions.length === 0)) {
      existingAlarms.forEach(alarm => {
        const [hours, minutes] = alarm.time.split(':').map(Number);
        
        const now = new Date();
        const alarmDate = new Date();
        alarmDate.setHours(hours, minutes, 0, 0);
        
        let delay = alarmDate.getTime() - now.getTime();
        if (delay < 0) {
          delay += 24 * 60 * 60 * 1000; // Add 24 hours
          alarmDate.setDate(alarmDate.getDate() + 1);
        }
        
        console.log(`Scheduling alarm from localStorage: ${alarm.name} at ${alarm.time} (in ${Math.floor(delay/60000)} minutes)`);
        
        // Create a pseudo-prescription object for the callback
        const pseudoPrescription = {
          id: alarm.id,
          medicineName: alarm.name,
          quantity: alarm.dosage.split(' ')[0],
          units: alarm.dosage.split(' ').slice(1).join(' '),
          reminderTime: alarm.time,
          userId: 0,  // Not important for the alarm functionality
          dosageForm: 'tablet', // Default value
          frequency: 'daily',  // Default value
          isActive: true,      // Default value
          instructions: ''     // Default value
        } as Prescription;
        
        const timerId = window.setTimeout(() => fireReminder(pseudoPrescription), delay);
        timersRef.current.set(alarm.id, timerId);
        alarmManager.setAlarmTimeoutId(alarm.id, timerId);
      });
    }
  }, [fireReminder, prescriptions]);
  
  // Schedule all reminders when prescriptions data changes
  useEffect(() => {
    if (!prescriptions || !Array.isArray(prescriptions) || prescriptions.length === 0) return;
    
    // Clear any existing timers
    timersRef.current.forEach(id => window.clearTimeout(id));
    timersRef.current.clear();
    
    // Add isAlertActive flag to each prescription
    const remindersWithAlertState = prescriptions.map((prescription: Prescription) => ({
      ...prescription,
      isAlertActive: false,
    }));
    
    setActiveReminders(remindersWithAlertState);
    
    // Find and set next reminder
    if (remindersWithAlertState.length > 0) {
      // For simplicity, just use the first reminder
      setNextReminder(remindersWithAlertState[0]);
    } else {
      setNextReminder(null);
    }
    
    // Schedule each medication
    remindersWithAlertState.forEach((reminder: Prescription & { isAlertActive: boolean }) => {
      // Parse the reminder time
      const [hours, minutes] = reminder.reminderTime.split(':').map(Number);
      
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
      
      // Calculate minutes until reminder (for logging)
      const minutesUntil = Math.floor(delay / (60 * 1000));
      
      console.log(`Scheduling reminder for ${reminder.medicineName} in ${minutesUntil} minutes (at ${reminderDate.toLocaleTimeString()})`);
      
      // Add to localStorage via AlarmManager
      alarmManager.addAlarm({
        id: reminder.id,
        name: reminder.medicineName,
        dosage: `${reminder.quantity} ${reminder.units}`,
        time: reminder.reminderTime
      });
      
      // Set the timeout for the reminder
      const timerId = window.setTimeout(() => fireReminder(reminder), delay);
      timersRef.current.set(reminder.id, timerId);
      
      // Save the timeoutId in AlarmManager
      alarmManager.setAlarmTimeoutId(reminder.id, timerId);
    });
    
    // Clean up function
    return () => {
      timersRef.current.forEach(id => window.clearTimeout(id));
      timersRef.current.clear();
    };
  }, [prescriptions, fireReminder]);

  const dismissReminder = useCallback((id: number) => {
    console.log(`Dismissing reminder for medication ID: ${id}`);
    
    // Update reminder state immediately
    setActiveReminders(prev => 
      prev.map(reminder => 
        reminder.id === id ? { ...reminder, isAlertActive: false } : reminder
      )
    );
    
    // Stop all audio immediately
    audioManager.stopAllAudio();
    
    // Stop speech synthesis if active
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Dismiss any sonner toasts that might be related to this medication
    const toastId = `med-${id}`;
    try {
      // Import dynamically to avoid circular dependencies
      import('sonner').then(sonner => {
        sonner.toast.dismiss(toastId);
      }).catch(e => {
        console.error('Failed to import sonner:', e);
      });
    } catch (e) {
      console.error('Failed to dismiss sonner toast:', e);
    }
    
    // Force clean any timeouts related to this reminder
    if (timersRef.current.has(id)) {
      window.clearTimeout(timersRef.current.get(id));
      timersRef.current.delete(id);
      console.log(`Cleared timeout for reminder ID: ${id}`);
    }
    
    console.log(`Successfully dismissed reminder for medication ID: ${id}`);
  }, []);

  const snoozeReminder = useCallback((id: number, minutes: number = 10) => {
    console.log(`Snoozing reminder for medication ID: ${id} for ${minutes} minutes`);
    
    // First dismiss the current alert
    setActiveReminders(prev => 
      prev.map(reminder => 
        reminder.id === id ? { ...reminder, isAlertActive: false } : reminder
      )
    );
    
    // Stop all audio immediately
    audioManager.stopAllAudio();
    
    // Stop speech synthesis if active
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Dismiss any sonner toasts that might be related to this medication
    const toastId = `med-${id}`;
    try {
      // Import dynamically to avoid circular dependencies
      import('sonner').then(sonner => {
        sonner.toast.dismiss(toastId);
      }).catch(e => {
        console.error('Failed to import sonner:', e);
      });
    } catch (e) {
      console.error('Failed to dismiss sonner toast:', e);
    }
    
    // Find the reminder
    const reminder = activeReminders.find(r => r.id === id);
    if (!reminder) {
      console.error(`Could not find reminder with ID: ${id} for snoozing`);
      return;
    }
    
    // Cancel any existing timer for this reminder
    if (timersRef.current.has(id)) {
      window.clearTimeout(timersRef.current.get(id));
      console.log(`Cleared existing timeout for reminder ID: ${id}`);
    }
    
    // Set a timeout to reactivate after snooze time
    console.log(`Scheduling snooze for ${reminder.medicineName} for ${minutes} minutes`);
    const snoozeTimeMs = minutes * 60 * 1000;
    const timerId = window.setTimeout(() => {
      console.log(`Snooze time up for ${reminder.medicineName}, firing reminder again`);
      fireReminder(reminder);
    }, snoozeTimeMs);
    
    // Save the new timer ID
    timersRef.current.set(id, timerId);
    
    // Show toast notification
    toast({
      title: "Reminder Snoozed",
      description: `Reminder for ${reminder.medicineName} snoozed for ${minutes} minutes`,
      duration: 3000,
    });
    
    console.log(`Successfully snoozed reminder for medication ID: ${id}`);
  }, [activeReminders, fireReminder, toast]);

  // Function to test the voice and alarm
  const testReminder = useCallback(async () => {
    try {
      // Initialize audio (needed for browsers that require user interaction)
      audioManager.initialize();
      
      // Play test alarm sound
      await playAlarm();
      
      // Speak test message
      await speakReminder("This is a test reminder. Your medication reminder system is working.");
      
      toast({
        title: "Test Successful",
        description: "The medication reminder system is working correctly",
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
  }, [speakReminder, playAlarm, toast]);

  return {
    activeReminders,
    nextReminder,
    isLoading,
    dismissReminder,
    snoozeReminder,
    testReminder,
    speakReminder,
    playAlarm,
  };
}
