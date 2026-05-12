// ─── CANVAS SETUP ───────────────────────────────────────────
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const fogCanvas = document.getElementById("fogCanvas");
const fogCtx = fogCanvas.getContext("2d");

// Internal resolution — this never changes
const GAME_W = 800;
const GAME_H = 600;

canvas.width = GAME_W;
canvas.height = GAME_H;
fogCanvas.width = GAME_W;
fogCanvas.height = GAME_H;

// ─── RESPONSIVE RESIZE ──────────────────────────────────────
// Scales the container to fit the screen while keeping aspect ratio
function resizeGame() {
	const container = document.getElementById("game-container");
	const scaleX = window.innerWidth / GAME_W;
	const scaleY = window.innerHeight / GAME_H;
	const scale = Math.min(scaleX, scaleY); // fit inside screen
	container.style.width = GAME_W * scale + "px";
	container.style.height = GAME_H * scale + "px";
}

window.addEventListener("resize", resizeGame);
resizeGame(); // call once on load

// ─── GAME STATE ──────────────────────────────────────────────
// Possible values: 'intro' | 'title' | 'exploring' | 'digging'
//                  'envelope_rising' | 'envelope_open' | 'letter'
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
	if (gameState === "digging") {
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

	if (gameState === "exploring" || gameState === "digging") {
		drawMap();
		drawWings();
		drawPlayer();
		drawParticles();
		drawFog();
		drawMemories();
		drawHUD();
	}
}

function gameLoop(deltaTime) {
	update();
	draw();
	requestAnimationFrame(gameLoop);
}

// 0 = water  1 = grass  2 = tree  3 = flower  4 = path
const TILE_SIZE = 32;

const map = [
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Row 0: Deep Sea
	[0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 3, 3, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], // Row 1: North Shore
	[0, 0, 0, 1, 1, 1, 2, 2, 2, 1, 1, 3, 3, 3, 1, 2, 2, 1, 1, 1, 0, 0, 0, 0, 0], // Row 2: Wildflower Meadow
	[0, 0, 1, 1, 4, 4, 4, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 0, 0, 0, 0], // Row 3: Northern Grove
	[0, 1, 1, 4, 4, 1, 4, 4, 2, 1, 1, 1, 1, 1, 1, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0], // Row 4: Path Split
	[0, 1, 4, 4, 1, 1, 1, 4, 1, 1, 1, 4, 4, 4, 1, 1, 1, 1, 1, 3, 1, 1, 1, 0, 0], // Row 5: Central Crossroad
	[0, 1, 4, 1, 1, 3, 1, 4, 4, 4, 4, 4, 1, 4, 4, 1, 1, 1, 3, 3, 3, 1, 1, 0, 0], // Row 6: River Bend (Path Bridge)
	[0, 1, 4, 1, 3, 3, 1, 1, 1, 1, 1, 1, 0, 1, 4, 4, 1, 1, 1, 3, 1, 1, 1, 0, 0], // Row 7: River Headwaters
	[0, 1, 4, 4, 1, 1, 1, 2, 2, 1, 1, 0, 0, 1, 1, 4, 4, 1, 1, 1, 1, 1, 0, 0, 0], // Row 8: Whispering Woods West
	[0, 0, 1, 4, 4, 1, 2, 2, 2, 2, 1, 0, 1, 1, 1, 1, 4, 1, 2, 2, 1, 1, 0, 0, 0], // Row 9: The Core Gate
	[0, 0, 1, 1, 4, 1, 2, 2, 2, 2, 1, 0, 1, 1, 1, 1, 4, 2, 2, 2, 2, 1, 0, 0, 0], // Row 10: Hidden Clearing Access
	[0, 0, 0, 1, 4, 4, 1, 2, 2, 1, 1, 0, 1, 1, 1, 4, 4, 2, 3, 3, 2, 1, 0, 0, 0], // Row 11: Lake/Ocean Runoff
	[0, 0, 0, 1, 1, 4, 4, 1, 1, 1, 1, 0, 1, 1, 4, 4, 1, 2, 3, 3, 2, 1, 0, 0, 0], // Row 12: Secret Garden (East)
	[0, 0, 1, 1, 1, 1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1, 1, 2, 2, 2, 2, 1, 0, 0, 0], // Row 13: Southern Overpass
	[0, 1, 1, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 0, 0, 0], // Row 14: Coastline Trimming
	[0, 1, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0], // Row 15: Destination Peninsula
	[0, 1, 1, 3, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0], // Row 16: South Shore
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Row 17: Edge Water
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Row 18: Padding
];

