# 💌 YOU FOUND ME — Complete Beginner's Build Guide

> A full walkthrough to build a romantic pixel-art island exploration game from scratch.
> Estimated total time: **4–8 weeks** (1–2 hours/day)

---

## 📦 What You'll Need Before You Start

### Tools (all free)

| Tool                                | Purpose                              | Link                         |
| ----------------------------------- | ------------------------------------ | ---------------------------- |
| **VS Code**                         | Code editor                          | code.visualstudio.com        |
| **Chrome / Firefox**                | Testing your game                    | (already installed)          |
| **Live Server** (VS Code extension) | Auto-refreshes browser on save       | Search in VS Code Extensions |
| **Git** (optional)                  | Save your progress / version control | git-scm.com                  |

### VS Code Extensions to Install

- **Live Server** — right-click index.html → "Open with Live Server"
- **Prettier** — auto-formats your code
- **Todo Tree** — tracks your `- [ ]` checkboxes

### Assets (all free)

| Asset                                 | Where to Get                                   |
| ------------------------------------- | ---------------------------------------------- |
| Pixel art tiles (grass, trees, water) | opengameart.org                                |
| Chiptune / lo-fi music                | opengameart.org or itch.io (free assets)       |
| Sound effects (seal crack, click)     | freesound.org                                  |
| Pixel fonts                           | fonts.google.com → search "Press Start 2P"     |
| Elegant fonts                         | fonts.google.com → search "Cormorant Garamond" |

---

## 🗂️ Project File Structure

```
you-found-me/
│
├── index.html          ← the one HTML file
├── style.css           ← minimal styles
├── game.js             ← main game logic (your biggest file)
│
├── assets/
│   ├── audio/
│   │   ├── music-explore.mp3
│   │   ├── music-reveal.mp3
│   │   ├── sfx-seal-crack.mp3
│   │   └── sfx-click.mp3
│   │
│   ├── sprites/
│   │   ├── player.png          ← character sprite sheet
│   │   ├── wings.png           ← power-up item
│   │   └── envelope.png        ← golden envelope
│   │
│   └── tiles/
│       ├── grass.png
│       ├── water.png
│       └── tree.png
│
└── README.md
```

---

## ⏱️ Time Estimates Per Phase

| Phase     | What You Build                                    | Est. Time     |
| --------- | ------------------------------------------------- | ------------- |
| 0         | Setup + HTML skeleton                             | 1–2 hours     |
| 1         | Tile map + moving character                       | 3–5 days      |
| 2         | Fog of war + HUD                                  | 2–3 days      |
| 3         | Storyline elements (boat intro, fragments, wings) | 4–6 days      |
| 4         | The reveal sequence                               | 4–6 days      |
| 5         | Audio                                             | 1–2 days      |
| 6         | Mobile controls                                   | 2–3 days      |
| 7         | Polish + testing                                  | 3–5 days      |
| **Total** |                                                   | **4–8 weeks** |

---

---

# 🟢 PHASE 0 — Project Setup

### ⏱️ Est. Time: 1–2 hours

---

### Step 1 — Create your project folder

Make a folder on your desktop called `you-found-me`.
Inside it, create these three files:

- `index.html`
- `style.css`
- `game.js`

---

### Step 2 — Write your base HTML

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>You Found Me 💌</title>
		<link rel="stylesheet" href="style.css" />

		<!-- Pixel font -->
		<link
			href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
			rel="stylesheet"
		/>
		<!-- Elegant font for the letter -->
		<link
			href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&display=swap"
			rel="stylesheet"
		/>
	</head>
	<body>
		<canvas id="gameCanvas"></canvas>
		<div id="ui-overlay"></div>
		<!-- for letter, envelope, text bubbles -->
		<script src="game.js"></script>
	</body>
</html>
```

---

### Step 3 — Base CSS

```css
/* style.css */
* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

body {
	background: #000;
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100vh;
	overflow: hidden;
}

#gameCanvas {
	display: block;
	image-rendering: pixelated; /* keeps pixel art crisp */
}

#ui-overlay {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	pointer-events: none; /* doesn't block canvas clicks by default */
}
```

---

### Step 4 — Start your game.js skeleton

```js
// game.js

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

