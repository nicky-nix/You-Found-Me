// ─── AUDIO ───────────────────────────────────────────────────
const audio = {
	explore: new Audio("assets/audio/explore.mp3"),
	reveal: new Audio("assets/audio/reveal.mp3"),
	sealCrack: new Audio("assets/audio/sealopen.mp3"),
	memoryFound: new Audio("assets/audio/memory.mp3"),
	typeSound: new Audio("assets/audio/typing.mp3"),

	_clickCtx: null,
	_clickGain: null,

	// ── Web Audio API-based waves (reliable on Android) ──
	waves: {
		_buffer: null,
		_source: null,
		_gainNode: null,
		_ctx: null,
		loop: true,
		volume: 0.25,
		paused: true,

		async _load() {
			const AudioCtx = window.AudioContext || window.webkitAudioContext;
			if (!AudioCtx) return;
			if (!this._ctx) {
				this._ctx = new AudioCtx();
				this._gainNode = this._ctx.createGain();
				this._gainNode.gain.value = this.volume;
				this._gainNode.connect(this._ctx.destination);
			}
			if (!this._buffer) {
				const response = await fetch("assets/audio/waves1.mp3");
				const arrayBuffer = await response.arrayBuffer();
				this._buffer = await this._ctx.decodeAudioData(arrayBuffer);
			}
		},

		play() {
			return new Promise(async (resolve, reject) => {
				try {
					await this._load();
					if (!this._ctx) return resolve();
					await this._ctx.resume();

					if (this._source) {
						try {
							this._source.stop();
						} catch (e) {}
						this._source.disconnect();
						this._source = null;
					}

					this._source = this._ctx.createBufferSource();
					this._source.buffer = this._buffer;
					this._source.loop = this.loop;
					this._source.connect(this._gainNode);
					this._source.start(0);
					this.paused = false;
					resolve();
				} catch (err) {
					reject(err);
				}
			});
		},

		pause() {
			if (this._ctx) this._ctx.suspend();
			this.paused = true;
		},
	},

	// ── Web Audio API click sound ──
	click: {
		currentTime: 0,
		play: function () {
			return new Promise((resolve) => {
				const AudioCtx = window.AudioContext || window.webkitAudioContext;
				if (!AudioCtx) return resolve();

				if (!audio._clickCtx) {
					audio._clickCtx = new AudioCtx();
					audio._clickGain = audio._clickCtx.createGain();
					audio._clickGain.connect(audio._clickCtx.destination);
				}

				const ctx = audio._clickCtx;

				const doPlay = () => {
					const osc = ctx.createOscillator();
					osc.connect(audio._clickGain);
					osc.type = "triangle";
					osc.frequency.setValueAtTime(800, ctx.currentTime);
					osc.frequency.exponentialRampToValueAtTime(
						200,
						ctx.currentTime + 0.05,
					);
					audio._clickGain.gain.setValueAtTime(0.2, ctx.currentTime);
					audio._clickGain.gain.exponentialRampToValueAtTime(
						0.01,
						ctx.currentTime + 0.05,
					);
					osc.start();
					osc.stop(ctx.currentTime + 0.06);
					osc.onended = () => osc.disconnect();
					resolve();
				};

				if (ctx.state === "suspended") {
					ctx.resume().then(doPlay).catch(resolve);
				} else {
					doPlay();
				}
			});
		},
	},
};

// ── HTML Audio element settings ──
audio.explore.loop = true;
audio.explore.volume = 0.4;
audio.reveal.loop = true;
audio.reveal.volume = 0.5;
audio.sealCrack.volume = 1;
audio.memoryFound.volume = 0.5;
audio.typeSound.loop = true;
audio.typeSound.volume = 0.3;

// Preload HTML audio elements
[
	audio.explore,
	audio.reveal,
	audio.sealCrack,
	audio.memoryFound,
	audio.typeSound,
].forEach((a) => {
	a.preload = "auto";
	a.load();
});

// ── Music start on first gesture (mobile unlock) ──
let musicStarted = false;
function startMusic() {
	if (musicStarted) return;
	musicStarted = true;
	audio.waves.play().catch((err) => console.log("Waves blocked:", err));
}

window.addEventListener("pointerdown", startMusic, { once: true });
window.addEventListener("keydown", startMusic, { once: true });

// ── Crossfade from explore → reveal ──
function switchToRevealMusic() {
	const fadeDuration = 2500;
	const fadeInterval = 50;
	const steps = fadeDuration / fadeInterval;
	const volumeStep = 1 / steps;

	audio.reveal.volume = 0;
	audio.reveal.play().catch((err) => console.log("Reveal music blocked:", err));

	let currentStep = 0;
	const crossfade = setInterval(() => {
		currentStep++;

		if (audio.explore && !audio.explore.paused) {
			audio.explore.volume = Math.max(0, audio.explore.volume - volumeStep);
		}
		if (audio.reveal) {
			audio.reveal.volume = Math.min(1, audio.reveal.volume + volumeStep);
		}

		if (currentStep >= steps) {
			clearInterval(crossfade);
			if (audio.explore) {
				audio.explore.pause();
				audio.explore.currentTime = 0;
			}
			audio.reveal.volume = 1;
		}
	}, fadeInterval);
}
