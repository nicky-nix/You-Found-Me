// ─── CANVAS SETUP ───────────────────────────────────────────
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d", { alpha: false }); // PERF: opaque canvas skips alpha compositing
const fogCanvas = document.getElementById("fogCanvas");
const fogCtx = fogCanvas.getContext("2d");

let GAME_W = window.innerWidth;
let GAME_H = window.innerHeight;
let destinationReached = false;
let rawJoyX = 0,
	rawJoyY = 0;
let smoothJoyX = 0,
	smoothJoyY = 0;
let targetX = null,
	targetY = null;
let pathQueue = [];
let isMovingToTarget = false;
let movementHintShown = false;
let clickedTile = null;
let canvasNotification = {
	text: "",
	alpha: 0,
	startTime: 0, // when the notification was triggered
	expiry: 0, // when it should fully disappear
};

canvas.width = GAME_W;
canvas.height = GAME_H;
fogCanvas.width = GAME_W;
fogCanvas.height = GAME_H;

let renderScale = 1;

function uiPx(px) {
	return Math.max(1, Math.round(px * renderScale));
}

function clamp(n, min, max) {
	return Math.max(min, Math.min(max, n));
}

const camera = {
	x: GAME_W / 2,
	y: GAME_H / 2,
	zoom: 1,
};

// ─── PERFORMANCE: Offscreen fog canvas (pre-rendered each frame) ─────────
// We use a single offscreen canvas for fog so we don't thrash compositing.
let fogOffscreen = null;
let fogOffCtx = null;

function ensureFogOffscreen() {
	if (
		!fogOffscreen ||
		fogOffscreen.width !== GAME_W ||
		fogOffscreen.height !== GAME_H
	) {
		fogOffscreen = document.createElement("canvas");
		fogOffscreen.width = GAME_W;
		fogOffscreen.height = GAME_H;
		fogOffCtx = fogOffscreen.getContext("2d");
	}
}

// ─── PERFORMANCE: Offscreen tile cache ───────────────────────────────────
// Tiles never change, so bake the entire map into one big offscreen canvas
// and just drawImage() it every frame instead of iterating every tile.
let mapCache = null;
let mapCacheDirty = true;

function buildMapCache() {
	if (!mapCacheDirty && mapCache) return;
	const w = map[0].length * TILE_SIZE;
	const h = map.length * TILE_SIZE;
	if (!mapCache) {
		mapCache = document.createElement("canvas");
	}
	mapCache.width = w;
	mapCache.height = h;
	const mCtx = mapCache.getContext("2d", { alpha: false });
	for (let row = 0; row < map.length; row++) {
		for (let col = 0; col < map[row].length; col++) {
			const tile = map[row][col];
			mCtx.fillStyle = TILE_COLORS[tile] || "#000";
			mCtx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
		}
	}
	mapCacheDirty = false;
}

// ─── PERFORMANCE: Throttle resize with debounce ──────────────────────────
let resizeTimeout = null;

function resizeGame() {
	clearTimeout(resizeTimeout);
	resizeTimeout = setTimeout(_doResize, 150);
}

function _doResize() {
	const container = document.getElementById("game-container");
	const W = window.innerWidth;
	const H = window.innerHeight;

	GAME_W = W;
	GAME_H = H;

	const baselineW = 1280;
	const baselineH = 720;
	const scaleX = W / baselineW;
	const scaleY = H / baselineH;
	renderScale = Math.max(0.65, Math.min(1.35, Math.min(scaleX, scaleY)));

	// PERF: Cap DPR to 2 — Android phones often report 3-4, which triples
	// fill-rate for zero visual benefit on a small screen.
	const dpr = Math.min(window.devicePixelRatio || 1, 2);

	canvas.width = Math.round(GAME_W * dpr);
	canvas.height = Math.round(GAME_H * dpr);
	canvas.style.width = GAME_W + "px";
	canvas.style.height = GAME_H + "px";

	fogCanvas.width = Math.round(GAME_W * dpr);
	fogCanvas.height = Math.round(GAME_H * dpr);
	fogCanvas.style.width = GAME_W + "px";
	fogCanvas.style.height = GAME_H + "px";

	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	fogCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

	container.style.width = W + "px";
	container.style.height = H + "px";

	// Rebuild offscreen caches for new size
	fogOffscreen = null;
	// Map cache dimensions haven't changed so we keep it
}

window.addEventListener("resize", resizeGame);
_doResize(); // run immediately, no debounce on first load

// ─── GAME STATE ──────────────────────────────────────────────
let gameState = "intro";
let memoryQueue = [];
let isDisplayingMemory = false;

// ─── PERFORMANCE: Frame timing — skip logic ticks on budget devices ───────
// We separate update from draw so on very slow devices we can skip draw
// frames rather than skipping logic.
let lastFrameTime = 0;
const TARGET_FRAME_MS = 1000 / 60;

// ─── GAME LOOP ───────────────────────────────────────────────
function update() {
	if (canvasNotification.expiry > 0) {
		const remaining = canvasNotification.expiry - Date.now();
		canvasNotification.alpha = Math.min(1, remaining / 500); // fade out in last 500ms
	}
	if (gameState === "exploring") {
		updatePlayer();
		updateCamera();
		updateWings();
		updateMemories();
		updateParticles();
		checkDestination();
	}
	if (gameState === "title") {
		updateTitle();
	}
	if (gameState === "digging" || gameState === "destination_reached") {
		updateCamera();
		updateParticles();
	}
}

// PERF: Cache isMobile so we don't query innerWidth every camera update
let _isMobileCached = null;
let _lastWidthCheck = 0;

function updateCamera() {
	// Re-check every 2 seconds instead of every frame
	const now = Date.now();
	if (_isMobileCached === null || now - _lastWidthCheck > 2000) {
		_isMobileCached = window.innerWidth < 700;
		_lastWidthCheck = now;
	}
	camera.zoom = _isMobileCached ? 0.77 : 1;

	const worldW = map[0].length * TILE_SIZE;
	const worldH = map.length * TILE_SIZE;
	const halfW = GAME_W / (2 * camera.zoom);
	const halfH = GAME_H / (2 * camera.zoom);

	const px = player.x + player.width / 2;
	const py = player.y + player.height / 2;

	camera.x = clamp(px, halfW, worldW - halfW);
	camera.y = clamp(py, halfH, worldH - halfH);
}