const TILE_COLORS = {
	0: "#1a5c7a", // water
	1: "#4a7c3f", // grass
	2: "#2d5a1b", // tree (solid)
	3: "#6aaa50", // wildflowers
	4: "#8a7a5c", // dirt path
};

function drawMap() {
	for (let row = 0; row < map.length; row++) {
		for (let col = 0; col < map[row].length; col++) {
			const tile = map[row][col];
			ctx.fillStyle = TILE_COLORS[tile] || "#000";
			ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
		}
	}

	// Draw subtle destination marker
	ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
	ctx.beginPath();
	ctx.arc(destination.x, destination.y, 6, 0, Math.PI * 2);
	ctx.fill();
}

const player = {
	x: 96, // starting pixel X
	y: 64, // starting pixel Y
	width: 16,
	height: 16,
	speed: 2,
	color: "#ff69b4", // hot pink placeholder
	hasWings: false,
};

const keys = {};

window.addEventListener("keydown", (e) => {
	keys[e.key] = true;
	// Prevent arrow keys from scrolling the page
	if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
		e.preventDefault();
	}
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
	// Water (0) and trees (2) block movement
	// If player has wings, NOTHING is solid
	if (player.hasWings) return false;
	return tile === 0 || tile === 2;
}

function updatePlayer() {
	let dx = 0;
	let dy = 0;
	const spd = player.hasWings ? player.speed * 3 : player.speed;

	if (keys["ArrowUp"] || keys["w"] || keys["W"]) dy -= spd;
	if (keys["ArrowDown"] || keys["s"] || keys["S"]) dy += spd;
	if (keys["ArrowLeft"] || keys["a"] || keys["A"]) dx -= spd;
	if (keys["ArrowRight"] || keys["d"] || keys["D"]) dx += spd;
	// Add this inside updatePlayer(), after the keyboard dx/dy section:
	// This blends joystick input with keyboard input
	dx += joyX * spd;
	dy += joyY * spd;

	// Then the same collision checks below handle both inputs together.
	// Diagonal speed fix (prevents moving faster diagonally)
	if (dx !== 0 && dy !== 0) {
		dx *= 0.707;
		dy *= 0.707;
	}

	const nextX = player.x + dx;
	const nextY = player.y + dy;

	// Check 4 corners of player for X movement
	if (
		!isSolid(getTileAt(nextX, player.y)) &&
		!isSolid(getTileAt(nextX + player.width, player.y)) &&
		!isSolid(getTileAt(nextX, player.y + player.height)) &&
		!isSolid(getTileAt(nextX + player.width, player.y + player.height))
	) {
		player.x = nextX;
	}

	// Check 4 corners for Y movement
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

	// Glow when wings active
	if (player.hasWings) {
		ctx.shadowColor = "#ffd700";
		ctx.shadowBlur = 12;
		ctx.fillRect(player.x, player.y, player.width, player.height);
		ctx.shadowBlur = 0;
	}
}

