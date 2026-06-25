/**
 * Utility functions for playing notification sounds
 */

// Play a notification sound with customizable options
export function playNotificationSound(options: {
  volume?: number;
  frequency?: number;
  duration?: number;
  type?: OscillatorType;
} = {}) {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Default options
    const {
      volume = 0.2,
      frequency = 800,
      duration = 500,
      type = 'sine'
    } = options;
    
    // Create an oscillator
    const oscillator = audioContext.createOscillator();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    // Create a gain node for volume control
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    
    // Fade out at the end to avoid clicks
    gainNode.gain.exponentialRampToValueAtTime(
      0.01, 
      audioContext.currentTime + duration / 1000
    );
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Start and stop the oscillator
    oscillator.start();
    
    // Clean up after the specified duration
    setTimeout(() => {
      oscillator.stop();
      audioContext.close().catch(console.error);
    }, duration);
    
    return true;
  } catch (error) {
    console.error('Error playing notification sound:', error);
    return false;
  }
}

// Play a double beep notification
export function playDoubleBeep() {
  try {
    // Try high-pitched beep
    const success1 = playNotificationSound({
      frequency: 880,
      duration: 200,
      volume: 0.15
    });
    
    // Follow with a lower beep after a short delay
    setTimeout(() => {
      playNotificationSound({
        frequency: 660,
        duration: 300,
        volume: 0.15
      });
    }, 250);
    
    return success1;
  } catch (error) {
    console.error('Error playing double beep:', error);
    return false;
  }
}

// Play a success sound (rising tone)
export function playSuccessSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      800, 
      audioContext.currentTime + 0.2
    );
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01, 
      audioContext.currentTime + 0.5
    );
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      audioContext.close().catch(console.error);
    }, 500);
    
    return true;
  } catch (error) {
    console.error('Error playing success sound:', error);
    return false;
  }
}

// Play a warning sound (descending tone)
export function playWarningSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      400, 
      audioContext.currentTime + 0.3
    );
    
    gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01, 
      audioContext.currentTime + 0.6
    );
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      audioContext.close().catch(console.error);
    }, 600);
    
    return true;
  } catch (error) {
    console.error('Error playing warning sound:', error);
    return false;
  }
}

// Play a reminder sound (more attention-getting)
export function playReminderSound() {
  try {
    // First high beep
    playNotificationSound({
      frequency: 880,
      duration: 200,
      volume: 0.2
    });
    
    // Second higher beep
    setTimeout(() => {
      playNotificationSound({
        frequency: 1100,
        duration: 200,
        volume: 0.2
      });
    }, 250);
    
    // Third highest beep
    setTimeout(() => {
      playNotificationSound({
        frequency: 1320,
        duration: 400,
        volume: 0.2
      });
    }, 500);
    
    return true;
  } catch (error) {
    console.error('Error playing reminder sound:', error);
    return false;
  }
}

// Fallback to playing a pre-recorded notification sound
export function playPrerecordedSound(soundUrl = '/notification.mp3') {
  try {
    const audio = new Audio(soundUrl);
    audio.volume = 0.3;
    return audio.play()
      .then(() => true)
      .catch(error => {
        console.error('Error playing pre-recorded sound:', error);
        return false;
      });
  } catch (error) {
    console.error('Error setting up pre-recorded sound:', error);
    return Promise.resolve(false);
  }
}

// Try multiple methods to play a notification, with fallbacks
export async function playNotification(type: 'default' | 'success' | 'warning' | 'reminder' = 'default') {
  let success = false;
  
  try {
    // Try method based on notification type
    switch (type) {
      case 'success':
        success = playSuccessSound();
        break;
      case 'warning':
        success = playWarningSound();
        break;
      case 'reminder':
        success = playReminderSound();
        break;
      default:
        success = playDoubleBeep();
    }
    
    // If Web Audio API failed, try prerecorded fallback
    if (!success) {
      success = await playPrerecordedSound();
    }
    
    return success;
  } catch (error) {
    console.error('All notification sound methods failed:', error);
    return false;
  }
}