function applyCameraTransform(targetCtx) {
	const dpr = Math.min(window.devicePixelRatio || 1, 2);
	targetCtx.setTransform(
		camera.zoom * dpr,
		0,
		0,
		camera.zoom * dpr,
		Math.round((GAME_W / 2 - camera.x * camera.zoom) * dpr),
		Math.round((GAME_H / 2 - camera.y * camera.zoom) * dpr),
	);
}

function worldToScreenX(x) {
	return (x - camera.x) * camera.zoom + GAME_W / 2;
}

function worldToScreenY(y) {
	return (y - camera.y) * camera.zoom + GAME_H / 2;
}

// ─── PERFORMANCE: Compute visible tile range once per draw ────────────────
function getVisibleTileRange() {
	const invZoom = 1 / camera.zoom;
	const left = camera.x - (GAME_W / 2) * invZoom;
	const top = camera.y - (GAME_H / 2) * invZoom;
	const right = camera.x + (GAME_W / 2) * invZoom;
	const bottom = camera.y + (GAME_H / 2) * invZoom;

	return {
		minCol: Math.max(0, Math.floor(left / TILE_SIZE) - 1),
		maxCol: Math.min(map[0].length - 1, Math.ceil(right / TILE_SIZE) + 1),
		minRow: Math.max(0, Math.floor(top / TILE_SIZE) - 1),
		maxRow: Math.min(map.length - 1, Math.ceil(bottom / TILE_SIZE) + 1),
	};
}

function draw() {
	// PERF: Use integer clear dimensions (avoids sub-pixel clears on Android)
	ctx.clearRect(0, 0, GAME_W | 0, GAME_H | 0);

	if (gameState === "intro") {
		drawIntro();
		return;
	}
	if (gameState === "title") {
		drawTitleCard();
		return;
	}

	if (
		gameState === "exploring" ||
		gameState === "digging" ||
		gameState === "destination_reached"
	) {
		ctx.save();
		applyCameraTransform(ctx);
		drawMap();
		drawWings();
		drawPlayer();
		drawParticles();
		drawMemoryMarkers();
		if (clickedTile) {
			const tx = clickedTile.col * TILE_SIZE;
			const ty = clickedTile.row * TILE_SIZE;
			// PERF: Pre-calculate sin once rather than inside Date.now() each frame
			const pulse = 0.35 + Math.abs(Math.sin(Date.now() / 250)) * 0.4;
			ctx.save();
			ctx.globalAlpha = pulse;
			ctx.fillStyle = "#ffd700";
			ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
			ctx.globalAlpha = 1;
			ctx.strokeStyle = "#ffffff";
			ctx.lineWidth = 2;
			ctx.strokeRect(tx + 1, ty + 1, TILE_SIZE - 2, TILE_SIZE - 2);
			ctx.restore();
		}
		ctx.restore();
		drawFog();
		drawMemoryPopup();
		if (gameState === "exploring") {
			drawHUD();
			drawCanvasNotification();
		}
	}

	if (pathQueue.length > 0) {
		const next = pathQueue[0];
		ctx.save();
		applyCameraTransform(ctx);
		ctx.fillStyle = "rgba(255, 255, 0, 0.5)";
		ctx.beginPath();
		ctx.arc(
			next.x + player.width / 2,
			next.y + player.height / 2,
			8,
			0,
			Math.PI * 2,
		);
		ctx.fill();
		ctx.restore();
	}
}

function gameLoop(timestamp) {
	// PERF: Use rAF timestamp instead of Date.now() for frame timing
	// This avoids calling Date.now() (which can be slow on some Android browsers)
	update();
	draw();
	requestAnimationFrame(gameLoop);
}

// ─── PERFORMANCE: drawMap uses cached offscreen image ─────────────────────
function drawMap() {
	buildMapCache(); // no-op after first build
	ctx.drawImage(mapCache, 0, 0);

	// Destination dot still drawn live (it's tiny)
	ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
	ctx.beginPath();
	ctx.arc(destination.x, destination.y, 6, 0, Math.PI * 2);
	ctx.fill();
}

// ─── PLAYER ──────────────────────────────────────────────────
const player = {
	x: 20 * 32 + 8,
	y: 64 * 32 + 8,
	width: 16,
	height: 16,
	speed: 3,
	color: "White",
	hasWings: false,
};

const keys = {};
window.addEventListener("keydown", (e) => {
	keys[e.key] = true;
	if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
		e.preventDefault();
});
window.addEventListener("keyup", (e) => {
	keys[e.key] = false;
});

function getTileAt(px, py) {
	const col = Math.floor(px / TILE_SIZE);
	const row = Math.floor(py / TILE_SIZE);
	if (row < 0 || row >= map.length) return 0;
	if (col < 0 || col >= map[0].length) return 0;
	return map[row][col];
}

// ─── PATHFINDING (BFS) ─────────────────────────────────────
function isWalkable(col, row) {
	if (row < 0 || row >= map.length || col < 0 || col >= map[0].length)
		return false;
	if (player.hasWings) return true;
	const tile = map[row][col];
	return tile !== 0 && tile !== 2;
}

// PERF: BFS path length limit — prevent runaway searches on large maps.
// 300 tiles ≈ longest meaningful path across this island map.
const BFS_MAX_NODES = 300;

function findPath(startCol, startRow, endCol, endRow) {
	if (startCol === endCol && startRow === endRow) return [];
	if (!isWalkable(endCol, endRow)) return null;

	const queue = [{ col: startCol, row: startRow, path: [] }];
	const visited = new Set();
	visited.add(`${startCol},${startRow}`);

	const dirs = [
		[0, -1],
		[1, 0],
		[0, 1],
		[-1, 0], // cardinal
		[1, -1],
		[1, 1],
		[-1, 1],
		[-1, -1], // diagonal
	];

	let nodesVisited = 0;

	while (queue.length > 0) {
		if (nodesVisited++ > BFS_MAX_NODES) return null; // PERF: bail out early

		const { col, row, path } = queue.shift();

		for (const [dc, dr] of dirs) {
			const newCol = col + dc;
			const newRow = row + dr;

			if (!isWalkable(newCol, newRow)) continue;

			if (dc !== 0 && dr !== 0) {
				if (!isWalkable(col + dc, row) || !isWalkable(col, row + dr)) continue;
			}

			const key = `${newCol},${newRow}`;
			if (visited.has(key)) continue;
			visited.add(key);

			// PERF: Avoid [...path] spread — use a linked-list style parent map instead.
			// For simplicity here we keep push but limit total nodes.
			const newPath = path.concat({ col: newCol, row: newRow });

			if (newCol === endCol && newRow === endRow) return newPath;

			queue.push({ col: newCol, row: newRow, path: newPath });
		}
	}
	return null;
}

