// ─── CANVAS SETUP ───────────────────────────────────────────
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const fogCanvas = document.getElementById("fogCanvas");
const fogCtx = fogCanvas.getContext("2d");

const GAME_W = 800;
const GAME_H = 600;

canvas.width = GAME_W;
canvas.height = GAME_H;
fogCanvas.width = GAME_W;
fogCanvas.height = GAME_H;

const joystickZone = document.getElementById("joystick-zone");

function setJoystickEnabled(enabled) {
	joystickZone.style.pointerEvents = enabled ? "all" : "none";
}

setJoystickEnabled(false);

let joyX = 0,
	joyY = 0;
let joystickInstance = null;

// ─── RESPONSIVE RESIZE (NO TRANSFORMS) ──────────────────────
function resizeGame() {
	const container = document.getElementById("game-container");
	const scaleX = window.innerWidth / GAME_W;
	const scaleY = window.innerHeight / GAME_H;
	const scale = Math.min(scaleX, scaleY, 1);

	container.style.width = Math.max(1, Math.floor(GAME_W * scale)) + "px";
	container.style.height = Math.max(1, Math.floor(GAME_H * scale)) + "px";

	if (joystickInstance && joystickInstance.destroy) {
		joystickInstance.destroy();
		joystickInstance = null;
		joyX = 0;
		joyY = 0;
		initJoystick();
	}
}
window.addEventListener("resize", resizeGame);
resizeGame();

// ─── GAME STATE ──────────────────────────────────────────────
let gameState = "intro";

// ─── GAME LOOP ───────────────────────────────────────────────
function update() {
	if (gameState === "exploring") {
		updatePlayer();
		updateWings();
		updateMemories();
		updateParticles();
		checkDestination();
	}
	if (gameState === "title") {
		updateTitle();
	}
	if (gameState === "digging" || gameState === "destination_reached") {
		updateParticles();
	}
}

function draw() {
	ctx.clearRect(0, 0, GAME_W, GAME_H);

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
		drawMap();
		drawWings();
		drawPlayer();
		drawParticles();
		drawFog();
		drawMemories();
		if (gameState === "exploring") {
			drawHUD();
			drawNotification();
		}
	}
}

function gameLoop() {
	update();
	draw();
	requestAnimationFrame(gameLoop);
}

// ─── MAP ─────────────────────────────────────────────────────
const TILE_SIZE = 32;