function drawFog() {
	fogCtx.clearRect(0, 0, GAME_W, GAME_H);

	// Step 1: Fill everything with dark fog
	fogCtx.fillStyle = "rgba(0, 0, 0, 0.73)";
	fogCtx.fillRect(0, 0, GAME_W, GAME_H);

	// Step 2: Cut a transparent hole around the player
	const cx = player.x + player.width / 2;
	const cy = player.y + player.height / 2;
	const radius = player.hasWings ? 160 : 100;

	// ✅ CORRECTED color stops — transparent in middle, opaque at edge
	const gradient = fogCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
	gradient.addColorStop(0, "rgba(0, 0, 0, 1)"); // ← will be "erased" = clear
	gradient.addColorStop(0.7, "rgba(0, 0, 0, 0.8)");
	gradient.addColorStop(1, "rgba(0, 0, 0, 0)"); // ← stays = foggy

	// "destination-out" erases the fog where we paint
	fogCtx.globalCompositeOperation = "destination-out";
	fogCtx.fillStyle = gradient;
	fogCtx.beginPath();
	fogCtx.arc(cx, cy, radius, 0, Math.PI * 2);
	fogCtx.fill();

	fogCtx.globalCompositeOperation = "source-over"; // reset!
}

function getGameCoords() {
	return {
		x: Math.floor(player.x / TILE_SIZE),
		z: -Math.floor(player.y / TILE_SIZE), // flip Y → Z like Minecraft
	};
}

function drawHUD() {
	const coords = getGameCoords();

	// Use fogCtx instead of ctx so it draws ABOVE the fog
	// Background pill
	fogCtx.fillStyle = "rgba(0,0,0,0.7)"; // Slightly darker for contrast
	roundRect(fogCtx, GAME_W - 168, 10, 158, 44, 6);

	// Coordinate text
	fogCtx.font = '10px "Press Start 2P"';
	fogCtx.fillStyle = "#ffd700";
	fogCtx.fillText(`X: ${coords.x}`, GAME_W - 152, 29);
	fogCtx.fillText(`Z: ${coords.z}`, GAME_W - 152, 47);

	// Wings indicator
	if (player.hasWings) {
		fogCtx.fillStyle = "rgba(255,255,255,0.15)";
		roundRect(fogCtx, 10, 10, 80, 24, 4);
		fogCtx.font = '7px "Press Start 2P"';
		fogCtx.fillStyle = "#ffffff";
		fogCtx.fillText("🪽 FLYING", 16, 26);
	}

	// Also call your progress heart here if you want it visible!
	drawProgressHeart();
}

// Helper — rounded rectangle (needed in multiple places)
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

let introStep = 0;
const introLines = [
	// Edit these to match your prologue text from the storyline doc
	"There is a certain kind of lost\nthat has no map.",
	"Not lost in a place.\nLost in yourself.",
	"And then she walked back\ninto his life.",
	"She left a letter.\nAnd inside it — a map.",
	"X: 150,  Z: -300\n\nIf you ever loved me...\nfind me.",
	"[ tap or press any key\nto set sail ]",
];