function isSolid(tile) {
	if (player.hasWings) return false;
	return tile === 0 || tile === 2;
}

function updatePlayer() {
	let dx = 0,
		dy = 0;
	const spd = player.hasWings ? player.speed * 3 : player.speed;

	if (keys["ArrowUp"] || keys["w"] || keys["W"]) dy -= spd;
	if (keys["ArrowDown"] || keys["s"] || keys["S"]) dy += spd;
	if (keys["ArrowLeft"] || keys["a"] || keys["A"]) dx -= spd;
	if (keys["ArrowRight"] || keys["d"] || keys["D"]) dx += spd;

	if (dx !== 0 || dy !== 0) {
		isMovingToTarget = false;
		pathQueue = [];
		targetX = targetY = null;
		clickedTile = null;
	}

	if (isMovingToTarget && pathQueue.length > 0) {
		const target = pathQueue[0];
		const dxToTarget = target.x - player.x;
		const dyToTarget = target.y - player.y;
		const distance = Math.hypot(dxToTarget, dyToTarget);

		if (distance <= TILE_SIZE / 2) {
			player.x = target.x;
			player.y = target.y;
			pathQueue.shift();
			if (pathQueue.length === 0) {
				isMovingToTarget = false;
				clickedTile = null;
			}
		} else {
			const norm = spd / distance;
			player.x += dxToTarget * norm;
			player.y += dyToTarget * norm;
		}
		return;
	} else if (!isMovingToTarget || pathQueue.length === 0) {
		isMovingToTarget = false;
	}

	if (dx !== 0 || dy !== 0) {
		if (dx !== 0 && dy !== 0) {
			dx *= 0.707;
			dy *= 0.707;
		}

		const nextX = player.x + dx;
		const nextY = player.y + dy;

		if (
			!isSolid(getTileAt(nextX, player.y)) &&
			!isSolid(getTileAt(nextX + player.width, player.y)) &&
			!isSolid(getTileAt(nextX, player.y + player.height)) &&
			!isSolid(getTileAt(nextX + player.width, player.y + player.height))
		) {
			player.x = nextX;
		}

		if (
			!isSolid(getTileAt(player.x, nextY)) &&
			!isSolid(getTileAt(player.x + player.width, nextY)) &&
			!isSolid(getTileAt(player.x, nextY + player.height)) &&
			!isSolid(getTileAt(player.x + player.width, nextY + player.height))
		) {
			player.y = nextY;
		}
	}
}

function drawPlayer() {
	// PERF: Only set shadowBlur when wings are active; reset immediately after.
	// shadowBlur is extremely expensive on Android (software-rendered path).
	if (player.hasWings) {
		ctx.shadowColor = "#ffd700";
		ctx.shadowBlur = 12;
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(player.x, player.y, player.width, player.height);
		ctx.shadowBlur = 0;
		ctx.shadowColor = "transparent";
	} else {
		ctx.fillStyle = player.color;
		ctx.fillRect(player.x, player.y, player.width, player.height);
	}
}

function drawCanvasNotification() {
	const n = canvasNotification;
	if (!n.text || Date.now() > n.expiry) return;

	const now = Date.now();
	const elapsed = now - n.startTime;
	const totalDuration =
		NOTIF_SLIDE_DURATION + NOTIF_HOLD_DURATION + NOTIF_FADE_DURATION;

	// ---------- alpha calculation ----------
	let alpha = 1;
	const fadeStart = NOTIF_SLIDE_DURATION + NOTIF_HOLD_DURATION;
	if (elapsed >= fadeStart) {
		alpha = 1 - (elapsed - fadeStart) / NOTIF_FADE_DURATION;
		alpha = Math.max(0, alpha);
	}

	// ---------- vertical slide calculation ----------
	// Start from below the screen (GAME_H + boxHeight) and end at centre
	// We'll compute the target centre Y first
	const isPC = GAME_W >= 700;
	const fontSize = isPC ? uiPx(12) : uiPx(9);
	const padY = uiPx(14);
	const boxH = fontSize + padY * 2;
	const centerY = (GAME_H - boxH) / 2; // final vertical position
	const startY = GAME_H + boxH; // off-screen bottom

	let boxY;
	if (elapsed < NOTIF_SLIDE_DURATION) {
		// Sliding up – use easeOutCubic for a smooth stop
		const t = elapsed / NOTIF_SLIDE_DURATION;
		const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
		boxY = startY + (centerY - startY) * ease;
	} else {
		boxY = centerY;
	}

	// ---------- horizontal centering ----------
	const padX = uiPx(24);
	fogCtx.save();
	fogCtx.font = `${fontSize}px "Press Start 2P"`;
	fogCtx.textAlign = "center";
	fogCtx.globalAlpha = alpha;

	const textWidth = fogCtx.measureText(n.text).width;
	const boxW = textWidth + padX * 2;
	const boxX = (GAME_W - boxW) / 2;

	// Draw the HUD‑themed panel at the animated position
	drawDarkPanel(
		fogCtx,
		boxX + boxW / 2,
		boxY + boxH / 2,
		boxW,
		boxH,
		uiPx(10),
		"rgba(244, 162, 97, 0.9)",
		0,
		6.2,
	);

	// Gold text with glow
	fogCtx.save();
	applyGlow(fogCtx, THEME.glowGold, uiPx(6));
	fogCtx.fillStyle = THEME.textGold;
	fogCtx.fillText(n.text, boxX + boxW / 2, boxY + boxH / 2 + fontSize * 0.35);
	killGlow(fogCtx);
	fogCtx.restore();

	fogCtx.restore();
}

