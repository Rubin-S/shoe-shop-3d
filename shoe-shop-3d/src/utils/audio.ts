/**
 * src/utils/audio.ts
 *
 * Procedural Web Audio API Micro-SFX & Atmospheric Sound Engine.
 * Generates zero-dependency interactive acoustic feedback:
 * - Ambient sound atmosphere: dual-oscillator warm subsonic pads (55Hz / 110Hz) with gentle lowpass breathing
 * - Rotation SFX: subtle tactile micro-friction sound on OrbitControls orbit/drag
 * - Segment select: low-frequency damped tactile thud (140Hz -> 55Hz)
 * - Color switch: dual-oscillator harmonic chime (528Hz & 1056Hz)
 * - Material/button click: crisp bandpass mechanical click (880Hz / 1760Hz Q=3.5)
 * - Explode snap: pneumatic/magnetic separation transient
 * - Checkout success: celebratory ascending harmonic chord progression
 * - Hover: micro-acoustic blip on interactive elements
 *
 * Persists mute preference in localStorage and fails gracefully in headless/SSR contexts.
 */

class WebAudioAtmosphere {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private isMutedState: boolean = false;
  private isInitialized: boolean = false;
  private isAmbientPlaying: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('shoe_shop_audio_muted');
      if (stored !== null) {
        this.isMutedState = stored === 'true';
      }
    }
  }

  public init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMutedState ? 0.0001 : 0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Dedicated ambient sub-bus
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.isMutedState ? 0.0001 : 0.05, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.isInitialized = true;
    } catch {
      // AudioContext unavailable or restricted by browser policy
    }
  }

  private ensureContext(): AudioContext | null {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public get isMuted(): boolean {
    return this.isMutedState;
  }

  public toggleMute(): boolean {
    this.isMutedState = !this.isMutedState;
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('shoe_shop_audio_muted', String(this.isMutedState));
    }
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMutedState ? 0.0001 : 0.35;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
    if (this.ambientGain && this.ctx) {
      const ambientTarget = this.isMutedState ? 0.0001 : 0.05;
      this.ambientGain.gain.setTargetAtTime(ambientTarget, this.ctx.currentTime, 0.1);
    }
    return this.isMutedState;
  }

  /**
   * Starts warm, generative luxury ambient drone pad.
   */
  public startAmbient(): boolean {
    const ctx = this.ensureContext();
    if (!ctx || !this.ambientGain || this.isAmbientPlaying) return false;
    try {
      const now = ctx.currentTime;

      // Lowpass filter for warm analog character
      this.ambientFilter = ctx.createBiquadFilter();
      this.ambientFilter.type = 'lowpass';
      this.ambientFilter.frequency.setValueAtTime(180, now);
      this.ambientFilter.Q.setValueAtTime(1.5, now);

      // Sub-bass root: 55Hz (A1)
      this.ambientOsc1 = ctx.createOscillator();
      this.ambientOsc1.type = 'sine';
      this.ambientOsc1.frequency.setValueAtTime(55, now);

      // Warm overtone: 110Hz (A2) with slight 0.15Hz chorus detune
      this.ambientOsc2 = ctx.createOscillator();
      this.ambientOsc2.type = 'triangle';
      this.ambientOsc2.frequency.setValueAtTime(110.15, now);

      this.ambientOsc1.connect(this.ambientFilter);
      this.ambientOsc2.connect(this.ambientFilter);
      this.ambientFilter.connect(this.ambientGain);

      this.ambientOsc1.start(now);
      this.ambientOsc2.start(now);
      this.isAmbientPlaying = true;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Smoothly stops ambient background audio.
   */
  public stopAmbient(): boolean {
    if (!this.isAmbientPlaying || !this.ctx) return false;
    try {
      const now = this.ctx.currentTime;
      if (this.ambientGain) {
        this.ambientGain.gain.setTargetAtTime(0.0001, now, 0.2);
      }
      setTimeout(() => {
        if (this.ambientOsc1) {
          try { this.ambientOsc1.stop(); } catch {}
          this.ambientOsc1.disconnect();
          this.ambientOsc1 = null;
        }
        if (this.ambientOsc2) {
          try { this.ambientOsc2.stop(); } catch {}
          this.ambientOsc2.disconnect();
          this.ambientOsc2 = null;
        }
        this.isAmbientPlaying = false;
      }, 300);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Harmonically tuned dual-sine chime for colorway and preset changes.
   */
  public playColorSwitch(): boolean {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMutedState) return false;
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(528, now); // Solfeggio C5 tone

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1056, now); // C6 upper harmonic

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.23);
      osc2.stop(now + 0.23);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Tactile low-frequency pitch envelope for anatomical segment tab switching.
   */
  public playSegmentSelect(): boolean {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMutedState) return false;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.07);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.10, now + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.075);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Precise filtered mechanical tick for button and finish switches.
   */
  public playClick(): boolean {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMutedState) return false;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1760, now);
      filter.Q.setValueAtTime(3.5, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.05);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Tactile micro-mechanical whir/friction sound when orbiting the 3D model.
   */
  public playRotation(): boolean {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMutedState) return false;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.linearRampToValueAtTime(340, now + 0.025);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(2.0, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.025, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.035);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Snappy pneumatic / magnetic tactile sound for exploded view separation and snap-back.
   */
  public playExplodeSnap(): boolean {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMutedState) return false;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const clickOsc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.09);

      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(1200, now);
      clickOsc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);

      osc.connect(gain);
      clickOsc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      clickOsc.start(now);
      osc.stop(now + 0.11);
      clickOsc.stop(now + 0.11);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Celebratory ascending harmonic chord progression for checkout completion.
   */
  public playCheckoutSuccess(): boolean {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMutedState) return false;
    try {
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 major chord arpeggio
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + idx * 0.07;
        const endTime = startTime + 0.45;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(0.06, startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(startTime);
        osc.stop(endTime + 0.02);
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Micro hover blip for magnetic cursor interaction with UI elements.
   */
  public playHover(): boolean {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMutedState) return false;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.015, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.03);
      return true;
    } catch {
      return false;
    }
  }
}

export const audioEngine = new WebAudioAtmosphere();
export const startAmbient = () => audioEngine.startAmbient();
export const stopAmbient = () => audioEngine.stopAmbient();
export const playColorSwitch = () => audioEngine.playColorSwitch();
export const playSegmentSelect = () => audioEngine.playSegmentSelect();
export const playClick = () => audioEngine.playClick();
export const playRotation = () => audioEngine.playRotation();
export const playExplodeSnap = () => audioEngine.playExplodeSnap();
export const playCheckoutSuccess = () => audioEngine.playCheckoutSuccess();
export const playHover = () => audioEngine.playHover();
