/**
 * ApalabraGE - Motor de Audio Táctil con Web Audio API
 * Genera sonidos armónicos, táctiles y fanfarrias sin dependencias externas.
 */

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  _init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  /**
   * Tono al deslizarse sobre una ficha consecutiva (la escala sube conforme la palabra crece)
   */
  playTileConnect(step = 1) {
    if (this.muted) return;
    this._init();
    if (!this.ctx) return;

    const baseFreq = 320;
    // Escala pentatónica luminosa (C, D, E, G, A)
    const scaleMultipliers = [1, 1.125, 1.25, 1.5, 1.666, 2, 2.25, 2.5, 3];
    const mult = scaleMultipliers[Math.min(step - 1, scaleMultipliers.length - 1)] || 1;
    const freq = baseFreq * mult;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle'; // Tono cálido tipo marimba
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * Sonido de palabra acertada (acorde brillante)
   */
  playWordMatch() {
    if (this.muted) return;
    this._init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.50]; // Do, Mi, Sol, Do agudo

    chords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.1, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.35);
    });
  }

  /**
   * Descenso de fichas por gravedad
   */
  playTileDrop() {
    if (this.muted) return;
    this._init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.15);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Error al soltar una palabra no válida
   */
  playInvalid() {
    if (this.muted) return;
    this._init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Pista / Powerup mágico
   */
  playSparkle() {
    if (this.muted) return;
    this._init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [880, 1108.73, 1318.51, 1760];

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.09, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.25);
    });
  }

  /**
   * Fanfarria de victoria de nivel
   */
  playVictory() {
    if (this.muted) return;
    this._init();
    if (!this.ctx) return;

    const notes = [
      { f: 523.25, d: 0.12, t: 0.00 }, // C5
      { f: 659.25, d: 0.12, t: 0.12 }, // E5
      { f: 783.99, d: 0.15, t: 0.24 }, // G5
      { f: 1046.50, d: 0.40, t: 0.39 } // C6
    ];

    const now = this.ctx.currentTime;
    notes.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.t);

      gain.gain.setValueAtTime(0.12, now + note.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + note.t);
      osc.stop(now + note.t + note.d);
    });
  }
}

export const sound = new SoundEngine();
