class GameAudio {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.musicBus = null;
        this.sfxBus = null;
        this.musicTimer = null;
        this.musicStep = 0;
        this.started = false;
        this.muted = false;
        this.bossMode = false;
    }

    async start() {
        if (!this.ctx) this.createGraph();
        if (!this.ctx) return false;
        if (this.ctx.state === 'suspended') await this.ctx.resume();
        if (!this.musicTimer) this.startMusic();
        if (!this.started) {
            this.started = true;
            this.prescriptionReady();
        }
        return this.ctx.state === 'running';
    }

    createGraph() {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        this.ctx = new AudioContextClass();
        this.master = this.ctx.createGain();
        this.musicBus = this.ctx.createGain();
        this.sfxBus = this.ctx.createGain();
        const compressor = this.ctx.createDynamicsCompressor();
        compressor.threshold.value = -18;
        compressor.knee.value = 12;
        compressor.ratio.value = 5;
        compressor.attack.value = 0.005;
        compressor.release.value = 0.18;
        this.master.gain.value = 0.78;
        this.musicBus.gain.value = 0.34;
        this.sfxBus.gain.value = 0.58;
        this.musicBus.connect(this.master);
        this.sfxBus.connect(this.master);
        this.master.connect(compressor);
        compressor.connect(this.ctx.destination);
    }

    startMusic() {
        this.musicStep = 0;
        this.musicTick();
        this.musicTimer = setInterval(() => this.musicTick(), 210);
    }

    musicTick() {
        if (!this.ctx || this.ctx.state !== 'running' || this.muted) return;
        const melody = this.bossMode
            ? [220, 233.08, 220, 174.61, 196, 207.65, 196, 146.83, 174.61, 185, 174.61, 130.81, 146.83, 155.56, 146.83, 110]
            : [293.66, 349.23, 440, 349.23, 261.63, 329.63, 392, 329.63, 246.94, 293.66, 369.99, 293.66, 220, 277.18, 329.63, 277.18];
        const roots = this.bossMode ? [110, 98, 87.31, 73.42] : [146.83, 130.81, 123.47, 110];
        const step = this.musicStep++ % melody.length;
        const root = roots[Math.floor(step / 4)];
        this.tone(melody[step], 0.18, 'triangle', 0.075, 0, 'music');
        if (step % (this.bossMode ? 1 : 2) === 0) this.noise(0.025, this.bossMode ? 0.028 : 0.018, 5200, 0, 'music');
        if (step % 4 === 0) {
            this.tone(root, 0.7, 'sine', 0.105, 0, 'music');
            this.tone(root * 2, 0.52, 'triangle', 0.035, 0.02, 'music');
            this.tone(root * 2.5, 0.52, 'triangle', 0.027, 0.02, 'music');
        }
        if (step === 7 || step === 15) this.noise(0.1, 0.035, 900, 0, 'music');
    }

    tone(freq, duration, type = 'sine', volume = 0.1, delay = 0, bus = 'sfx', endFreq = null) {
        if (!this.ctx || this.ctx.state !== 'running' || this.muted) return;
        const start = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + duration);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain);
        gain.connect(bus === 'music' ? this.musicBus : this.sfxBus);
        osc.start(start);
        osc.stop(start + duration + 0.02);
    }

    noise(duration = 0.08, volume = 0.06, filterFreq = 1800, delay = 0, bus = 'sfx') {
        if (!this.ctx || this.ctx.state !== 'running' || this.muted) return;
        const start = this.ctx.currentTime + delay;
        const frames = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
        const buffer = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
        const source = this.ctx.createBufferSource();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        source.buffer = buffer;
        filter.type = 'bandpass';
        filter.frequency.value = filterFreq;
        filter.Q.value = 0.8;
        gain.gain.setValueAtTime(volume, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(bus === 'music' ? this.musicBus : this.sfxBus);
        source.start(start);
    }

    setPaused(paused) {
        if (!this.ctx || !this.musicBus) return;
        this.musicBus.gain.cancelScheduledValues(this.ctx.currentTime);
        this.musicBus.gain.setTargetAtTime(paused ? 0.08 : 0.34, this.ctx.currentTime, 0.08);
    }

    async toggleMute() {
        if (!this.ctx) await this.start();
        this.muted = !this.muted;
        if (this.master && this.ctx) {
            this.master.gain.cancelScheduledValues(this.ctx.currentTime);
            this.master.gain.setTargetAtTime(this.muted ? 0.0001 : 0.78, this.ctx.currentTime, 0.03);
        }
        return this.muted;
    }

    shoot() {
        this.tone(760, 0.055, 'square', 0.075, 0, 'sfx', 520);
        this.noise(0.035, 0.025, 2800);
    }

    enemyHit() { this.tone(185, 0.075, 'sawtooth', 0.07, 0, 'sfx', 105); }

    playerHit() {
        this.noise(0.14, 0.13, 620);
        this.tone(165, 0.2, 'square', 0.11, 0, 'sfx', 72);
    }

    shieldBlock() {
        this.tone(880, 0.18, 'sine', 0.1, 0, 'sfx', 1320);
        this.tone(1320, 0.13, 'triangle', 0.06, 0.04);
    }

    pickup(type = 'upgrade') {
        if (type === 'potion') {
            [523.25, 659.25, 783.99].forEach((note, i) => this.tone(note, 0.16, 'sine', 0.09, i * 0.055));
        } else if (type === 'cefaclor' || type === 'augmentin') {
            [392, 523.25, 783.99].forEach((note, i) => this.tone(note, 0.22, 'triangle', 0.08, i * 0.07));
        } else {
            [659.25, 880].forEach((note, i) => this.tone(note, 0.14, 'triangle', 0.09, i * 0.065));
        }
    }

    prescriptionReady() {
        this.tone(523.25, 0.1, 'triangle', 0.08);
        this.tone(783.99, 0.18, 'triangle', 0.09, 0.09);
    }

    levelUp() {
        [523.25, 659.25, 783.99, 1046.5].forEach((note, i) => this.tone(note, 0.24, 'triangle', 0.11, i * 0.075));
    }

    autoDispense() {
        this.noise(0.24, 0.11, 2400);
        [220, 329.63, 440, 659.25, 880].forEach((note, i) => this.tone(note, 0.28, i < 2 ? 'sawtooth' : 'triangle', 0.1, i * 0.045, 'sfx', note * 1.2));
    }

    bossAppear() {
        this.bossMode = true;
        this.noise(0.45, 0.12, 180);
        [110, 92.5, 73.42].forEach((note, i) => this.tone(note, 0.52, 'sawtooth', 0.13, i * 0.13, 'sfx', note * 0.72));
    }

    bossShot() {
        this.tone(240, 0.32, 'sawtooth', 0.12, 0, 'sfx', 720);
        this.noise(0.1, 0.08, 1200, 0.06);
    }

    summon() { [330, 247, 196].forEach((note, i) => this.tone(note, 0.24, 'square', 0.075, i * 0.055)); }

    bossDefeat() {
        this.bossMode = false;
        this.noise(0.3, 0.1, 320);
        [196, 293.66, 392, 587.33, 783.99].forEach((note, i) => this.tone(note, 0.3, 'triangle', 0.11, i * 0.075));
    }

    gameOver() {
        this.bossMode = false;
        [293.66, 246.94, 196, 146.83].forEach((note, i) => this.tone(note, 0.42, 'triangle', 0.105, i * 0.18, 'sfx', note * 0.82));
        this.setPaused(true);
    }

    hit() { this.enemyHit(); }
    boss() { this.bossAppear(); }
}

window.gameAudio = new GameAudio();
