// Toggle Mail – Sound Manager (TypeScript)

class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean;

  constructor() {
    this.enabled = localStorage.getItem('toggle_mail_sounds') !== 'false';
  }

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  private beep(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
    if (!this.enabled) return;
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch { /* ignore */ }
  }

  send()    { this.beep(880, 0.18, 'sine', 0.12); setTimeout(() => this.beep(1100, 0.12), 120); }
  receive() { this.beep(520, 0.12, 'sine', 0.08); setTimeout(() => this.beep(640, 0.1), 80); }
  archive() { this.beep(320, 0.22, 'triangle', 0.06); }
  error()   { this.beep(220, 0.3, 'sawtooth', 0.1); }
  click()   { this.beep(660, 0.06, 'sine', 0.04); }
  trash()   { this.beep(180, 0.25, 'triangle', 0.07); }
  star()    { this.beep(750, 0.1, 'sine', 0.06); setTimeout(() => this.beep(1000, 0.08), 70); }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('toggle_mail_sounds', String(this.enabled));
    return this.enabled;
  }
  isEnabled() { return this.enabled; }
}

export const sounds = new SoundManager();
