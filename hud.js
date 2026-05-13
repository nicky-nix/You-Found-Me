// ─── CRASH-PROOF RETRO HUD ENGINE WITH TRACKERS ──────────────────────────

let notification = null;
let notifTimer = 0;
let notifMaxTime = 180;

// Internal animated tracking values to make indicators feel alive
let smoothRenderCoords = { x: 0, z: 0 };
let hudPulseCycle = 0;
let smoothHeartPct = 0; // Smooth easing for destination tracker
let smoothMemoriesPct = 0; // Smooth easing for memories tracker

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

	// ─────── 2. HEART PROGRESSION SYSTEM (TOP LEFT - ANCHOR) ───────
	drawProgressHeart();

	// ─────── 3. MEMORIES PROGRESSION BAR (TOP LEFT - STACKED BELOW HEART) ───────
	drawMemoriesBar();

	// ─────── 4. FLIGHT INDICATOR (TOP LEFT - STACKED BOTTOM) ───────
	if (player && player.hasWings) {
		const wingX = uiPx(20);
		// Push down below both the heart panel (36px) and memories panel (36px) plus spacing
		const wingY = uiPx(20) + uiPx(36) + uiPx(36) + uiPx(16);
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
}

function getGameCoords() {
	if (!player) return { x: 0, z: 0 };
	return {
		x: Math.floor(player.x / TILE_SIZE),
		z: -Math.floor(player.y / TILE_SIZE),
	};
}

// ─────── 5. RETRO PROGRESSION CARD (DESTINATION DISTANCE) ───────
function drawProgressHeart() {
	if (!player || !destination) return;

	const dx = player.x - destination.x;
	const dy = player.y - destination.y;
	const dist = Math.sqrt(dx * dx + dy * dy);
	const targetPct = 1 - Math.min(dist / 450, 1);

	smoothHeartPct += (targetPct - smoothHeartPct) * 0.1;

	const panelX = uiPx(20);
	const panelY = uiPx(20);
	const panelW = uiPx(185);
	const panelH = uiPx(36);

	drawDecorativePixelPanel(
		fogCtx,
		panelX,
		panelY,
		panelW,
		panelH,
		"rgba(14, 11, 14, 0.92)",
		"#dbb40c",
	);

	const heartPulse = Math.sin(hudPulseCycle * 2) * uiPx(1);
	fogCtx.save();
	fogCtx.font = `${uiPx(15)}px serif`;

	fogCtx.globalAlpha = 0.25;
	fogCtx.fillText("🤍", panelX + uiPx(12), panelY + uiPx(24));

	fogCtx.globalAlpha = 0.4 + smoothHeartPct * 0.6;
	if (smoothHeartPct > 0.05) {
		applyEtherealGlow(fogCtx, "#ff3366", 8 * smoothHeartPct);
		fogCtx.fillText("❤️", panelX + uiPx(12), panelY + uiPx(24) + heartPulse);
	}
	fogCtx.restore();

	const barX = panelX + uiPx(42);
	const barY = panelY + uiPx(13);
	const barW = uiPx(130);
	const barH = uiPx(10);

	fogCtx.fillStyle = "#2a1f15";
	fogCtx.fillRect(barX, barY, barW, barH);
	fogCtx.strokeStyle = "#4a3b2c";
	fogCtx.lineWidth = uiPx(1);
	fogCtx.strokeRect(barX, barY, barW, barH);

	if (smoothHeartPct > 0.01) {
		fogCtx.save();
		const fillW = barW * smoothHeartPct;
		const progressGrad = fogCtx.createLinearGradient(
			barX,
			barY,
			barX + barW,
			barY,
		);
		progressGrad.addColorStop(0, "#ff2a6d");
		progressGrad.addColorStop(1, "#ff8c00");

		applyEtherealGlow(fogCtx, "#ff2a6d", 6 * smoothHeartPct);
		fogCtx.fillStyle = progressGrad;
		fogCtx.fillRect(
			barX + uiPx(1),
			barY + uiPx(1),
			fillW - uiPx(2),
			barH - uiPx(2),
		);
		fogCtx.restore();
	}
}

