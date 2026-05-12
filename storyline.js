// ═══════════════════════════════════════════════════════════════
//  storyline.js  —  You Found Me  |  All narrative content
//  Import this BEFORE game.js in your HTML:
//    <script src="storyline.js"></script>
//    <script src="game.js"></script>
// ═══════════════════════════════════════════════════════════════

// ─── PROLOGUE / INTRO SCREENS ───────────────────────────────────
// These map 1-to-1 to the introLines array in game.js.
// Each entry is one "screen" — \n = line break within screen.
const STORY_INTRO_LINES = [
	// Screen 1
	"There is a certain kind of lost\nthat has no map.",

	// Screen 2
	"Not lost in a place.\nLost in yourself.\nThe kind where you stop recognizing\nthe face in the mirror.",

	// Screen 3
	"And then she walked back into his life.\nNot loudly. Not with fanfare.\nThe way light comes through a curtain.",

	// Screen 4
	"She saw him.\nNot who he was pretending to be.\nThe real one.\nThe one he'd almost forgotten existed.",

	// Screen 5 — the map clue reveal
	"She left a letter.\nAnd inside it — a map.",

	// Screen 6 — coordinates
	"X: 150,  Z: -300\n\nIf you ever loved me...\nfind me.",

	// Screen 7 — prompt
	"[ tap or press any key\nto set sail ]",
];

// ─── MEMORY FRAGMENTS ───────────────────────────────────────────
// Each fragment: { label, worldX, worldY, lines[] }
// worldX / worldY are pixel positions (col * TILE_SIZE + offset).
// lines[] is the array passed to queueMessage() when collected.
//
// To use in game.js, replace the `memories` array with:
//   const memories = STORY_MEMORIES.map(m => ({
//     x: m.worldX, y: m.worldY,
//     collected: false,
//     text: m.lines
//   }));

const STORY_MEMORIES = [
	// ── Fragment 1  ·  Near the shore  ·  X:30, Z:-40 ───────────
	{
		label: "Fragment 1 — Wildflower Shore",
		worldX: 6 * 32 + 16, // col 6
		worldY: 3 * 32 + 16, // row 3
		lines: [
			"I still remember the first time",
			"I noticed you.",
			"We were young.",
			"You were looking at the water",
			"like it owed you something.",
			"I couldn't look away.",
		],
	},

	// ── Fragment 2  ·  Under the great tree  ·  X:70, Z:-110 ────
	{
		label: "Fragment 2 — The Great Tree",
		worldX: 12 * 32 + 16, // col 12
		worldY: 5 * 32 + 16, // row 5
		lines: [
			"There were afternoons",
			"we didn't say anything at all.",
			"Just existed in the same space.",
			"That kind of quiet is rare.",
			"I've been chasing it ever since.",
		],
	},

	// ── Fragment 3  ·  Waterfall + stream  ·  X:110, Z:-200 ─────
	{
		label: "Fragment 3 — Waterfall",
		worldX: 3 * 32 + 16, // col 3
		worldY: 11 * 32 + 16, // row 11
		lines: [
			"I used to call you at 2am",
			"just to hear your voice.",
			"I still do it sometimes.",
			"I just don't press call anymore.",
		],
	},

	// ── Fragment 4  ·  Just before the clearing  ·  X:140, Z:-270
	{
		label: "Fragment 4 — The Clearing",
		worldX: 14 * 32 + 16, // col 14
		worldY: 13 * 32 + 16, // row 13
		lines: ["You're close now.", "I can feel it.", "I always could."],
	},
];

// ─── WINGS PICKUP ───────────────────────────────────────────────
// Text shown when the wings are collected.
const STORY_WINGS_LINES = [
	"For when walking isn't fast enough.",
	"You were always worth running to.",
	"[ You can now fly! ]",
];

// ─── DESTINATION — NOT ENOUGH MEMORIES ──────────────────────────
// Message shown if the player reaches X before collecting all fragments.
const STORY_COLLECT_FIRST = [
	"I'm close.",
	"But I should find her memories first.",
];

// ─── THE LETTER ─────────────────────────────────────────────────
// Multi-line string used by typewriterEffect() in game.js.
// Replace the `letterContent` const with: const letterContent = STORY_LETTER;
const STORY_LETTER = `To Hyacinth,


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
                    — iweiwei21 💛`;

// ─── EPILOGUE — FADE TO BLACK ────────────────────────────────────
// Final lines shown after the paper boat drifts away.
// Render these one at a time on the black screen.
const STORY_EPILOGUE_LINES = [
	"She found you first.",
	"You found her back.",
	"That's the whole story.",
];

// ─── EXPORT CHECK ────────────────────────────────────────────────
// Makes all story constants available globally (no module system needed).
// game.js can reference them directly after this script loads.
console.log(
	"[storyline.js] Loaded — fragments:",
	STORY_MEMORIES.length,
	"| intro screens:",
	STORY_INTRO_LINES.length,
);
