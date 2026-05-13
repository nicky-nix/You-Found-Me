// ─── CRASH-PROOF RETRO HUD ENGINE ───────────────────────────────────

let notification = null;
let notifTimer = 0;
let notifMaxTime = 180;

// Internal animated tracking values to make indicators feel alive
let smoothRenderCoords = { x: 0, z: 0 };
let hudPulseCycle = 0;

// High-end retro glow matrices
function applyEtherealGlow(ctx, color, blurAmount) {
	ctx.shadowColor = color;
	ctx.shadowBlur = uiPx(blurAmount);
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;
}

function killGlow(ctx) {
	ctx.shadowBlur = 0;
}

// SAFE UNIVERSAL ROUND RECT (Prevents game freezing on popup assets)
function roundRect(ctx, x, y, w, h, r) {
	if (w < 0 || h < 0) return; // Guard against negative layout calculations
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + r);
	ctx.lineTo(x + w, y + h - r);
	ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	ctx.lineTo(x + r, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - r);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
	ctx.fill();
}

// Special separate function explicitly for the HUD panels
function drawDecorativePixelPanel(ctx, x, y, w, h, baseColor, trimColor) {
	ctx.save();

	// Main Body Plate
	ctx.fillStyle = baseColor;
	ctx.fillRect(x, y, w, h);

	// Outer Pixel Border Outlines
	ctx.strokeStyle = trimColor;
	ctx.lineWidth = uiPx(2);
	ctx.strokeRect(x + uiPx(2), y + uiPx(2), w - uiPx(4), h - uiPx(4));

	// Stylized Vintage RPG Corner Studs
	ctx.fillStyle = trimColor;
	const studSize = uiPx(4);
	ctx.fillRect(x + uiPx(5), y + uiPx(5), studSize, studSize); // Top-Left
	ctx.fillRect(x + w - uiPx(9), y + uiPx(5), studSize, studSize); // Top-Right
	ctx.fillRect(x + uiPx(5), y + h - uiPx(9), studSize, studSize); // Bottom-Left
	ctx.fillRect(x + w - uiPx(9), y + h - uiPx(9), studSize, studSize); // Bottom-Right

	ctx.restore();
}

function drawHUD() {
	hudPulseCycle += 0.04;

	const realCoords = getGameCoords();
	// Smoothly ease the displayed coordinates for an advanced rolling digital counter effect
	smoothRenderCoords.x += (realCoords.x - smoothRenderCoords.x) * 0.25;
	smoothRenderCoords.z += (realCoords.z - smoothRenderCoords.z) * 0.25;

	const dispX = Math.round(smoothRenderCoords.x);
	const dispZ = Math.round(smoothRenderCoords.z);

	// ─────── 1. COMPASS SYSTEM (TOP RIGHT) ───────
	const compW = uiPx(170);
	const compH = uiPx(60);
	const compX = GAME_W - compW - uiPx(20);
	const compY = uiPx(20);

	drawDecorativePixelPanel(
		fogCtx,
		compX,
		compY,
		compW,
		compH,
		"rgba(12, 10, 12, 0.92)",
		"#dbb40c",
	);

	fogCtx.save();
	fogCtx.strokeStyle = "rgba(219, 180, 12, 0.15)";
	fogCtx.lineWidth = uiPx(1);
	fogCtx.beginPath();
	fogCtx.moveTo(compX + compW / 2, compY + uiPx(6));
	fogCtx.lineTo(compX + compW / 2, compY + compH - uiPx(6));
	fogCtx.moveTo(compX + uiPx(6), compY + compH / 2);
	fogCtx.lineTo(compX + compW - uiPx(6), compY + compH / 2);
	fogCtx.stroke();
	fogCtx.restore();

	fogCtx.save();
	fogCtx.font = `${uiPx(9)}px "Press Start 2P"`;
	fogCtx.shadowColor = "#3a2500";
	fogCtx.shadowOffsetX = uiPx(1.5);
	fogCtx.shadowOffsetY = uiPx(1.5);

	fogCtx.fillStyle = "#ff5555";
	fogCtx.fillText("🧭 X", compX + uiPx(18), compY + uiPx(24));
	fogCtx.fillStyle = "#ffffff";
	fogCtx.fillText(
		String(dispX).padStart(4, " "),
		compX + uiPx(78),
		compY + uiPx(24),
	);

	fogCtx.fillStyle = "#55ff55";
	fogCtx.fillText("🗺️ Z", compX + uiPx(18), compY + uiPx(46));
	fogCtx.fillStyle = "#ffffff";
	fogCtx.fillText(
		String(dispZ).padStart(4, " "),
		compX + uiPx(78),
		compY + uiPx(46),
	);
	fogCtx.restore();

	// ─────── 2. FLIGHT INDICATOR (TOP LEFT) ───────
	if (player && player.hasWings) {
		const wingX = uiPx(20);
		const wingY = uiPx(20);
		const wingW = uiPx(115);
		const wingH = uiPx(32);

		const waveGlow = Math.abs(Math.sin(hudPulseCycle)) * 12 + 4;
		const bounceMovement = Math.sin(hudPulseCycle * 1.5) * uiPx(2);

		fogCtx.save();
		applyEtherealGlow(fogCtx, "rgba(0, 240, 255, 0.6)", waveGlow);
		drawDecorativePixelPanel(
			fogCtx,
			wingX,
			wingY + bounceMovement,
			wingW,
			wingH,
			"rgba(10, 22, 35, 0.85)",
			"#00f0ff",
		);
		fogCtx.restore();

		fogCtx.save();
		fogCtx.font = `${uiPx(8)}px "Press Start 2P"`;
		fogCtx.fillStyle = "#ffffff";
		applyEtherealGlow(fogCtx, "#ffffff", 4);
		fogCtx.fillText(
			"🪽 FLYING",
			wingX + uiPx(15),
			wingY + uiPx(20) + bounceMovement,
		);
		fogCtx.restore();
	}

	if (typeof drawProgressHeart === "function") {
		drawProgressHeart();
	}
}

