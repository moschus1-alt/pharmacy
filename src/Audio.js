class GameAudio {
    constructor() { this.ctx = null; this.master = null; this.musicTimer = null; this.step = 0; }
    start() {
        if (this.ctx) { this.ctx.resume(); return; }
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain(); this.master.gain.value = 0.12; this.master.connect(this.ctx.destination);
        const notes = [220, 0, 277.18, 329.63, 0, 277.18, 246.94, 0, 196, 0, 246.94, 293.66, 0, 246.94, 220, 0];
        this.musicTimer = setInterval(() => { const n = notes[this.step++ % notes.length]; if (n) this.tone(n, .22, 'triangle', .035); }, 220);
    }
    tone(freq, duration, type = 'sine', volume = .12) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = type; osc.frequency.value = freq; gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(.001, this.ctx.currentTime + duration);
        osc.connect(gain); gain.connect(this.master); osc.start(); osc.stop(this.ctx.currentTime + duration);
    }
    shoot() { this.tone(680, .08, 'square', .09); }
    hit() { this.tone(150, .08, 'sawtooth', .07); }
    levelUp() { this.tone(523.25, .12, 'triangle', .12); setTimeout(() => this.tone(783.99, .18, 'triangle', .12), 100); }
    boss() { this.tone(95, .35, 'sawtooth', .16); }
}
window.gameAudio = new GameAudio();
