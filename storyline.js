// ─── PROLOGUE / INTRO SCREENS ───────────────────────────────────
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
	"X: 48,  Z: -3\n\nIf you ever loved me...\nfind me.",

	// Screen 7 — prompt
	"[ tap or press any key\nto set sail ]",
];

// ── MEMORY FRAGMENT LOCATIONS ────────────────────────────────────────────────
//
//  New map layout (70 rows × 90 cols, TILE_SIZE = 32):
//
//  Fragment 1 — South ruins wide path (row 52, col 30)
//               First memory the player is likely to find, on the large ruins corridor.
//
//  Fragment 2 — West forest path (row 36, col 18)
//               Hidden along the western forest clearing corridor.
//
//  Fragment 3 — East mid-forest path (row 39, col 50)
//               Deep in the forest, along the eastern path.
//
//  Fragment 4 — North path approach (row 15, col 22)
//               Very close to the top island — nearly there.
//
// ────────────────────────────────────────────────────────────────────────────

const STORY_MEMORIES = [
	// ── Fragment 1 · South ruins path (row 52, col 30) ────────────
	{
		label: "Fragment 1 — The Ruined Shore",
		worldX: 30 * 32 + 16,
		worldY: 52 * 32 + 16,

		lines: [
			"I still remember the first time",
			"I noticed you.",
			"We were young.",
			"You were looking at the water",
			"like it owed you something.",
			"I couldn't look away.",
		],
	},

	// ── Fragment 2 · West forest path (row 36, col 18) ──
	{
		label: "Fragment 2 — The Overgrown Path",
		worldX: 18 * 32 + 16,
		worldY: 36 * 32 + 16,

		lines: [
			"There were afternoons",
			"we didn't say anything at all.",
			"Just existed in the same space.",
			"That kind of quiet is rare.",
			"I've been chasing it ever since.",
		],
	},

	// ── Fragment 3 · East mid-forest path (row 39, col 50) ──
	{
		label: "Fragment 3 — The Dark Trees",
		worldX: 50 * 32 + 16,
		worldY: 39 * 32 + 16,

		lines: [
			"I used to call you at 2am",
			"just to hear your voice.",
			"I still do it sometimes.",
			"I just don't press call anymore.",
		],
	},

	// ── Fragment 4 · North path approach (row 15, col 22) ──
	{
		label: "Fragment 4 — The Old Courtyard",
		worldX: 22 * 32 + 16,
		worldY: 15 * 32 + 16,

		lines: ["You're close now.", "I can feel it.", "I always could."],
	},
];

// ─── WINGS PICKUP ───────────────────────────────────────────────
const STORY_WINGS_LINES = [
	"For when walking isn't fast enough.",
	"You were always worth running to.",
	"[ You can now fly! ]",
];

// ─── DESTINATION — NOT ENOUGH MEMORIES ──────────────────────────
const STORY_COLLECT_FIRST = [
	"I'm close.",
	"But I should find her memories first.",
];

// ─── THE LETTER ─────────────────────────────────────────────────
const STORY_LETTER = `To Hyacinth,


the way I once found you.


               Always yours,
                    — iweiwei21 💛`;

// ─── EPILOGUE — FADE TO BLACK ────────────────────────────────────
const STORY_EPILOGUE_LINES = [
	"She found you first.",
	"You found her back.",
	"That's the whole story.",
];

// ─── EXPORT CHECK ────────────────────────────────────────────────
console.log(
	"[storyline.js] Loaded — fragments:",
	STORY_MEMORIES.length,
	"| intro screens:",
	STORY_INTRO_LINES.length,
);