// ─────── 6. NEW: COLLECTED MEMORIES TRACKER BAR ───────
function drawMemoriesBar() {
	// Safety check to ensure arrays are defined in game.js context
	if (typeof memories === "undefined" || !memories) return;

	const totalMemories = memories.length;
	const collectedCount =
		memories.filter((m) => m.collected).count ||
		memories.filter((m) => m.collected).length;

	// Math safety boundary check
	const targetPct = totalMemories > 0 ? collectedCount / totalMemories : 0;

	// Smoothly glide the bar width change when a memory is loaded
	smoothMemoriesPct += (targetPct - smoothMemoriesPct) * 0.1;

	const panelX = uiPx(20);
	const panelY = uiPx(20) + uiPx(36) + uiPx(8); // Positioned nicely below the first tracker
	const panelW = uiPx(185);
	const panelH = uiPx(36);

	// Base Panel container
	drawDecorativePixelPanel(
		fogCtx,
		panelX,
		panelY,
		panelW,
		panelH,
		"rgba(10, 14, 12, 0.92)",
		"#dbb40c",
	);

	// Render dynamic sparkling icon star label
	fogCtx.save();
	fogCtx.font = `${uiPx(11)}px "Press Start 2P"`;

	// Pulsating star aura tracking
	const starPulse = Math.abs(Math.sin(hudPulseCycle * 1.5)) * 6 + 2;
	applyEtherealGlow(fogCtx, "#00ffcc", starPulse);
	fogCtx.fillStyle = "#00ffcc";
	fogCtx.fillText("✨", panelX + uiPx(10), panelY + uiPx(23));
	fogCtx.restore();

	// Draw internal metric bar slot
	const barX = panelX + uiPx(42);
	const barY = panelY + uiPx(13);
	const barW = uiPx(130);
	const barH = uiPx(10);

	fogCtx.fillStyle = "#12221a";
	fogCtx.fillRect(barX, barY, barW, barH);
	fogCtx.strokeStyle = "#1d3a2b";
	fogCtx.lineWidth = uiPx(1);
	fogCtx.strokeRect(barX, barY, barW, barH);

	// Render Filled Progress Section
	if (smoothMemoriesPct > 0.01) {
		fogCtx.save();
		const fillW = barW * smoothMemoriesPct;

		// Immersive cybernetic emerald/cyan tech color gradient
		const memoryGrad = fogCtx.createLinearGradient(
			barX,
			barY,
			barX + barW,
			barY,
		);
		memoryGrad.addColorStop(0, "#00ff87");
		memoryGrad.addColorStop(1, "#60efff");

		applyEtherealGlow(fogCtx, "#00ff87", 6 * smoothMemoriesPct);
		fogCtx.fillStyle = memoryGrad;
		fogCtx.fillRect(
			barX + uiPx(1),
			barY + uiPx(1),
			fillW - uiPx(2),
			barH - uiPx(2),
		);
		fogCtx.restore();
	}

	// Tiny micro numbers text layout inside the bar panel to track exact metrics
	fogCtx.save();
	fogCtx.font = `${uiPx(6)}px "Press Start 2P"`;
	fogCtx.fillStyle = "rgba(255, 255, 255, 0.75)";
	fogCtx.textAlign = "right";
	fogCtx.fillText(
		`${collectedCount}/${totalMemories}`,
		barX + barW - uiPx(4),
		barY - uiPx(4),
	);
	fogCtx.restore();
}

// ─────── 7. NOTIFICATION BANNER (BOTTOM CENTER) ───────
function drawNotification() {
	if (!notification || notifTimer <= 0) return;
	notifTimer--;

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