function drawIntro() {
	ctx.fillStyle = "#050508";
	ctx.fillRect(0, 0, GAME_W, GAME_H);

	const lines = introLines[introStep].split("\n");
	ctx.textAlign = "center";

	// Calculate how long this specific line has been on screen
	const timeElapsed = Date.now() - lineStartTime;
	const fadeDuration = 1000; // 1 second fade-in time
	const alpha = Math.min(1, timeElapsed / fadeDuration); // Fades to 1 and STAYS at 1

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

// Advance intro on click OR any keypress
canvas.addEventListener("click", advanceIntro);
window.addEventListener("keydown", (e) => {
	if (gameState === "intro") advanceIntro();
});

let lineStartTime = Date.now(); // Put this at the top of your script with game states

function advanceIntro() {
	if (gameState !== "intro") return;
	introStep++;
	if (introStep >= introLines.length) {
		gameState = "title";
		introStep = 0;
	}
	lineStartTime = Date.now(); // 🔥 Reset the timer for the new line!
}

let titleTimer = 0;

function updateTitle() {
	titleTimer++;
	if (titleTimer > 200) {
		// ~3.3 seconds at 60fps
		gameState = "exploring";
		titleTimer = 0;
	}
}

function drawTitleCard() {
	ctx.fillStyle = "#050508";
	ctx.fillRect(0, 0, GAME_W, GAME_H);

	const pulse = 0.85 + Math.sin(Date.now() / 400) * 0.15;
	ctx.globalAlpha = pulse;

	ctx.textAlign = "center";
	ctx.font = '20px "Press Start 2P"';
	ctx.fillStyle = "#ffd700";
	ctx.fillText("YOU FOUND ME", GAME_W / 2, GAME_H / 2 - 10);

	ctx.font = "24px serif";
	ctx.fillStyle = "#ffffff";
	ctx.fillText("💌", GAME_W / 2, GAME_H / 2 + 30);

	ctx.globalAlpha = 1;
	ctx.textAlign = "left";
}

const wings = {
	x: 160, // near spawn — adjust to match your map
	y: 96,
	width: 16,
	height: 16,
	collected: false,
};

let notification = null;
let notifTimer = 0;

function showNotification(msg) {
	notification = msg;
	notifTimer = 180;
}

function updateWings() {
	if (wings.collected) return;
	const dx = player.x - wings.x;
	const dy = player.y - wings.y;
	if (Math.sqrt(dx * dx + dy * dy) < 20) {
		wings.collected = true;
		player.hasWings = true;
		showNotification("✨ Wings collected! You can fly!");
	}
}

function drawWings() {
	if (wings.collected) return;

	const bob = Math.sin(Date.now() / 300) * 3;

	// 1. Save the current canvas state
	ctx.save();

	// 2. Set the opacity (0.0 = completely invisible, 1.0 = fully solid)
	ctx.globalAlpha = 1; // 💡 Change this value to adjust the wing's transparency!

	// 3. Draw the wings
	ctx.font = "18px serif";
	ctx.fillText("🪽", wings.x, wings.y + bob);

	// 4. Restore the canvas state so other objects don't become transparent
	ctx.restore();
}

// Call this in your draw() to show the notification
function drawNotification() {
	if (!notification || notifTimer <= 0) return;
	notifTimer--;
	const alpha = Math.min(1, notifTimer / 30);
	ctx.globalAlpha = alpha;
	ctx.fillStyle = "rgba(0,0,0,0.75)";
	roundRect(ctx, GAME_W / 2 - 180, GAME_H - 70, 360, 40, 6);
	ctx.font = '8px "Press Start 2P"';
	ctx.fillStyle = "#ffd700";
	ctx.textAlign = "center";
	ctx.fillText(notification, GAME_W / 2, GAME_H - 45);
	ctx.textAlign = "left";
	ctx.globalAlpha = 1;
}

// Positions are in pixels — tune these to match your map layout
const memories = [
	{
		// Memory 1: Near the northern path fork, right where the journey begins
		x: 6 * TILE_SIZE + 16, // Column 6 (208px)
		y: 3 * TILE_SIZE + 16, // Row 3 (112px)
		text: [
			"This is where I used to sit",
			"and think about you.",
			"Every single day.",
		],
		collected: false,
	},
	{
		// Memory 2: Right at the central crossroad just before the river crossing
		x: 12 * TILE_SIZE + 16, // Column 12 (400px)
		y: 5 * TILE_SIZE + 16, // Row 5 (176px)
		text: [
			"I found this tree on my first day here.",
			"I carved something into it.",
			"I hoped you would find it.",
		],
		collected: false,
	},
	{
		// Memory 3: Hidden deep along the quiet western trail loop
		x: 3 * TILE_SIZE + 16, // Column 3 (112px)
		y: 11 * TILE_SIZE + 16, // Row 11 (368px)
		text: [
			"I used to call you at 2am",
			"just to hear your voice.",
			"I still do it sometimes.",
			"I just don't press call anymore.",
		],
		collected: false,
	},
	{
		// Memory 4: Placed on the main dirt highway right before the open run to the letter
		x: 14 * TILE_SIZE + 16, // Column 14 (464px)
		y: 13 * TILE_SIZE + 16, // Row 13 (432px)
		text: ["You're close now.", "I can feel it.", "I always could."],
		collected: false,
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
	// --- PART A: THE GLOWING DOTS (World Space) ---
	// Keep these on 'ctx' so they stay on the ground
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

	// --- PART B: THE TEXT BUBBLE (UI Space) ---
	if (!activeMemory || memoryTimer <= 0) return;

	const alpha = Math.min(1, memoryTimer / 40);
	const lines = activeMemory;
	const padX = 20;
	const padY = 12;
	const lineH = 18;
	const boxW = GAME_W - 40;
	const boxH = lines.length * lineH + padY * 2;
	const boxY = GAME_H - boxH - 50;

	// Use fogCtx here to draw ABOVE the fog!
	fogCtx.globalAlpha = alpha;
	fogCtx.fillStyle = "rgba(10,8,5,0.95)"; // Slightly darker for legibility
	fogCtx.strokeStyle = "#ffd700";
	fogCtx.lineWidth = 2;

	// Use the fogCtx for the rectangle and text
	roundRect(fogCtx, padX, boxY, boxW, boxH, 8);
	fogCtx.stroke();

	fogCtx.font = '8px "Press Start 2P"';
	fogCtx.fillStyle = "#fff8dc";
	lines.forEach((line, i) => {
		fogCtx.fillText(line, padX + 14, boxY + padY + 12 + i * lineH);
	});

	fogCtx.globalAlpha = 1;
}

// Target in pixel coordinates — tune to match your map
const destination = {
	x: 20 * TILE_SIZE + 16, // Column 20 (656px)
	y: 15 * TILE_SIZE + 16, // Row 15 (496px)
};

function checkDestination() {
	if (gameState !== "exploring") return;
	const dx = player.x - destination.x;
	const dy = player.y - destination.y;
	if (Math.sqrt(dx * dx + dy * dy) < 20) {
		gameState = "digging";
		startRevealSequence();
	}
}

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
		p.vy += 0.12; // gravity
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

function startRevealSequence() {
	// Spawn digging particles in bursts
	const burstInterval = setInterval(() => {
		spawnParticles(destination.x, destination.y, 15);
	}, 300);

	setTimeout(() => {
		clearInterval(burstInterval);
		gameState = "envelope_rising";
		showEnvelope();
	}, 2500);
}

function showEnvelope() {
	const overlay = document.getElementById("ui-overlay");
	overlay.style.pointerEvents = "all";
	overlay.innerHTML = `
    <div id="envelope-container">
      <div id="envelope">
        <div id="envelope-heart">💛</div>
      </div>
      <p id="envelope-hint">tap to open</p>
    </div>
  `;

	document
		.getElementById("envelope-container")
		.addEventListener("click", () => {
			gameState = "envelope_open";
			showLetter();
		});
}

// ── Edit the letter here ───────────────────────────────────────
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
	overlay.innerHTML = `
    <div id="letter-container">
      <div id="parchment">
        <p id="letter-text"></p>
        
        <div id="reply-area" style="display: none; margin-top: 25px; border-top: 1px dashed #8a7a5c; padding-top: 15px;">
          
          <div style="margin-bottom: 10px;">
            <label style="font-family: 'Press Start 2P'; font-size: 7px; color: #8a7a5c; display: block; margin-bottom: 4px;">Your Name:</label>
            <input type="text" id="reply-name" placeholder="Name..." style="
              width: 100%; 
              background: rgba(255, 248, 220, 0.6); 
              border: 1px solid #8a7a5c; 
              border-radius: 4px;
              font-family: 'Press Start 2P', monospace; 
              font-size: 8px; 
              padding: 6px; 
              box-sizing: border-box;
              color: #2d1e10;
            " />
          </div>

          <div>
            <label style="font-family: 'Press Start 2P'; font-size: 7px; color: #8a7a5c; display: block; margin-bottom: 4px;">Your Reply:</label>
            <textarea id="reply-input" placeholder="Type your reply here..." style="
              width: 100%; 
              height: 70px; 
              background: rgba(255, 248, 220, 0.6); 
              border: 1px solid #8a7a5c; 
              border-radius: 4px;
              font-family: 'Press Start 2P', monospace; 
              font-size: 8px; 
              padding: 8px; 
              box-sizing: border-box;
              resize: none;
              color: #2d1e10;
            "></textarea>
          </div>

          <p id="reply-status" style="font-family: 'Press Start 2P'; font-size: 7px; color: #6aaa50; margin-top: 5px; display:none;"></p>
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
			// Auto-scroll parchment as text appears
			const parchment = document.getElementById("parchment");
			parchment.scrollTop = parchment.scrollHeight;
			i++;
		} else {
			clearInterval(interval);
			document.getElementById("letter-buttons").style.opacity = "1";
			spawnConfetti();
		}
	}, 38);
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

		// Auto-scroll parchment down to show the new inputs
		const parchment = document.getElementById("parchment");
		parchment.scrollTop = parchment.scrollHeight;
		nameInput.focus();
	} else {
		const nameValue = nameInput.value.trim();
		const msgValue = messageInput.value.trim();

		// If they click send, make sure fields aren't blank
		if (nameValue !== "" || msgValue !== "") {
			if (nameValue === "") {
				statusText.style.display = "block";
				statusText.style.color = "#ff4444";
				statusText.textContent = "Please enter your name!";
				nameInput.focus();
				return;
			}
			if (msgValue === "") {
				statusText.style.display = "block";
				statusText.style.color = "#ff4444";
				statusText.textContent = "Please type a message!";
				messageInput.focus();
				return;
			}

			// If both pass validation, fire the webhook
			sendReplyToDiscord(nameValue, msgValue);
		} else {
			// Close cleanly if clicked while completely empty
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
	statusText.textContent = "Sending via carrier pigeon...";
	replyBtn.disabled = true;

	// ⚠️ PASTE YOUR ACTUAL DISCORD WEBHOOK URL BETWEEN THE QUOTES BELOW:
	const discordWebhookUrl = "YOUR_DISCORD_WEBHOOK_URL_HERE";

	// Premium Discord Embed Layout Structure
	const payload = {
		username: "Island Mailbox",
		avatar_url: "https://i.imgur.com/K81pX5m.png", // Custom letter icon for the bot profile picture
		embeds: [
			{
				title: "✨ Message Discovered on the Island ✨",
				color: 16767008, // Hex #ffd700 (Gold accent line)
				thumbnail: {
					url: "https://i.imgur.com/K81pX5m.png", // Pixel-art letter icon inside the card
				},
				fields: [
					{
						name: "👤 Explorer",
						value: `\`\`\`yaml\n${authorName}\n\`\`\``,
						inline: true,
					},
					{
						name: "📍 Current Status",
						value: `\`\`\`fix\nFound & Replied\n\`\`\``,
						inline: true,
					},
					{
						name: "📝 Written Response",
						value: `> ${replyMessage.split("\n").join("\n> ")}`, // Blockquote styling for her actual words
						inline: false,
					},
					{
						name: "📅 Delivered At",
						value: `<t:${Math.floor(Date.now() / 1000)}:F> (<t:${Math.floor(Date.now() / 1000)}:R>)`, // Live dynamic Discord timestamp
						inline: false,
					},
				],
				footer: {
					text: "You Found Me • Game Delivery Engine",
					icon_url: "https://i.imgur.com/K81pX5m.png",
				},
			},
		],
	};

	fetch(discordWebhookUrl, {
		method: "POST",
		mode: "cors",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	})
		.then((response) => {
			if (response.ok || response.status === 204 || response.status === 200) {
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
				throw new Error("Response not OK");
			}
		})
		.catch((error) => {
			statusText.style.color = "#ff4444";
			statusText.textContent = "Network error. Try again!";
			replyBtn.disabled = false;
			console.error("Webhook Error:", error);
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
}

function spawnConfetti() {
	// Simple CSS confetti — add to overlay
	const overlay = document.getElementById("ui-overlay");
	const confetti = document.createElement("div");
	confetti.id = "confetti";
	confetti.innerHTML = Array.from(
		{ length: 40 },
		() =>
			`<span style="
      position:absolute;
      left:${Math.random() * 100}%;
      top:-10px;
      font-size:${14 + Math.random() * 16}px;
      animation:fall ${1.5 + Math.random() * 2}s ease-in forwards;
      animation-delay:${Math.random()}s;
    ">${["💛", "✨", "🌸", "⭐", "💫"][Math.floor(Math.random() * 5)]}</span>`,
	).join("");
	overlay.appendChild(confetti);
}

const audio = {
	explore: new Audio("assets/audio/music-explore.mp3"),
	reveal: new Audio("assets/audio/music-reveal.mp3"),
	sealCrack: new Audio("assets/audio/sfx-seal-crack.mp3"),
	click: new Audio("assets/audio/sfx-click.mp3"),
};

audio.explore.loop = true;
audio.explore.volume = 0.4;
audio.reveal.loop = true;
audio.reveal.volume = 0.5;

let musicStarted = false;

function startMusic() {
	if (musicStarted) return;
	musicStarted = true;
	audio.explore.play().catch(() => {}); // catch needed — browser may still block
}

// Trigger music on first interaction
canvas.addEventListener("click", startMusic, { once: true });
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

// Call switchToRevealMusic() when the envelope appears

let joyX = 0;
let joyY = 0;
let joystickInstance = null;

function initJoystick() {
	// Only create joystick on touch devices
	if (!("ontouchstart" in window)) return;

	joystickInstance = nipplejs.create({
		zone: document.getElementById("ui-overlay"),
		mode: "static",
		position: { left: "70px", bottom: "70px" },
		color: "rgba(255,215,0,0.5)",
		size: 80,
	});

	joystickInstance.on("move", (evt, data) => {
		joyX = data.vector.x;
		joyY = data.vector.y;
	});

	joystickInstance.on("end", () => {
		joyX = 0;
		joyY = 0;
	});
}

// Call initJoystick() after the game starts exploring:
// In advanceIntro(), at the point where gameState becomes "exploring"

// Then in updatePlayer(), after the keyboard section, add:
// player.x += joyX * spd;  (with collision check)
// player.y += joyY * spd;  (with collision check)

function drawProgressHeart() {
	const dx = player.x - destination.x;
	const dy = player.y - destination.y;
	const dist = Math.sqrt(dx * dx + dy * dy);
	const maxD = 450;
	const pct = 1 - Math.min(dist / maxD, 1);

	fogCtx.font = "18px serif";
	fogCtx.globalAlpha = 0.3;
	fogCtx.fillText("🤍", 10, 50);

	fogCtx.globalAlpha = pct;
	fogCtx.fillText("❤️", 10, 50);
	fogCtx.globalAlpha = 1;
}

function saveProgress() {
	try {
		localStorage.setItem(
			"yfm-save",
			JSON.stringify({
				px: player.x,
				py: player.y,
				hasWings: player.hasWings,
				memories: memories.map((m) => m.collected),
				wingsCollected: wings.collected,
			}),
		);
	} catch (e) {
		/* storage unavailable in some browsers */
	}
}

function loadProgress() {
	try {
		const raw = localStorage.getItem("yfm-save");
		if (!raw) return;
		const d = JSON.parse(raw);
		player.x = d.px;
		player.y = d.py;
		player.hasWings = d.hasWings;
		wings.collected = d.wingsCollected;
		d.memories.forEach((c, i) => {
			memories[i].collected = c;
		});
	} catch (e) {}
}

// Call saveProgress() every 5 seconds:
setInterval(saveProgress, 5000);

function takeScreenshot() {
	const link = document.createElement("a");
	link.download = "you-found-me.png";
	link.href = canvas.toDataURL("image/png");
	link.click();
}

gameLoop();
