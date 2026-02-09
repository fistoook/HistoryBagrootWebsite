// Sound Effects Manager
class SoundEffects {
  constructor() {
    this.enabled = localStorage.getItem('soundEnabled') !== 'false';
    this.audioContext = null;
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      // Use Web Audio API to generate sounds instead of loading files
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
    } catch (e) {
      console.log('Web Audio API not supported');
    }
  }

  toggleSound(enabled) {
    this.enabled = enabled;
    localStorage.setItem('soundEnabled', enabled ? 'true' : 'false');
  }

  // Generate a simple beep sound
  playBeep(freq = 800, duration = 100) {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = freq;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration / 1000);
  }

  // Success/correct answer sound
  playSuccess() {
    if (!this.enabled) return;
    this.playBeep(800, 100);
    setTimeout(() => this.playBeep(1000, 150), 120);
  }

  // Error/wrong answer sound
  playError() {
    if (!this.enabled) return;
    this.playBeep(400, 200);
    this.playBeep(300, 200);
  }

  // Super station unlock - epic sound
  playEpicUnlock() {
    if (!this.enabled) return;
    this.playBeep(500, 150);
    setTimeout(() => this.playBeep(650, 150), 160);
    setTimeout(() => this.playBeep(800, 200), 320);
    setTimeout(() => this.playBeep(1000, 300), 520);
  }

  // Level up sound
  playLevelUp() {
    if (!this.enabled) return;
    this.playBeep(523, 100); // C
    setTimeout(() => this.playBeep(659, 100), 110);  // E
    setTimeout(() => this.playBeep(784, 200), 220);  // G
  }

  // Point earned sound
  playPointEarned() {
    if (!this.enabled) return;
    this.playBeep(600, 80);
  }

  // Click sound
  playClick() {
    if (!this.enabled) return;
    this.playBeep(700, 50);
  }
}

// Initialize global sound effects
const soundEffects = new SoundEffects();
