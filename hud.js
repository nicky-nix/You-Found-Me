// ─── HUD ENGINE — LIGHT LINEN THEME ─────────────────────────────────────────
//  Soft cream panels, warm rose/sage accents, canvas rotation tilt on movement

let notification = null;
let notifTimer = 0;
let notifMaxTime = 180;

// ── Smooth coord rolling ──
let smoothRenderCoords = { x: 0, z: 0 };
let hudPulseCycle = 0;
let smoothHeartPct = 0;
let smoothMemoriesPct = 0;

// ── Movement state ──
let prevPlayerX = 0;
let prevPlayerY = 0;
let playerVelX = 0;
let playerVelY = 0;
let playerSpeed = 0;
let smoothSpeed = 0;

// ── Tilt state (used with ctx.rotate for all panels) ──
let panelTilt = 0; // current rotation in radians (eased)
let compassTilt = 0; // compass gets a mirrored tilt

// ── Memories flash ──
let memoriesFlashTimer = 0;
let prevCollectedCount = 0;

// ─────────────────────────────────────────────────────────────────────────────
//  DRAWING HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function killGlow(ctx) {
	ctx.shadowBlur = 0;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 0;
	ctx.shadowColor = "transparent";
}

function applySoftShadow(ctx, alpha) {
	ctx.shadowColor = "rgba(80, 50, 30, " + (alpha || 0.13) + ")";
	ctx.shadowBlur = uiPx(10);
	ctx.shadowOffsetX = uiPx(1);
	ctx.shadowOffsetY = uiPx(3);
}

// Rounded-rect path helpers
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

// ── Light panel: warm cream background, coloured bottom accent bar ──────────
// Draws centred on (cx, cy), rotated by `tilt` radians
function drawLightPanel(ctx, cx, cy, w, h, r, accentColor, tilt) {
	if (w <= 0 || h <= 0) return;
	ctx.save();

	// Rotate around the panel centre
	ctx.translate(cx, cy);
	ctx.rotate(tilt || 0);

	var x = -w / 2,
		y = -h / 2;

	// Drop shadow
	applySoftShadow(ctx, 0.14);
	ctx.fillStyle = "rgba(255, 252, 245, 0.96)";
	roundRect(ctx, x, y, w, h, r);
	killGlow(ctx);

	// Thin accent stripe along the bottom edge
	var stripeH = uiPx(3);
	ctx.save();
	rrPath(ctx, x, y, w, h, r);
	ctx.clip();
	ctx.fillStyle = accentColor;
	ctx.globalAlpha = 0.55;
	ctx.fillRect(x, y + h - stripeH, w, stripeH);
	ctx.restore();

	// Very subtle top inner gradient
	var innerGrad = ctx.createLinearGradient(0, y, 0, y + h * 0.5);
	innerGrad.addColorStop(0, "rgba(255,255,255,0.55)");
	innerGrad.addColorStop(1, "rgba(255,255,255,0)");
	ctx.fillStyle = innerGrad;
	roundRect(ctx, x + uiPx(1), y + uiPx(1), w - uiPx(2), h * 0.5, r);

	// Hair-line border
	ctx.strokeStyle = "rgba(200, 180, 155, 0.45)";
	ctx.lineWidth = uiPx(1);
	roundRectStroke(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r);

	ctx.restore();
}