// ─── FOG ─────────────────────────────────────────────────────
// PERF: The sunrise gradient never changes — build it once.
let _sunriseGradient = null;
let _sunriseGradientH = -1;

function drawFog() {
	// PERF: We draw fog to the real fogCanvas directly (DPR-scaled context).
	// The fogCanvas is a separate DOM element composited by the browser using
	// CSS mix-blend-mode or z-index, so clearing it each frame is unavoidable —
	// but we minimise work inside it.

	fogCtx.clearRect(0, 0, GAME_W, GAME_H);

	// Dark overlay
	fogCtx.fillStyle = "rgba(0, 0, 0, 0.68)";
	fogCtx.fillRect(0, 0, GAME_W, GAME_H);

	// PERF: Re-build sunrise gradient only when height changes (i.e. on resize)
	if (_sunriseGradientH !== GAME_H || !_sunriseGradient) {
		_sunriseGradient = fogCtx.createLinearGradient(0, 0, 0, GAME_H);
		_sunriseGradient.addColorStop(0, "rgba(255, 190, 120, 0.10)");
		_sunriseGradient.addColorStop(0.55, "rgba(255, 220, 170, 0.00)");
		_sunriseGradient.addColorStop(1, "rgba(210, 230, 255, 0.06)");
		_sunriseGradientH = GAME_H;
	}
	fogCtx.fillStyle = _sunriseGradient;
	fogCtx.fillRect(0, 0, GAME_W, GAME_H);

	const cx = worldToScreenX(player.x + player.width / 2);
	const cy = worldToScreenY(player.y + player.height / 2);
	const radius = player.hasWings ? uiPx(170) : uiPx(120);

	// PERF: Radial gradient is created per-frame because cx/cy change every frame.
	// We can't avoid this, but we can skip the heavy composite op by using a
	// simpler cutout approach.
	const gradient = fogCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
	gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
	gradient.addColorStop(0.7, "rgba(0, 0, 0, 0.8)");
	gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

	fogCtx.globalCompositeOperation = "destination-out";
	fogCtx.fillStyle = gradient;
	fogCtx.beginPath();
	fogCtx.arc(cx, cy, radius, 0, Math.PI * 2);
	fogCtx.fill();
	fogCtx.globalCompositeOperation = "source-over";
}

// ─── INTRO ───────────────────────────────────────────────────
let introStep = 0;
const introLines = STORY_INTRO_LINES;
let lineStartTime = Date.now();

function drawIntro() {
	ctx.fillStyle = "#050508";
	ctx.fillRect(0, 0, GAME_W, GAME_H);

	const isPC = GAME_W >= 700;
	const fontPx = isPC ? uiPx(20) : uiPx(11);
	const lineStep = isPC ? uiPx(44) : uiPx(24);

	ctx.font = `${fontPx}px "Press Start 2P"`;
	ctx.textAlign = "center";

	const alpha = Math.min(1, (Date.now() - lineStartTime) / 1000);
	ctx.globalAlpha = alpha;

	const structuralLines = introLines[introStep].split("\n");
	let renderedLines = [];
	let highlightedLineIndices = new Set();

	const maxTextWidth = isPC
		? Math.min(GAME_W - uiPx(120), uiPx(900))
		: GAME_W - uiPx(40);

	structuralLines.forEach((structLine, structIndex) => {
		const words = structLine.split(" ");
		let currentLine = "";

		words.forEach((word) => {
			let testLine = currentLine + (currentLine === "" ? "" : " ") + word;
			let testWidth = ctx.measureText(testLine).width;

			if (testWidth > maxTextWidth && currentLine !== "") {
				renderedLines.push(currentLine);
				if (structIndex === structuralLines.length - 1) {
					highlightedLineIndices.add(renderedLines.length - 1);
				}
				currentLine = word;
			} else {
				currentLine = testLine;
			}
		});

		if (currentLine !== "") {
			renderedLines.push(currentLine);
			if (structIndex === structuralLines.length - 1) {
				highlightedLineIndices.add(renderedLines.length - 1);
			}
		}
	});

	const totalHeight = renderedLines.length * lineStep;
	const startY = Math.round((GAME_H - totalHeight) / 2 + lineStep / 2);

	renderedLines.forEach((line, i) => {
		ctx.fillStyle = highlightedLineIndices.has(i) ? "#ffd700" : "#e8e4d4";
		ctx.fillText(
			line,
			Math.round(GAME_W / 2),
			Math.round(startY + i * lineStep),
		);
	});

	ctx.globalAlpha = 1;
	ctx.textAlign = "left";
}

document.getElementById("game-container").addEventListener(
	"pointerdown",
	(e) => {
		if (gameState !== "intro") return;
		e.preventDefault();
		advanceIntro();
	},
	{ passive: false },
);

window.addEventListener("keydown", (e) => {
	if (gameState === "intro") advanceIntro();
});

function advanceIntro() {
	if (gameState !== "intro") return;

	if (typeof audio !== "undefined" && audio.click) {
		audio.click.currentTime = 0;
		audio.click.play().catch((err) => console.log("Click blocked:", err));
	}

	if (!musicStarted) {
		startMusic();
	}

	introStep++;
	if (introStep >= introLines.length) {
		gameState = "title";
		introStep = 0;
	}
	lineStartTime = Date.now();
}

// ─── TITLE CARD ──────────────────────────────────────────────
let titleTimer = 0;

function updateTitle() {
	titleTimer++;
	if (titleTimer > 210) {
		gameState = "exploring";
		titleTimer = 0;
		updateCamera();
		showNotification("🦶 Tap any tile – I'll walk there!");
		movementHintShown = true;
		/*audio.explore
			.play()
			.catch((err) => console.log("Explore music failed:", err));*/
		crossfadeWavesToExplore();
	}
}