function getGameCoords() {
	if (!player) return { x: 0, z: 0 };
	return {
		x: Math.floor(player.x / TILE_SIZE),
		z: -Math.floor(player.y / TILE_SIZE),
	};
}

// ─────── 3. NOTIFICATION BANNER (BOTTOM CENTER) ───────
function drawNotification() {
	if (!notification || notifTimer <= 0) return;
	notifTimer--;

	const lifetimeRatio = notifTimer / notifMaxTime;
	let animAlpha = 1;
	let verticalSlide = 0;

	if (notifMaxTime - notifTimer < 25) {
		const progress = (notifMaxTime - notifTimer) / 25;
		verticalSlide = (1 - Math.sin((progress * Math.PI) / 2)) * uiPx(25);
		animAlpha = progress;
	} else if (notifTimer < 30) {
		animAlpha = notifTimer / 30;
		verticalSlide = (1 - animAlpha) * uiPx(-12);
	}

	fogCtx.save();
	fogCtx.globalAlpha = animAlpha;

	const bannerW = Math.min(GAME_W - uiPx(40), uiPx(580));
	const bannerH = uiPx(44);
	const bannerX = (GAME_W - bannerW) / 2;
	const bannerY = GAME_H - bannerH - uiPx(60) + verticalSlide;

	fogCtx.shadowColor = "rgba(0, 0, 0, 0.5)";
	fogCtx.shadowBlur = uiPx(8);
	fogCtx.shadowOffsetY = uiPx(4);

	drawDecorativePixelPanel(
		fogCtx,
		bannerX,
		bannerY,
		bannerW,
		bannerH,
		"rgba(16, 12, 8, 0.97)",
		"#dbb40c",
	);
	killGlow(fogCtx);

	fogCtx.font = `${uiPx(8)}px "Press Start 2P"`;
	fogCtx.fillStyle = "#fffdf0";
	fogCtx.textAlign = "center";

	fogCtx.shadowColor = "#000000";
	fogCtx.shadowBlur = 0;
	fogCtx.shadowOffsetX = uiPx(1);
	fogCtx.shadowOffsetY = uiPx(1);

	let shakeY = 0;
	if (notifTimer > notifMaxTime - 15) {
		shakeY = (Math.random() - 0.5) * uiPx(1.5);
	}

	fogCtx.fillText(
		notification,
		GAME_W / 2,
		bannerY + bannerH / 2 + uiPx(3.5) + shakeY,
	);
	fogCtx.restore();

	if (notifTimer <= 0) notification = null;
}

function showNotification(msg) {
	notification = msg;
	notifTimer = 180;
	notifMaxTime = 180;
}