const map = [
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 3, 3, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 1, 1, 1, 2, 2, 2, 1, 1, 3, 3, 3, 1, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0],
	[0, 0, 1, 1, 4, 4, 4, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0],
	[0, 1, 1, 4, 4, 1, 4, 4, 2, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0],
	[0, 1, 4, 4, 1, 1, 1, 4, 1, 1, 1, 4, 4, 4, 1, 1, 1, 1, 1, 3, 1, 1, 1, 0, 0],
	[0, 1, 4, 1, 1, 3, 1, 4, 4, 4, 4, 4, 1, 4, 4, 1, 1, 1, 3, 3, 3, 1, 1, 0, 0],
	[0, 1, 4, 1, 3, 3, 1, 1, 1, 1, 1, 1, 0, 1, 4, 4, 1, 1, 1, 3, 1, 1, 1, 0, 0],
	[0, 1, 4, 4, 1, 1, 1, 2, 2, 1, 1, 0, 0, 1, 1, 4, 4, 1, 1, 1, 1, 1, 0, 0, 0],
	[0, 0, 1, 4, 4, 1, 2, 2, 2, 2, 1, 0, 1, 1, 1, 1, 4, 1, 2, 2, 1, 1, 0, 0, 0],
	[0, 0, 1, 1, 4, 1, 2, 2, 2, 2, 1, 0, 1, 1, 1, 1, 4, 2, 2, 2, 2, 1, 0, 0, 0],
	[0, 0, 0, 1, 4, 4, 1, 2, 2, 1, 1, 0, 1, 1, 1, 4, 4, 2, 3, 3, 2, 1, 0, 0, 0],
	[0, 0, 0, 1, 1, 4, 4, 1, 1, 1, 1, 0, 1, 1, 4, 4, 1, 2, 3, 3, 2, 1, 0, 0, 0],
	[0, 0, 1, 1, 1, 1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 1, 2, 2, 2, 2, 1, 0, 0, 0],
	[0, 1, 1, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 0, 0],
	[0, 1, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
	[0, 1, 1, 3, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

const TILE_COLORS = {
	0: "#1a5c7a",
	1: "#4a7c3f",
	2: "#2d5a1b",
	3: "#6aaa50",
	4: "#8a7a5c",
};

function drawMap() {
	for (let row = 0; row < map.length; row++) {
		for (let col = 0; col < map[row].length; col++) {
			const tile = map[row][col];
			ctx.fillStyle = TILE_COLORS[tile] || "#000";
			ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
		}
	}
	ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
	ctx.beginPath();
	ctx.arc(destination.x, destination.y, 6, 0, Math.PI * 2);
	ctx.fill();
}

// ─── PLAYER ──────────────────────────────────────────────────
const player = {
	x: 96,
	y: 64,
	width: 16,
	height: 16,
	speed: 2,
	color: "#ff69b4",
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

	dx += joyX * spd;
	dy += joyY * spd;

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

function drawPlayer() {
	ctx.fillStyle = player.hasWings ? "#ffffff" : player.color;
	ctx.fillRect(player.x, player.y, player.width, player.height);
	if (player.hasWings) {
		ctx.shadowColor = "#ffd700";
		ctx.shadowBlur = 12;
		ctx.fillRect(player.x, player.y, player.width, player.height);
		ctx.shadowBlur = 0;
	}
}

// ─── FOG ─────────────────────────────────────────────────────
function drawFog() {
	fogCtx.clearRect(0, 0, GAME_W, GAME_H);
	fogCtx.fillStyle = "rgba(0, 0, 0, 0.73)";
	fogCtx.fillRect(0, 0, GAME_W, GAME_H);

	const cx = player.x + player.width / 2;
	const cy = player.y + player.height / 2;
	const radius = player.hasWings ? 160 : 100;

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

// ─── HUD ─────────────────────────────────────────────────────
function getGameCoords() {
	return {
		x: Math.floor(player.x / TILE_SIZE),
		z: -Math.floor(player.y / TILE_SIZE),
	};
}

function drawHUD() {
	const coords = getGameCoords();

	fogCtx.fillStyle = "rgba(0,0,0,0.7)";
	roundRect(fogCtx, GAME_W - 168, 10, 158, 44, 6);

	fogCtx.font = '10px "Press Start 2P"';
	fogCtx.fillStyle = "#ffd700";
	fogCtx.fillText(`X: ${coords.x}`, GAME_W - 152, 29);
	fogCtx.fillText(`Z: ${coords.z}`, GAME_W - 152, 47);

	if (player.hasWings) {
		fogCtx.fillStyle = "rgba(255,255,255,0.15)";
		roundRect(fogCtx, 10, 10, 80, 24, 4);
		fogCtx.font = '7px "Press Start 2P"';
		fogCtx.fillStyle = "#ffffff";
		fogCtx.fillText("🪽 FLYING", 16, 26);
	}

	drawProgressHeart();
}

let notification = null;
let notifTimer = 0;

function showNotification(msg) {
	notification = msg;
	notifTimer = 180;
}

function drawNotification() {
	if (!notification || notifTimer <= 0) return;
	notifTimer--;

	const alpha = Math.min(1, notifTimer / 30);
	fogCtx.globalAlpha = alpha;
	fogCtx.fillStyle = "rgba(10,8,5,0.9)";
	fogCtx.strokeStyle = "#ffd700";
	fogCtx.lineWidth = 1.5;
	roundRect(fogCtx, 20, GAME_H - 80, GAME_W - 40, 30, 6);
	fogCtx.stroke();
	fogCtx.font = '8px "Press Start 2P"';
	fogCtx.fillStyle = "#fff8dc";
	fogCtx.textAlign = "center";
	fogCtx.fillText(notification, GAME_W / 2, GAME_H - 59);
	fogCtx.textAlign = "left";
	fogCtx.globalAlpha = 1;

	if (notifTimer <= 0) notification = null;
}

function roundRect(ctx, x, y, w, h, r) {
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

// ─── INTRO ───────────────────────────────────────────────────
let introStep = 0;
const introLines = [
	"There is a certain kind of lost\nthat has no map.",
	"Not lost in a place.\nLost in yourself.",
	"And then she walked back\ninto his life.",
	"She left a letter.\nAnd inside it — a map.",
	"X: 20,  Z: -15\n\nIf you ever loved me...\nfind me.",
	"[ tap or press any key\nto set sail ]",
];
let lineStartTime = Date.now();

function drawIntro() {
	ctx.fillStyle = "#050508";
	ctx.fillRect(0, 0, GAME_W, GAME_H);

	const lines = introLines[introStep].split("\n");
	ctx.textAlign = "center";

	const alpha = Math.min(1, (Date.now() - lineStartTime) / 1000);
	ctx.globalAlpha = alpha;

	lines.forEach((line, i) => {
		ctx.font = '11px "Press Start 2P"';
		ctx.fillStyle = i === lines.length - 1 ? "#ffd700" : "#e8e4d4";
		ctx.fillText(
			line,
			GAME_W / 2,
			GAME_H / 2 - (lines.length - 1) * 14 + i * 28,
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
	if (titleTimer > 350) {
		gameState = "exploring";
		titleTimer = 0;
		initJoystick(); // This is perfect!
	}
}

function drawTitleCard() {
	ctx.fillStyle = "#050508";
	ctx.fillRect(0, 0, GAME_W, GAME_H);

	ctx.save();
	ctx.textAlign = "center";

	const time = Date.now();
	const floatOffset = Math.cos(time / 350) * 12;
	const pulseAlpha = 0.82 + Math.sin(time / 400) * 0.18;

	ctx.font = "75px serif";
	ctx.shadowColor = "rgba(255, 105, 180, 0.4)";
	ctx.shadowBlur = 20;
	ctx.shadowOffsetX = 0;
	ctx.shadowOffsetY = 8;
	ctx.fillText("💌", GAME_W / 2, GAME_H / 2 - 50 + floatOffset);

	ctx.shadowBlur = 0;
	ctx.shadowOffsetY = 0;

	ctx.font = '24px "Press Start 2P"';
	ctx.globalAlpha = pulseAlpha;

	ctx.shadowColor = "#ffd700";
	ctx.shadowBlur = 15;
	ctx.fillStyle = "#ff8c00";
	ctx.fillText("YOU FOUND ME", GAME_W / 2, GAME_H / 2 + 50);

	ctx.shadowBlur = 0;
	ctx.fillStyle = "#ffd700";
	ctx.fillText("YOU FOUND ME", GAME_W / 2, GAME_H / 2 + 50);

	ctx.font = '8px "Press Start 2P"';
	ctx.globalAlpha = 0.4 + Math.abs(Math.sin(time / 600)) * 0.4;
	ctx.fillStyle = "#8a7a5c";
	ctx.fillText("charting island coordinates...", GAME_W / 2, GAME_H - 60);

	ctx.restore();
}

// ─── WINGS ───────────────────────────────────────────────────
const wings = { x: 160, y: 96, width: 16, height: 16, collected: false };

function updateWings() {
	if (wings.collected) return;
	const dx = player.x - wings.x;
	const dy = player.y - wings.y;
	if (Math.sqrt(dx * dx + dy * dy) < 20) {
		wings.collected = true;
		player.hasWings = true;
		showNotification("Wings collected! You can fly!");
	}
}

function drawWings() {
	if (wings.collected) return;
	const bob = Math.sin(Date.now() / 300) * 3;
	ctx.save();
	ctx.font = "18px serif";
	ctx.fillText("🪽", wings.x, wings.y + bob);
	ctx.restore();
}

// ─── MEMORIES ────────────────────────────────────────────────
const memories = [
	{
		x: 6 * TILE_SIZE + 16,
		y: 3 * TILE_SIZE + 16,
		collected: false,
		text: [
			"This is where I used to sit",
			"and think about you.",
			"Every single day.",
		],
	},
	{
		x: 12 * TILE_SIZE + 16,
		y: 5 * TILE_SIZE + 16,
		collected: false,
		text: [
			"I found this tree on my first day here.",
			"I carved something into it.",
			"I hoped you would find it.",
		],
	},
	{
		x: 3 * TILE_SIZE + 16,
		y: 11 * TILE_SIZE + 16,
		collected: false,
		text: [
			"I used to call you at 2am",
			"just to hear your voice.",
			"I still do it sometimes.",
			"I just don't press call anymore.",
		],
	},
	{
		x: 14 * TILE_SIZE + 16,
		y: 13 * TILE_SIZE + 16,
		collected: false,
		text: ["You're close now.", "I can feel it.", "I always could."],
	},
];

let activeMemory = null;
let memoryTimer = 0;

function updateMemories() {
	memories.forEach((mem) => {
		if (mem.collected) return;
		const dx = player.x - mem.x;
		const dy = player.y - mem.y;
		if (Math.sqrt(dx * dx + dy * dy) < 24) {
			mem.collected = true;
			activeMemory = mem.text;
			memoryTimer = 280;
		}
	});
	if (memoryTimer > 0) memoryTimer--;
	else activeMemory = null;
}

function drawMemories() {
	const glow = 4 + Math.sin(Date.now() / 400) * 2;
	memories.forEach((mem) => {
		if (mem.collected) return;
		ctx.shadowColor = "#ffd700";
		ctx.shadowBlur = glow * 2;
		ctx.fillStyle = "#ffd700";
		ctx.beginPath();
		ctx.arc(mem.x, mem.y, glow, 0, Math.PI * 2);
		ctx.fill();
		ctx.shadowBlur = 0;
	});

	if (!activeMemory || memoryTimer <= 0) return;

	const alpha = Math.min(1, memoryTimer / 40);
	const lines = activeMemory;
	const padX = 20,
		padY = 12,
		lineH = 18;
	const boxW = GAME_W - 40;
	const boxH = lines.length * lineH + padY * 2;
	const boxY = GAME_H - boxH - 50;

	fogCtx.save();
	fogCtx.globalAlpha = alpha;
	fogCtx.fillStyle = "rgba(10,8,5,0.95)";
	roundRect(fogCtx, padX, boxY, boxW, boxH, 8);
	fogCtx.strokeStyle = "#ffd700";
	fogCtx.lineWidth = 2;
	fogCtx.stroke();

	fogCtx.font = '8px "Press Start 2P"';
	fogCtx.fillStyle = "#fff8dc";
	lines.forEach((line, i) => {
		fogCtx.fillText(line, padX + 14, boxY + padY + 12 + i * lineH);
	});
	fogCtx.restore();
}

// ─── DESTINATION ─────────────────────────────────────────────
const destination = {
	x: 20 * TILE_SIZE + 16,
	y: 15 * TILE_SIZE + 16,
};

function checkDestination() {
	if (gameState !== "exploring") return;
	const c = getGameCoords();
	if (c.x === 20 && c.z === -15) {
		gameState = "digging";
		startRevealSequence();
	}
}

// ─── PARTICLES ───────────────────────────────────────────────
let particles = [];

function spawnParticles(x, y, count = 30) {
	for (let i = 0; i < count; i++) {
		particles.push({
			x,
			y,
			vx: (Math.random() - 0.5) * 5,
			vy: (Math.random() - 2) * 3,
			life: 60 + Math.random() * 30,
			maxLife: 90,
			color: `hsl(${30 + Math.random() * 20}, 80%, ${40 + Math.random() * 20}%)`,
			size: 2 + Math.random() * 4,
		});
	}
}

function updateParticles() {
	particles.forEach((p) => {
		p.x += p.vx;
		p.y += p.vy;
		p.vy += 0.12;
		p.life--;
	});
	particles = particles.filter((p) => p.life > 0);
}

function drawParticles() {
	particles.forEach((p) => {
		ctx.globalAlpha = p.life / p.maxLife;
		ctx.fillStyle = p.color;
		ctx.fillRect(p.x, p.y, p.size, p.size);
	});
	ctx.globalAlpha = 1;
}

// ─── REVEAL SEQUENCE ─────────────────────────────────────────
function startRevealSequence() {
	const burstInterval = setInterval(() => {
		spawnParticles(destination.x, destination.y, 15);
	}, 300);

	setTimeout(() => {
		clearInterval(burstInterval);
		gameState = "destination_reached";
		switchToRevealMusic();
		showEnvelope();
	}, 2500);
}

// ─── ENVELOPE ────────────────────────────────────────────────
function showEnvelope() {
	const overlay = document.getElementById("ui-overlay");
	overlay.style.pointerEvents = "all";
	setJoystickEnabled(false);
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

	// FIX: guard against double-fire (touchend + click on mobile)
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
const letterContent = `To my wifey:>,


I've been thinking about how to start this
for a long time.

And every time, I come back to the same truth:

You found me first.

I was lost 

Thankyousm my wifey.
For an amazing month.
For being my person.
For finding me —

the way I once found you.


               Always yours,
                    — iweiwei21`;

function showLetter() {
	const overlay = document.getElementById("ui-overlay");
	setJoystickEnabled(false);
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
	const interval = setInterval(() => {
		if (i < text.length) {
			el.textContent += text[i];
			document.getElementById("parchment").scrollTop =
				document.getElementById("parchment").scrollHeight;
			i++;
		} else {
			clearInterval(interval);
			document.getElementById("letter-buttons").style.opacity = "1";
			spawnConfetti();
		}
	}, 28);
}

function toggleReplyBox() {
	const replyArea = document.getElementById("reply-area");
	const replyBtn = document.getElementById("reply-btn");
	const nameInput = document.getElementById("reply-name");
	const messageInput = document.getElementById("reply-input");
	const statusText = document.getElementById("reply-status");

	if (replyArea.style.display === "none") {
		replyArea.style.display = "block";
		replyBtn.textContent = "🚀 Send Reply";
		document.getElementById("parchment").scrollTop =
			document.getElementById("parchment").scrollHeight;
		nameInput.focus();
	} else {
		const nameValue = nameInput.value.trim();
		const msgValue = messageInput.value.trim();

		if (nameValue !== "" || msgValue !== "") {
			if (nameValue === "") {
				statusText.style.display = "block";
				statusText.style.color = "#ff4444";
				statusText.textContent = "Please enter your name! 🤍";
				nameInput.focus();
				return;
			}
			if (!nameValue.toLowerCase().includes("hyacinth")) {
				statusText.style.display = "block";
				statusText.style.color = "#ff4444";
				statusText.textContent =
					"This mailbox is reserved for my wifey only. Name mo po:>🔒";
				nameInput.focus();
				return;
			}
			if (msgValue === "") {
				statusText.style.display = "block";
				statusText.style.color = "#ff4444";
				statusText.textContent = "Please type a message! 🌸";
				messageInput.focus();
				return;
			}
			sendReplyToDiscord(nameValue, msgValue);
		} else {
			replyArea.style.display = "none";
			replyBtn.textContent = "✍️ Reply";
			statusText.style.display = "none";
		}
	}
}

function sendReplyToDiscord(authorName, replyMessage) {
	const statusText = document.getElementById("reply-status");
	const replyBtn = document.getElementById("reply-btn");

	statusText.style.display = "block";
	statusText.style.color = "#ffd700";
	statusText.textContent = "Sending via carrier pigeon... 🕊️";
	replyBtn.disabled = true;

	const discordWebhookUrl =
		"https://discord.com/api/webhooks/1503654821704630332/npab-qTmGPzCNq9Hvy5RmOrZwQkQezsportS75r5yy2oNsK6l0JGgHrlbLhdXvuP-C-9";

	const payload = {
		username: "Island Love Letters",
		avatar_url: "https://i.imgur.com/vHco7O6.png",
		embeds: [
			{
				description: `> 💖 **From Your Wifey:** \`${authorName}\`\n> ⏳ **Time:** <t:${Math.floor(Date.now() / 1000)}:F> (<t:${Math.floor(Date.now() / 1000)}:R>)\n\n🌸 ───────────────────────────── 🌸`,
				title: `\n${replyMessage}\n`,
				color: 16738740,
				thumbnail: { url: "https://i.imgur.com/vHco7O6.png" },
				footer: {
					text: "Always Yours • You Found Me Engine",
					icon_url: "https://i.imgur.com/vHco7O6.png",
				},
			},
		],
	};

	fetch(discordWebhookUrl, {
		method: "POST",
		mode: "cors",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	})
		.then((res) => {
			if (res.ok || res.status === 204 || res.status === 200) {
				statusText.style.color = "#6aaa50";
				statusText.textContent = "Reply sent securely! ❤️";
				document.getElementById("reply-name").value = "";
				document.getElementById("reply-input").value = "";
				setTimeout(() => {
					document.getElementById("reply-area").style.display = "none";
					replyBtn.textContent = "✍️ Reply";
					replyBtn.disabled = false;
					statusText.style.display = "none";
				}, 3000);
			} else {
				throw new Error("Not OK");
			}
		})
		.catch((err) => {
			statusText.style.color = "#ff4444";
			statusText.textContent = "Network error. Try again!";
			replyBtn.disabled = false;
			console.error("Webhook Error:", err);
		});
}

function replayLetter() {
	showLetter();
}

function backToIsland() {
	const overlay = document.getElementById("ui-overlay");
	overlay.innerHTML = "";
	overlay.style.pointerEvents = "none";
	gameState = "exploring";
	setJoystickEnabled(true);
}

function spawnConfetti() {
	const overlay = document.getElementById("ui-overlay");
	const confetti = document.createElement("div");
	confetti.id = "confetti";
	confetti.innerHTML = Array.from(
		{ length: 40 },
		() =>
			`<span style="position:absolute;left:${Math.random() * 100}%;top:-10px;font-size:${14 + Math.random() * 16}px;animation:fall ${1.5 + Math.random() * 2}s ease-in forwards;animation-delay:${Math.random()}s;">${["💛", "✨", "🌸", "⭐", "💫"][Math.floor(Math.random() * 5)]}</span>`,
	).join("");
	overlay.appendChild(confetti);
}

// ─── AUDIO ───────────────────────────────────────────────────
const audio = {
	explore: new Audio("assets/audio/poopie pack/journey.wav"),
	reveal: new Audio("assets/audio/poopie pack/blossom.wav"),
	sealCrack: new Audio("assets/audio/poopie pack/start.wav"),
	click: new Audio("assets/audio/poopie pack/yeahhhhh yuh.wav"),
};
audio.explore.loop = true;
audio.explore.volume = 0.4;
audio.reveal.loop = true;
audio.reveal.volume = 0.5;

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
	audio.explore.pause();
	audio.reveal.currentTime = 0;
	audio.reveal.play().catch(() => {});
}

let isMuted = false;
function toggleMute() {
	isMuted = !isMuted;
	Object.values(audio).forEach((a) => (a.muted = isMuted));
}

// ─── JOYSTICK ────────────────────────────────────────────────
// ─── JOYSTICK INITIALIZATION ────────────────────────────────
function initJoystick() {
	// Simple check to ensure we are on a touch-capable device
	if (!("ontouchstart" in window || navigator.maxTouchPoints > 0)) return;
	if (joystickInstance) return;

	setJoystickEnabled(true);
	joystickInstance = nipplejs.create({
		zone: document.getElementById("joystick-zone"), // CHANGE: Target joystick-zone directly
		mode: "static",
		position: { left: "15%", bottom: "18%" },
		color: "rgba(255, 215, 0, 0.6)",
		size: 90,
	});

	joystickInstance.on("move", (evt, data) => {
		// NippleJS gives an inversion vector on Y-axis naturally, we normalize it here
		joyX = data.vector.x;
		joyY = -data.vector.y;
	});

	joystickInstance.on("end", () => {
		joyX = 0;
		joyY = 0;
	});
}

// ─── PROGRESS HEART ──────────────────────────────────────────
function drawProgressHeart() {
	const dx = player.x - destination.x;
	const dy = player.y - destination.y;
	const dist = Math.sqrt(dx * dx + dy * dy);
	const pct = 1 - Math.min(dist / 450, 1);

	fogCtx.font = "18px serif";
	fogCtx.globalAlpha = 0.3;
	fogCtx.fillText("🤍", 10, 50);
	fogCtx.globalAlpha = pct;
	fogCtx.fillText("❤️", 10, 50);
	fogCtx.globalAlpha = 1;
}

// ─── SCREENSHOT ──────────────────────────────────────────────
function takeScreenshot() {
	const link = document.createElement("a");
	link.download = "you-found-me.png";
	link.href = canvas.toDataURL("image/png");
	link.click();
}

// ─── START ───────────────────────────────────────────────────
gameLoop();
