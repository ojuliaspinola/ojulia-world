# juliaspinola — the site

Three pages so far: **Hello World** (the solar system), **Portfolio** (the lists)
and **Contact** (the transmission).
Plain HTML, CSS and JavaScript. No build step, no framework, no npm. What is in
this folder is exactly what goes on the internet.

## Where things are

- `index.html` — Hello World, the landing page.
- `portfolio/index.html` — the portfolio page, lives at `/portfolio/`.
- `contact/index.html` — the contact page, lives at `/contact/`. No JavaScript.
- `404.html` — shown when an address does not exist.
- `css/base.css` — **the shared world**: the palette, the fonts, the paper, the grain, the off-register print, the focus rings. Change something here and it changes on every page.
- `css/home.css` — only the solar system: planets, sun, the name, the figure.
- `css/portfolio.css` — only the workshop: the lists, the fish tank, the scattered cut-outs.
- `css/contact.css` — only the transmission: the lilac sheet, the aerial, the station board, the empty frames.
- `js/home.js` — the planet physics (push them around; nothing else depends on it).
- `js/portfolio.js` — the fish, and the "Surprise me" button.
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
