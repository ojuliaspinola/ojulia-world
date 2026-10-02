# ojulia.space

Plain HTML, CSS and JavaScript. No build step. This folder is the site.

```
index.html              Hello World
portfolio/index.html    /portfolio/
garden/index.html       /garden/
garden/notes.md         every note in the garden, one file
contact/index.html      /contact/
404.html

css/base.css            palette, fonts, paper, grain — shared by every page
css/home.css  css/portfolio.css  css/garden.css  css/contact.css
js/home.js              planet physics
js/portfolio.js         the fish
js/garden.js            reads notes.md and draws the garden
js/contact.js           copy-to-clipboard on the email addresses

assets/fonts/  assets/img/
netlify.toml  robots.txt
```

## Run it locally

Paths are root-relative, so opening the file directly won't work.

```
python3 -m http.server 8000
```

## Add a garden note

Add four lines to the bottom of `garden/notes.md` and commit. Format is at the
top of that file.

## Add a fish

Drop a transparent PNG in `assets/img/` and add it to a shoal in
`js/portfolio.js`. `facesLeft` says which way it is drawn.

## Colours

`:root` in `css/base.css`. A page overrides `--paper` to change its ground.

## Deploy

Push to `main`. Netlify copies the folder. HTML isn't cached; images and fonts
are, so give a replaced asset a new filename.
