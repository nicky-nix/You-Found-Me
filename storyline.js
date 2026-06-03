// ─── PROLOGUE / INTRO SCREENS ───────────────────────────────────
const STORY_INTRO_LINES = [
	// Screen -1
	"Surpriseeeee this is what i have been making po\n it's a game po muehhe",
	// Screen 0
	"By the end of this game\n i hope ma enjoy nimo po muhehe",

	"Ahem ahem\n Narrator mode muna mueheheh",

	// Screen 1
	"There is a kind of lost\nthat no map can fix.\nThe kind that lives inside you.",

	// Screen 2
	"Not lost in a place.\nLost in yourself.\nWhere your own reflection\nfeels like a stranger.",

	// Screen 3
	"Then she came.\nNot loud.\nNot with noise.\nJust like sunlight\nslips through a curtain.",

	// Screen 4
	"She saw him.\nThe real him.\nThe one he had almost forgotten\nexisted.",

	// Screen 5 — the map clue reveal
	"He left her a letter.\nInside, a map.\nDrawn with a hand that trembled—\na secret too tender to speak,\ntoo precious to burn.",

	// Screen 6 — coordinates with a personal touch
	"X: 76,  Z: -40 (Write this down)\n\nWhen you're ready…\ncome find me.\n\n(She drew a tiny heart beside it.)",

	// Screen 7 — prompt
	"[ tap or press any key\nto set sail ]",
];

// ── MEMORY FRAGMENT LOCATIONS ────────────────────────────────────────────────
// (same coordinates and labels — only the 'lines' arrays changed)

const STORY_MEMORIES = [
	// ── Fragment 1 · (row 52, col 30) ────────────
	{
		label: "Fragment 1 — The Ruined Shore",
		worldX: 30 * 32 + 16,
		worldY: 52 * 32 + 16,

		lines: ["Hey, it's me.", "It's been a while, hasn't it?"],
	},

	// ── Fragment 2 · (row 36, col 18) ──
	{
		label: "Fragment 2 — The Overgrown Path",
		worldX: 18 * 32 + 16,
		worldY: 36 * 32 + 16,
		displayFrames: 420, // ← custom duration (60fps * 7 = 7 seconds)

		lines: ["Do you remember us? We used to call eachother ming2x and doggy"],
	},

	// ── Fragment 3 · East mid-forest path (row 39, col 50) ──
	{
		label: "Fragment 3 — The Dark Trees",
		worldX: 50 * 32 + 16,
		worldY: 39 * 32 + 16,
		displayFrames: 420, // ← custom duration (60fps * 7 = 7 seconds)

		lines: ["That day… when everything changed. Do you remember?"],
	},

	// ── Fragment 4 · North path approach (row 15, col 22) ──
	{
		label: "Fragment 4 — The Old Courtyard",
		worldX: 22 * 32 + 16,
		worldY: 15 * 32 + 16,
		displayFrames: 420, // ← custom duration (60fps * 7 = 7 seconds)
		lines: ["I know you'll find me eventually."],
	},
];

// ─── WINGS PICKUP ───────────────────────────────────────────────
const STORY_WINGS_LINES = [
	"A warmth unlocks in your chest.\nYou remember how to fly.",
];

// ─── DESTINATION — NOT ENOUGH MEMORIES ──────────────────────────
const STORY_COLLECT_FIRST = [
	"She's near.",
	"But I need her memories first.",
	"Without them, I'm still a stranger.",
];

// ─── THE LETTER ─────────────────────────────────────────────────
// (Now a complete, emotional template — see explanation below)
const STORY_LETTER = `To my wifey (Hyacinth Laranjo Baguio) hehe,

Happy 18th Monthsary to us! 🎉

I am writing this letter at 8:30 pm BHWABHWABHWAHB
by the end of this letter I shall announce what time I finished it BWAHBHWBHW

Adi, wifey, ming2x, and all the cs we had, I just want to say thank you for being 
there for me, You Found Me po, I'm truly thankful for you.
I couldn't ask for more unless it's huggiess kissess and lambings;>> muhehehe
I WANTTT MOREEEE muhehe

And ofc if there's thank you there's im sorry
im sorry po my wifey for how I acted sometimes
im really sorry, ur husbanto is working hard to improve
im working hard cause i loveupoo 

toud adi advance happy 18th bday po muhehehe

muehehehehehehe

MUEHEHHEHEHEHEHEHEHEHEH

*/ahem ahem
*/clears throat 
*/leans forward and kisses yaa lipssss AHHHHHHHHHHHHHhh

BHAWBHWABHWAWA

I hope u enjoyed this short game po
i worked on this game for about 3 days straight
and i really learned alatttt

originally for our 18th monthsary I planned to make an interactive 
online letter but i remembered im Dominic and i want to make something
unique for you, pasikat ako muehhehe
I always saw online letter on tiktok but i havent seen someone made a 
game or maybe someone did but not to this extent
so I decided to make one just for you muehehehe 
can i get a kissess poooooooo???


thats probably all for now adi muhehe.....
timecheck toud muhehe its 9:04

stay abit longer po...
ull understand soon po what i mean muheheh

again happy 18th po adi muhehe 
congrats nato po stay strong to us po

I Love You poo my future wifey 

Always yours,
    — iweiwei21 💛`;

// ─── EPILOGUE — FADE TO BLACK ────────────────────────────────────
const STORY_EPILOGUE_LINES = [
	"She found you first.",
	"You found her back.",
	"That's the whole story.",
	"And that was enough.",
];

// ─── EXPORT CHECK ────────────────────────────────────────────────
console.log(
	"[storyline.js] Loaded — fragments:",
	STORY_MEMORIES.length,
	"| intro screens:",
	STORY_INTRO_LINES.length,
);
