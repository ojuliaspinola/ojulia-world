(function () {
  "use strict";

  /* ═══════════════════════════════════════════════════════════════════════
     THE GARDEN.

     One file in, one page out. /garden/notes.md is fetched at load and
     parsed here, in the browser. There is no build step and there is no
     second file to keep in sync — which is the whole reason the garden has
     a chance of surviving past nine notes.

     Everything below is written to be forgiving. Julia types this file on a
     phone. A parser that punishes a typo is a parser that kills the garden,
     so every failure here degrades into something visible and honest
     instead of into a blank page.

     TWO DIALS AND NOTHING ELSE:
       TAG_PATH_MIN  how many notes a tag needs before it earns a button
       SRC           where the notes live
     ═══════════════════════════════════════════════════════════════════════ */

  var SRC          = "/garden/notes.md";
  var TAG_PATH_MIN = 3;

  var TYPES  = ["note", "source", "idea", "concept", "collection"];
  var KINDS  = ["World", "Online", "Books", "Essays", "People",
                "Games", "Music", "Videos", "Movies", "TV"];

  /* field names she might plausibly type, mapped to the five real ones */
  var ALIAS = {
    type: "type", kind: "type", sort: "type",
    tags: "tags", tag: "tags", topics: "tags", topic: "tags",
    source: "source", from: "source", src: "source", shelf: "source",
    cite: "cite", by: "cite", via: "cite", quote: "cite", attribution: "cite",
    flag: "flag", check: "flag", todo: "flag", fixme: "flag"
  };
  var ALIAS_KEYS = Object.keys(ALIAS);

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var el = function (t, c) { var n = document.createElement(t); if (c) n.className = c; return n; };

  /* ── SMALL TOOLS ──────────────────────────────────────────────────────── */

  /* edit distance, capped at 2 — only used to forgive a slipped key */
  function near(a, b) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > 1) return 9;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur[0] = i;
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1,
                          prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
      }
      for (j = 0; j <= b.length; j++) prev[j] = cur[j];
    }
    return prev[b.length];
  }

  function fuzzy(key, list) {
    for (var i = 0; i < list.length; i++) if (list[i] === key) return list[i];
    if (key.length < 3) return null;
    for (i = 0; i < list.length; i++) if (near(key, list[i]) === 1) return list[i];
    return null;
  }

  /* the key a [[wikilink]] and a title are matched on. deliberately blunt:
     case, spacing and trailing punctuation must not stop a link resolving. */
  function key(s) {
    return String(s).toLowerCase()
      .replace(/[‘’“”]/g, "'")
      .replace(/\s+/g, " ")
      .replace(/[.,;:!?'"`]+$/g, "")
      .trim();
  }

  function slugify(s, taken) {
    var base = String(s).toLowerCase()
      .replace(/[‘’“”]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
    if (!base) {                       /* emoji-only, CJK-only, punctuation-only */
      var h = 0, i;
      for (i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
      base = "n" + Math.abs(h).toString(36);
    }
    if (!taken) return base;
    var out = base, n = 2;
    while (taken[out]) out = base + "-" + n++;
    taken[out] = 1;
    return out;
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* ── THE PARSER ───────────────────────────────────────────────────────── */
  /*
     A heading starts a note. That is the entire separator rule: there is
     nothing to close and nothing to forget. Anything before the first
     heading is the instructions at the top of the file, and is skipped.
     Fenced code blocks are respected, so the worked example in those
     instructions is not mistaken for a real note.
  */
  function parse(text) {
    var lines = String(text).replace(/\r\n?/g, "\n").split("\n");
    var notes = [], cur = null, fence = "";

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var f = line.match(/^\s{0,3}(`{3,}|~{3,})/);
      if (f) {
        if (!fence) fence = f[1].charAt(0);
        else if (f[1].charAt(0) === fence) fence = "";
        if (cur) cur.raw.push(line);
        continue;
      }
      if (!fence) {
        var h = line.match(/^\s{0,3}#{1,6}\s*(.*\S)\s*$/);
        if (h) {
          cur = { title: h[1].replace(/\s*#+\s*$/, ""), raw: [],
                  type: "", typeRaw: "", tags: [], source: "",
                  sourceRaw: "", cite: "", flag: "" };
          notes.push(cur);
          continue;
        }
      }
      if (cur) cur.raw.push(line);
    }

    for (i = 0; i < notes.length; i++) fields(notes[i]);
    return notes;
  }

  /* pull the field lines out of a note. everything left over is the body.
     a line only counts as a field if its key is one of the five (or a near
     miss of one) — so a typo bad enough to miss shows up as body text,
     which is exactly how she will notice it. */
  function fields(n) {
    var body = [];
    for (var i = 0; i < n.raw.length; i++) {
      var line = n.raw[i];
      var m = line.match(/^\s{0,3}[-*]?\s*([A-Za-z][A-Za-z ]{0,13}?)\s*:\s*(.*)$/);
      var hit = null;
      if (m) hit = fuzzy(m[1].toLowerCase().replace(/\s+/g, ""), ALIAS_KEYS);
      if (!hit) { body.push(line); continue; }

      var f = ALIAS[hit], v = m[2].trim();
      if (!v) continue;
      if (f === "tags") {
        v.split(/[,;·]/).forEach(function (t) {
          t = t.trim().replace(/^#/, "");
          if (t && n.tags.indexOf(t) < 0) n.tags.push(t);
        });
      } else if (f === "type") {
        if (!n.typeRaw) {
          n.typeRaw = v;
          n.type = fuzzy(v.toLowerCase().replace(/[^a-z]/g, ""), TYPES) || "";
        }
      } else if (f === "source") {
        if (!n.sourceRaw) {
          n.sourceRaw = v;
          var k = fuzzy(v.toLowerCase().replace(/[^a-z]/g, ""),
                        KINDS.map(function (x) { return x.toLowerCase(); }));
          n.source = k ? KINDS[KINDS.map(function (x) { return x.toLowerCase(); }).indexOf(k)] : "";
        }
      } else if (!n[f]) {
        n[f] = v;
      }
    }
    while (body.length && !body[0].trim()) body.shift();
    while (body.length && !body[body.length - 1].trim()) body.pop();
    n.body = body.join("\n");
    if (!n.type) n.type = "note";          /* absent or unrecognised: a note */
    return n;
  }

  /* ── BODY → HTML ──────────────────────────────────────────────────────── */
  /* wikilinks, real links, code and emphasis. everything else is text.
     tokens are lifted out of the raw string first so that escaping can
     never eat a URL and emphasis can never chew through a link. */
  function inline(raw, resolve) {
    var tok = [], n = 0;
    /* NUL sentinels — nothing typeable can collide with them */
    function keep(html) { tok.push(html); return "\u0000" + (n++) + "\u0000"; }

    var s = String(raw);

    s = s.replace(/`([^`\n]+)`/g, function (_, c) {
      return keep("<code>" + esc(c) + "</code>");
    });

    /* [[Title]] or [[Title|what to show]] */
    s = s.replace(/\[\[([^\]\n|]+)(?:\|([^\]\n]+))?\]\]/g, function (whole, t, alt) {
      if (!t.trim()) return whole;          /* [[ ]] is not a link, it is a typo */
      var label = esc((alt || t).trim()) || esc(t.trim());
      var hit = resolve(t.trim());
      if (hit.found) {
        return keep('<a class="wl" href="#' + esc(hit.slug) + '">' + label + "</a>");
      }
      return keep('<a class="wl gh" href="#' + esc(hit.slug) +
                  '" title="not written yet"><i aria-hidden="true">◌</i>' + label +
                  '<b class="hid"> — unwritten</b></a>');
    });

    s = s.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_, t, u) {
      return keep('<a class="ex" href="' + esc(u) + '">' + esc(t) +
                  '<i aria-hidden="true">↗</i></a>');
    });

    s = s.replace(/(^|[\s(])(https?:\/\/[^\s<>)]+[^\s<>).,;:!?'"])/g, function (_, p, u) {
      return p + keep('<a class="ex" href="' + esc(u) + '">' + esc(u.replace(/^https?:\/\//, "")) +
                      '<i aria-hidden="true">↗</i></a>');
    });

    s = esc(s);
    s = s.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/gm, "$1<em>$2</em>");

    return s.replace(/\u0000(\d+)\u0000/g, function (_, i) { return tok[+i]; });
  }

  /* A cite is a person, a markdown link, or a bare URL. A bare URL shows as
     its domain — the whole address in 8px caps is unreadable. */
  function citeHTML(raw) {
    var t = String(raw).trim();
    var bare = t.match(/^(https?:\/\/[^\s]+)$/);
    if (bare) {
      var host = t.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
      return '<a class="ex" href="' + esc(t) + '">' + esc(host) +
             '<i aria-hidden="true">\u2197</i></a>';
    }
    return inline(t, function () { return { found: false, slug: "" }; });
  }

  function bodyHTML(raw, resolve) {
    if (!raw || !raw.trim()) return "";
    var out = "", fence = null, buf = [];
    var blocks = String(raw).split("\n");

    function flush() {
      if (!buf.length) return;
      var t = buf.join("\n").trim();
      if (t) out += "<p>" + inline(t, resolve).replace(/\n/g, "<br>") + "</p>";
      buf = [];
    }

    for (var i = 0; i < blocks.length; i++) {
      var line = blocks[i];
      var f = line.match(/^\s{0,3}(`{3,}|~{3,})/);
      if (f) {
        if (fence === null) { flush(); fence = []; }
        else { out += "<pre>" + esc(fence.join("\n")) + "</pre>"; fence = null; }
        continue;
      }
      if (fence !== null) { fence.push(line); continue; }
      if (!line.trim()) { flush(); continue; }
      buf.push(line);
    }
    if (fence !== null && fence.length) out += "<pre>" + esc(fence.join("\n")) + "</pre>";
    flush();
    return out;
  }

  /* ── THE GARDEN, ASSEMBLED ────────────────────────────────────────────── */
  function build(notes) {
    var byKey = {}, taken = {}, ghosts = {}, i;

    for (i = 0; i < notes.length; i++) {
      var n = notes[i];
      n.slug = slugify(n.title, taken);
      n.backlinks = [];
      n.out = [];
      var k = key(n.title);
      if (!byKey[k]) byKey[k] = n;         /* first title wins a duplicate */
    }

    function resolve(title) {
      var k = key(title), hit = byKey[k];
      if (hit) return { found: true, slug: hit.slug, note: hit };
      if (!ghosts[k]) {
        ghosts[k] = { title: title.trim(), slug: "g-" + slugify(title, taken), from: [] };
      }
      return { found: false, slug: ghosts[k].slug, ghost: ghosts[k] };
    }

    /* first pass builds the links, second pass renders — so a note can link
       forward to one written below it */
    for (i = 0; i < notes.length; i++) {
      var note = notes[i];
      var re = /\[\[([^\]\n|]+)(?:\|[^\]\n]+)?\]\]/g, m;
      while ((m = re.exec(note.body || "")) !== null) {
        if (!m[1].trim()) continue;        /* [[   ]] is a typo, not a ghost */
        var r = resolve(m[1]);
        if (r.found) {
          if (r.note !== note && r.note.backlinks.indexOf(note) < 0) r.note.backlinks.push(note);
          note.out.push(r.note);
        } else if (r.ghost.from.indexOf(note) < 0) {
          r.ghost.from.push(note);
        }
      }
    }

    var tags = {};
    for (i = 0; i < notes.length; i++) {
      notes[i].tags.forEach(function (t) {
        var tk = t.toLowerCase();
        (tags[tk] = tags[tk] || { label: t, notes: [] }).notes.push(notes[i]);
      });
    }

    return { notes: notes, byKey: byKey, resolve: resolve, ghosts: ghosts, tags: tags };
  }

  /* ── DRAWING ──────────────────────────────────────────────────────────── */

  function chip(text, count) {
    var b = el("button", "chip");
    b.type = "button";
    b.innerHTML = '<span>' + esc(text) + '</span>' +
                  (count == null ? "" : '<i>' + count + '</i>');
    return b;
  }

  function meta(n) {
    var wrap = el("p", "n-meta"), bits = [];
    /* if she typed a type nobody recognises, show her word next to the
       kind it was filed under, rather than silently swallowing it */
    var known = n.typeRaw && fuzzy(n.typeRaw.toLowerCase().replace(/[^a-z]/g, ""), TYPES);
    bits.push('<i class="t-' + esc(n.type) + '">' + esc(n.type) + "</i>");
    if (n.typeRaw && !known) bits.push('<i class="odd">' + esc(n.typeRaw) + "</i>");
    if (n.source)            bits.push('<i class="k">' + esc(n.source) + "</i>");
    else if (n.sourceRaw)    bits.push('<i class="k odd">' + esc(n.sourceRaw) + "</i>");
    if (n.cite)              bits.push('<span class="cite">\u2014 ' + citeHTML(n.cite) + "</span>");
    wrap.innerHTML = bits.join("");
    return wrap;
  }

  function tagRow(n, onTag) {
    if (!n.tags.length) return null;
    var p = el("p", "n-tags");
    n.tags.forEach(function (t) {
      var b = el("button", "tg");
      b.type = "button";
      b.textContent = t;
      b.addEventListener("click", function () { onTag(t.toLowerCase()); });
      p.appendChild(b);
    });
    return p;
  }

  function drawNote(n, g, onTag) {
    var art = el("article", "n t-" + n.type);
    art.id = n.slug;
    art.setAttribute("data-hay", hay(n));

    var h = el("h3", "n-t");
    var a = el("a", "n-a");
    a.href = "#" + n.slug;
    a.textContent = n.title;
    h.appendChild(a);
    art.appendChild(h);
    art.appendChild(meta(n));

    if (n.flag) {
      var fl = el("p", "n-flag");
      fl.textContent = n.flag;
      art.appendChild(fl);
    }

    var b = bodyHTML(n.body, g.resolve);
    if (b) {
      var d = el("div", "n-b");
      d.innerHTML = b;
      art.appendChild(d);
    }

    var tr = tagRow(n, onTag);
    if (tr) art.appendChild(tr);

    if (n.backlinks.length) {
      var r = el("p", "n-roots");
      r.innerHTML = '<b>Roots</b>';
      n.backlinks.forEach(function (s) {
        var l = el("a");
        l.href = "#" + s.slug;
        l.textContent = s.title;
        r.appendChild(l);
      });
      art.appendChild(r);
    }
    return art;
  }

  function hay(n) {
    return [n.title, n.body, n.tags.join(" "), n.cite, n.type,
            n.source || n.sourceRaw, n.flag].join(" · ").toLowerCase();
  }

  /* ── HONEST FAILURE ───────────────────────────────────────────────────── */
  function trouble(head, body) {
    var host = $("#bed-host");
    if (!host) return;
    host.innerHTML = "";
    var box = el("div", "trouble");
    var h = el("p", "tr-h"); h.textContent = head;
    var p = el("p", "tr-b"); p.textContent = body;
    var a = el("a", "pill");
    a.href = SRC;
    a.textContent = "Open notes.md →";
    box.appendChild(h); box.appendChild(p); box.appendChild(a);
    host.appendChild(box);
    ["paths", "shelves", "unwritten", "sortbar"].forEach(function (id) {
      var s = document.getElementById(id);
      if (s) s.hidden = true;
    });
  }

  /* ── GO ───────────────────────────────────────────────────────────────── */

  function render(g) {
    var host   = $("#bed-host");
    var query  = "";
    var facet  = null;                         /* {kind:'tag'|'shelf', value} */

    host.innerHTML = "";

    var cards = g.notes.map(function (n) {
      return drawNote(n, g, function (t) { setFacet("tag", t); });
    });
    cards.forEach(function (c) { host.appendChild(c); });

    /* ── the ghosts. a writing list she wrote by accident ──────────────── */
    var gl = $("#ghost-list"), keys = Object.keys(g.ghosts);
    gl.innerHTML = "";
    keys.sort(function (a, b) { return g.ghosts[b].from.length - g.ghosts[a].from.length; });
    keys.forEach(function (k) {
      var gh = g.ghosts[k];
      var li = el("li", "gh-i");
      li.id = gh.slug;
      li.setAttribute("data-hay", (gh.title + " " +
        gh.from.map(function (n) { return n.title; }).join(" ")).toLowerCase());
      var t = el("span", "gh-t");
      t.innerHTML = '<i aria-hidden="true">◌</i>' + esc(gh.title);
      li.appendChild(t);
      var w = el("span", "gh-w");
      w.appendChild(document.createTextNode("wanted by "));
      gh.from.forEach(function (n) {
        var a = el("a"); a.href = "#" + n.slug; a.textContent = n.title;
        w.appendChild(a);
      });
      li.appendChild(w);
      gl.appendChild(li);
    });
    $("#unwritten").hidden = !keys.length;
    $("#ghost-n").textContent = keys.length;

    /* ── the paths. a tag earns a button at TAG_PATH_MIN notes ───────── */
    var pathHost = $("#path-host");
    pathHost.innerHTML = "";
    var tk = Object.keys(g.tags).sort(function (a, b) {
      var d = g.tags[b].notes.length - g.tags[a].notes.length;
      return d || a.localeCompare(b);
    });
    var paths = 0, nears = 0;
    tk.forEach(function (k) {
      var t = g.tags[k], c = t.notes.length;
      if (c >= TAG_PATH_MIN) {
        var b = chip(t.label, c);
        b.setAttribute("data-tag", k);
        b.addEventListener("click", function () { setFacet("tag", k); });
        pathHost.appendChild(b);
        paths++;
      } else { nears++; }
    });
    $("#paths").hidden = !paths;

    /* ── the shelves ─────────────────────────────────────────────────── */
    var shelfHost = $("#shelf-host");
    shelfHost.innerHTML = "";
    var tally = {};
    g.notes.forEach(function (n) { if (n.source) tally[n.source] = (tally[n.source] || 0) + 1; });
    KINDS.forEach(function (k) {
      var c = tally[k] || 0;
      var b = chip(k, c);
      b.className = "chip shelf" + (c ? "" : " none");
      if (!c) b.disabled = true;
      else b.addEventListener("click", function () { setFacet("shelf", k.toLowerCase()); });
      shelfHost.appendChild(b);
    });

    /* Alphabetical. The notes have no order of their own and a date order
       would be a lie about how a garden grows. */
    var byNote = {};
    g.notes.forEach(function (n, i) { byNote[n.slug] = cards[i]; });

    var frag = document.createDocumentFragment();
    g.notes.slice()
      .sort(function (a, b) { return a.title.toLowerCase().localeCompare(b.title.toLowerCase()); })
      .forEach(function (n) { frag.appendChild(byNote[n.slug]); });
    host.appendChild(frag);


    /* ── THE WEB. the whole garden at once, the current note lit ────────
       Edges are a [[link]] she wrote (solid) or a tag two notes share
       (dotted). With 17 notes and 3 links, the tags are what hold it
       together, so they have to be drawn. */
    var web = (function () {
      var host = $("#web"), svg = $("#web-svg");
      if (!host || !svg || !g.notes.length) return { light: function () {}, filter: function () {} };

      var edges = [];
      g.notes.forEach(function (a) {
        a.out.forEach(function (b) {               /* out holds notes, not slugs */
          if (b && b !== a) edges.push({ a: a, b: b, kind: "link" });
        });
      });
      for (var i = 0; i < g.notes.length; i++) {
        for (var j = i + 1; j < g.notes.length; j++) {
          var shared = g.notes[i].tags.filter(function (t) {
            return g.notes[j].tags.indexOf(t) > -1;
          });
          if (shared.length) edges.push({ a: g.notes[i], b: g.notes[j], kind: "tag" });
        }
      }

      /* a few hundred rounds of spring and shove, run once */
      var W = 520, H = 760, P = {};
      g.notes.forEach(function (n, k) {
        var ang = (k / g.notes.length) * Math.PI * 2;
        P[n.slug] = { x: W / 2 + Math.cos(ang) * 190, y: H / 2 + Math.sin(ang) * 275 };
      });
      for (var pass = 0; pass < 240; pass++) {
        edges.forEach(function (e) {
          var p = P[e.a.slug], q = P[e.b.slug];
          var dx = q.x - p.x, dy = q.y - p.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
          var want = e.kind === "link" ? 108 : 205, f = (d - want) * 0.012;
          p.x += dx / d * f; p.y += dy / d * f; q.x -= dx / d * f; q.y -= dy / d * f;
        });
        g.notes.forEach(function (a) {
          g.notes.forEach(function (b) {
            if (a === b) return;
            var p = P[a.slug], q = P[b.slug];
            var dx = q.x - p.x, dy = q.y - p.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
            if (d < 112) { var f = (112 - d) * 0.055; p.x -= dx / d * f; p.y -= dy / d * f; }
          });
          var p = P[a.slug];
          p.x += (W / 2 - p.x) * 0.0028;
          p.y += (H / 2 - p.y) * 0.0028;
          p.x = Math.max(62, Math.min(W - 62, p.x));
          p.y = Math.max(46, Math.min(H - 46, p.y));
        });
      }

      /* whatever shape it settled into, stretch it to fill the frame */
      (function () {
        var xs = [], ys = [];
        g.notes.forEach(function (n) { xs.push(P[n.slug].x); ys.push(P[n.slug].y); });
        var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
        var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
        var padX = 64, padY = 54;
        var sx = (x1 - x0) > 1 ? (W - padX * 2) / (x1 - x0) : 1;
        var sy = (y1 - y0) > 1 ? (H - padY * 2) / (y1 - y0) : 1;
        /* a force graph has no true aspect, so it may stretch a little to
           fill a tall frame — but only a little, or it reads as squashed */
        var k = Math.min(sx, sy);
        var kx = Math.min(sx, k * 1.35), ky = Math.min(sy, k * 1.35);
        var ox = (W - (x1 - x0) * kx) / 2, oy = (H - (y1 - y0) * ky) / 2;
        g.notes.forEach(function (n) {
          P[n.slug].x = ox + (P[n.slug].x - x0) * kx;
          P[n.slug].y = oy + (P[n.slug].y - y0) * ky;
        });
      })();

      var NS = "http://www.w3.org/2000/svg";
      function tag(t, at) {
        var e = document.createElementNS(NS, t);
        for (var k in at) e.setAttribute(k, at[k]);
        return e;
      }
      var lineOf = {}, nodeOf = {};
      edges.forEach(function (e) {
        var ln = tag("line", { class: "w-e " + e.kind,
          x1: P[e.a.slug].x, y1: P[e.a.slug].y, x2: P[e.b.slug].x, y2: P[e.b.slug].y });
        svg.appendChild(ln);
        (lineOf[e.a.slug] = lineOf[e.a.slug] || []).push({ ln: ln, other: e.b.slug });
        (lineOf[e.b.slug] = lineOf[e.b.slug] || []).push({ ln: ln, other: e.a.slug });
      });
      g.notes.forEach(function (n) {
        var gg = tag("g", { class: "w-n", transform: "translate(" + P[n.slug].x + "," + P[n.slug].y + ")" });
        gg.appendChild(tag("circle", { r: 7 }));
        var words = n.title.split(" "), lines = [""], k = 0;
        words.forEach(function (w) {
          if ((lines[k] + " " + w).trim().length > 16) { k++; lines[k] = w; }
          else lines[k] = (lines[k] + " " + w).trim();
        });
        lines.slice(0, 2).forEach(function (ln, m) {
          var t = tag("text", { "text-anchor": "middle", y: 25 + m * 9.5 });
          t.textContent = ln + (m === 1 && lines.length > 2 ? "\u2026" : "");
          gg.appendChild(t);
        });
        gg.addEventListener("click", function () { jump(n.slug); });
        gg.addEventListener("mouseenter", function () { light(n.slug); });
        svg.appendChild(gg);
        nodeOf[n.slug] = gg;
      });
      host.hidden = false;

      var current = null;
      function light(slug) {
        if (current === slug) return;
        current = slug;
        var near = {};
        (lineOf[slug] || []).forEach(function (x) { near[x.other] = 1; });
        Object.keys(nodeOf).forEach(function (k) {
          var c = nodeOf[k];
          c.classList.toggle("on", k === slug);
          c.classList.toggle("near", k !== slug && !!near[k]);
          c.classList.toggle("far", k !== slug && !near[k] && !c.classList.contains("hid"));
          c.querySelector("circle").setAttribute("r", k === slug ? 15 : (near[k] ? 10 : 6.5));
        });
        svg.querySelectorAll(".w-e").forEach(function (l) { l.classList.remove("lit"); });
        (lineOf[slug] || []).forEach(function (x) { x.ln.classList.add("lit"); });
      }
      function jump(slug) {
        var card = document.getElementById(slug);
        if (!card) return;
        card.scrollIntoView({ block: "center", behavior: "smooth" });
        card.classList.add("lit");
        setTimeout(function () { card.classList.remove("lit"); }, 1600);
        light(slug);
      }
      function filter(visible) {
        Object.keys(nodeOf).forEach(function (k) {
          var on = visible[k];
          nodeOf[k].style.display = on ? "" : "none";
        });
        svg.querySelectorAll(".w-e").forEach(function (l) { l.style.display = ""; });
        edges.forEach(function (e, i) {
          var l = svg.querySelectorAll(".w-e")[i];
          if (l) l.style.display = (visible[e.a.slug] && visible[e.b.slug]) ? "" : "none";
        });
      }
      /* the note you are reading is the note the web is showing */
      cards.forEach(function (c) {
        c.addEventListener("mouseenter", function () { light(c.id); });
      });
      light(g.notes.slice().sort(function (a, b) {
        return (lineOf[b.slug] || []).length - (lineOf[a.slug] || []).length;
      })[0].slug);
      return { light: light, filter: filter };
    })();

    /* ── FILTERING. search plus at most one facet ──────────────────────── */
    var input   = $("#q");
    var readout = $("#readout");
    var clear   = $("#clear");
    var everything = Array.prototype.slice.call(document.querySelectorAll("[data-hay]"));

    function matches(node) {
      var h = node.getAttribute("data-hay");
      if (query && h.indexOf(query) < 0) return false;
      if (facet) {
        if (facet.kind === "tag" && h.indexOf(facet.value) < 0) return false;
        if (facet.kind === "shelf" && h.indexOf(facet.value) < 0) return false;
      }
      return true;
    }

    function apply() {
      var shown = 0;
      everything.forEach(function (n) {
        var ok = matches(n);
        n.hidden = !ok;
        if (ok && n.classList.contains("n")) shown++;
      });
      /* a section with nothing left in it steps out of the way */
      [["unwritten", "#ghost-list .gh-i"]].forEach(function (p) {
        var sec = document.getElementById(p[0]);
        if (!sec) return;
        var any = Array.prototype.slice.call(document.querySelectorAll(p[1]))
                    .some(function (x) { return !x.hidden; });
        sec.hidden = !any;
      });
      var empty = $("#nothing");
      empty.hidden = shown > 0;
      var vis = {};
      g.notes.forEach(function (n) {
        var c = document.getElementById(n.slug);
        vis[n.slug] = !!c && !c.hidden;
      });
      web.filter(vis);
      document.querySelectorAll("#path-host .chip").forEach(function (b) {
        b.setAttribute("aria-pressed",
          facet && facet.kind === "tag" && b.getAttribute("data-tag") === facet.value ? "true" : "false");
      });
      say(shown);
    }

    function say(shown) {
      if (shown == null) {
        shown = Array.prototype.slice.call(document.querySelectorAll("#bed-host .n"))
                  .filter(function (n) { return !n.hidden; }).length;
      }
      var total = g.notes.length;
      var bits = shown === total ? total + " notes" : shown + " of " + total + " notes";
      if (facet) bits += " · " + facet.value;
      if (query) bits += ' · "' + query + '"';
      readout.textContent = bits;
      clear.hidden = !(query || facet);
    }

    function setFacet(kind, value) {
      facet = (facet && facet.kind === kind && facet.value === value) ? null : { kind: kind, value: value };
      apply();
      var top = $("#sortbar");
      if (top) top.scrollIntoView({ block: "start", behavior: prefersStill() ? "auto" : "smooth" });
    }

    input.addEventListener("input", function () {
      query = input.value.trim().toLowerCase();
      apply();
    });
    clear.addEventListener("click", function () {
      query = ""; facet = null; input.value = ""; apply(); input.focus();
    });

    /* TYPE ANYWHERE. no box to click into first — but the box is real and
       visible, because a phone has no keyboard to start typing on. */
    document.addEventListener("keydown", function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
        if (e.key === "Escape") { query = ""; input.value = ""; apply(); input.blur(); }
        return;
      }
      if (e.key === "Escape") { query = ""; facet = null; input.value = ""; apply(); return; }
      if (e.key === "Backspace") {
        e.preventDefault();
        input.value = input.value.slice(0, -1);
        query = input.value.trim().toLowerCase();
        input.focus(); apply(); return;
      }
      if (e.key === "/" ) { e.preventDefault(); input.focus(); return; }
      if (e.key.length === 1) {
        e.preventDefault();
        input.value += e.key;
        query = input.value.trim().toLowerCase();
        input.focus(); apply();
      }
    });

    /* ── DEEP LINKS. #slug lands on the note, filters get out of the way ─ */
    function land() {
      var id = decodeURIComponent(location.hash.replace(/^#/, ""));
      if (!id) return;
      var node = document.getElementById(id);
      if (!node) return;
      if (node.hidden || query || facet) {
        query = ""; facet = null; input.value = ""; apply();
      }
      document.querySelectorAll(".lit").forEach(function (n) { n.classList.remove("lit"); });
      node.classList.add("lit");
      node.scrollIntoView({ block: "center", behavior: prefersStill() ? "auto" : "smooth" });
    }
    window.addEventListener("hashchange", land);
    apply();
    land();

    $("#count").textContent = g.notes.length;
    $("#link-n").textContent = g.notes.reduce(function (a, n) { return a + n.out.length; }, 0);
  }

  function prefersStill() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  }

  /* ── FETCH. every branch out of here has to leave something on screen ── */
  if (!window.fetch) {
    trouble("This browser cannot read the garden file.", "");
    return;
  }

  fetch(SRC, { cache: "no-cache" }).then(function (r) {
    if (!r.ok) throw new Error("notes.md came back " + r.status + " " + r.statusText);
    return r.text();
  }).then(function (text) {
    var notes;
    try {
      notes = parse(text);
    } catch (err) {
      trouble("The garden file could not be read.", err.message);
      return;
    }
    if (!notes.length) {
      trouble("No notes yet.", "Nothing in notes.md starts with ##.");
      return;
    }
    try {
      render(build(notes));
      document.documentElement.classList.add("grown");
    } catch (err) {
      trouble("The garden loaded but would not draw.", (err && err.message) || "");
      if (window.console) console.warn(err);
    }
  }).catch(function (err) {
    trouble("The garden file did not load.", (err && err.message) || "");
  });
})();
