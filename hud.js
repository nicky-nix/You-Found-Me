// ─── LIGHT HUD — STARLIT ISLAND THEME (CREAM, PASTEL, DARK TEXT) ───────────
//  Replaces all dark panels with light/cream backgrounds and high‑contrast text.
//  Memory popup text is now left‑aligned.

let notification = null;
let notifTimer = 0;
let notifMaxTime = 180;

let smoothRenderCoords = { x: 0, z: 0 };
let hudPulseCycle = 0;
let smoothHeartPct = 0;
let smoothMemoriesPct = 0;

let prevPlayerX = 0;
let prevPlayerY = 0;
let playerVelX = 0;
let playerVelY = 0;
let playerSpeed = 0;
let smoothSpeed = 0;

let panelTilt = 0;
let compassTilt = 0;

let memoriesFlashTimer = 0;
let prevCollectedCount = 0;

let starSeeds = Array.from({ length: 6 }, (_, i) => i * 1.37 + 0.5);

// ─── LIGHT THEME PALETTE (CREAM, DARK SLATE, PASTEL ACCENTS) ───────────────
const THEME = {
	panelBg: "rgba(255, 250, 235, 0.94)", // light cream
	panelBgWarm: "rgba(255, 245, 220, 0.96)",
	borderGold: "rgba(244, 162, 97, 0.5)", // soft amber
	borderRose: "rgba(255, 183, 178, 0.55)",
	glowGold: "rgba(244, 162, 97, 0.35)",
	glowRose: "rgba(255, 140, 130, 0.35)",
	glowTeal: "rgba(42, 157, 143, 0.35)",
	glowSky: "rgba(72, 187, 255, 0.35)",
	textGold: "#D97706", // amber
	textCream: "#2D3E50", // dark slate
	textDim: "rgba(45, 62, 80, 0.55)",
	textRose: "#E76F51",
	trackDark: "rgba(200, 190, 170, 0.35)", // light track
	starFaint: "rgba(244, 162, 97, 0.5)",
};

function killGlow(ctx) {
	ctx.shadowBlur = 0;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;
	ctx.shadowColor = "transparent";
}

function applyGlow(ctx, color, blur) {
	ctx.shadowColor = color;
	ctx.shadowBlur = blur || uiPx(8);
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;
}

function rrPath(ctx, x, y, w, h, r) {
	if (w <= 0 || h <= 0) return;
	r = Math.min(r, w / 2, h / 2);
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
}

function roundRect(ctx, x, y, w, h, r) {
	if (w <= 0 || h <= 0) return;
	rrPath(ctx, x, y, w, h, r);
	ctx.fill();
}

function roundRectStroke(ctx, x, y, w, h, r) {
	if (w <= 0 || h <= 0) return;
	rrPath(ctx, x, y, w, h, r);
	ctx.stroke();
}