// --- GAME STATE ---
// This variable controls which "scene" is active
// Possible values: 'intro', 'exploring', 'reveal', 'letter'
let gameState = "intro";

// --- GAME LOOP ---
function update() {
	if (gameState === "exploring") {
		updatePlayer();
	}
}

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if (gameState === "exploring") {
		drawMap();
		drawPlayer();
	}
}

function gameLoop() {
	update();
	draw();
	requestAnimationFrame(gameLoop);
}

gameLoop(); // start!
```

> ✅ Open with Live Server. You should see a black screen. That means it's working.

---

---

# 🟢 PHASE 1 — Tile Map + Moving Character

### ⏱️ Est. Time: 3–5 days

---

### Concept: How a Tile Map Works

Your island is a grid. Each cell is a "tile."
Each tile has a number that means something:

```
0 = water
1 = grass
2 = tree (solid, can't walk through)
```

You draw the tile based on its number. That's it.

---

### Step 5 — Define your map

```js
// game.js

const TILE_SIZE = 32; // each tile is 32x32 pixels

// 0 = water, 1 = grass, 2 = tree
const map = [
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
	[0, 1, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 0, 0, 0],
	[0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
	[0, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
	[0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
	[0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
	[0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

// Colors for each tile type
const TILE_COLORS = {
	0: "#1a6b8a", // water — deep blue
	1: "#4a7c3f", // grass — pixel green
	2: "#2d5a1b", // tree — dark green
};
```

---

### Step 6 — Draw the tile map

```js
function drawMap() {
	for (let row = 0; row < map.length; row++) {
		for (let col = 0; col < map[row].length; col++) {
			const tile = map[row][col];
			ctx.fillStyle = TILE_COLORS[tile];
			ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);

			// Optional: draw a subtle grid line
			ctx.strokeStyle = "rgba(0,0,0,0.1)";
			ctx.strokeRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
		}
	}
}
```

---

### Step 7 — Create the player

```js
const player = {
	x: 64, // starting X position (in pixels)
	y: 64, // starting Y position (in pixels)
	width: 16,
	height: 16,
	speed: 2,
	color: "#ff69b4", // hot pink placeholder until you have a sprite
	hasWings: false,
};
```

---

### Step 8 — Keyboard input

```js
const keys = {};

window.addEventListener("keydown", (e) => {
	keys[e.key] = true;
});

window.addEventListener("keyup", (e) => {
	keys[e.key] = false;
});
```

---

### Step 9 — Move the player + collision

```js
function getTileAt(px, py) {
	const col = Math.floor(px / TILE_SIZE);
	const row = Math.floor(py / TILE_SIZE);
	if (row < 0 || row >= map.length || col < 0 || col >= map[0].length) return 0;
	return map[row][col];
}

function isSolid(tile) {
	return tile === 0 || tile === 2; // water and trees are solid
}

function updatePlayer() {
	let dx = 0;
	let dy = 0;
	const spd = player.hasWings ? player.speed * 4 : player.speed;

	if (keys["ArrowUp"] || keys["w"]) dy -= spd;
	if (keys["ArrowDown"] || keys["s"]) dy += spd;
	if (keys["ArrowLeft"] || keys["a"]) dx -= spd;
	if (keys["ArrowRight"] || keys["d"]) dx += spd;

	// Check X movement
	const nextX = player.x + dx;
	if (
		!isSolid(getTileAt(nextX, player.y)) &&
		!isSolid(getTileAt(nextX + player.width, player.y)) &&
		!isSolid(getTileAt(nextX, player.y + player.height)) &&
		!isSolid(getTileAt(nextX + player.width, player.y + player.height))
	) {
		player.x = nextX;
	}

	// Check Y movement
	const nextY = player.y + dy;
	if (
		!isSolid(getTileAt(player.x, nextY)) &&
		!isSolid(getTileAt(player.x + player.width, nextY)) &&
		!isSolid(getTileAt(player.x, nextY + player.height)) &&
		!isSolid(getTileAt(player.x + player.width, nextY + player.height))
	) {
		player.y = nextY;
	}
}
```

---

### Step 10 — Draw the player

```js
function drawPlayer() {
	ctx.fillStyle = player.color;
	ctx.fillRect(player.x, player.y, player.width, player.height);
}
```

---

### Step 11 — Hook it all together

```js
function update() {
	if (gameState === "exploring") {
		updatePlayer();
	}
}

function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if (gameState === "exploring") {
		drawMap();
		drawPlayer();
	}
}
```

> ✅ You should now have a colored square moving around a tile map, blocked by trees and water.

---

---

# 🟡 PHASE 2 — Fog of War + Coordinate HUD

### ⏱️ Est. Time: 2–3 days

---

### Concept: How Fog of War Works

You draw the game normally, then place a dark overlay on top.
You "cut a hole" in that overlay around the player using a radial gradient.
The gradient goes from transparent (visible) at the center to black (foggy) at the edges.

This requires a **second canvas** drawn on top.

---

### Step 12 — Add a fog canvas in HTML

```html
<!-- index.html — add after gameCanvas -->
<canvas id="fogCanvas"></canvas>
```

```css
/* style.css */
#fogCanvas {
	position: absolute;
	top: 0;
	left: 0;
	pointer-events: none;
}
```

---

### Step 13 — Draw the fog

```js
// game.js
const fogCanvas = document.getElementById("fogCanvas");
const fogCtx = fogCanvas.getContext("2d");

fogCanvas.width = canvas.width;
fogCanvas.height = canvas.height;

function drawFog() {
	fogCtx.clearRect(0, 0, fogCanvas.width, fogCanvas.height);

	// Fill entire fog canvas with dark overlay
	fogCtx.fillStyle = "rgba(0, 0, 0, 0.85)";
	fogCtx.fillRect(0, 0, fogCanvas.width, fogCanvas.height);

	// Cut a "visible" circle around the player
	const centerX = player.x + player.width / 2;
	const centerY = player.y + player.height / 2;
	const radius = 100; // how far she can "see"

	const gradient = fogCtx.createRadialGradient(
		centerX,
		centerY,
		0,
		centerX,
		centerY,
		radius,
	);
	gradient.addColorStop(0, "rgba(0,0,0,1)"); // fully transparent (reveals game)
	gradient.addColorStop(1, "rgba(0,0,0,0)"); // fully opaque (foggy)

	fogCtx.globalCompositeOperation = "destination-out";
	fogCtx.fillStyle = gradient;
	fogCtx.beginPath();
	fogCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
	fogCtx.fill();

	fogCtx.globalCompositeOperation = "source-over"; // reset
}
```

> Call `drawFog()` at the end of your `draw()` function.

---

### Step 14 — Draw the coordinate HUD

```js
// Convert pixel position to "game coordinates" (like Minecraft)
function getGameCoords() {
	return {
		x: Math.floor(player.x / TILE_SIZE),
		z: Math.floor(player.y / TILE_SIZE) * -1, // flip Y to make it Z
	};
}

function drawHUD() {
	const coords = getGameCoords();
	ctx.font = '10px "Press Start 2P"';
	ctx.fillStyle = "rgba(0,0,0,0.5)";
	ctx.fillRect(canvas.width - 160, 10, 150, 36);
	ctx.fillStyle = "#ffffff";
	ctx.fillText(`X: ${coords.x}`, canvas.width - 148, 26);
	ctx.fillText(`Z: ${coords.z}`, canvas.width - 148, 40);
}
```

> Call `drawHUD()` inside your `draw()` function, after everything else so it appears on top.

---

---

# 🟡 PHASE 3 — Storyline Elements

### ⏱️ Est. Time: 4–6 days

---

## 3A — Boat Intro Cutscene

### Concept

The intro is just a sequence of timed text slides before the game starts.
Use a simple counter that advances when the player taps/clicks.

```js
let introStep = 0;
const introLines = [
	"She left without a word.\nThree months ago.",
	"You never stopped looking.",
	"And then — the letter arrived.",
	"[ tap to set sail ]",
];

function drawIntro() {
	ctx.fillStyle = "#0a0a1a";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = "#ffffff";
	ctx.font = '12px "Press Start 2P"';
	ctx.textAlign = "center";

	const lines = introLines[introStep].split("\n");
	lines.forEach((line, i) => {
		ctx.fillText(line, canvas.width / 2, canvas.height / 2 + i * 28);
	});

	ctx.textAlign = "left"; // reset
}

canvas.addEventListener("click", () => {
	if (gameState === "intro") {
		introStep++;
		if (introStep >= introLines.length) {
			gameState = "title"; // show title card next
		}
	}
});
```

---

## 3B — Title Card

```js
let titleTimer = 0;

function drawTitleCard() {
	ctx.fillStyle = "#0a0a1a";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillStyle = "#ffd700";
	ctx.font = '18px "Press Start 2P"';
	ctx.textAlign = "center";
	ctx.fillText("YOU FOUND ME", canvas.width / 2, canvas.height / 2 - 10);

	ctx.fillStyle = "#ffffff";
	ctx.font = '8px "Press Start 2P"';
	ctx.fillText("💌", canvas.width / 2, canvas.height / 2 + 20);

	titleTimer++;
	if (titleTimer > 180) {
		// ~3 seconds at 60fps
		gameState = "exploring";
		titleTimer = 0;
	}
	ctx.textAlign = "left";
}
```

---

## 3C — Wings Power-Up

```js
const wings = {
	x: 80, // near spawn
	y: 96,
	width: 16,
	height: 16,
	collected: false,
	bobOffset: 0,
};

function updateWings() {
	if (wings.collected) return;
	wings.bobOffset = Math.sin(Date.now() / 300) * 3; // floating animation

	// Check if player touches it
	const dx = player.x + player.width / 2 - (wings.x + wings.width / 2);
	const dy = player.y + player.height / 2 - (wings.y + wings.height / 2);
	const dist = Math.sqrt(dx * dx + dy * dy);

	if (dist < 20) {
		wings.collected = true;
		player.hasWings = true;
		player.speed = 6;
		showNotification("You found the Wings! ✨ Speed boosted!");
	}
}

function drawWings() {
	if (wings.collected) return;
	ctx.fillStyle = "#ffffff";
	ctx.font = "16px sans-serif";
	ctx.fillText("🪽", wings.x, wings.y + wings.bobOffset);
}
```

---

## 3D — Memory Fragments

```js
const memories = [
	{
		x: 96,
		y: 128,
		text: "This is where I used to sit and\nthink about you. Every single day.",
		collected: false,
	},
	{
		x: 200,
		y: 160,
		text: "I found this tree on my first day here.\nI carved something into it.\nI thought you'd never see it.\nI hoped you would.",
		collected: false,
	},
	{
		x: 320,
		y: 192,
		text: "I used to call you at 2am\njust to hear your voice.\nI still do it sometimes.\nI just don't press call anymore.",
		collected: false,
	},
	{
		x: 420,
		y: 240,
		text: "You're close now.\nI can feel it.\nI always could.",
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
		const dist = Math.sqrt(dx * dx + dy * dy);
		if (dist < 24) {
			mem.collected = true;
			activeMemory = mem.text;
			memoryTimer = 240; // show for 4 seconds
		}
	});

	if (memoryTimer > 0) memoryTimer--;
	else activeMemory = null;
}

function drawMemories() {
	// Draw uncollected fragments as glowing dots
	memories.forEach((mem) => {
		if (mem.collected) return;
		ctx.fillStyle = "#ffd700";
		ctx.beginPath();
		ctx.arc(mem.x, mem.y, 5 + Math.sin(Date.now() / 300) * 2, 0, Math.PI * 2);
		ctx.fill();
	});

	// Draw active memory bubble
	if (activeMemory && memoryTimer > 0) {
		const lines = activeMemory.split("\n");
		const bubbleX = 20;
		const bubbleY = canvas.height - lines.length * 18 - 40;
		const bubbleW = canvas.width - 40;
		const bubbleH = lines.length * 18 + 20;

		ctx.fillStyle = "rgba(0,0,0,0.8)";
		ctx.strokeStyle = "#ffd700";
		ctx.lineWidth = 2;
		roundRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 8);

		ctx.fillStyle = "#fff8dc";
		ctx.font = '8px "Press Start 2P"';
		lines.forEach((line, i) => {
			ctx.fillText(line, bubbleX + 12, bubbleY + 18 + i * 18);
		});
	}
}

// Helper: draw a rounded rectangle
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
	ctx.stroke();
}
```

---

## 3E — Destination Detection

```js
const destination = { x: 450, y: 280 }; // adjust to match your map

function checkDestination() {
	const dx = player.x - destination.x;
	const dy = player.y - destination.y;
	const dist = Math.sqrt(dx * dx + dy * dy);

	if (dist < 20 && gameState === "exploring") {
		gameState = "digging";
		startRevealSequence();
	}
}
```

---

---

# 🟡 PHASE 4 — The Reveal Sequence

### ⏱️ Est. Time: 4–6 days

---

### Concept: State Machine for the Reveal

The reveal is a chain of states. Each one plays an animation, then moves to the next.

```
'exploring' → 'digging' → 'envelope_rising' → 'envelope_open' → 'letter'
```

---

### Step — Particle Effects (Digging)

```js
let particles = [];

function spawnParticles(x, y) {
	for (let i = 0; i < 30; i++) {
		particles.push({
			x,
			y,
			vx: (Math.random() - 0.5) * 4,
			vy: (Math.random() - 2) * 3,
			life: 60,
			color: `hsl(${30 + Math.random() * 20}, 70%, 50%)`,
			size: 2 + Math.random() * 4,
		});
	}
}

function updateParticles() {
	particles.forEach((p) => {
		p.x += p.vx;
		p.y += p.vy;
		p.vy += 0.1; // gravity
		p.life--;
	});
	particles = particles.filter((p) => p.life > 0);
}

function drawParticles() {
	particles.forEach((p) => {
		ctx.globalAlpha = p.life / 60;
		ctx.fillStyle = p.color;
		ctx.fillRect(p.x, p.y, p.size, p.size);
	});
	ctx.globalAlpha = 1;
}
```

---

### Step — The Envelope & Letter (HTML Overlay)

For the envelope and letter, switch from canvas to HTML/CSS.
This is much easier for animations and text.

```js
// Add to game.js
function startRevealSequence() {
	// 1. Play digging animation for 2 seconds
	spawnParticles(destination.x, destination.y);

	setTimeout(() => {
		gameState = "envelope_rising";
		showEnvelope();
	}, 2000);
}

function showEnvelope() {
	const overlay = document.getElementById("ui-overlay");
	overlay.innerHTML = `
    <div id="envelope-container">
      <div id="envelope">
        <div id="seal">💛</div>
        <div id="envelope-flap"></div>
      </div>
    </div>
  `;
	overlay.style.pointerEvents = "all";

	// After 2 seconds, crack the seal
	setTimeout(() => {
		document.getElementById("seal").style.transform = "scale(1.3)";
		document.getElementById("seal").style.opacity = "0";
		setTimeout(showLetter, 1000);
	}, 2000);
}

function showLetter() {
	const overlay = document.getElementById("ui-overlay");
	overlay.innerHTML = `
    <div id="letter-container">
      <div id="parchment">
        <p id="letter-text"></p>
      </div>
      <div id="letter-buttons">
        <button onclick="replayLetter()">💌 Read Again</button>
        <button onclick="backToIsland()">🏝️ Back to Island</button>
      </div>
    </div>
  `;
	typewriterEffect(letterContent);
}
```

---

### Step — Typewriter Effect

```js
const letterContent = `To Hyacinth,

If you're reading this — you found me.
And honestly? I knew you would.

I came here because I needed to know
if what we had was real enough
to make you cross an ocean for.

It was. You are.

Thank you for the late-night calls.
For staying. For showing up — then, and now.

One month doesn't sound like much.
But with you, it felt like finding home.

Daghang salamat, my love.
For an amazing month.
For being my person.
For finding me.

          Always yours,
               — [Your Name] 💛`;

function typewriterEffect(text) {
	const el = document.getElementById("letter-text");
	let i = 0;
	const interval = setInterval(() => {
		if (i < text.length) {
			el.textContent += text[i];
			i++;
		} else {
			clearInterval(interval);
			// Show buttons and confetti after letter finishes
			document.getElementById("letter-buttons").style.opacity = "1";
			spawnConfetti();
		}
	}, 30); // 30ms per character
}
```

---

### Step — CSS for the Letter Overlay

```css
/* style.css — add these */

#envelope-container {
	position: fixed;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(0, 0, 0, 0.85);
	animation: fadeIn 0.5s ease;
}

