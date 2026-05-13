// ─── AUDIO ───────────────────────────────────────────────────
const audio = {
	explore: new Audio("assets/audio/explore.mp3"),
	reveal: new Audio("assets/audio/reveal.mp3"),
	sealCrack: new Audio("assets/audio/sealopen.mp3"),
	memoryFound: new Audio("assets/audio/memory.mp3"),
	typeSound: new Audio("assets/audio/typing.mp3"),
	click: {
		currentTime: 0, // Keeps compatibility with your reset code
		play: function () {
			return new Promise((resolve) => {
				const AudioCtx = window.AudioContext || window.webkitAudioContext;
				if (!AudioCtx) return resolve();

				const ctx = new AudioCtx();
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();

				osc.connect(gain);
				gain.connect(ctx.destination);

				// 'sine' is soft, 'square' or 'triangle' feels like an old GameBoy
				osc.type = "triangle";

				// Start high, slide down fast (creates a crisp "pop/click" sensation)
				osc.frequency.setValueAtTime(800, ctx.currentTime);
				osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.05);

				// Quick fade out so it doesn't ring
				gain.gain.setValueAtTime(0.2, ctx.currentTime);
				gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

				osc.start();
				osc.stop(ctx.currentTime + 0.06);
				resolve();
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

if (audio.typeSound) {
	audio.typeSound.loop = true;
	audio.typeSound.volume = 0.3;
}

// --- FIXED AUDIO UNLOCK FOR MOBILE ---
let musicStarted = false;
function startMusic() {
	if (musicStarted) return;
	musicStarted = true;
	audio.explore
		.play()
		.catch((err) => console.log("Audio playback blocked:", err));
}

window.addEventListener("pointerdown", startMusic, { once: true });
window.addEventListener("keydown", startMusic, { once: true });

function switchToRevealMusic() {
	const fadeDuration = 2500; // Match the 2.5 second delay in startRevealSequence
	const fadeInterval = 50; // Update volume every 50ms
	const steps = fadeDuration / fadeInterval;
	const volumeStep = 1 / steps;

	// 1. Prepare the reveal music silently in the background
	audio.reveal.volume = 0;
	audio.reveal.play().catch((err) => console.log("Reveal music blocked:", err));

	let currentStep = 0;

	const crossfade = setInterval(() => {
		currentStep++;

		// ─── FADE OUT EXPLORE ───
		if (audio.explore && !audio.explore.paused) {
			audio.explore.volume = Math.max(0, audio.explore.volume - volumeStep);
		}

		// ─── FADE IN REVEAL ───
		if (audio.reveal) {
			audio.reveal.volume = Math.min(1, audio.reveal.volume + volumeStep);
		}

		// ─── CLEANUP WHEN FADE IS DONE ───
		if (currentStep >= steps) {
			clearInterval(crossfade);

			if (audio.explore) {
				audio.explore.pause();
				audio.explore.currentTime = 0; // Reset track position
			}

			// Lock target volumes perfectly
			audio.reveal.volume = 1;
		}
	}, fadeInterval);
}