// ─── LIGHT PANEL DRAWER (cream background, dark text, pastel border) ──────
function drawDarkPanel(ctx, cx, cy, w, h, r, accentColor, tilt, seed) {
	if (w <= 0 || h <= 0) return;
	ctx.save();

	ctx.translate(cx, cy);
	ctx.rotate(tilt || 0);

	let x = -w / 2,
		y = -h / 2;

	// Soft outer glow
	ctx.save();
	applyGlow(ctx, accentColor, uiPx(10));
	ctx.strokeStyle = accentColor;
	ctx.lineWidth = uiPx(1);
	ctx.globalAlpha = 0.3;
	roundRectStroke(
		ctx,
		x - uiPx(1),
		y - uiPx(1),
		w + uiPx(2),
		h + uiPx(2),
		r + uiPx(1),
	);
	ctx.globalAlpha = 1;
	killGlow(ctx);
	ctx.restore();

	// Main light cream fill
	ctx.fillStyle = THEME.panelBg;
	roundRect(ctx, x, y, w, h, r);

	// Subtle warm gradient
	let innerGrad = ctx.createRadialGradient(
		x + uiPx(20),
		y + uiPx(10),
		0,
		x + w * 0.4,
		y + h * 0.5,
		w * 0.75,
	);
	innerGrad.addColorStop(0, "rgba(255, 220, 160, 0.12)");
	innerGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
	ctx.save();
	rrPath(ctx, x, y, w, h, r);
	ctx.clip();
	ctx.fillStyle = innerGrad;
	ctx.fillRect(x, y, w, h);
	ctx.restore();

	// Accent border
	ctx.strokeStyle = accentColor;
	ctx.lineWidth = uiPx(1.2);
	ctx.globalAlpha = 0.6;
	roundRectStroke(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r);
	ctx.globalAlpha = 0.25;
	roundRectStroke(
		ctx,
		x + uiPx(2),
		y + uiPx(2),
		w - uiPx(4),
		h - uiPx(4),
		Math.max(r - uiPx(2), 0),
	);
	ctx.globalAlpha = 1;

	// Decorative dots (soft amber)
	if (seed !== undefined) {
		ctx.fillStyle = THEME.starFaint;
		for (let s = 0; s < 4; s++) {
			let sx = x + uiPx(6) + ((seed * 37.3 + s * 71.9) % (w - uiPx(12)));
			let sy = y + uiPx(5) + ((seed * 53.7 + s * 43.1) % (h - uiPx(10)));
			let twinkle =
				0.4 + 0.4 * Math.abs(Math.sin(hudPulseCycle * 0.7 + s * 2.1 + seed));
			ctx.globalAlpha = twinkle * 0.6;
			ctx.beginPath();
			ctx.arc(sx, sy, uiPx(1), 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.globalAlpha = 1;
	}

	ctx.restore();
}

// ─── LIGHT PROGRESS BAR ───────────────────────────────────────────────────
function drawDarkBar(
	ctx,
	bx,
	by,
	bw,
	bh,
	r,
	pct,
	fillGradStart,
	fillGradEnd,
	glowColor,
) {
	if (bw <= 0 || bh <= 0) return;

	ctx.fillStyle = THEME.trackDark;
	roundRect(ctx, bx, by, bw, bh, r);

	ctx.strokeStyle = "rgba(120, 100, 70, 0.2)";
	ctx.lineWidth = uiPx(1);
	roundRectStroke(ctx, bx, by, bw, bh, r);

	if (pct > 0.01) {
		let fillW = Math.max(uiPx(4), (bw - uiPx(2)) * pct);
		let grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
		grad.addColorStop(0, fillGradStart);
		grad.addColorStop(1, fillGradEnd);

		ctx.save();
		rrPath(ctx, bx, by, bw, bh, r);
		ctx.clip();

		applyGlow(ctx, glowColor || fillGradEnd, uiPx(5));
		ctx.fillStyle = grad;
		ctx.fillRect(bx + uiPx(1), by + uiPx(1), fillW, bh - uiPx(2));
		killGlow(ctx);

		ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
		ctx.fillRect(
			bx + uiPx(1) + fillW - uiPx(2),
			by + uiPx(1),
			uiPx(2),
			bh - uiPx(2),
		);

		ctx.restore();
	}
}

// ─── MOVEMENT TRACKING ────────────────────────────────────────────────────
function updateHUDMovement() {
	if (!player) return;

	playerVelX = player.x - prevPlayerX;
	playerVelY = player.y - prevPlayerY;
	prevPlayerX = player.x;
	prevPlayerY = player.y;

	playerSpeed = Math.sqrt(playerVelX * playerVelX + playerVelY * playerVelY);
	smoothSpeed += (playerSpeed - smoothSpeed) * 0.1;

	let targetTilt = clamp(playerVelX * 0.012, -0.07, 0.07);
	panelTilt += (targetTilt - panelTilt) * 0.13;

	compassTilt = 0;
}

// ─── MAIN HUD ─────────────────────────────────────────────────────────────
function drawHUD() {
	hudPulseCycle += 0.04;
	updateHUDMovement();

	let realCoords = getGameCoords();
	smoothRenderCoords.x += (realCoords.x - smoothRenderCoords.x) * 0.25;
	smoothRenderCoords.z += (realCoords.z - smoothRenderCoords.z) * 0.25;

	let dispX = Math.round(smoothRenderCoords.x);
	let dispZ = Math.round(smoothRenderCoords.z);

	drawCompass(dispX, dispZ);
	drawProgressHeart();
	drawMemoriesBar();

	if (player && player.hasWings) drawFlightBadge();
}

function getGameCoords() {
	if (!player) return { x: 0, z: 0 };
	return {
		x: Math.floor(player.x / TILE_SIZE),
		z: -Math.floor(player.y / TILE_SIZE),
	};
}

// ─── 1. COMPASS (top right) ──────────────────────────────────────────────
function drawCompass(dispX, dispZ) {
	let W = uiPx(158);
	let H = uiPx(58);
	let r = uiPx(8);
	let cx = GAME_W - W / 2 - uiPx(16);
	let cy = H / 2 + uiPx(16);

	let heat = Math.min(smoothSpeed * 3, 1);
	let rC = Math.round(255 * (0.87 + 0.13 * heat));
	let gC = Math.round(255 * (0.82 - 0.4 * heat));
	let bC = Math.round(255 * (0.31 + 0.2 * heat));
	let accent = "rgba(" + rC + "," + gC + "," + bC + ",1)";

	drawDarkPanel(fogCtx, cx, cy, W, H, r, accent, compassTilt, 2.5);

	fogCtx.save();
	fogCtx.translate(cx, cy);
	fogCtx.rotate(compassTilt);

	let lx = -W / 2,
		ly = -H / 2;

	fogCtx.font = uiPx(5) + 'px "Press Start 2P"';
	fogCtx.fillStyle = THEME.textDim;
	fogCtx.textBaseline = "top";
	fogCtx.textAlign = "left";
	fogCtx.fillText("MAP", lx + uiPx(10), ly + uiPx(6));

	fogCtx.strokeStyle = THEME.borderGold;
	fogCtx.lineWidth = uiPx(1);
	fogCtx.beginPath();
	fogCtx.moveTo(lx + uiPx(32), ly + uiPx(18));
	fogCtx.lineTo(lx + uiPx(32), ly + H - uiPx(10));
	fogCtx.stroke();

	fogCtx.font = uiPx(7) + 'px "Press Start 2P"';
	fogCtx.textBaseline = "middle";
	fogCtx.textAlign = "left";
	fogCtx.fillStyle = "rgba(45, 62, 80, 0.6)";
	fogCtx.fillText("X", lx + uiPx(12), ly + uiPx(28));
	fogCtx.fillStyle = "rgba(72, 187, 255, 0.7)";
	fogCtx.fillText("Z", lx + uiPx(12), ly + uiPx(44));

	fogCtx.textAlign = "right";
	fogCtx.font = uiPx(8) + 'px "Press Start 2P"';
	applyGlow(fogCtx, THEME.glowGold, uiPx(5));
	fogCtx.fillStyle = THEME.textGold;
	fogCtx.fillText(
		String(dispX).padStart(4, " "),
		lx + W - uiPx(10),
		ly + uiPx(28),
	);
	killGlow(fogCtx);

	applyGlow(fogCtx, THEME.glowSky, uiPx(5));
	fogCtx.fillStyle = "#2A9D8F";
	fogCtx.fillText(
		String(dispZ).padStart(4, " "),
		lx + W - uiPx(10),
		ly + uiPx(44),
	);
	killGlow(fogCtx);

	fogCtx.restore();
}

// ─── 2. HEART TRACKER (above player) ─────────────────────────────────────
function drawProgressHeart() {
	if (!player || !destination) return;

	let dx = player.x - destination.x;
	let dy = player.y - destination.y;
	let dist = Math.sqrt(dx * dx + dy * dy);
	// Max distance = spawn (row 64) to destination (row 3) ≈ 61 rows × 32px = 1952px
	let targetPct = 1 - Math.min(dist / 1952, 1);
	smoothHeartPct += (targetPct - smoothHeartPct) * 0.1;
	let pct = smoothHeartPct;

	let W = uiPx(168);
	let H = uiPx(44);
	let r = uiPx(8);

	let screenPX = clamp(
		worldToScreenX(player.x + player.width / 2),
		W / 2 + uiPx(8),
		GAME_W - W / 2 - uiPx(8),
	);
	let screenPY = worldToScreenY(player.y);
	let cy = screenPY - H / 2 - uiPx(20);
	cy = clamp(cy, H / 2 + uiPx(8), GAME_H - H / 2 - uiPx(8));
	let cx = screenPX;

	let rV = Math.round(255);
	let gV = Math.round(80 + 130 * pct);
	let bV = Math.round(140 - 100 * pct);
	let accent = "rgb(" + rV + "," + gV + "," + bV + ")";
	let glowColor = "rgba(" + rV + "," + gV + "," + bV + ",0.4)";

	drawDarkPanel(fogCtx, cx, cy, W, H, r, accent, panelTilt, 1.0);

	fogCtx.save();
	fogCtx.translate(cx, cy);
	fogCtx.rotate(panelTilt);

	let lx = -W / 2,
		ly = -H / 2;

	fogCtx.font = uiPx(5) + 'px "Press Start 2P"';
	fogCtx.fillStyle = THEME.textDim;
	fogCtx.textBaseline = "top";
	fogCtx.textAlign = "left";
	fogCtx.fillText("HEART", lx + uiPx(10), ly + uiPx(5));

	let beatRate = 1.6 + pct * 2.2;
	let heartBeat =
		Math.sin(hudPulseCycle * beatRate) * uiPx(1.2) * (0.4 + pct * 0.6);
	let heartSize = uiPx(15) + heartBeat;
	fogCtx.font = heartSize + "px serif";
	fogCtx.textAlign = "center";
	fogCtx.textBaseline = "middle";

	if (pct > 0.05) {
		applyGlow(fogCtx, glowColor, uiPx(10) * pct);
		fogCtx.globalAlpha = 0.6 + pct * 0.4;
		fogCtx.fillText("❤️", lx + uiPx(24), uiPx(2));
	} else {
		fogCtx.globalAlpha = 0.3;
		fogCtx.fillText("🤍", lx + uiPx(24), uiPx(2));
	}
	killGlow(fogCtx);
	fogCtx.globalAlpha = 1;

	let bx = lx + uiPx(44);
	let by = -uiPx(4);
	let bw = W - uiPx(56);
	let bh = uiPx(7);
	let br = uiPx(3);

	drawDarkBar(fogCtx, bx, by, bw, bh, br, pct, "#ff607a", "#ffb040", glowColor);

	let pctLabel = Math.round(pct * 100) + "%";
	fogCtx.font = uiPx(6) + 'px "Press Start 2P"';
	fogCtx.fillStyle = pct > 0.6 ? THEME.textGold : THEME.textRose;
	fogCtx.textAlign = "right";
	fogCtx.textBaseline = "alphabetic";
	if (pct > 0.05) applyGlow(fogCtx, glowColor, uiPx(4));
	fogCtx.fillText(pctLabel, bx + bw - uiPx(2), by - uiPx(2));
	killGlow(fogCtx);

	if (smoothSpeed > 0.9 && pct > 0.05) {
		let shimX = bx + ((hudPulseCycle * 0.85) % 1) * bw * pct;
		let sg = fogCtx.createLinearGradient(
			shimX - uiPx(8),
			0,
			shimX + uiPx(8),
			0,
		);
		sg.addColorStop(0, "rgba(255,255,255,0)");
		sg.addColorStop(
			0.5,
			"rgba(255,255,255," + Math.min(smoothSpeed * 0.22, 0.35) + ")",
		);
		sg.addColorStop(1, "rgba(255,255,255,0)");
		fogCtx.save();
		rrPath(fogCtx, bx, by, bw, bh, br);
		fogCtx.clip();
		fogCtx.fillStyle = sg;
		fogCtx.fillRect(bx, by, bw, bh);
		fogCtx.restore();
	}

	fogCtx.restore();

	// Tether line
	fogCtx.save();
	let tetherAlpha = 0.15 + Math.min(smoothSpeed * 0.05, 0.12);
	applyGlow(fogCtx, THEME.glowRose, uiPx(3));
	fogCtx.strokeStyle = "rgba(231, 111, 81, " + tetherAlpha + ")";
	fogCtx.lineWidth = uiPx(1);
	fogCtx.setLineDash([uiPx(2), uiPx(5)]);
	let tx = clamp(screenPX, uiPx(8), GAME_W - uiPx(8));
	fogCtx.beginPath();
	fogCtx.moveTo(tx, cy + H / 2 + uiPx(2));
	fogCtx.lineTo(tx, screenPY - uiPx(2));
	fogCtx.stroke();
	fogCtx.setLineDash([]);
	killGlow(fogCtx);
	fogCtx.restore();
}

// ─── 3. MEMORIES BAR (top left) ──────────────────────────────────────────
function drawMemoriesBar() {
	if (typeof memories === "undefined" || !memories) return;

	let totalMemories = memories.length;
	let collectedCount = memories.filter((m) => m.collected).length;

	if (collectedCount > prevCollectedCount) {
		memoriesFlashTimer = 38;
		prevCollectedCount = collectedCount;
	}
	if (memoriesFlashTimer > 0) memoriesFlashTimer--;
	let flash = memoriesFlashTimer / 38;

	let targetPct = totalMemories > 0 ? collectedCount / totalMemories : 0;
	smoothMemoriesPct += (targetPct - smoothMemoriesPct) * 0.1;

	let W = uiPx(178);
	let H = uiPx(44);
	let r = uiPx(8);
	let cx = W / 2 + uiPx(16);
	let cy = H / 2 + uiPx(16);

	let tealFlash = Math.round(160 + 70 * flash);
	let accent = "rgba(60," + tealFlash + ",160,1)";
	let glowColor = "rgba(60," + tealFlash + ",200,0.4)";

	drawDarkPanel(fogCtx, cx, cy, W, H, r, accent, 0, 3.7);

	fogCtx.save();
	fogCtx.translate(cx, cy);

	let lx = -W / 2,
		ly = -H / 2;

	fogCtx.font = uiPx(5) + 'px "Press Start 2P"';
	fogCtx.fillStyle = THEME.textDim;
	fogCtx.textBaseline = "top";
	fogCtx.textAlign = "left";
	fogCtx.fillText("MEM", lx + uiPx(10), ly + uiPx(5));

	let iconBounce =
		flash > 0 ? Math.sin(hudPulseCycle * 8) * uiPx(2) * flash : 0;
	let iconSize = uiPx(14) * (1 + flash * 0.22);
	fogCtx.font = iconSize + "px serif";
	fogCtx.textAlign = "center";
	fogCtx.textBaseline = "middle";

	if (flash > 0) applyGlow(fogCtx, glowColor, uiPx(12) * flash);
	fogCtx.globalAlpha = 0.7 + flash * 0.3;
	fogCtx.fillText("✨", lx + uiPx(26), iconBounce);
	killGlow(fogCtx);
	fogCtx.globalAlpha = 1;

	let bx = lx + uiPx(44);
	let by = -uiPx(4);
	let bw = W - uiPx(56);
	let bh = uiPx(7);
	let br = uiPx(3);

	drawDarkBar(
		fogCtx,
		bx,
		by,
		bw,
		bh,
		br,
		smoothMemoriesPct,
		"#40e8a8",
		"#30c8e0",
		glowColor,
	);

	let countLabel = collectedCount + "/" + totalMemories;
	fogCtx.font = uiPx(6) + 'px "Press Start 2P"';
	if (flash > 0) {
		applyGlow(fogCtx, glowColor, uiPx(4));
		fogCtx.fillStyle = "#2A9D8F";
	} else {
		fogCtx.fillStyle = "rgba(42, 157, 143, 0.7)";
	}
	fogCtx.textAlign = "right";
	fogCtx.textBaseline = "alphabetic";
	fogCtx.fillText(countLabel, bx + bw - uiPx(2), by - uiPx(2));
	killGlow(fogCtx);

	if (flash > 0.5) {
		fogCtx.save();
		fogCtx.strokeStyle = "rgba(42, 157, 143, " + (flash - 0.5) * 1.2 + ")";
		fogCtx.lineWidth = uiPx(1);
		applyGlow(fogCtx, glowColor, uiPx(8));
		rrPath(
			fogCtx,
			lx + uiPx(2),
			ly + uiPx(2),
			W - uiPx(4),
			H - uiPx(4),
			r - uiPx(1),
		);
		fogCtx.stroke();
		killGlow(fogCtx);
		fogCtx.restore();
	}

	fogCtx.restore();
}

// ─── 4. FLIGHT BADGE (below memories) ────────────────────────────────────
function drawFlightBadge() {
	let W = uiPx(122);
	let H = uiPx(30);
	let r = uiPx(8);
	let cx = W / 2 + uiPx(16);
	let baseY = H / 2 + uiPx(16) + uiPx(44) + uiPx(10);
	let bounceY = Math.sin(hudPulseCycle * 1.7) * uiPx(2);
	let cy = baseY + bounceY;

	let flyPulse = Math.abs(Math.sin(hudPulseCycle * 2.1));
	let skyBlue = Math.round(200 + 55 * flyPulse);
	let accent = "rgba(80,170," + skyBlue + ",1)";
	let glowColor = "rgba(80,180," + skyBlue + ",0.4)";

	drawDarkPanel(fogCtx, cx, cy, W, H, r, accent, 0, 5.1);

	fogCtx.save();
	fogCtx.translate(cx, cy);

	applyGlow(fogCtx, glowColor, uiPx(5 + flyPulse * 6));
	fogCtx.font = uiPx(7) + 'px "Press Start 2P"';
	fogCtx.fillStyle = "#2A9D8F";
	fogCtx.textAlign = "center";
	fogCtx.textBaseline = "middle";
	fogCtx.fillText("🪽 FLYING", 0, 0);
	killGlow(fogCtx);

	fogCtx.restore();
}

// ─── 5. NOTIFICATION BANNER (light theme) ────────────────────────────────
function drawNotification() {
	if (!notification || notifTimer <= 0) return;
	notifTimer--;

	let animAlpha = 1;
	let verticalSlide = 0;

	if (notifMaxTime - notifTimer < 25) {
		let progress = (notifMaxTime - notifTimer) / 25;
		verticalSlide = (1 - Math.sin((progress * Math.PI) / 2)) * uiPx(32);
		animAlpha = progress;
	} else if (notifTimer < 30) {
		animAlpha = notifTimer / 30;
		verticalSlide = (1 - animAlpha) * uiPx(-10);
	}

	let bannerW = Math.min(GAME_W - uiPx(32), uiPx(560));
	let bannerH = uiPx(42);
	let bannerCX = GAME_W / 2;
	let bannerCY = GAME_H - bannerH / 2 - uiPx(56) + verticalSlide;

	fogCtx.save();
	fogCtx.globalAlpha = animAlpha;

	drawDarkPanel(
		fogCtx,
		bannerCX,
		bannerCY,
		bannerW,
		bannerH,
		uiPx(8),
		"rgba(244, 162, 97, 0.9)",
		0,
		4.2,
	);

	let shakeY = 0;
	if (notifTimer > notifMaxTime - 14) {
		shakeY = (Math.random() - 0.5) * uiPx(1.2);
	}

	fogCtx.translate(bannerCX, bannerCY + shakeY);

	applyGlow(fogCtx, THEME.glowGold, uiPx(6));
	fogCtx.font = uiPx(8) + 'px "Press Start 2P"';
	fogCtx.fillStyle = THEME.textGold;
	fogCtx.textAlign = "center";
	fogCtx.textBaseline = "middle";
	fogCtx.fillText(notification, 0, 0);
	killGlow(fogCtx);

	fogCtx.restore();

	if (notifTimer <= 0) notification = null;
}

function showNotification(msg) {
	notification = msg;
	notifTimer = 180;
	notifMaxTime = 180;
}