#envelope {
	width: 200px;
	height: 140px;
	background: #f5e6c8;
	border: 3px solid #c8a000;
	border-radius: 4px;
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	animation: riseUp 1s ease forwards;
	font-size: 32px;
}

@keyframes riseUp {
	from {
		transform: translateY(100px) scale(0.5);
		opacity: 0;
	}
	to {
		transform: translateY(0) scale(1);
		opacity: 1;
	}
}

#letter-container {
	position: fixed;
	inset: 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: rgba(10, 10, 20, 0.95);
	animation: fadeIn 1s ease;
}

#parchment {
	background: #fdf6e3;
	border: 2px solid #c8a000;
	border-radius: 8px;
	padding: 40px;
	max-width: 500px;
	max-height: 70vh;
	overflow-y: auto;
	box-shadow: 0 0 40px rgba(200, 160, 0, 0.3);
}

#letter-text {
	font-family: "Cormorant Garamond", serif;
	font-size: 18px;
	line-height: 1.8;
	color: #3a2a1a;
	white-space: pre-wrap;
}

#letter-buttons {
	margin-top: 24px;
	display: flex;
	gap: 16px;
	opacity: 0;
	transition: opacity 1s ease;
}

#letter-buttons button {
	font-family: "Press Start 2P", monospace;
	font-size: 10px;
	padding: 12px 20px;
	background: #1a1a2e;
	color: #ffd700;
	border: 2px solid #ffd700;
	cursor: pointer;
	transition: background 0.2s;
}

