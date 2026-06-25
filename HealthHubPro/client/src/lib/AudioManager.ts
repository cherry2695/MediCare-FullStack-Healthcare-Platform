// AudioManager.ts - Handles alarm sounds and speech synthesis

export class AudioManager {
  private static instance: AudioManager;
  private audioContext: AudioContext | null = null;
  private isInitialized = false;
  private activeOscillators: OscillatorNode[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  private constructor() {
    // AudioContext should be initialized on user interaction 
    // to comply with browser autoplay policies
    this.initialize = this.initialize.bind(this);
    
    // Try to initialize on import if possible, but this will usually be deferred
    // until user interaction
    if (typeof window !== 'undefined') {
      document.addEventListener('click', this.initialize, { once: true });
      document.addEventListener('touchstart', this.initialize, { once: true });
    }
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  // Initialize the audio context (should be called on user interaction)
  public initialize(): void {
    if (this.isInitialized) return;
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
        this.isInitialized = true;
        console.log('AudioManager initialized');
        
        // Remove event listeners once initialized
        document.removeEventListener('click', this.initialize);
        document.removeEventListener('touchstart', this.initialize);
      }
    } catch (error) {
      console.error('Failed to initialize AudioManager:', error);
    }
  }
  
  // Stop all active audio - call this when "Mark as Taken" is clicked
  public stopAllAudio(): void {
    console.log('Stopping all audio');
    
    // Stop any speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
    
    // Stop audio context if it exists
    if (this.audioContext) {
      // In modern browsers we can suspend the audio context
      if (this.audioContext.state === 'running' && this.audioContext.suspend) {
        try {
          this.audioContext.suspend();
        } catch (e) {
          console.warn('Failed to suspend audio context:', e);
        }
      }
      
      // Clean up any active oscillators
      this.activeOscillators.forEach(osc => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {
          // Oscillator might already be stopped
        }
      });
      this.activeOscillators = [];
    }
  }

  // Play an alarm sound
  public playAlarm(duration: number = 1000, frequency: number = 800): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isInitialized) {
        this.initialize();
      }

      if (!this.audioContext) {
        console.error('AudioContext not available');
        reject(new Error('AudioContext not available'));
        return;
      }

      try {
        // First attempt: Standard oscillator approach
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Add to active oscillators array for tracking
        this.activeOscillators.push(oscillator);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration / 1000);
        
        console.log("Playing alarm sound");
        
        // Resolve after sound is done and clean up
        setTimeout(() => {
          // Remove from active oscillators
          const index = this.activeOscillators.indexOf(oscillator);
          if (index > -1) {
            this.activeOscillators.splice(index, 1);
          }
          resolve();
        }, duration);

      } catch (error) {
        console.error('Failed to play alarm sound:', error);
        
        // Second attempt: Create a more simple beep
        try {
          const simpleOscillator = this.audioContext.createOscillator();
          simpleOscillator.type = 'sine';
          simpleOscillator.frequency.value = frequency;
          
          // Add to active oscillators array for tracking
          this.activeOscillators.push(simpleOscillator);
          
          simpleOscillator.connect(this.audioContext.destination);
          simpleOscillator.start();
          
          setTimeout(() => {
            try {
              simpleOscillator.stop();
              
              // Remove from active oscillators
              const index = this.activeOscillators.indexOf(simpleOscillator);
              if (index > -1) {
                this.activeOscillators.splice(index, 1);
              }
            } catch (e) {
              // Ignore errors if oscillator already stopped
            }
            resolve();
          }, Math.min(300, duration)); // Short beep
          
          console.log("Playing fallback alarm sound");
        } catch (secondError) {
          console.error('Failed to play fallback alarm sound:', secondError);
          reject(secondError);
        }
      }
    });
  }

  // Play multiple beeps as an alarm pattern
  public async playAlarmPattern(): Promise<void> {
    if (!this.isInitialized) {
      this.initialize();
    }

    try {
      // Play 3 short beeps
      await this.playAlarm(300, 800);
      await new Promise(resolve => setTimeout(resolve, 200));
      await this.playAlarm(300, 900);
      await new Promise(resolve => setTimeout(resolve, 200));
      await this.playAlarm(600, 1000);
    } catch (error) {
      console.error('Failed to play alarm pattern:', error);
    }
  }

  // Speak a message using speech synthesis with fallback audio
  public speak(text: string, options: SpeechSynthesisUtterance = new SpeechSynthesisUtterance()): Promise<void> {
    return new Promise(async (resolve, reject) => {
      // First try to play a notification beep to get attention
      try {
        await this.playAlarm(300, 700);
      } catch (error) {
        console.warn('Could not play notification beep:', error);
      }
      
      // Then try to speak the text
      if (!('speechSynthesis' in window)) {
        console.error('SpeechSynthesis not supported');
        // Don't reject, try to continue with the audio fallback
      } else {
        try {
          // Cancel any ongoing speech
          window.speechSynthesis.cancel();
          
          // Create and configure utterance
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = options.rate || 1;
          utterance.pitch = options.pitch || 1;
          utterance.volume = options.volume || 1;
          
          // Save reference to current utterance for cancellation
          this.currentUtterance = utterance;
          
          if (options.voice) {
            utterance.voice = options.voice;
          } else {
            // Try to find an English voice
            const voices = window.speechSynthesis.getVoices();
            const englishVoice = voices.find(voice => 
              voice.lang.includes('en-IN') || 
              voice.lang.includes('en-GB') || 
              voice.lang.includes('en-US')
            );
            
            if (englishVoice) {
              utterance.voice = englishVoice;
            }
          }
          
          // Setup event handlers
          utterance.onend = () => {
            console.log('Speech finished');
            resolve();
          };
          
          utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            // Continue despite error, no reject
          };
          
          // Speak the text
          console.log('Speaking:', text);
          window.speechSynthesis.speak(utterance);
          
          // Add a timeout to ensure we don't hang if speech synthesis fails silently
          setTimeout(() => {
            resolve();
          }, 8000);
          
          return;
        } catch (error) {
          console.error('Error with speech synthesis:', error);
          // Continue to audio fallback
        }
      }
      
      // Audio fallback if speech synthesis fails or isn't supported
      try {
        // Play a series of beeps as a fallback alert
        await this.playAlarmPattern();
        resolve();
      } catch (fallbackError) {
        console.error('Audio fallback also failed:', fallbackError);
        reject(new Error('Both speech and audio fallback failed'));
      }
    });
  }
  

}

// Export a singleton instance
export const audioManager = AudioManager.getInstance();