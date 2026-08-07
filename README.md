# juliaspinola — the site

Four pages so far: **Hello World** (the solar system), **Portfolio** (the lists),
**Digital Garden** (the bed) and **Contact** (the transmission).
Plain HTML, CSS and JavaScript. No build step, no framework, no npm. What is in
this folder is exactly what goes on the internet.

## Where things are

- `index.html` — Hello World, the landing page.
- `portfolio/index.html` — the portfolio page, lives at `/portfolio/`.
- `garden/index.html` — the digital garden, lives at `/garden/`.
- `garden/notes.md` — **every note in the garden, in one file.** This is the only file you edit to add a note. It explains its own format at the top.
- `contact/index.html` — the contact page, lives at `/contact/`. No JavaScript.
- `404.html` — shown when an address does not exist.
- `css/base.css` — **the shared world**: the palette, the fonts, the paper, the grain, the off-register print, the focus rings. Change something here and it changes on every page.
- `css/home.css` — only the solar system: planets, sun, the name, the figure.
- `css/portfolio.css` — only the workshop: the lists, the fish tank, the scattered cut-outs.
- `css/garden.css` — only the bed: the moss sheet, the roots, the belief stones, the note columns.
- `css/contact.css` — only the transmission: the lilac sheet, the aerial, the station board, the empty frames.
- `js/home.js` — the planet physics (push them around; nothing else depends on it).
- `js/portfolio.js` — the fish, and the "Surprise me" button.
- `js/garden.js` — reads `garden/notes.md` and draws the garden: the links, the backlinks, the unwritten notes, the tags.
- `assets/fonts/` — Pixelify Sans, Silkscreen, Space Mono, self-hosted so nothing phones out to Google.
- `assets/img/` — every photo and cut-out on the site.
- `netlify.toml` — tells Netlify to publish this folder as-is.

## Preview it on your machine

The pages use root-relative paths (`/css/base.css`, `/portfolio/`), so
double-clicking the HTML file will **not** work — you need a tiny local server.
From this folder:

```
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. `/portfolio/` and `/404.html` work there too.
Ctrl-C stops it. (Any static server is fine — `npx serve`, VS Code Live Server —
as long as it serves *this folder* as the root.)

## Add a note to the garden

Open `garden/notes.md`, scroll to the bottom, and type:

```
## The title of the note
type: note
tags: cyberfeminism, DIY punk
The body. One line is enough. Link with [[Another note]].
```

Commit. It is live in under a minute — you can do the whole thing in the
GitHub web editor on a phone. Only the first line is required. There is no
index to update and nothing to build: the page reads that one file in the
browser and works out the links, the backlinks and the tags itself. The top
of the file explains the format, and the page says so out loud if you break
something rather than going blank.

**One file, on purpose.** A static host cannot list a directory, so one file
per note would mean a second edit — to an index — every single time, and two
edits is how a garden dies.

**When to revisit it.** Not for speed: the page was measured at 300 notes
(125KB, draws in ~1s, filters in ~0.2s) and at 1000 notes (414KB, ~1.5s,
~0.3s), and neither struggles. The thing that gets worse is *typing* — the
limit is how long you are willing to scroll to reach the bottom of the file in
GitHub's editor on a phone. That starts to grate somewhere around **250
notes**, or about 100KB. The fix then is not a build step: it is splitting
into `notes.md`, `notes-2.md`, … and having `js/garden.js` fetch each in turn,
which is a few lines and changes nothing about how a note is written.

## Add a fish

Open `js/portfolio.js`. At the top there is one array:

```js
var FISH = [
  "/assets/img/fish1.png",
  "/assets/img/fish2.png"
];
```

Drop a cut-out PNG (transparent background) into `assets/img/`, add one line to
the array, done. Any number works — one fish or ten. Sizes, speeds, depths,
lanes and swim direction are all worked out from how many are in the list, so
nothing else needs touching.

## Change the colours

All of them are at the top of `css/base.css`, in `:root`:

```css
--paper:#EFE6D2;   /* the ground */
--ink:#14181B;
--teal:#17646B;
--aqua:#59C6C3;    /* the hair colour */
--coral:#E9612F;   /* signal: this link leaves the site */
...
```

Every page reads from those. The portfolio page is a different colour of paper
because `css/portfolio.css` overrides `--paper` and `--paper-2` for that page
only — that is the pattern to copy for a new room: same world, one dial turned.
Same idea for how heavy the print texture is (`--misregister`, `--grain-mul`,
`--grain-overlay`).

## Getting a change live

Edit a file, commit, push to `main`. Netlify rebuilds (there is nothing to
build, so it is a copy) and the change is live in under a minute. HTML is served
with no caching, so you see it immediately; images and fonts are cached hard, so
if you replace one, give it a new filename.

You can do the whole loop in the GitHub web editor from a phone if you want to —
edit, commit, and it deploys.
