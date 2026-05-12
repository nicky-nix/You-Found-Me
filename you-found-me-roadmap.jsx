import { useState } from "react";

const phases = [
  {
    id: 0,
    color: "#22c55e",
    label: "Phase 0",
    title: "Project Setup",
    time: "1–2 hours",
    difficulty: "Easy",
    summary: "Create your folder, write 3 files, confirm a black screen in your browser.",
    steps: [
      {
        title: "Install the tools",
        body: `You need two things installed on your computer:

1. VS Code — your code editor: https://code.visualstudio.com
2. The Live Server extension inside VS Code (search "Live Server" in the Extensions tab)

That's it. No Node.js, no frameworks, no build tools. This game runs entirely in the browser.`,
      },
      {
        title: "Create your project folder",
        body: `Make a folder anywhere on your computer called you-found-me.
Inside it, create exactly these three files:

  you-found-me/
  ├── index.html
  ├── style.css
  └── game.js

You can right-click inside VS Code's sidebar and click "New File" to create them.`,
      },
      {
        title: "Write index.html",
        body: `Paste this into index.html:`,
        code: `<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>You Found Me 💌</title>
    <link rel="stylesheet" href="style.css" />
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&display=swap" rel="stylesheet" />
  </head>
  <body>
    <canvas id="gameCanvas"></canvas>
    <canvas id="fogCanvas"></canvas>
    <div id="ui-overlay"></div>
    <script src="game.js"></script>
  </body>
</html>`,
        note: "The two canvas elements stack on top of each other. gameCanvas draws the world; fogCanvas draws the darkness with a hole cut around the player. ui-overlay is a plain HTML layer for the letter and envelope animations."
      },
      {
        title: "Write style.css",
        body: `Paste this into style.css:`,
        code: `/* style.css */
* { margin: 0; padding: 0; box-sizing: border-box; }

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
  image-rendering: pixelated; /* keeps pixel art crisp — don't remove this */
}

#fogCanvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none; /* clicks pass through to the canvas below */
}

#ui-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
}`,
      },
      {
        title: "Write the game.js skeleton",
        body: `Paste this into game.js:`,
        code: `// game.js

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 800;
canvas.height = 600;

// gameState controls which "scene" is active
// Values: 'intro' | 'title' | 'exploring' | 'digging' | 'envelope_rising' | 'letter'
let gameState = "intro";

function update() {
  if (gameState === "exploring") {
    updatePlayer();
    updateWings();
    updateMemories();
    checkDestination();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (gameState === "intro")      drawIntro();
  else if (gameState === "title") drawTitleCard();
  else if (gameState === "exploring") {
    drawMap();
    drawMemories();
    drawWings();
    drawPlayer();
    drawFog();
    drawHUD();
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();`,
        note: "✅ Open index.html with Live Server (right-click → 'Open with Live Server'). You should see a black screen and no errors in the browser console (F12). That means everything is connected correctly."
      },
    ],
  },
  {
    id: 1,
    color: "#3b82f6",
    label: "Phase 1",
    title: "Tile Map + Moving Player",
    time: "3–5 days",
    difficulty: "Easy–Medium",
    summary: "Build the island grid and make a colored square move around it, blocked by trees and water.",
    steps: [
      {
        title: "Understand tile maps",
        body: `Your island is a 2D grid. Each cell is a "tile." Each tile is a number:

  0 = water   (blue, can't walk through)
  1 = grass   (green, walkable)
  2 = tree    (dark green, can't walk through)

You loop over the grid and draw a colored rectangle for each tile. That's all a tile map is.

The map below matches the island layout from the storyline — dock at the top, clearing with the X at the bottom-right.`,
      },
      {
        title: "Define the map and tile colors",
        code: `// game.js — add this near the top

const TILE_SIZE = 32; // each tile is 32×32 pixels

// Island map — matches the storyline zones
// 0=water, 1=grass, 2=tree
const map = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,1,1,1,2,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,1,1,1,1,2,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,2,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

const TILE_COLORS = {
  0: "#1a6b8a",  // water
  1: "#4a7c3f",  // grass
  2: "#2d5a1b",  // tree
};`,
      },
      {
        title: "Draw the tile map",
        code: `// game.js

function drawMap() {
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      const tile = map[row][col];
      ctx.fillStyle = TILE_COLORS[tile];
      ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
  }
}`,
        note: "col * TILE_SIZE gives the X pixel position. row * TILE_SIZE gives Y. That's the whole formula for a tile map."
      },
      {
        title: "Create the player object",
        code: `// game.js

const player = {
  x: 128,           // starting pixel position (near the dock)
  y: 64,
  width: 16,
  height: 16,
  speed: 2,
  color: "#ff69b4", // pink placeholder — replace with a sprite later
  hasWings: false,
};`,
      },
      {
        title: "Add keyboard input",
        code: `// game.js

const keys = {};
window.addEventListener("keydown", (e) => { keys[e.key] = true; });
window.addEventListener("keyup",   (e) => { keys[e.key] = false; });`,
      },
      {
        title: "Move the player with collision detection",
        code: `// game.js

function getTileAt(px, py) {
  const col = Math.floor(px / TILE_SIZE);
  const row = Math.floor(py / TILE_SIZE);
  if (row < 0 || row >= map.length || col < 0 || col >= map[0].length) return 0;
  return map[row][col];
}

function isSolid(tile) {
  return tile === 0 || tile === 2; // water and trees block movement
}

function updatePlayer() {
  let dx = 0, dy = 0;
  const spd = player.hasWings ? player.speed * 4 : player.speed;

  if (keys["ArrowUp"]    || keys["w"]) dy -= spd;
  if (keys["ArrowDown"]  || keys["s"]) dy += spd;
  if (keys["ArrowLeft"]  || keys["a"]) dx -= spd;
  if (keys["ArrowRight"] || keys["d"]) dx += spd;

  // Check all 4 corners of the player rectangle before moving
  const nextX = player.x + dx;
  if (!isSolid(getTileAt(nextX, player.y)) &&
      !isSolid(getTileAt(nextX + player.width, player.y)) &&
      !isSolid(getTileAt(nextX, player.y + player.height)) &&
      !isSolid(getTileAt(nextX + player.width, player.y + player.height))) {
    player.x = nextX;
  }

  const nextY = player.y + dy;
  if (!isSolid(getTileAt(player.x, nextY)) &&
      !isSolid(getTileAt(player.x + player.width, nextY)) &&
      !isSolid(getTileAt(player.x + player.width, nextY)) &&
      !isSolid(getTileAt(player.x + player.width, nextY + player.height))) {
    player.y = nextY;
  }
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}`,
        note: "✅ You should now see a pink square on a green-and-blue map. Arrow keys or WASD move it. It stops at trees and water."
      },
    ],
  },
  {
    id: 2,
    color: "#a855f7",
    label: "Phase 2",
    title: "Fog of War + Coordinate HUD",
    time: "2–3 days",
    difficulty: "Medium",
    summary: "Cover the island in darkness. Only the area around the player is visible. Add the X/Z tracker.",
    steps: [
      {
        title: "How fog of war works",
        body: `The technique has three steps:
1. Draw the game normally on gameCanvas
2. Fill fogCanvas entirely with dark color
3. "Cut a hole" in the fog around the player using a radial gradient

The hole uses a canvas trick called destination-out compositing — it erases pixels from the fog layer instead of drawing on top of them. The result: the fog has a transparent circle wherever the player is, revealing the game beneath.`,
      },
      {
        title: "Set up the fog canvas",
        code: `// game.js — add near the top

const fogCanvas = document.getElementById("fogCanvas");
const fogCtx = fogCanvas.getContext("2d");

fogCanvas.width  = canvas.width;
fogCanvas.height = canvas.height;`,
      },
      {
        title: "Draw the fog",
        code: `// game.js

function drawFog() {
  fogCtx.clearRect(0, 0, fogCanvas.width, fogCanvas.height);

  // 1. Fill everything dark
  fogCtx.fillStyle = "rgba(0, 0, 0, 0.88)";
  fogCtx.fillRect(0, 0, fogCanvas.width, fogCanvas.height);

  // 2. Cut a visible circle around the player
  const cx = player.x + player.width  / 2;
  const cy = player.y + player.height / 2;
  const radius = player.hasWings ? 180 : 110; // wings expand your vision

  const gradient = fogCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0,   "rgba(0,0,0,1)"); // center: fully transparent (reveals game)
  gradient.addColorStop(0.6, "rgba(0,0,0,0.8)");
  gradient.addColorStop(1,   "rgba(0,0,0,0)"); // edge: fully opaque (foggy)

  fogCtx.globalCompositeOperation = "destination-out";
  fogCtx.fillStyle = gradient;
  fogCtx.beginPath();
  fogCtx.arc(cx, cy, radius, 0, Math.PI * 2);
  fogCtx.fill();

  fogCtx.globalCompositeOperation = "source-over"; // always reset this
}`,
        note: "Call drawFog() at the end of your draw() function, after drawPlayer(). The fog always renders on top."
      },
      {
        title: "Add the coordinate HUD",
        body: `The storyline gives the destination as X: 150, Z: -300. This HUD translates the player's pixel position into those same coordinates, so the player can navigate to the right spot.`,
        code: `// game.js

function getGameCoords() {
  return {
    x: Math.floor(player.x / TILE_SIZE),
    z: -(Math.floor(player.y / TILE_SIZE)), // flip Y axis to match the storyline's Z coords
  };
}

function drawHUD() {
  const { x, z } = getGameCoords();
  const padX = canvas.width - 165;

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(padX - 5, 8, 160, 42);

  ctx.font = '9px "Press Start 2P"';
  ctx.fillStyle = "#ffffff";
  ctx.fillText(\`X: \${x}\`, padX, 24);
  ctx.fillText(\`Z: \${z}\`, padX, 40);
}`,
        note: "✅ You should now see a dark overlay with a clear circle around the player, and X/Z coordinates in the top-right corner."
      },
    ],
  },
  {
    id: 3,
    color: "#f59e0b",
    label: "Phase 3",
    title: "Storyline Elements",
    time: "4–6 days",
    difficulty: "Medium",
    summary: "Add the text intro, the title card, the wings power-up, and the 4 memory fragments from the storyline.",
    steps: [
      {
        title: "Intro text sequence",
        body: `The storyline prologue shows poetic text one line at a time before the boat scene. Clicking/tapping advances to the next line. When all lines are done, switch to the title card.`,
        code: `// game.js

let introStep = 0;

// Condensed from the storyline prologue
const introLines = [
  "There is a certain kind of lost\\nthat has no map.",
  "Not lost in a place.\\nLost in yourself.",
  "And then she walked back\\ninto his life.",
  "She saw him.\\nThe real one.",
  "And then one morning —\\nshe was gone.",
  "Two things were left in the envelope:\\na map. and a card.",
  '"X: 150, Z: -300\\nIf you ever loved me... find me."',
  "[ tap to set sail ]",
];

function drawIntro() {
  ctx.fillStyle = "#06060f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#e8e8e8";
  ctx.font = '10px "Press Start 2P"';
  ctx.textAlign = "center";

  const lines = introLines[introStep].split("\\n");
  const startY = canvas.height / 2 - (lines.length - 1) * 16;
  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, startY + i * 28);
  });
  ctx.textAlign = "left";
}

canvas.addEventListener("click", () => {
  if (gameState === "intro") {
    introStep++;
    if (introStep >= introLines.length) {
      gameState = "title";
    }
  }
});`,
      },
      {
        title: "Title card",
        code: `// game.js

let titleTimer = 0;

function drawTitleCard() {
  ctx.fillStyle = "#06060f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ffd700";
  ctx.font = '20px "Press Start 2P"';
  ctx.textAlign = "center";
  ctx.fillText("YOU FOUND ME", canvas.width / 2, canvas.height / 2 - 12);

  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = '9px "Press Start 2P"';
  ctx.fillText("use arrow keys or WASD to move", canvas.width / 2, canvas.height / 2 + 18);

  ctx.textAlign = "left";
  titleTimer++;
  if (titleTimer > 220) { // ~3.5 seconds at 60fps
    gameState = "exploring";
    titleTimer = 0;
  }
}`,
      },
      {
        title: "Wings power-up",
        body: `Near the spawn point, half-hidden in tall grass. Collecting it gives the player flight speed and expands their fog visibility radius. This matches the storyline note: "For when walking isn't fast enough."`,
        code: `// game.js

const wings = {
  x: 160, y: 96,      // near the dock / spawn area
  width: 16, height: 16,
  collected: false,
  bobOffset: 0,
};

function updateWings() {
  if (wings.collected) return;
  wings.bobOffset = Math.sin(Date.now() / 300) * 3;

  const dx = (player.x + player.width  / 2) - (wings.x + wings.width  / 2);
  const dy = (player.y + player.height / 2) - (wings.y + wings.height / 2);
  if (Math.sqrt(dx*dx + dy*dy) < 20) {
    wings.collected = true;
    player.hasWings = true;
    player.speed = 6;
    showNotification("Wings collected! ✨ You can fly.");
  }
}

function drawWings() {
  if (wings.collected) return;
  ctx.font = "18px sans-serif";
  ctx.fillText("🪽", wings.x, wings.y + wings.bobOffset);
}

// Simple notification banner
let notification = null;
let notifTimer = 0;

function showNotification(msg) {
  notification = msg;
  notifTimer = 180;
}

function drawNotification() {
  if (!notification || notifTimer <= 0) return;
  notifTimer--;
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillRect(20, canvas.height - 50, canvas.width - 40, 36);
  ctx.fillStyle = "#ffd700";
  ctx.font = '9px "Press Start 2P"';
  ctx.fillText(notification, 32, canvas.height - 28);
}`,
      },
      {
        title: "Memory fragments",
        body: `Four golden glowing dots on the map. Walking over one plays the memory text. The positions below translate to roughly the storyline's X/Z coordinates.`,
        code: `// game.js

const memories = [
  {
    x: 96, y: 128,
    // Fragment 1 — shore, wildflowers — storyline: X:30, Z:-40
    text: "This is where I used to sit\\nand think about you.\\nEvery single day.",
    collected: false,
  },
  {
    x: 224, y: 192,
    // Fragment 2 — the great tree — storyline: X:70, Z:-110
    text: "I found this tree on my first day here.\\nI carved something into it.\\nI thought you'd never see it.\\nI hoped you would.",
    collected: false,
  },
  {
    x: 352, y: 256,
    // Fragment 3 — waterfall / stream — storyline: X:110, Z:-200
    text: "I used to call you at 2am\\njust to hear your voice.\\nI still do it sometimes.\\nI just don't press call anymore.",
    collected: false,
  },
  {
    x: 448, y: 288,
    // Fragment 4 — before the clearing — storyline: X:140, Z:-270
    text: "You're close now.\\nI can feel it.\\nI always could.",
    collected: false,
  },
];

let activeMemory = null;
let memoryTimer  = 0;

function updateMemories() {
  memories.forEach(mem => {
    if (mem.collected) return;
    const dx = player.x - mem.x;
    const dy = player.y - mem.y;
    if (Math.sqrt(dx*dx + dy*dy) < 24) {
      mem.collected = true;
      activeMemory  = mem.text;
      memoryTimer   = 260;
    }
  });
  if (memoryTimer > 0) memoryTimer--;
  else activeMemory = null;
}

function drawMemories() {
  // Uncollected = glowing gold dot
  memories.forEach(mem => {
    if (mem.collected) return;
    const glow = 5 + Math.sin(Date.now() / 300) * 2;
    ctx.fillStyle = "#ffd700";
    ctx.beginPath();
    ctx.arc(mem.x, mem.y, glow, 0, Math.PI * 2);
    ctx.fill();
  });

  // Active memory bubble
  if (activeMemory && memoryTimer > 0) {
    const lines  = activeMemory.split("\\n");
    const bH     = lines.length * 20 + 24;
    const bY     = canvas.height - bH - 12;

    ctx.fillStyle   = "rgba(10,10,20,0.88)";
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth   = 1.5;
    roundRect(ctx, 16, bY, canvas.width - 32, bH, 6);

    ctx.fillStyle = "#fff8dc";
    ctx.font = '8px "Press Start 2P"';
    lines.forEach((line, i) => {
      ctx.fillText(line, 28, bY + 18 + i * 20);
    });
  }
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x+r, y);
  c.lineTo(x+w-r, y); c.quadraticCurveTo(x+w, y, x+w, y+r);
  c.lineTo(x+w, y+h-r); c.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  c.lineTo(x+r, y+h); c.quadraticCurveTo(x, y+h, x, y+h-r);
  c.lineTo(x, y+r); c.quadraticCurveTo(x, y, x+r, y);
  c.closePath(); c.fill(); c.stroke();
}`,
        note: "✅ You should now see 4 glowing gold dots on the map. Walk over each one and the memory text appears at the bottom of the screen."
      },
      {
        title: "Destination detection",
        body: `When the player reaches X:150, Z:-300 (translated to pixel coords: approximately x:480, y:288), trigger the reveal sequence.`,
        code: `// game.js

const destination = { x: 480, y: 288 }; // translates to roughly X:150, Z:-300

function checkDestination() {
  if (gameState !== "exploring") return;
  const dx = player.x - destination.x;
  const dy = player.y - destination.y;
  if (Math.sqrt(dx*dx + dy*dy) < 22) {
    gameState = "digging";
    startRevealSequence();
  }
}

// Draw a subtle marker at the destination so the player has a hint
function drawDestinationMarker() {
  const pulse = Math.sin(Date.now() / 500) * 0.5 + 0.5;
  ctx.globalAlpha = 0.3 + pulse * 0.3;
  ctx.fillStyle = "#ffd700";
  ctx.beginPath();
  ctx.arc(destination.x, destination.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}`,
      },
    ],
  },
  {
    id: 4,
    color: "#ec4899",
    label: "Phase 4",
    title: "The Reveal Sequence",
    time: "4–6 days",
    difficulty: "Hard",
    summary: "Digging particles → envelope rises → seal cracks → letter types itself out. The emotional climax of the game.",
    steps: [
      {
        title: "Understand the reveal state machine",
        body: `The reveal is a chain of states. Each one plays out, then moves to the next automatically:

  'exploring'
      ↓ (player reaches destination)
  'digging'         — 2 seconds of particle effects
      ↓
  'envelope_rising' — envelope animates up and fills the screen
      ↓
  'envelope_open'   — seal cracks, flap opens
      ↓
  'letter'          — parchment slides in, letter types itself out
      ↓
  'reply'           — player types a reply, paper boat animates away

Each state is driven by setTimeout() and CSS animations in the HTML overlay layer.`,
      },
      {
        title: "Particle effects (digging animation)",
        code: `// game.js

let particles = [];

function spawnParticles(x, y, count = 30) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 2.2) * 3,
      life: 60 + Math.random() * 40,
      maxLife: 100,
      color: \`hsl(\${28 + Math.random() * 24}, 70%, \${40 + Math.random() * 20}%)\`,
      size: 2 + Math.random() * 4,
    });
  }
}

function updateParticles() {
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.12; // gravity
    p.life--;
  });
  particles = particles.filter(p => p.life > 0);
}

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle   = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  });
  ctx.globalAlpha = 1;
}

function drawDigging() {
  drawMap();
  drawPlayer();
  drawParticles();
  drawFog();
  updateParticles();

  // Spawn a few particles each frame during digging
  if (Math.random() < 0.4) {
    spawnParticles(destination.x + (Math.random()-0.5)*20,
                   destination.y + (Math.random()-0.5)*20, 3);
  }
}`,
      },
      {
        title: "Reveal sequence controller",
        code: `// game.js

function startRevealSequence() {
  spawnParticles(destination.x, destination.y, 60);

  setTimeout(() => {
    gameState = "envelope_rising";
    showEnvelope();
  }, 2200);
}`,
      },
      {
        title: "Envelope animation (HTML overlay)",
        code: `// game.js

function showEnvelope() {
  const overlay = document.getElementById("ui-overlay");
  overlay.style.pointerEvents = "all";
  overlay.innerHTML = \`
    <div id="envelope-container" style="
      position:fixed; inset:0;
      display:flex; align-items:center; justify-content:center;
      background:rgba(6,6,15,0.88);
      animation: fadeIn 0.8s ease;">
      <div id="envelope" style="
        width:220px; height:155px;
        background:#f5e6c8; border:3px solid #c8a000;
        border-radius:4px; display:flex; align-items:center;
        justify-content:center; position:relative;
        animation: riseUp 1s ease forwards; font-size:38px;">
        <div id="seal" style="
          transition: transform 0.4s, opacity 0.4s;
          font-size:32px;">💛</div>
      </div>
    </div>
    <style>
      @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
      @keyframes riseUp  {
        from { transform: translateY(120px) scale(0.4); opacity:0 }
        to   { transform: translateY(0) scale(1); opacity:1 }
      }
    </style>
  \`;

  // Crack the seal after 2 seconds
  setTimeout(() => {
    const seal = document.getElementById("seal");
    if (seal) {
      seal.style.transform = "scale(1.4)";
      seal.style.opacity   = "0";
    }
    setTimeout(showLetter, 900);
  }, 2000);
}`,
      },
      {
        title: "Letter with typewriter effect",
        body: `This is the full letter from the storyline, addressed to Hyacinth, ending with "Daghang salamat."`,
        code: `// game.js

// Replace [Your Name] with the actual name before giving the game
const letterContent = \`To Hyacinth,


I've been thinking about how to start this
for a long time.

And every time, I come back to the same truth:

You found me first.

I was lost — really lost —
the kind of lost that doesn't announce itself.
I just woke up one day and didn't recognize
anything around me. Including myself.

And then there was you.

You didn't fix me.
You didn't try to.
You just... saw me.
The real me, underneath all of it.
And you stayed anyway.

Do you know how rare that is?
Do you know what it did to me —
to be seen like that?

I went to this island because I needed to know
if I was worth finding.
If you'd cross water for me
the way I'd cross anything for you.

And here you are.

Here you are.

One month.
It sounds so small when you say it out loud.
But I have lived more in this one month with you
than in years before it.

Thank you for the late nights.
For the silences that never felt empty.
For finding me — even when I didn't leave
very good directions.

Daghang salamat, my love.
For an amazing month.
For being my person.
For finding me —

the way I once found you.


                          Always yours,
                               — [Your Name] 💛\`;

function showLetter() {
  gameState = "letter";
  const overlay = document.getElementById("ui-overlay");
  overlay.innerHTML = \`
    <div id="letter-container" style="
      position:fixed; inset:0;
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      background:rgba(6,6,15,0.95); animation: fadeIn 1s ease;">
      <div id="parchment" style="
        background:#fdf6e3; border:2px solid #c8a000; border-radius:8px;
        padding:36px 40px; max-width:520px; max-height:72vh; overflow-y:auto;
        box-shadow:0 0 50px rgba(200,160,0,0.25);">
        <p id="letter-text" style="
          font-family:'Cormorant Garamond',serif;
          font-size:17px; line-height:1.85; color:#3a2a1a;
          white-space:pre-wrap; min-height:60px;"></p>
      </div>
      <div id="letter-buttons" style="
        margin-top:24px; display:flex; gap:16px; opacity:0;
        transition: opacity 1.2s ease;">
        <button onclick="replayLetter()" style="
          font-family:'Press Start 2P',monospace; font-size:9px;
          padding:12px 18px; background:#0a0a1e; color:#ffd700;
          border:2px solid #ffd700; cursor:pointer; border-radius:2px;">
          💌 Read again
        </button>
        <button onclick="backToIsland()" style="
          font-family:'Press Start 2P',monospace; font-size:9px;
          padding:12px 18px; background:#0a0a1e; color:#ffffff;
          border:2px solid #ffffff55; cursor:pointer; border-radius:2px;">
          🏝️ Back to island
        </button>
      </div>
    </div>
    <style>@keyframes fadeIn{from{opacity:0}to{opacity:1}}</style>
  \`;
  typewriterEffect(letterContent);
}

function typewriterEffect(text) {
  const el = document.getElementById("letter-text");
  let i = 0;
  const speed = 28; // ms per character — lower = faster
  const interval = setInterval(() => {
    if (i < text.length) {
      el.textContent += text[i];
      i++;
      // Auto-scroll as text grows
      el.parentElement.scrollTop = el.parentElement.scrollHeight;
    } else {
      clearInterval(interval);
      document.getElementById("letter-buttons").style.opacity = "1";
      spawnConfetti();
    }
  }, speed);
}

function replayLetter() {
  document.getElementById("letter-text").textContent = "";
  document.getElementById("letter-buttons").style.opacity = "0";
  typewriterEffect(letterContent);
}

function backToIsland() {
  document.getElementById("ui-overlay").innerHTML = "";
  document.getElementById("ui-overlay").style.pointerEvents = "none";
  gameState = "exploring";
}`,
      },
      {
        title: "Confetti effect",
        code: `// game.js

function spawnConfetti() {
  const overlay = document.getElementById("letter-container");
  if (!overlay) return;

  for (let i = 0; i < 80; i++) {
    const piece = document.createElement("div");
    const colors = ["#ffd700","#fff","#ffb3d1","#b3e5fc","#c8f7c5"];
    piece.style.cssText = \`
      position:fixed;
      left:\${Math.random() * 100}vw;
      top:-10px;
      width:\${4 + Math.random()*6}px;
      height:\${4 + Math.random()*6}px;
      background:\${colors[Math.floor(Math.random()*colors.length)]};
      border-radius:50%;
      animation: fall \${1.5+Math.random()*2}s linear \${Math.random()*2}s forwards;
      pointer-events:none;
    \`;
    document.body.appendChild(piece);
  }

  // Inject the fall keyframes once
  if (!document.getElementById("confetti-style")) {
    const s = document.createElement("style");
    s.id = "confetti-style";
    s.textContent = \`@keyframes fall {
      to { transform: translateY(110vh) rotate(360deg); opacity:0; }
    }\`;
    document.head.appendChild(s);
  }

  // Clean up after 6 seconds
  setTimeout(() => {
    document.querySelectorAll("[style*='fall']").forEach(el => el.remove());
  }, 6000);
}`,
        note: "✅ Walking to the destination should now trigger: particles → envelope rise → seal crack → letter types out → confetti."
      },
    ],
  },
  {
    id: 5,
    color: "#14b8a6",
    label: "Phase 5",
    title: "Audio",
    time: "1–2 days",
    difficulty: "Easy",
    summary: "Background music, a sound when the wings are collected, and silence during the letter reveal.",
    steps: [
      {
        title: "Where to find free music",
        body: `All audio should be royalty-free. Best sources:

• opengameart.org — pixel/chiptune music, free to use
• freesound.org — individual sound effects (seal crack, click, footsteps)
• itch.io/game-assets/free — curated packs with music + SFX

Download MP3 files and put them in assets/audio/ inside your project folder.

Suggested files to find:
  music-explore.mp3   — gentle lo-fi chiptune for exploring
  music-reveal.mp3    — warm piano swell for the letter scene
  sfx-wings.mp3       — a soft chime when wings are collected
  sfx-seal.mp3        — a small crack/click for the seal breaking`,
      },
      {
        title: "Add and control audio",
        code: `// game.js

const audio = {
  explore: new Audio("assets/audio/music-explore.mp3"),
  reveal:  new Audio("assets/audio/music-reveal.mp3"),
  wings:   new Audio("assets/audio/sfx-wings.mp3"),
  seal:    new Audio("assets/audio/sfx-seal.mp3"),
};

audio.explore.loop   = true;
audio.explore.volume = 0.4;
audio.reveal.volume  = 0.6;

// Browsers block audio until the user interacts first.
// Call this on the click that starts the game (introStep → title):
function startMusic() {
  audio.explore.play().catch(() => {}); // .catch prevents console errors if blocked
}

// Call this when showing the letter
function switchToRevealMusic() {
  audio.explore.pause();
  audio.explore.currentTime = 0;
  audio.reveal.play().catch(() => {});
}

let isMuted = false;
function toggleMute() {
  isMuted = !isMuted;
  Object.values(audio).forEach(a => a.muted = isMuted);
}

// Add 'M' key to mute
window.addEventListener("keydown", e => {
  if (e.key === "m" || e.key === "M") toggleMute();
});`,
        note: "In your showEnvelope() function, call switchToRevealMusic() at the start. In updateWings() when wings are collected, call audio.wings.play()."
      },
    ],
  },
  {
    id: 6,
    color: "#ef4444",
    label: "Phase 6",
    title: "Polish + Save",
    time: "3–5 days",
    difficulty: "Medium–Hard",
    summary: "Progress heart, save to localStorage, mobile joystick, screenshot button.",
    steps: [
      {
        title: "Progress heart UI",
        body: `Fills as the player gets closer to X:150, Z:-300. Gives a quiet emotional signal without showing a map.`,
        code: `// game.js

function drawProgressHeart() {
  const dx   = player.x - destination.x;
  const dy   = player.y - destination.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  const progress = 1 - Math.min(dist / 520, 1); // 0 at far, 1 at destination

  ctx.font = "18px sans-serif";
  ctx.globalAlpha = 0.3;
  ctx.fillText("🤍", 20, 36);
  ctx.globalAlpha = progress;
  ctx.fillText("❤️", 20, 36);
  ctx.globalAlpha = 1;
}`,
      },
      {
        title: "Save progress to localStorage",
        code: `// game.js

function saveProgress() {
  localStorage.setItem("yfm-save", JSON.stringify({
    px: player.x,
    py: player.y,
    hasWings:  player.hasWings,
    speed:     player.speed,
    memories:  memories.map(m => m.collected),
    wingsGone: wings.collected,
  }));
}

function loadProgress() {
  const raw = localStorage.getItem("yfm-save");
  if (!raw) return;
  const d = JSON.parse(raw);
  player.x        = d.px;
  player.y        = d.py;
  player.hasWings = d.hasWings;
  player.speed    = d.speed;
  d.memories.forEach((c, i) => memories[i].collected = c);
  wings.collected = d.wingsGone;
  if (wings.collected) player.hasWings = true;
}

// Call loadProgress() at the very end of your game.js setup
// Call saveProgress() every 10 seconds:
setInterval(saveProgress, 10000);`,
      },
      {
        title: "Mobile joystick (nipplejs)",
        code: `<!-- index.html — add inside <head> -->
<script src="https://cdn.jsdelivr.net/npm/nipplejs@0.10.1/dist/nipplejs.min.js"></script>`,
        body: `Then in game.js:`,
        code2: `// game.js

let joyX = 0, joyY = 0;

// Only create joystick on touch devices
if ("ontouchstart" in window) {
  const joystick = nipplejs.create({
    zone:     document.getElementById("ui-overlay"),
    mode:     "static",
    position: { left: "70px", bottom: "70px" },
    color:    "rgba(255,255,255,0.4)",
  });
  joystick.on("move", (evt, data) => {
    joyX = data.vector.x;
    joyY = data.vector.y;
  });
  joystick.on("end", () => { joyX = 0; joyY = 0; });
}

// In updatePlayer(), after the keyboard checks, also add:
// player.x += joyX * spd;
// player.y += joyY * spd;`,
      },
      {
        title: "Screenshot button",
        code: `// game.js

function takeScreenshot() {
  const link      = document.createElement("a");
  link.download   = "you-found-me.png";
  link.href       = canvas.toDataURL("image/png");
  link.click();
}

// Add a button to the HUD — call this inside drawHUD():
function drawScreenshotButton() {
  ctx.fillStyle   = "rgba(0,0,0,0.5)";
  ctx.fillRect(canvas.width - 38, canvas.height - 38, 30, 28);
  ctx.font = "16px sans-serif";
  ctx.fillText("📷", canvas.width - 34, canvas.height - 16);
}

// Detect click on that area:
canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  if (mx > canvas.width-38 && my > canvas.height-38 && gameState === "exploring") {
    takeScreenshot();
  }
});`,
        note: "✅ The game is now feature-complete. Final checklist: test on mobile, verify all 4 memory fragments trigger, confirm the letter types out fully, and check the confetti appears after the letter."
      },
    ],
  },
];

