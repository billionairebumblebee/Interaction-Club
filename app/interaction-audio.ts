// Original, locally synthesized sounds. No recordings, third-party requests,
// microphone permission, or audio files are needed.
export type SoundCue = "click" | "flip" | "confetti" | "happy" | "celebrate" | "aw";

export class InteractionAudio {
  private context: AudioContext | null = null;
  private effects: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private musicStep = 0;
  private nextBeat = 0;
  private lastClick = 0;
  effectsEnabled = true;

  async unlock() {
    if (typeof window === "undefined" || !window.AudioContext) return false;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.effects = this.context.createGain();
        this.musicBus = this.context.createGain();
        this.effects.gain.value = this.effectsEnabled ? 0.22 : 0;
        this.musicBus.gain.value = 0.12;
        this.effects.connect(this.context.destination);
        this.musicBus.connect(this.context.destination);
      }
      if (this.context.state === "suspended") await this.context.resume();
      return this.context.state === "running";
    } catch { return false; }
  }

  setEffects(enabled: boolean) {
    this.effectsEnabled = enabled;
    if (this.context && this.effects) this.effects.gain.setTargetAtTime(enabled ? 0.22 : 0, this.context.currentTime, 0.015);
  }

  private note(midi: number, time: number, length: number, volume: number, bus: GainNode, type: OscillatorType = "sine") {
    const ctx = this.context!;
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(volume, time + 0.009);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + length);
    oscillator.connect(envelope); envelope.connect(bus);
    oscillator.start(time); oscillator.stop(time + length + 0.02);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
  }

  async play(cue: SoundCue) {
    if (!this.effectsEnabled || document.hidden || !await this.unlock() || !this.effectsEnabled || document.hidden) return;
    const ctx = this.context!; const bus = this.effects!; const now = ctx.currentTime + 0.008;
    if (cue === "click" || cue === "flip") {
      if (now - this.lastClick < 0.06) return;
      this.lastClick = now;
      this.note(cue === "click" ? 79 : 67, now, 0.11, 0.28, bus, "sine");
      if (cue === "flip") this.note(74, now + 0.055, 0.12, 0.23, bus);
      return;
    }
    if (cue === "aw") {
      // A soft, playful falling phrase—not an error buzzer.
      [76, 72, 69].forEach((note, index) => this.note(note, now + index * 0.16, 0.45, 0.18, bus));
      return;
    }
    const notes = cue === "happy" ? [72, 76, 79, 84] : cue === "confetti" ? [72, 79, 84, 88, 91, 96] : [60, 64, 67, 72, 76, 79, 84, 88, 91, 96];
    notes.forEach((note, index) => this.note(note, now + index * 0.085, 0.35, 0.23, bus, index % 2 ? "sine" : "triangle"));
    if (cue === "celebrate") {
      [60, 64, 67, 72].forEach(note => this.note(note, now + 0.95, 1.1, 0.14, bus, "triangle"));
      [91, 88, 84, 79].forEach((note, i) => this.note(note, now + 1.15 + i * 0.12, 0.4, 0.14, bus));
    }
  }

  async startMusic() {
    if (!await this.unlock()) return false;
    if (this.musicTimer) return true;
    const ctx = this.context!;
    this.musicBus!.gain.setTargetAtTime(0.12, ctx.currentTime, 0.03);
    this.nextBeat = ctx.currentTime + 0.04; this.musicStep = 0;
    // A light 96 BPM lounge loop: plucked melody, soft bass, major-seventh chords.
    const chords = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67]];
    const melody = [12, -1, 7, 9, -1, 4, 7, -1, 12, 14, -1, 9, 7, -1, 4, -1];
    const schedule = () => {
      if (document.hidden) return;
      // A sleeping device or throttled timer must not replay a backlog of notes.
      if (this.nextBeat < ctx.currentTime - 0.2) this.nextBeat = ctx.currentTime + 0.04;
      while (this.nextBeat < ctx.currentTime + 0.15) {
        const bar = Math.floor(this.musicStep / 16) % 4;
        const slot = this.musicStep % 16; const chord = chords[bar];
        if (slot === 0 || slot === 8) {
          chord.forEach(note => this.note(note, this.nextBeat, 1.1, 0.07, this.musicBus!, "triangle"));
          this.note(chord[0] - 12, this.nextBeat, 0.6, 0.25, this.musicBus!);
        }
        if (melody[slot] >= 0) this.note(chord[0] + melody[slot] + 12, this.nextBeat, 0.22, 0.22, this.musicBus!);
        this.nextBeat += 60 / 96 / 4; this.musicStep++;
      }
    };
    schedule(); this.musicTimer = setInterval(schedule, 50); return true;
  }

  stopMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
    if (this.context && this.musicBus) this.musicBus.gain.setTargetAtTime(0, this.context.currentTime, 0.02);
  }

  suspend() { this.stopMusic(); void this.context?.suspend().catch(() => undefined); }
  dispose() { this.stopMusic(); void this.context?.close().catch(() => undefined); this.context = null; }
}