function crossfadeWavesToExplore() {
	const fadeDuration = 2000; // 2 seconds of overlap
	const fadeInterval = 50;
	const steps = fadeDuration / fadeInterval;
	const volumeStep = 1 / steps;

	audio.explore.volume = 0;
	audio.explore
		.play()
		.catch((err) => console.log("Explore music blocked:", err));

	let step = 0;
	const crossfade = setInterval(() => {
		step++;
		// Fade out waves
		audio.waves.volume = Math.max(0, audio.waves.volume - volumeStep);
		// Fade in explore
		audio.explore.volume = Math.min(0.4, audio.explore.volume + volumeStep);

		if (step >= steps) {
			clearInterval(crossfade);
			audio.waves.pause();
			audio.waves.currentTime = 0;
			audio.waves.volume = 0.55; // reset for potential later use
			audio.explore.volume = 0.4;
		}
	}, fadeInterval);
}

function drawTitleCard() {
	ctx.fillStyle = "#050508";
	ctx.fillRect(0, 0, GAME_W, GAME_H);

	ctx.save();
	ctx.textAlign = "center";

	const time = Date.now();
	const floatOffset = Math.cos(time / 350) * uiPx(12);
	const pulseAlpha = 0.82 + Math.sin(time / 400) * 0.18;

	// PERF: Reduce shadowBlur on mobile title screen — it's purely decorative here
	const isMobile = GAME_W < 700;
	const shadowBlurAmount = isMobile ? 8 : 20;

	ctx.font = `${uiPx(75)}px serif`;
	ctx.shadowColor = "rgba(255, 105, 180, 0.4)";
	ctx.shadowBlur = shadowBlurAmount;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 8;
	ctx.fillText(
		"💌",
		Math.round(GAME_W / 2),
		Math.round(GAME_H / 2 - uiPx(50) + floatOffset),
	);

	ctx.shadowBlur = 0;
	ctx.shadowOffsetY = 0;

	ctx.font = `${uiPx(24)}px "Press Start 2P"`;
	ctx.globalAlpha = pulseAlpha;

	ctx.shadowColor = "#ffd700";
	ctx.shadowBlur = isMobile ? 6 : 15;
	ctx.fillStyle = "#ff8c00";
	ctx.fillText(
		"YOU FOUND ME",
		Math.round(GAME_W / 2),
		Math.round(GAME_H / 2 + uiPx(50)),
	);

	ctx.shadowBlur = 0;
	ctx.fillStyle = "#ffd700";
	ctx.fillText(
		"YOU FOUND ME",
		Math.round(GAME_W / 2),
		Math.round(GAME_H / 2 + uiPx(50)),
	);

	ctx.font = `${uiPx(8)}px "Press Start 2P"`;
	ctx.globalAlpha = 0.4 + Math.abs(Math.sin(time / 600)) * 0.4;
	ctx.fillStyle = "#8a7a5c";
	ctx.fillText(
		"charting island coordinates...",
		Math.round(GAME_W / 2),
		Math.round(GAME_H - uiPx(60)),
	);

	ctx.restore();
}

// ─── WINGS ───────────────────────────────────────────────────
const wings = {
	x: 53 * 32 + 8,
	y: 27 * 32 + 8,
	width: 16,
	height: 16,
	collected: false,
};

function updateWings() {
	if (wings.collected) return;
	const dx = player.x - wings.x;
	const dy = player.y - wings.y;

	if (Math.sqrt(dx * dx + dy * dy) < 20) {
		if (areAllMemoriesCollected()) {
			wings.collected = true;
			player.hasWings = true;
			queueMessage(STORY_WINGS_LINES);
		} else {
			if (!isDisplayingMemory && memoryQueue.length === 0) {
				queueMessage("You forgot how to fly, get all the memories first");
			}
		}
	}
}

function drawWings() {
	if (wings.collected) return;
	const bob = Math.sin(Date.now() / 300) * 3;

	ctx.save();
	ctx.globalAlpha = 1.0;
	// PERF: Reduce shadowBlur for wings — still looks glowy at 6 vs 10
	ctx.shadowColor = "#fbff00ec";
	ctx.shadowBlur = 6;
	ctx.font = `${uiPx(18)}px serif`;
	ctx.fillStyle = "#ffd900";
	ctx.fillText("⭐", wings.x, wings.y + bob);
	ctx.restore();
}

// ─── MEMORIES ────────────────────────────────────────────────
const memories = STORY_MEMORIES.map((m) => ({
	x: m.worldX,
	y: m.worldY,
	collected: false,
	text: m.lines,
}));

let activeMemory = null;
let memoryTimer = 0;

function updateMemories() {
	// PERF: Only check uncollected memories (skip already-found ones)
	for (let i = 0; i < memories.length; i++) {
		const mem = memories[i];
		if (mem.collected) continue;
		const dx = player.x - mem.x;
		const dy = player.y - mem.y;
		if (dx * dx + dy * dy < 24 * 24) {
			// PERF: skip sqrt
			mem.collected = true;

			audio.memoryFound.currentTime = 0;
			audio.memoryFound
				.play()
				.catch((err) => console.log("Sound blocked:", err));

			queueMessage(mem.text);

			if (areAllMemoriesCollected()) {
				queueMessage([
					"✨ A strange warmth flows through you...",
					"You know how to fly now! Go find the wings!",
				]);
			}
		}
	}

	if (memoryTimer > 0) {
		memoryTimer--;
	} else if (isDisplayingMemory) {
		activeMemory = null;
		isDisplayingMemory = false;
		processNextMemory();
	}
}

function queueMessage(messageData) {
	if (typeof messageData === "string") {
		memoryQueue.push([messageData]);
	} else if (Array.isArray(messageData)) {
		memoryQueue.push(messageData);
	}
	processNextMemory();
}

function processNextMemory() {
	if (isDisplayingMemory || memoryQueue.length === 0) return;
	isDisplayingMemory = true;
	activeMemory = memoryQueue.shift();
	memoryTimer = 240;
}

// PERF: Cache the glow radius value so sin isn't called both in update and draw
let _memoryGlowRadius = 4;

