export function useSpeech() {
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      // Create a new speech synthesis utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set properties for the speech
      utterance.volume = 1; // 0 to 1
      utterance.rate = 0.9; // 0.1 to 10
      utterance.pitch = 1; // 0 to 2
      
      // Optional: Choose a voice
      const voices = window.speechSynthesis.getVoices();
      const indianEnglishVoice = voices.find(voice => 
        voice.lang.includes('en-IN') || 
        voice.lang.includes('en-GB') || 
        voice.lang.includes('en-US')
      );
      
      if (indianEnglishVoice) {
        utterance.voice = indianEnglishVoice;
      }
      
      // Speak the text
      window.speechSynthesis.speak(utterance);
      
      return utterance;
    } else {
      console.error('Speech synthesis not supported in this browser');
      return null;
    }
  };

  const cancel = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  return {
    speak,
    cancel,
  };
}
