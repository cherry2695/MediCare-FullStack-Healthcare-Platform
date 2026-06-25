import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useReminders } from "@/hooks/useReminders";
import { useSpeech } from "@/lib/speech";
import { Prescription, SnoozeOptions } from "@shared/schema";
import { audioManager } from "@/lib/AudioManager";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Loader2, 
  Clock, 
  Pill, 
  X, 
  BellOff, 
  ChevronDown,
  Volume2
} from "lucide-react";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ReminderAlertProps {
  reminder: Prescription;
  show: boolean;
  dismissReminder?: (id: number) => void;
}

export default function ReminderAlert({ reminder, show, dismissReminder }: ReminderAlertProps) {
  const [open, setOpen] = useState(false);
  const [snoozeDuration, setSnoozeDuration] = useState(10); // Default snooze duration in minutes
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);
  const { snoozeReminder } = useReminders();
  const { speak } = useSpeech();
  
  // Mark as taken mutation
  const markAsTakenMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/prescriptions/${id}/taken`, {});
      return res.json();
    },
    onSuccess: () => {
      // Close the dialog
      setOpen(false);
      
      // Invalidate prescriptions queries
      queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
      
      // Call dismissReminder if available (to update UI state)
      if (dismissReminder) {
        dismissReminder(reminder.id);
      }
    },
  });

  // Snooze mutation
  const snoozeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/prescriptions/${id}/snooze`, {
        minutes: snoozeDuration,
      });
      return res.json();
    },
    onSuccess: () => {
      // Close the dialog
      setOpen(false);
      
      // Call snoozeReminder (to update UI state)
      snoozeReminder(reminder.id, snoozeDuration);
    },
  });

  // Show the dialog when the reminder becomes active
  useEffect(() => {
    if (show) {
      setOpen(true);
      // Speak the medication reminder
      const speechText = `It is time to take your medicine: ${reminder.medicineName}, ${reminder.quantity} - ${reminder.units}`;
      speak(speechText);
    } else {
      // Make sure we close the dialog
      setOpen(false);
      
      // Ensure audio is stopped
      audioManager.stopAllAudio();
      
      // Stop speech synthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [show, reminder, speak]);

  // Handle mark as taken action
  const handleMarkAsTaken = () => {
    // Stop all audio
    audioManager.stopAllAudio();
    
    // Stop speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    console.log('Marking medication as taken');
    
    // Close the dialog first
    setOpen(false);
    
    // Then submit the API request
    markAsTakenMutation.mutate(reminder.id);
    
    // Directly call dismissReminder for immediate UI update
    if (dismissReminder) {
      dismissReminder(reminder.id);
    }
    
    // Dismiss any toast notifications
    dismissToast(`med-${reminder.id}`);
  };

  // Handle snooze action with default duration
  const handleSnooze = () => {
    // Stop all audio
    audioManager.stopAllAudio();
    
    // Stop speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    console.log(`Snoozing medication reminder for ${snoozeDuration} minutes`);
    
    // Close the dialog first
    setOpen(false);
    
    // Then submit the API request
    snoozeMutation.mutate(reminder.id);
    
    // Directly call snoozeReminder for immediate UI update
    snoozeReminder(reminder.id, snoozeDuration);
    
    // Dismiss any toast notifications
    dismissToast(`med-${reminder.id}`);
  };
  
  // Set snooze duration and call handleSnooze with specific duration
  const setDurationAndSnooze = (duration: number) => {
    setSnoozeDuration(duration);
    
    // Stop all audio
    audioManager.stopAllAudio();
    
    // Stop speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    console.log(`Snoozing medication reminder for ${duration} minutes`);
    
    // Close the dialog first
    setOpen(false);
    
    // Then submit the API request with the newly selected duration
    snoozeMutation.mutate(reminder.id);
    
    // Directly call snoozeReminder for immediate UI update
    snoozeReminder(reminder.id, duration);
    
    // Dismiss any toast notifications
    dismissToast(`med-${reminder.id}`);
  };

  // Helper to dismiss toasts
  const dismissToast = (id: string) => {
    try {
      import('sonner').then(sonner => {
        sonner.toast.dismiss(id);
      }).catch(e => {
        console.error('Failed to import sonner:', e);
      });
    } catch (e) {
      console.error('Failed to dismiss toast:', e);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    console.log('Closing reminder dialog');
    
    // Stop all audio
    audioManager.stopAllAudio();
    
    // Stop speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Close the dialog
    setOpen(false);
    
    // Call dismissReminder to update UI state
    if (dismissReminder) {
      dismissReminder(reminder.id);
    }
    
    // Dismiss any toast notifications
    dismissToast(`med-${reminder.id}`);
  };

  return (
    <AlertDialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose();
        }
        setOpen(isOpen);
      }}
    >
      <AlertDialogContent className="max-w-md mx-auto overflow-hidden rounded-lg border border-blue-200 dark:border-blue-800 shadow-lg">
        {/* Close button (X) at top right */}
        <button 
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </button>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AlertDialogHeader>
            <motion.div 
              className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900 shadow-md"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20 
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <Pill className="h-10 w-10 text-primary" />
              </motion.div>
            </motion.div>
            
            <AlertDialogTitle className="text-center mt-4 text-2xl font-bold bg-gradient-to-r from-primary to-blue-700 dark:from-primary dark:to-blue-400 bg-clip-text text-transparent">
              Medicine Reminder
            </AlertDialogTitle>
            
            <AlertDialogDescription className="text-center mt-4">
              <p className="text-lg text-gray-700 dark:text-gray-300">It's time to take your medicine:</p>
              <motion.p 
                className="text-xl font-bold mt-3 text-primary py-2 px-4 rounded-lg bg-blue-50 dark:bg-blue-900/40 inline-block"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 10 
                }}
              >
                {reminder.medicineName}, {reminder.quantity} - {reminder.units}
              </motion.p>
              
              <div className="mt-5 text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" /> Scheduled for {reminder.reminderTime}
              </div>
              
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-500 text-center">
                Please take action on this reminder using the buttons below
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="mt-6"></div>
          
          <AlertDialogFooter>
            <div className="grid grid-cols-2 gap-3 w-full">
              <motion.div 
                className="col-span-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild className="w-full">
                    <button
                      type="button"
                      disabled={snoozeMutation.isPending || markAsTakenMutation.isPending}
                      className="w-full bg-gray-200 text-gray-700 hover:bg-gray-300 
                        dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 
                        transition-all rounded-md py-3 flex items-center justify-center gap-2"
                    >
                      {snoozeMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <BellOff className="h-5 w-5" />
                      )}
                      <span>Snooze for {snoozeDuration} min</span>
                      <ChevronDown className="h-4 w-4 opacity-70" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-48">
                    <DropdownMenuItem onClick={() => setDurationAndSnooze(5)}>
                      <Clock className="mr-2 h-4 w-4" />
                      <span>5 minutes</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDurationAndSnooze(10)}>
                      <Clock className="mr-2 h-4 w-4" />
                      <span>10 minutes</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDurationAndSnooze(15)}>
                      <Clock className="mr-2 h-4 w-4" />
                      <span>15 minutes</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDurationAndSnooze(30)}>
                      <Clock className="mr-2 h-4 w-4" />
                      <span>30 minutes</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDurationAndSnooze(60)}>
                      <Clock className="mr-2 h-4 w-4" />
                      <span>1 hour</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
              
              <motion.div 
                className="col-span-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  type="button"
                  onClick={handleMarkAsTaken}
                  disabled={snoozeMutation.isPending || markAsTakenMutation.isPending}
                  className="w-full bg-gradient-to-r from-primary to-blue-600 
                    hover:from-primary/90 hover:to-blue-700 text-white 
                    transition-all rounded-md py-3 flex items-center justify-center gap-2"
                >
                  {markAsTakenMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Pill className="h-5 w-5" />
                  )}
                  <span>Mark as taken</span>
                </button>
              </motion.div>
            </div>
          </AlertDialogFooter>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
}