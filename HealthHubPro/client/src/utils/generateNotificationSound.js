// Generate a notification sound and export it to an audio file
// This script is for development purposes only

function generateNotificationSound() {
  // Create an offline audio context
  const offlineCtx = new OfflineAudioContext({
    numberOfChannels: 2,
    length: 44100 * 2, // 2 seconds
    sampleRate: 44100,
  });

  // Create an oscillator
  const oscillator1 = offlineCtx.createOscillator();
  oscillator1.type = 'sine';
  oscillator1.frequency.value = 830; // A high note
  
  // Create a second oscillator
  const oscillator2 = offlineCtx.createOscillator();
  oscillator2.type = 'sine';
  oscillator2.frequency.value = 700; // A lower note
  
  // Create a gain node for the envelope
  const gainNode = offlineCtx.createGain();
  gainNode.gain.value = 0.5;
  gainNode.gain.setValueAtTime(0, 0);
  gainNode.gain.linearRampToValueAtTime(0.7, 0.1);
  gainNode.gain.exponentialRampToValueAtTime(0.01, 1.5);
  
  // Connect the oscillators to the gain node and the gain node to the destination
  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  gainNode.connect(offlineCtx.destination);
  
  // Start and stop the oscillators
  oscillator1.start(0);
  oscillator2.start(0.1); // Start the second oscillator a bit later
  oscillator1.stop(0.5);
  oscillator2.stop(0.7);
  
  // Render the audio
  return offlineCtx.startRendering().then((renderedBuffer) => {
    // Convert the rendered buffer to a WAV file
    // This is a simple implementation, a more sophisticated one would be needed for production
    const audioElement = new Audio();
    audioElement.src = URL.createObjectURL(new Blob([renderedBuffer], { type: 'audio/wav' }));
    return audioElement;
  });
}

// You can use this in a browser console to generate and play the sound
// generateNotificationSound().then(audio => audio.play());