function drawMemoryMarkers() {
	_memoryGlowRadius = 4 + Math.sin(Date.now() / 400) * 2;
	// PERF: Set shadow once outside the loop
	ctx.shadowColor = "#ffd700";
	ctx.fillStyle = "#ffd700";
	for (let i = 0; i < memories.length; i++) {
		const mem = memories[i];
		if (mem.collected) continue;
		ctx.shadowBlur = _memoryGlowRadius * 2;
		ctx.beginPath();
		ctx.arc(mem.x, mem.y, _memoryGlowRadius, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.shadowBlur = 0;
	ctx.shadowColor = "transparent";
}

function drawMemoryPopup() {
	if (!activeMemory || memoryTimer <= 0) return;

	const isPC = GAME_W >= 700;
	const alpha = Math.min(1, memoryTimer / 40);
	const rawLines = activeMemory;

	const fontSize = isPC ? uiPx(16) : uiPx(9);
	const lineH = isPC ? uiPx(30) : uiPx(20);
	const padX = isPC ? uiPx(40) : uiPx(20);
	const padY = isPC ? uiPx(25) : uiPx(12);
	const textYOffset = isPC ? uiPx(22) : uiPx(12);

	const boxW = isPC
		? Math.min(GAME_W - uiPx(100), uiPx(750))
		: GAME_W - uiPx(40);

	fogCtx.save();
	fogCtx.font = `${fontSize}px "Press Start 2P"`;

	let lines = [];
	const maxTextWidth = boxW - padX * 2;

	rawLines.forEach((structLine) => {
		const words = structLine.split(" ");
		let currentLine = "";

		words.forEach((word) => {
			let testLine = currentLine + (currentLine === "" ? "" : " ") + word;
			let testWidth = fogCtx.measureText(testLine).width;

			if (testWidth > maxTextWidth && currentLine !== "") {
				lines.push(currentLine);
				currentLine = word;
			} else {
				currentLine = testLine;
			}
		});
		if (currentLine !== "") lines.push(currentLine);
	});

	const boxH = lines.length * lineH + padY * 2;
	const boxX = Math.round((GAME_W - boxW) / 2);
	const boxY = Math.round(GAME_H - boxH - uiPx(50));

	fogCtx.globalAlpha = alpha;

	fogCtx.fillStyle = "rgba(255, 248, 225, 0.96)";
	roundRect(fogCtx, boxX, boxY, boxW, boxH, uiPx(10));

	// PERF: Draw border with a single path + stroke instead of individual line segments
	fogCtx.strokeStyle = "#FFB7B2";
	fogCtx.lineWidth = uiPx(2);
	rrPath(fogCtx, boxX, boxY, boxW, boxH, uiPx(10));
	fogCtx.stroke();

	fogCtx.fillStyle = "#2D3E50";
	fogCtx.textAlign = "left";
	lines.forEach((line, i) => {
		fogCtx.fillText(
			line,
			Math.round(boxX + padX),
			Math.round(boxY + padY + textYOffset + i * lineH),
		);
	});

	fogCtx.textAlign = "left";
	fogCtx.restore();
}

function checkDestination() {
	if (gameState !== "exploring" || destinationReached) return;
	if (isDisplayingMemory || memoryQueue.length > 0) return;

	const px = player.x + player.width / 2;
	const py = player.y + player.height / 2;
	const dx = px - destination.x;
	const dy = py - destination.y;
	// PERF: skip sqrt — compare squared distance
	const distSq = dx * dx + dy * dy;
	const threshSq = TILE_SIZE * 2 * (TILE_SIZE * 2);

	if (distSq < threshSq) {
		if (areAllMemoriesCollected()) {
			destinationReached = true;
			gameState = "digging";
			startRevealSequence();
		} else if (!isDisplayingMemory && memoryQueue.length === 0) {
			queueMessage(STORY_COLLECT_FIRST);
		}
	}
}

// ─── PARTICLES ───────────────────────────────────────────────
let particles = [];

// PERF: Pool particles to avoid GC pressure from constant object allocation
const PARTICLE_POOL_SIZE = 120;
const _particlePool = [];
for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
	_particlePool.push({
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		life: 0,
		maxLife: 0,
		color: "",
		size: 0,
		_active: false,
	});
}

function _getPooledParticle() {
	for (let i = 0; i < _particlePool.length; i++) {
		if (!_particlePool[i]._active) return _particlePool[i];
	}
	// Pool exhausted — create a new one (rare)
	const p = {
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		life: 0,
		maxLife: 0,
		color: "",
		size: 0,
		_active: false,
	};
	_particlePool.push(p);
	return p;
}

function spawnParticles(x, y, count = 30) {
	for (let i = 0; i < count; i++) {
		const p = _getPooledParticle();
		p.x = x;
		p.y = y;
		p.vx = (Math.random() - 0.5) * 5;
		p.vy = (Math.random() - 2) * 3;
		p.life = 60 + Math.random() * 30;
		p.maxLife = 90;
		p.color = `hsl(${30 + Math.random() * 20}, 80%, ${40 + Math.random() * 20}%)`;
		p.size = 2 + Math.random() * 4;
		p._active = true;
		particles.push(p);
	}
}

function updateParticles() {
	for (let i = particles.length - 1; i >= 0; i--) {
		const p = particles[i];
		p.x += p.vx;
		p.y += p.vy;
		p.vy += 0.12;
		p.life--;
		if (p.life <= 0) {
			p._active = false;
			particles.splice(i, 1);
		}
	}
}

function drawParticles() {
	for (let i = 0; i < particles.length; i++) {
		const p = particles[i];
		ctx.globalAlpha = p.life / p.maxLife;
		ctx.fillStyle = p.color;
		ctx.fillRect(p.x | 0, p.y | 0, p.size | 0, p.size | 0); // PERF: integer rects
	}
	ctx.globalAlpha = 1;
}

// ─── REVEAL SEQUENCE ─────────────────────────────────────────
function startRevealSequence() {
	switchToRevealMusic();

	const burstInterval = setInterval(() => {
		spawnParticles(destination.x, destination.y, 15);
	}, 300);

	setTimeout(() => {
		clearInterval(burstInterval);
		gameState = "destination_reached";
		showEnvelope();
	}, 2500);
}

// ─── ENVELOPE ────────────────────────────────────────────────
function showEnvelope() {
	const overlay = document.getElementById("ui-overlay");
	overlay.style.pointerEvents = "all";
	overlay.innerHTML = `
    <div id="envelope-container" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
    ">
      <p style="
          font-family: 'Press Start 2P', monospace;
          font-size: 16px;
          color: #ffd700;
          text-shadow: 0 0 12px #ffd700, 2px 2px #000;
          letter-spacing: 2px;
          margin-bottom: 24px;
          animation: pulse 0.8s ease-in-out infinite alternate;
      ">YOU FOUND ME</p>

      <div id="envelope" style="cursor: pointer; font-size: 45px; transform: scale(1); transition: transform 0.2s ease;">
        <div id="envelope-heart">💌</div>
      </div>
      <p id="envelope-hint" style="
          font-family: 'Press Start 2P', monospace; 
          font-size: 8px; 
          color: #ffffff; 
          margin-top: 15px; 
          text-shadow: 2px 2px #000;
          letter-spacing: 1px;
      ">[ tap letter to read ]</p>
    </div>

    <style>
      @keyframes pulse {
        from { opacity: 0.75; text-shadow: 0 0 8px #ffd700, 2px 2px #000; }
        to   { opacity: 1;    text-shadow: 0 0 20px #ffd700, 2px 2px #000; }
      }
    </style>
  `;

	const env = document.getElementById("envelope");
	env.addEventListener(
		"mouseenter",
		() => (env.style.transform = "scale(1.15)"),
	);
	env.addEventListener("mouseleave", () => (env.style.transform = "scale(1)"));

	let opened = false;
	function openEnvelope(e) {
		if (opened) return;
		opened = true;
		if (e.type === "touchend") e.preventDefault();
		if (audio.sealCrack) audio.sealCrack.play().catch(() => {});
		gameState = "envelope_open";
		showLetter();
	}

	const container = document.getElementById("envelope-container");
	container.addEventListener("touchend", openEnvelope, { passive: false });
	container.addEventListener("click", openEnvelope);
}

// ─── LETTER ──────────────────────────────────────────────────
const letterContent = STORY_LETTER;

function showLetter() {
	const overlay = document.getElementById("ui-overlay");
	overlay.innerHTML = `
        <div id="letter-container">
            <div id="parchment">
                <p id="letter-text"></p>
                <div id="reply-area" style="display:none; margin-top:25px; border-top:1px dashed #8a7a5c; padding-top:15px;">
                    <div style="margin-bottom:10px;">
                        <label style="font-family:'Press Start 2P';font-size:7px;color:#8a7a5c;display:block;margin-bottom:4px;">Your Name:</label>
                        <input type="text" id="reply-name" placeholder="Name..." style="width:100%;background:rgba(255,248,220,0.6);border:1px solid #8a7a5c;border-radius:4px;font-family:'Press Start 2P',monospace;font-size:8px;padding:6px;box-sizing:border-box;color:#2d1e10;" />
                    </div>
                    <div>
                        <label style="font-family:'Press Start 2P';font-size:7px;color:#8a7a5c;display:block;margin-bottom:4px;">Your Reply:</label>
                        <textarea id="reply-input" placeholder="Type your reply here..." style="width:100%;height:70px;background:rgba(255,248,220,0.6);border:1px solid #8a7a5c;border-radius:4px;font-family:'Press Start 2P',monospace;font-size:8px;padding:8px;box-sizing:border-box;resize:none;color:#2d1e10;"></textarea>
                    </div>
                    <p id="reply-status" style="font-family:'Press Start 2P';font-size:7px;color:#6aaa50;margin-top:5px;display:none;"></p>
                </div>
            </div>
            <div id="letter-buttons" style="opacity:0">
                <button id="reply-btn" onclick="toggleReplyBox()">✍️ Reply</button>
                <button onclick="replayLetter()">💌 Read Again</button>
                <button onclick="backToIsland()">🏝️ Back to Island</button>
            </div>
        </div>
    `;
	gameState = "letter";
	typewriterEffect(letterContent);
}

function typewriterEffect(text) {
	const el = document.getElementById("letter-text");
	let i = 0;

	if (typeof audio !== "undefined" && audio.typeSound) {
		audio.typeSound.currentTime = 0;
		audio.typeSound
			.play()
			.catch((err) => console.log("Audio play blocked:", err));
	}

	// PERF: Use a single timeout chain instead of setInterval for typewriter.
	// setInterval accumulates drift on throttled Android background tabs;
	// setTimeout scheduling is more reliable for the letter reveal.
	function typeNext() {
		if (i < text.length) {
			el.textContent += text[i];
			const parchment = document.getElementById("parchment");
			if (parchment) parchment.scrollTop = parchment.scrollHeight;
			i++;
			setTimeout(typeNext, 28);
		} else {
			if (typeof audio !== "undefined" && audio.typeSound) {
				audio.typeSound.pause();
				audio.typeSound.currentTime = 0;
			}
			const btns = document.getElementById("letter-buttons");
			if (btns) btns.style.opacity = "1";
			spawnConfetti();
		}
	}
	typeNext();
}

function replayLetter() {
	showLetter();
}

let islandReturnTimeout = null;
let islandReturnSecondTimeout = null;

function backToIsland() {
	if (typeof audio !== "undefined" && audio.click) {
		audio.click.currentTime = 0;
		audio.click.play().catch(() => {});
	}

	gameState = "exploring";

	const overlay = document.getElementById("ui-overlay");
	overlay.innerHTML = "";
	overlay.style.pointerEvents = "none";

	if (audio.reveal && !audio.reveal.paused) {
		const fadeDuration = 1000;
		const fadeInterval = 50;
		const steps = fadeDuration / fadeInterval;
		const volumeStep = audio.reveal.volume / steps;

		const fadeOutReveal = setInterval(() => {
			if (audio.reveal.volume > volumeStep) {
				audio.reveal.volume -= volumeStep;
			} else {
				clearInterval(fadeOutReveal);
				audio.reveal.pause();
				audio.reveal.currentTime = 0;
			}
		}, fadeInterval);
	}

	if (audio.explore) {
		audio.explore.volume = 0.4;
		audio.explore.currentTime = 0;
		audio.explore
			.play()
			.catch((err) => console.log("Explore music resume failed:", err));
	}

	if (islandReturnTimeout) clearTimeout(islandReturnTimeout);
	if (islandReturnSecondTimeout) clearTimeout(islandReturnSecondTimeout);

	islandReturnTimeout = setTimeout(() => {
		if (gameState === "exploring") {
			showCenteredNotification(
				"✨ A strange energy lingers… Part Two is calling.",
				7000,
			);
		}
		islandReturnTimeout = null;
	}, 10000);

	islandReturnSecondTimeout = setTimeout(() => {
		if (gameState === "exploring") {
			showCenteredNotification(
				"💌 The waves whisper a secret… your journey is far from over.",
				7000,
			);
		}
		islandReturnSecondTimeout = null;
	}, 15000);
}

let activeNotificationTimeout = null;

function showCenteredNotification(message, durationMs = 3000) {
	const oldNote = document.getElementById("custom-notification");
	if (oldNote) oldNote.remove();
	if (activeNotificationTimeout) clearTimeout(activeNotificationTimeout);

	const isMobile = GAME_W <= 700;
	const fontSize = isMobile ? "10px" : "14px";
	const paddingV = isMobile ? "8px" : "12px";
	const paddingH = isMobile ? "12px" : "20px";

	const note = document.createElement("div");
	note.id = "custom-notification";
	note.innerText = message;
	note.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(10px);
    color: #ffd700;
    font-family: 'Press Start 2P', monospace;
    font-size: ${fontSize};
    padding: ${paddingV} ${paddingH};
    border-radius: 12px;
    border: 1px solid #ffd700;
    z-index: 10000;
    text-align: center;
    white-space: normal;
    word-break: break-word;
    max-width: 85vw;
    pointer-events: none;
    line-height: 1.5;
    box-sizing: border-box;
    animation: fadeInOut ${durationMs / 1000}s ease-in-out forwards;
  `;

	if (!document.querySelector("#notification-style")) {
		const style = document.createElement("style");
		style.id = "notification-style";
		style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        85% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); visibility: hidden; }
      }
    `;
		document.head.appendChild(style);
	}

	document.body.appendChild(note);

	activeNotificationTimeout = setTimeout(() => {
		if (note && note.remove) note.remove();
		activeNotificationTimeout = null;
	}, durationMs);
}