// ── Progress bar inside a light panel ──────────────────────────────────────
// All coords relative to panel centre (already translated+rotated by caller)
function drawLightBar(
	ctx,
	bx,
	by,
	bw,
	bh,
	r,
	pct,
	fillGradStart,
	fillGradEnd,
	trackColor,
) {
	if (bw <= 0 || bh <= 0) return;

	// Track
	ctx.fillStyle = trackColor || "rgba(220, 205, 190, 0.55)";
	roundRect(ctx, bx, by, bw, bh, r);

	ctx.strokeStyle = "rgba(190, 170, 145, 0.3)";
	ctx.lineWidth = uiPx(1);
	roundRectStroke(ctx, bx, by, bw, bh, r);

	if (pct > 0.01) {
		var fillW = Math.max(uiPx(4), (bw - uiPx(2)) * pct);
		var grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
		grad.addColorStop(0, fillGradStart);
		grad.addColorStop(1, fillGradEnd);

		ctx.save();
		rrPath(ctx, bx, by, bw, bh, r);
		ctx.clip();
		ctx.fillStyle = grad;
		ctx.fillRect(bx + uiPx(1), by + uiPx(1), fillW, bh - uiPx(2));
		ctx.restore();
	}
}

// ─────────────────────────────────────────────────────────────────────────────
//  MOVEMENT TRACKING
// ─────────────────────────────────────────────────────────────────────────────

