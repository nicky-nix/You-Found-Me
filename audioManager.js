// ─── AUDIO ───────────────────────────────────────────────────
const audio = {
	explore: new Audio("assets/audio/explore.mp3"),
	reveal: new Audio("assets/audio/reveal.mp3"),
	sealCrack: new Audio("assets/audio/sealopen.mp3"),
	memoryFound: new Audio("assets/audio/memory.mp3"),
	typeSound: new Audio("assets/audio/typing.mp3"),
	waves: new Audio("assets/audio/waves1.mp3"), // ← new

	// PERF: Reuse a single AudioContext and OscillatorNode chain instead of
	// creating a new AudioContext on every click. Android WebView has a hard
	// limit on concurrent AudioContexts (often 6) and creating/closing them
	// rapidly causes audio glitches and GC pauses.
	_clickCtx: null,
	_clickGain: null,

	click: {
		currentTime: 0, // Keeps compatibility with reset code elsewhere
		play: function () {
			return new Promise((resolve) => {
				const AudioCtx = window.AudioContext || window.webkitAudioContext;
				if (!AudioCtx) return resolve();

				// Reuse existing context
				if (!audio._clickCtx) {
					audio._clickCtx = new AudioCtx();
					audio._clickGain = audio._clickCtx.createGain();
					audio._clickGain.connect(audio._clickCtx.destination);
				}

				const ctx = audio._clickCtx;

				// Resume suspended context (mobile browsers suspend it when idle)
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

					// PERF: Disconnect the oscillator after it finishes so it can be GC'd
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

audio.explore.loop = true;
audio.explore.volume = 0.4;
audio.reveal.loop = true;
audio.reveal.volume = 0.5;
audio.sealCrack.volume = 1;
audio.typeSound.volume = 0.7;
audio.memoryFound.volume = 0.5;
audio.waves.loop = true;
audio.waves.volume = 0.55; // slightly louder than explore to be audible
audio.waves.preload = "auto";

if (audio.typeSound) {
	audio.typeSound.loop = true;
	audio.typeSound.volume = 0.3;
}

// PERF: Preload audio files so Android doesn't stall on first play
// (Android WebView often has a "first play" spike of 200-400ms)
[
	audio.explore,
	audio.reveal,
	audio.sealCrack,
	audio.memoryFound,
	audio.typeSound,
	audio.waves,
].forEach((a) => {
	a.preload = "auto";
	// Load a silent portion to prime the decoder
	a.load();
});

// --- FIXED AUDIO UNLOCK FOR MOBILE ---
let musicStarted = false;
function startMusic() {
	if (musicStarted) return;
	musicStarted = true;
	audio.waves.play().catch((err) => console.log("Waves blocked:", err));
	/*audio.explore
		.play()
		.catch((err) => console.log("Audio playback blocked:", err));*/
}

window.addEventListener("pointerdown", startMusic, { once: true });
window.addEventListener("keydown", startMusic, { once: true });

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