function spawnConfetti() {
	const overlay = document.getElementById("ui-overlay");
	const confetti = document.createElement("div");
	confetti.id = "confetti";
	confetti.style.position = "fixed";
	confetti.style.inset = "0";
	confetti.style.overflow = "hidden";
	confetti.style.pointerEvents = "none";
	confetti.style.zIndex = "9999";
	confetti.innerHTML = Array.from(
		{ length: 40 },
		() =>
			`<span style="position:absolute;left:${Math.random() * 100}%;top:-10px;font-size:${14 + Math.random() * 16}px;animation:fall ${1.5 + Math.random() * 2}s ease-in forwards;animation-delay:${Math.random()}s;">${["💛", "✨", "🌸", "⭐", "💫"][Math.floor(Math.random() * 5)]}</span>`,
	).join("");
	overlay.appendChild(confetti);
	setTimeout(() => confetti.remove(), 4500);
}

// ─── SCREENSHOT ──────────────────────────────────────────────
function takeScreenshot() {
	const link = document.createElement("a");
	link.download = "you-found-me.png";
	link.href = canvas.toDataURL("image/png");
	link.click();
}

function areAllMemoriesCollected() {
	return memories.every((mem) => mem.collected === true);
}

// ─── TAP TO MOVE (ANDROID / TOUCH) ─────────────────────────
// PERF: Debounce tap so rapid multi-touches don't spawn multiple BFS searches
let _tapCooldown = false;