const checklist = {
  easy: [
    "Live X/Z coordinate tracker shows in top-right",
    "Intro text advances on click/tap",
    "Arrival detection triggers at X:150, Z:-300",
    "Screen darkens for envelope reveal",
    "Letter opens with 'To Hyacinth...' and ends 'Daghang salamat'",
    "M key toggles mute",
    "Option to replay the letter after reading",
    "Loading screen / title card before exploring",
  ],
  medium: [
    "2D top-down map with tile-based terrain",
    "Grass, water, tree tiles — solid collision on water and trees",
    "WASD / arrow key movement on desktop",
    "Wings power-up near spawn boosts speed",
    "4 memory fragments that trigger text bubbles",
    "Typewriter effect on the letter",
    "Confetti after letter finishes",
    "Envelope rises and scales to fill screen",
    "Background lo-fi chiptune music",
    "Progress saves to localStorage",
    "Screenshot button",
  ],
  hard: [
    "Fog of war (radial gradient on second canvas)",
    "Pixel art sprite for the player character",
    "Idle / walk animation for the player",
    "Flying animation when wings are active",
    "! or ? bubble above character near fragments",
    "Mobile joystick (nipplejs)",
    "Music crossfades into reveal theme",
    "Footstep / ambient sound effects",
    "Progress heart fills as player approaches",
    "Intro boat cutscene before title card",
    "Day/night cycle",
    "Minimap dot in corner",
  ],
};