#letter-buttons button:hover {
	background: #ffd700;
	color: #1a1a2e;
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}
```

---

---

# 🟢 PHASE 5 — Audio

### ⏱️ Est. Time: 1–2 days

---

### Step — Add Audio

```js
// game.js
const audio = {
	explore: new Audio("assets/audio/music-explore.mp3"),
	reveal: new Audio("assets/audio/music-reveal.mp3"),
	sealCrack: new Audio("assets/audio/sfx-seal-crack.mp3"),
	click: new Audio("assets/audio/sfx-click.mp3"),
};

audio.explore.loop = true;
audio.explore.volume = 0.4;

function startMusic() {
	audio.explore.play();
}

let isMuted = false;
function toggleMute() {
	isMuted = !isMuted;
	Object.values(audio).forEach((a) => (a.muted = isMuted));
}
```

> 💡 Browsers block audio until the user interacts with the page.
> Start music on the first click/tap (e.g., when they click past the intro).

---

---

# 🔴 PHASE 6 — Mobile Controls

### ⏱️ Est. Time: 2–3 days

---

### Option A — Use nipplejs (recommended for beginners)

```html
<!-- index.html — add in <head> -->
<script src="https://cdn.jsdelivr.net/npm/nipplejs@0.10.1/dist/nipplejs.min.js"></script>
```

```js
// game.js
const joystick = nipplejs.create({
	zone: document.getElementById("ui-overlay"),
	mode: "static",
	position: { left: "60px", bottom: "60px" },
	color: "rgba(255,255,255,0.5)",
});

