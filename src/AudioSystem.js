/**
 * AudioSystem.js - Realistické zvukové efekty JOP generované pomocí Web Audio API
 * Není potřeba stahovat žádné externí soubory .wav, funguje ihned v jakémkoliv prohlížeči.
 */
export class AudioSystem {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.activeAlarms = new Map();
    }

    init() {
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

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopAllAlarms();
        }
        return this.enabled;
    }

    /**
     * Krátké kliknutí / potvrzení relé JOP
     */
    playRelayClick() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(650, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.04);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.04);
    }

    /**
     * Zvuk postavení vlakové cesty (charakteristický melodický tón)
     */
    playRouteBuilt() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, t); // C5
        osc.frequency.setValueAtTime(659.25, t + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, t + 0.16); // G5

        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.35);
    }

    /**
     * Zvuk 1.wav - Vstup vlaku do 2. přibližovacího úseku (zřetelné pípnutí)
     */
    playApproach1() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t); // A5

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.18);
    }

    /**
     * Zvuk 2.wav - Vstup před vjezdové návěstidlo na volno (kratší pípnutí)
     */
    playApproach2() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5, t); // C6

        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    /**
     * Žádost o traťový souhlas (souhlas.wav - opakované přerušované pípání)
     */
    startConsentRequestLoop(id = 'consent') {
        if (!this.enabled || this.activeAlarms.has(id)) return;
        this.init();
        if (!this.ctx) return;

        const timer = setInterval(() => {
            if (!this.enabled) {
                this.stopAlarm(id);
                return;
            }
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, t);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.12);
        }, 800);

        this.activeAlarms.set(id, timer);
    }

    stopAlarm(id) {
        if (this.activeAlarms.has(id)) {
            clearInterval(this.activeAlarms.get(id));
            this.activeAlarms.delete(id);
        }
    }

    stopAllAlarms() {
        for (const [id, timer] of this.activeAlarms.entries()) {
            clearInterval(timer);
        }
        this.activeAlarms.clear();
    }
}