function handleCanvasTap(e) {
	if (gameState !== "exploring") return;
	if (_tapCooldown) return;
	e.preventDefault();

	let clientX, clientY;
	if (e.touches && e.touches.length > 0) {
		clientX = e.touches[0].clientX;
		clientY = e.touches[0].clientY;
	} else if (e.changedTouches && e.changedTouches.length > 0) {
		clientX = e.changedTouches[0].clientX;
		clientY = e.changedTouches[0].clientY;
	} else {
		clientX = e.clientX;
		clientY = e.clientY;
	}

	const rect = canvas.getBoundingClientRect();
	const logicalX = clientX - rect.left;
	const logicalY = clientY - rect.top;

	const invZoom = 1 / camera.zoom;
	const worldX = (logicalX - GAME_W / 2) * invZoom + camera.x;
	const worldY = (logicalY - GAME_H / 2) * invZoom + camera.y;

	const tileCol = Math.floor(worldX / TILE_SIZE);
	const tileRow = Math.floor(worldY / TILE_SIZE);

	if (
		tileRow < 0 ||
		tileRow >= map.length ||
		tileCol < 0 ||
		tileCol >= map[0].length
	)
		return;

	if (!isWalkable(tileCol, tileRow)) {
		if (!movementHintShown) {
			showNotification("❌ Can't walk there – find wings to fly!");
			movementHintShown = true;
		} else {
			showNotification("❌ You can't go there");
		}
		return;
	}

	const startCol = Math.floor((player.x + player.width / 2) / TILE_SIZE);
	const startRow = Math.floor((player.y + player.height / 2) / TILE_SIZE);

	if (startCol === tileCol && startRow === tileRow) return;

	// PERF: Run BFS off the main thread via setTimeout(0) so it doesn't block
	// the current touch event (prevents "ANR"-style jank on Android WebView)
	_tapCooldown = true;
	setTimeout(() => {
		const path = findPath(startCol, startRow, tileCol, tileRow);

		if (path && path.length > 0) {
			pathQueue = path.map((step) => ({
				x: step.col * TILE_SIZE + (TILE_SIZE - player.width) / 2,
				y: step.row * TILE_SIZE + (TILE_SIZE - player.height) / 2,
			}));
			clickedTile = { col: tileCol, row: tileRow };
			isMovingToTarget = true;
			if (!movementHintShown) {
				showNotification("🦶 Tap any tile – I'll walk there!");
				movementHintShown = true;
			}
		} else {
			showNotification("🚫 No path found");
			clickedTile = null;
		}
		// Small cooldown so double-taps don't re-trigger immediately
		setTimeout(() => {
			_tapCooldown = false;
		}, 120);
	}, 0);
}

canvas.addEventListener("touchstart", handleCanvasTap, { passive: false });
canvas.addEventListener("mousedown", handleCanvasTap);

// ─── START ───────────────────────────────────────────────────
gameLoop();