let joyX = 0;
let joyY = 0;

joystick.on("move", (evt, data) => {
	joyX = data.vector.x;
	joyY = data.vector.y;
});

joystick.on("end", () => {
	joyX = 0;
	joyY = 0;
});

// Then in updatePlayer(), also check joyX and joyY:
// player.x += joyX * spd;
// player.y += joyY * spd;
```

---

---

# 🔴 PHASE 7 — Polish

### ⏱️ Est. Time: 3–5 days

---

### Features to add in polish phase:

**Progress Heart**

```js
function drawProgressHeart() {
	const dx = player.x - destination.x;
	const dy = player.y - destination.y;
	const dist = Math.sqrt(dx * dx + dy * dy);
	const maxDist = 500;
	const progress = 1 - Math.min(dist / maxDist, 1);

	ctx.font = "16px sans-serif";
	ctx.fillText("🤍", 20, 30);

	// Overlay filled heart based on progress
	ctx.globalAlpha = progress;
	ctx.fillText("❤️", 20, 30);
	ctx.globalAlpha = 1;
}
```

**localStorage Save**

```js
function saveProgress() {
	localStorage.setItem(
		"yfm-player",
		JSON.stringify({
			x: player.x,
			y: player.y,
			hasWings: player.hasWings,
			memories: memories.map((m) => m.collected),
		}),
	);
}