const resources = [
  { name: "MDN Canvas Tutorial", url: "https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/tutorial", desc: "The official reference for everything you'll draw" },
  { name: "OpenGameArt", url: "https://opengameart.org", desc: "Free pixel tiles, tilesets, sprites, music" },
  { name: "Freesound", url: "https://freesound.org", desc: "Free individual sound effects (seal crack, chimes)" },
  { name: "itch.io Free Assets", url: "https://itch.io/game-assets/free", desc: "Curated game asset packs" },
  { name: "nipplejs (joystick)", url: "https://github.com/yoannmoinet/nipplejs", desc: "Mobile virtual joystick library" },
  { name: "Press Start 2P (font)", url: "https://fonts.google.com/specimen/Press+Start+2P", desc: "The pixel font for HUD and UI" },
  { name: "Cormorant Garamond (font)", url: "https://fonts.google.com/specimen/Cormorant+Garamond", desc: "The elegant serif font for the letter" },
];

export default function Roadmap() {
  const [activePhase, setActivePhase] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [tab, setTab] = useState("roadmap");
  const [checked, setChecked] = useState({});

  const phase = phases.find(p => p.id === activePhase);

  const toggleCheck = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }));

  const totalChecked = Object.values(checked).filter(Boolean).length;
  const totalItems = checklist.easy.length + checklist.medium.length + checklist.hard.length;

  return (
    <div style={{ fontFamily: "var(--font-sans)", padding: "1.5rem 1rem", maxWidth: 700, margin: "0 auto" }}>
      <h2 className="sr-only">You Found Me — Game Development Roadmap</h2>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 4 }}>
          Game Dev Roadmap
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: "0 0 6px", color: "var(--color-text-primary)" }}>
          You Found Me 💌
        </h1>
        <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: 0 }}>
          Build a romantic pixel-art island exploration game from scratch — no prior game dev experience needed.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", borderBottom: "0.5px solid var(--color-border-tertiary)", paddingBottom: "0.75rem" }}>
        {["roadmap", "checklist", "resources"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            fontSize: 13, padding: "6px 14px", borderRadius: "var(--border-radius-md)",
            border: tab === t ? "0.5px solid var(--color-border-secondary)" : "0.5px solid transparent",
            background: tab === t ? "var(--color-background-secondary)" : "transparent",
            color: "var(--color-text-primary)", cursor: "pointer",
            fontWeight: tab === t ? 500 : 400,
          }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ROADMAP TAB */}
      {tab === "roadmap" && !phase && (
        <div>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: "1rem" }}>
            7 phases, ~4–8 weeks at 1–2 hours/day. Each phase builds on the last — don't skip ahead.
          </p>
          {phases.map(p => (
            <div key={p.id}
              onClick={() => { setActivePhase(p.id); setActiveStep(0); }}
              style={{
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: "var(--border-radius-lg)",
                padding: "1rem 1.25rem",
                marginBottom: 10,
                cursor: "pointer",
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                transition: "border-color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-border-secondary)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border-tertiary)"}
            >
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: p.color + "22",
                border: `2px solid ${p.color}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontSize: 12, fontWeight: 500, color: p.color,
              }}>
                {p.id}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>
                    {p.title}
                  </span>
                  <span style={{
                    fontSize: 11, padding: "2px 8px",
                    background: "var(--color-background-secondary)",
                    borderRadius: "var(--border-radius-md)",
                    color: "var(--color-text-secondary)",
                  }}>
                    {p.time}
                  </span>
                  <span style={{
                    fontSize: 11, padding: "2px 8px",
                    background: p.color + "18",
                    borderRadius: "var(--border-radius-md)",
                    color: p.color,
                  }}>
                    {p.difficulty}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>{p.summary}</p>
              </div>
              <i className="ti ti-chevron-right" style={{ fontSize: 18, color: "var(--color-text-secondary)", flexShrink: 0, marginTop: 8 }} aria-hidden="true" />
            </div>
          ))}
        </div>
      )}

      {/* PHASE DETAIL */}
      {tab === "roadmap" && phase && (
        <div>
          {/* Back */}
          <button onClick={() => setActivePhase(null)} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "transparent", border: "none",
            color: "var(--color-text-secondary)", cursor: "pointer",
            fontSize: 13, marginBottom: "1rem", padding: 0,
          }}>
            <i className="ti ti-arrow-left" aria-hidden="true" /> Back to phases
          </button>

          {/* Phase header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.25rem" }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: phase.color + "22", border: `2px solid ${phase.color}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 500, color: phase.color, flexShrink: 0,
            }}>
              {phase.id}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>{phase.title}</h2>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
                {phase.time} · {phase.difficulty}
              </div>
            </div>
          </div>

          {/* Step pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: "1.25rem" }}>
            {phase.steps.map((s, i) => (
              <button key={i} onClick={() => setActiveStep(i)} style={{
                fontSize: 12, padding: "5px 12px",
                borderRadius: "var(--border-radius-md)",
                border: activeStep === i
                  ? `1px solid ${phase.color}`
                  : "0.5px solid var(--color-border-tertiary)",
                background: activeStep === i ? phase.color + "18" : "var(--color-background-primary)",
                color: activeStep === i ? phase.color : "var(--color-text-secondary)",
                cursor: "pointer", fontWeight: activeStep === i ? 500 : 400,
              }}>
                {i + 1}. {s.title}
              </button>
            ))}
          </div>

          {/* Active step */}
          {(() => {
            const step = phase.steps[activeStep];
            return (
              <div style={{
                background: "var(--color-background-primary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: "var(--border-radius-lg)",
                overflow: "hidden",
              }}>
                <div style={{
                  padding: "1rem 1.25rem",
                  borderBottom: step.code || step.code2 ? "0.5px solid var(--color-border-tertiary)" : "none",
                }}>
                  <h3 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 500 }}>{step.title}</h3>
                  {step.body && (
                    <p style={{ fontSize: 13, lineHeight: 1.75, color: "var(--color-text-secondary)", margin: 0, whiteSpace: "pre-wrap" }}>
                      {step.body}
                    </p>
                  )}
                  {step.code2 && step.body && (
                    <div style={{
                      marginTop: 12,
                      background: "var(--color-background-secondary)",
                      borderRadius: "var(--border-radius-md)",
                      padding: "1rem",
                      overflowX: "auto",
                    }}>
                      <pre style={{ margin: 0, fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--color-text-primary)", whiteSpace: "pre" }}>
                        {step.code2}
                      </pre>
                    </div>
                  )}
                </div>
                {step.code && (
                  <div style={{
                    background: "var(--color-background-secondary)",
                    padding: "1rem 1.25rem",
                    overflowX: "auto",
                  }}>
                    <pre style={{ margin: 0, fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--color-text-primary)", whiteSpace: "pre" }}>
                      {step.code}
                    </pre>
                  </div>
                )}
                {step.note && (
                  <div style={{
                    padding: "0.75rem 1.25rem",
                    borderTop: "0.5px solid var(--color-border-tertiary)",
                    fontSize: 12, color: "var(--color-text-secondary)",
                    background: "var(--color-background-secondary)",
                  }}>
                    {step.note}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Prev / next */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
            <button
              onClick={() => setActiveStep(s => Math.max(0, s - 1))}
              disabled={activeStep === 0}
              style={{
                fontSize: 13, padding: "8px 16px",
                border: "0.5px solid var(--color-border-secondary)",
                borderRadius: "var(--border-radius-md)",
                background: "transparent", color: "var(--color-text-primary)",
                cursor: activeStep === 0 ? "default" : "pointer",
                opacity: activeStep === 0 ? 0.3 : 1,
              }}
            >
              <i className="ti ti-arrow-left" aria-hidden="true" /> Prev
            </button>
            <button
              onClick={() => setActiveStep(s => Math.min(phase.steps.length - 1, s + 1))}
              disabled={activeStep === phase.steps.length - 1}
              style={{
                fontSize: 13, padding: "8px 16px",
                border: "0.5px solid var(--color-border-secondary)",
                borderRadius: "var(--border-radius-md)",
                background: "transparent", color: "var(--color-text-primary)",
                cursor: activeStep === phase.steps.length - 1 ? "default" : "pointer",
                opacity: activeStep === phase.steps.length - 1 ? 0.3 : 1,
              }}
            >
              Next <i className="ti ti-arrow-right" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* CHECKLIST TAB */}
      {tab === "checklist" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
              {totalChecked} / {totalItems} features
            </p>
            <div style={{
              width: 140, height: 6, background: "var(--color-background-secondary)",
              borderRadius: 99, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 99,
                width: `${(totalChecked / totalItems) * 100}%`,
                background: "#22c55e", transition: "width 0.3s",
              }} />
            </div>
          </div>

          {[
            { label: "Easy", items: checklist.easy, color: "#22c55e" },
            { label: "Medium", items: checklist.medium, color: "#f59e0b" },
            { label: "Hard", items: checklist.hard, color: "#ef4444" },
          ].map(group => (
            <div key={group.label} style={{ marginBottom: "1.25rem" }}>
              <div style={{
                fontSize: 12, fontWeight: 500, color: group.color,
                marginBottom: 8, display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: group.color, display: "inline-block",
                }} />
                {group.label}
              </div>
              {group.items.map((item, i) => {
                const key = `${group.label}-${i}`;
                return (
                  <div key={key}
                    onClick={() => toggleCheck(key)}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "8px 12px", borderRadius: "var(--border-radius-md)",
                      cursor: "pointer", marginBottom: 4,
                      background: checked[key] ? "var(--color-background-secondary)" : "transparent",
                      border: "0.5px solid transparent",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => !checked[key] && (e.currentTarget.style.background = "var(--color-background-secondary)")}
                    onMouseLeave={e => !checked[key] && (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
                      border: checked[key] ? `2px solid ${group.color}` : "1.5px solid var(--color-border-secondary)",
                      background: checked[key] ? group.color : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {checked[key] && <i className="ti ti-check" style={{ fontSize: 11, color: "#fff" }} aria-hidden="true" />}
                    </div>
                    <span style={{
                      fontSize: 13, color: checked[key] ? "var(--color-text-secondary)" : "var(--color-text-primary)",
                      textDecoration: checked[key] ? "line-through" : "none",
                      lineHeight: 1.5,
                    }}>
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* RESOURCES TAB */}
      {tab === "resources" && (
        <div>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: "1rem" }}>
            Everything you need is free. These are the best sources.
          </p>
          {resources.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noreferrer" style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "0.875rem 1rem",
              background: "var(--color-background-primary)",
              border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "var(--border-radius-lg)",
              marginBottom: 8, textDecoration: "none",
              transition: "border-color 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-border-secondary)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border-tertiary)"}
            >
              <i className="ti ti-external-link" style={{ fontSize: 18, color: "var(--color-text-secondary)", flexShrink: 0 }} aria-hidden="true" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)", marginBottom: 2 }}>
                  {r.name}
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{r.desc}</div>
              </div>
            </a>
          ))}

          <div style={{
            marginTop: "1.5rem", padding: "1rem 1.25rem",
            background: "var(--color-background-secondary)",
            borderRadius: "var(--border-radius-lg)",
            border: "0.5px solid var(--color-border-tertiary)",
          }}>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.7, fontStyle: "italic" }}>
              "She didn't run away. She just needed to know you'd follow."
              <br /><br />
              Build it. She'll love it.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