function updateHUDMovement() {
	if (!player) return;

	playerVelX = player.x - prevPlayerX;
	playerVelY = player.y - prevPlayerY;
	prevPlayerX = player.x;
	prevPlayerY = player.y;

	playerSpeed = Math.sqrt(playerVelX * playerVelX + playerVelY * playerVelY);
	smoothSpeed += (playerSpeed - smoothSpeed) * 0.1;

	// Tilt: lean into horizontal movement direction, max ±4°
	var targetTilt = clamp(playerVelX * 0.012, -0.07, 0.07);
	panelTilt += (targetTilt - panelTilt) * 0.13;
	compassTilt += (-targetTilt - compassTilt) * 0.13; // compass mirrors
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN HUD ENTRY
// ─────────────────────────────────────────────────────────────────────────────

function drawHUD() {
	hudPulseCycle += 0.04;

	updateHUDMovement();

	var realCoords = getGameCoords();
	smoothRenderCoords.x += (realCoords.x - smoothRenderCoords.x) * 0.25;
	smoothRenderCoords.z += (realCoords.z - smoothRenderCoords.z) * 0.25;

	var dispX = Math.round(smoothRenderCoords.x);
	var dispZ = Math.round(smoothRenderCoords.z);

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

// ─────────────────────────────────────────────────────────────────────────────
//  1. COMPASS — top right
// ─────────────────────────────────────────────────────────────────────────────

function drawCompass(dispX, dispZ) {
	var W = uiPx(152);
	var H = uiPx(56);
	var r = uiPx(12);
	var cx = GAME_W - W / 2 - uiPx(18);
	var cy = H / 2 + uiPx(18);

	// Accent warms to coral when moving fast
	var heat = Math.min(smoothSpeed * 3, 1);
	var accent =
		"rgba(" +
		Math.round(220 + 35 * heat) +
		"," +
		Math.round(140 - 50 * heat) +
		",100,1)";

	drawLightPanel(fogCtx, cx, cy, W, H, r, accent, compassTilt);

	// Draw text in the rotated space
	fogCtx.save();
	fogCtx.translate(cx, cy);
	fogCtx.rotate(compassTilt);

	var lx = -W / 2,
		ly = -H / 2;

	// Labels
	fogCtx.font = uiPx(7) + 'px "Press Start 2P"';
	fogCtx.textBaseline = "middle";
	fogCtx.textAlign = "left";
	fogCtx.fillStyle = "rgba(160, 100, 70, 0.65)";
	fogCtx.fillText("X", lx + uiPx(14), ly + uiPx(17));
	fogCtx.fillText("Z", lx + uiPx(14), ly + uiPx(36));

	// Divider
	fogCtx.strokeStyle = "rgba(200, 170, 140, 0.35)";
	fogCtx.lineWidth = uiPx(1);
	fogCtx.beginPath();
	fogCtx.moveTo(lx + uiPx(30), ly + uiPx(10));
	fogCtx.lineTo(lx + uiPx(30), ly + H - uiPx(10));
	fogCtx.stroke();

	// Values — deep warm brown
	fogCtx.fillStyle = "#3a2510";
	fogCtx.textAlign = "right";
	fogCtx.font = uiPx(8) + 'px "Press Start 2P"';
	fogCtx.fillText(
		String(dispX).padStart(4, " "),
		lx + W - uiPx(12),
		ly + uiPx(17),
	);
	fogCtx.fillText(
		String(dispZ).padStart(4, " "),
		lx + W - uiPx(12),
		ly + uiPx(36),
	);

	fogCtx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
//  2. HEART TRACKER — anchored above player, tilts with movement
// ─────────────────────────────────────────────────────────────────────────────

function drawProgressHeart() {
	if (!player || !destination) return;

	var dx = player.x - destination.x;
	var dy = player.y - destination.y;
	var dist = Math.sqrt(dx * dx + dy * dy);
	var targetPct = 1 - Math.min(dist / 450, 1);
	smoothHeartPct += (targetPct - smoothHeartPct) * 0.1;
	var pct = smoothHeartPct;

	var W = uiPx(162);
	var H = uiPx(36);
	var r = uiPx(10);

	// Screen-space position
	var screenPX = worldToScreenX(player.x + player.width / 2);
	var screenPY = worldToScreenY(player.y);

	var cx = clamp(screenPX, W / 2 + uiPx(10), GAME_W - W / 2 - uiPx(10));
	var cy = clamp(
		screenPY - H / 2 - uiPx(18),
		H / 2 + uiPx(6),
		GAME_H - H / 2 - uiPx(6),
	);

	// Accent: pale rose → warm rose as proximity grows
	var rVal = Math.round(240 + 15 * pct);
	var gVal = Math.round(160 - 80 * pct);
	var bVal = Math.round(170 - 90 * pct);
	var accent = "rgb(" + rVal + "," + gVal + "," + bVal + ")";

	drawLightPanel(fogCtx, cx, cy, W, H, r, accent, panelTilt);

	// Draw contents in rotated space
	fogCtx.save();
	fogCtx.translate(cx, cy);
	fogCtx.rotate(panelTilt);

	var lx = -W / 2,
		ly = -H / 2;

	// Heart emoji
	var heartBeat = Math.sin(hudPulseCycle * 2.4) * uiPx(0.8) * pct;
	fogCtx.font = uiPx(14) + heartBeat + "px serif";
	fogCtx.textAlign = "center";
	fogCtx.textBaseline = "middle";

	if (pct > 0.05) {
		fogCtx.globalAlpha = 0.4 + pct * 0.6;
		// Soft rose glow
		fogCtx.shadowColor = "rgba(240, 80, 120, " + pct * 0.5 + ")";
		fogCtx.shadowBlur = uiPx(6) * pct;
		fogCtx.fillText("❤️", lx + uiPx(22), 0);
	} else {
		fogCtx.globalAlpha = 0.3;
		fogCtx.fillText("🤍", lx + uiPx(22), 0);
	}
	killGlow(fogCtx);
	fogCtx.globalAlpha = 1;

	// Progress bar
	var bx = lx + uiPx(40);
	var by = -uiPx(4);
	var bw = W - uiPx(52);
	var bh = uiPx(7);
	var br = uiPx(3);

	drawLightBar(
		fogCtx,
		bx,
		by,
		bw,
		bh,
		br,
		pct,
		"#f07090",
		"#ffb060",
		"rgba(220, 190, 180, 0.5)",
	);

	// Shimmer on fast movement
	if (smoothSpeed > 0.9 && pct > 0.05) {
		var shimX = bx + ((hudPulseCycle * 0.85) % 1) * bw * pct;
		var sg = fogCtx.createLinearGradient(
			shimX - uiPx(7),
			0,
			shimX + uiPx(7),
			0,
		);
		sg.addColorStop(0, "rgba(255,255,255,0)");
		sg.addColorStop(
			0.5,
			"rgba(255,255,255," + Math.min(smoothSpeed * 0.18, 0.28) + ")",
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

	// ── Dashed tether line from panel bottom to player ──
	fogCtx.save();
	var tetherAlpha = 0.18 + Math.min(smoothSpeed * 0.06, 0.14);
	fogCtx.strokeStyle = "rgba(220, 100, 130, " + tetherAlpha + ")";
	fogCtx.lineWidth = uiPx(1);
	fogCtx.setLineDash([uiPx(2), uiPx(4)]);
	var tx = clamp(screenPX, uiPx(8), GAME_W - uiPx(8));
	fogCtx.beginPath();
	// Bottom of panel (approximate, panel centre is cy, height H)
	fogCtx.moveTo(tx, cy + H / 2 + uiPx(2));
	fogCtx.lineTo(tx, screenPY - uiPx(2));
	fogCtx.stroke();
	fogCtx.setLineDash([]);
	fogCtx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
//  3. MEMORIES BAR — fixed top-left, tilts with movement, flashes on pickup
// ─────────────────────────────────────────────────────────────────────────────

function drawMemoriesBar() {
	if (typeof memories === "undefined" || !memories) return;

	var totalMemories = memories.length;
	var collectedCount = memories.filter(function (m) {
		return m.collected;
	}).length;

	if (collectedCount > prevCollectedCount) {
		memoriesFlashTimer = 30;
		prevCollectedCount = collectedCount;
	}
	if (memoriesFlashTimer > 0) memoriesFlashTimer--;
	var flash = memoriesFlashTimer / 30;

	var targetPct = totalMemories > 0 ? collectedCount / totalMemories : 0;
	smoothMemoriesPct += (targetPct - smoothMemoriesPct) * 0.1;

	var W = uiPx(170);
	var H = uiPx(36);
	var r = uiPx(10);
	var cx = W / 2 + uiPx(18);
	var cy = H / 2 + uiPx(18);

	// Sage green accent, brightens on flash
	var gVal = Math.round(180 + 60 * flash);
	var accent = "rgba(80," + gVal + ",130,1)";

	drawLightPanel(fogCtx, cx, cy, W, H, r, accent, panelTilt);

	fogCtx.save();
	fogCtx.translate(cx, cy);
	fogCtx.rotate(panelTilt);

	var lx = -W / 2,
		ly = -H / 2;

	// Sparkle icon — bounces on flash
	var iconSize = uiPx(12) * (1 + flash * 0.28);
	var starGlow = Math.abs(Math.sin(hudPulseCycle * 1.7)) * 3 + flash * 10;
	fogCtx.font = iconSize + "px serif";
	fogCtx.textAlign = "center";
	fogCtx.textBaseline = "middle";
	fogCtx.shadowColor = "rgba(80, 200, 150, " + (0.4 + flash * 0.5) + ")";
	fogCtx.shadowBlur = uiPx(starGlow);
	fogCtx.globalAlpha = 0.75 + flash * 0.25;
	fogCtx.fillText("✨", lx + uiPx(22), 0);
	killGlow(fogCtx);
	fogCtx.globalAlpha = 1;

	// Progress bar
	var bx = lx + uiPx(40);
	var by = -uiPx(4);
	var bw = W - uiPx(52);
	var bh = uiPx(7);
	var br = uiPx(3);

	drawLightBar(
		fogCtx,
		bx,
		by,
		bw,
		bh,
		br,
		smoothMemoriesPct,
		"#60d890",
		"#38d8c8",
		"rgba(190, 215, 200, 0.5)",
	);

	// Count label — sage text
	fogCtx.font = uiPx(6) + 'px "Press Start 2P"';
	fogCtx.fillStyle =
		flash > 0
			? "rgba(50,160,110," + (0.7 + flash * 0.3) + ")"
			: "rgba(80,130,100,0.6)";
	fogCtx.textAlign = "right";
	fogCtx.textBaseline = "alphabetic";
	fogCtx.fillText(
		collectedCount + "/" + totalMemories,
		bx + bw - uiPx(2),
		by - uiPx(2),
	);

	fogCtx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
//  4. FLIGHT BADGE — below memories, tilts, bounces
// ─────────────────────────────────────────────────────────────────────────────

function drawFlightBadge() {
	var W = uiPx(112);
	var H = uiPx(28);
	var r = uiPx(14);
	var cx = W / 2 + uiPx(18);
	// Sit just below the memories panel
	var baseY = H / 2 + uiPx(18) + uiPx(36) + uiPx(10);
	var bounceY = Math.sin(hudPulseCycle * 1.5) * uiPx(1.8);
	var cy = baseY + bounceY;

	var flyPulse = Math.abs(Math.sin(hudPulseCycle * 1.9));
	// Sky-blue accent
	var accent = "rgba(80,175," + Math.round(230 + 25 * flyPulse) + ",1)";

	drawLightPanel(fogCtx, cx, cy, W, H, r, accent, panelTilt);

	fogCtx.save();
	fogCtx.translate(cx, cy);
	fogCtx.rotate(panelTilt);

	fogCtx.font = uiPx(7) + 'px "Press Start 2P"';
	fogCtx.fillStyle = "#1a5080";
	fogCtx.textAlign = "center";
	fogCtx.textBaseline = "middle";
	fogCtx.shadowColor = "rgba(80,180,255,0.3)";
	fogCtx.shadowBlur = uiPx(4 + flyPulse * 5);
	fogCtx.fillText("🪽  FLYING", 0, 0);
	killGlow(fogCtx);

	fogCtx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
//  5. NOTIFICATION BANNER — bottom centre, slides up/down
// ─────────────────────────────────────────────────────────────────────────────

function drawNotification() {
	if (!notification || notifTimer <= 0) return;
	notifTimer--;

	var animAlpha = 1;
	var verticalSlide = 0;

	if (notifMaxTime - notifTimer < 25) {
		var progress = (notifMaxTime - notifTimer) / 25;
		verticalSlide = (1 - Math.sin((progress * Math.PI) / 2)) * uiPx(28);
		animAlpha = progress;
	} else if (notifTimer < 30) {
		animAlpha = notifTimer / 30;
		verticalSlide = (1 - animAlpha) * uiPx(-10);
	}

	var bannerW = Math.min(GAME_W - uiPx(48), uiPx(560));
	var bannerH = uiPx(40);
	var bannerCX = GAME_W / 2;
	var bannerCY = GAME_H - bannerH / 2 - uiPx(56) + verticalSlide;

	fogCtx.save();
	fogCtx.globalAlpha = animAlpha;

	// Slight wobble tilt matching the rest of HUD
	drawLightPanel(
		fogCtx,
		bannerCX,
		bannerCY,
		bannerW,
		bannerH,
		uiPx(10),
		"rgba(210, 165, 60, 1)",
		panelTilt * 0.4,
	);

	var shakeY = 0;
	if (notifTimer > notifMaxTime - 14) {
		shakeY = (Math.random() - 0.5) * uiPx(1.2);
	}

	fogCtx.translate(bannerCX, bannerCY + shakeY);
	fogCtx.rotate(panelTilt * 0.4);

	fogCtx.font = uiPx(8) + 'px "Press Start 2P"';
	fogCtx.fillStyle = "#3a2208";
	fogCtx.textAlign = "center";
	fogCtx.textBaseline = "middle";
	fogCtx.shadowColor = "rgba(255,240,200,0.6)";
	fogCtx.shadowBlur = uiPx(4);
	fogCtx.fillText(notification, 0, 0);

	fogCtx.restore();

	if (notifTimer <= 0) notification = null;
}

function showNotification(msg) {
	notification = msg;
	notifTimer = 180;
	notifMaxTime = 180;
}