function loadProgress() {
	const saved = localStorage.getItem("yfm-player");
	if (!saved) return;
	const data = JSON.parse(saved);
	player.x = data.x;
	player.y = data.y;
	player.hasWings = data.hasWings;
	data.memories.forEach((collected, i) => (memories[i].collected = collected));
}
```

**Screenshot Button**

```js
function takeScreenshot() {
	const link = document.createElement("a");
	link.download = "you-found-me.png";
	link.href = canvas.toDataURL();
	link.click();
}
```

---

---

# ✅ Complete Feature Checklist

## 🟢 Easy

- [ ] Live X/Z coordinate tracker
- [ ] Short typed instruction at the start
- [ ] Arrival detection at exact target coordinates
- [ ] Screen darkens to focus on the envelope
- [ ] Letter opens with "To Hyacinth..." and ends with "Daghang salamat"
- [ ] Pause menu with a mute button
- [ ] Option to replay the letter or return to the map
- [ ] Loading screen with a small animation

## 🟡 Medium

- [ ] 2D top-down map with 16-bit pixel art aesthetic
- [ ] Terrain tiles: grass, trees, water
- [ ] WASD / arrow key movement on desktop
- [ ] Fast travel power-up (wings) near spawn
- [ ] 3–4 memory fragments that trigger text bubbles
- [ ] Parchment slides out, font transitions pixel-art → elegant
- [ ] Letter types itself out character by character (typewriter effect)
- [ ] Confetti / flower petal particles after letter opens
- [ ] Pixel particle effects during digging animation
- [ ] Golden-trimmed envelope rises and scales to full screen
- [ ] Sound effect — clicking, wax seal cracking, flap opening
- [ ] Progress saves to localStorage
- [ ] Background chiptune/lo-fi music
- [ ] Share / screenshot button

## 🔴 Hard

- [ ] Fog of war (radial gradient on second canvas layer)
- [ ] Small custom pixel sprite for her character
- [ ] Idle animation when she stops moving
- [ ] Flying animation when wings are active
- [ ] "!" or "?" bubble above character near memory fragments
- [ ] Memory fragments with pixel image alongside text
- [ ] Digital joystick or tap-to-move on mobile
- [ ] Music swells or changes when fast travel item is picked up
- [ ] Ambient sound effects — footsteps, rustling, water ripples
- [ ] Subtle screen shake when landing after flying
- [ ] Intro cutscene / opening title card
- [ ] Day/night cycle
- [ ] Progress heart that fills as she gets closer
- [ ] Minimap showing her dot and destination

---

## ⏱️ Final Time Summary

| Phase     | What You Build                       | Est. Time     |
| --------- | ------------------------------------ | ------------- |
| 0         | Setup + HTML skeleton                | 1–2 hours     |
| 1         | Tile map + moving character          | 3–5 days      |
| 2         | Fog of war + HUD                     | 2–3 days      |
| 3         | Intro, wings, fragments, destination | 4–6 days      |
| 4         | Full reveal sequence                 | 4–6 days      |
| 5         | Audio                                | 1–2 days      |
| 6         | Mobile controls                      | 2–3 days      |
| 7         | Polish + testing                     | 3–5 days      |
| **Total** |                                      | **4–8 weeks** |

> 💡 **Reality check:** If you code 1–2 hours a day consistently, 6 weeks is very achievable.
> The phases build on each other — don't skip ahead. A working Phase 1 is more valuable than a broken Phase 4.

---

## 📚 Resources

| Resource            | Link                                                         |
| ------------------- | ------------------------------------------------------------ |
| MDN Canvas Tutorial | developer.mozilla.org/en-US/docs/Web/API/Canvas_API/tutorial |
| nipplejs (joystick) | github.com/yoannmoinet/nipplejs                              |
| Free pixel tiles    | opengameart.org                                              |
| Free music/SFX      | freesound.org                                                |
| Pixel font          | fonts.google.com → "Press Start 2P"                          |
| Elegant font        | fonts.google.com → "Cormorant Garamond"                      |
| Free game assets    | itch.io/game-assets/free                                     |

---

> _"She didn't run away. She just needed to know you'd follow."_
>
> **Build it. She'll love it.**
