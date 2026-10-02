(function(){
  "use strict";

  /* ── THE FISH ──────────────────────────────────────────────────────────
     Two shoals. BIG are the standalone cut-outs, SMALL came off the sheet.
     To add one: drop the PNG in /assets/img/ and add a line to the right
     list. facesLeft says which way the fish is drawn in its own file.
     ───────────────────────────────────────────────────────────────────── */
  var SHOALS = [
    { facesLeft: true,  scale: 1,    files: [
      "/assets/img/fish1.png", "/assets/img/fish2.png", "/assets/img/fish3.png" ] },
    { facesLeft: false, scale: 0.42, files: [
      "/assets/img/shoal01.png", "/assets/img/shoal02.png", "/assets/img/shoal03.png",
      "/assets/img/shoal04.png", "/assets/img/shoal05.png", "/assets/img/shoal06.png",
      "/assets/img/shoal07.png", "/assets/img/shoal08.png", "/assets/img/shoal09.png",
      "/assets/img/shoal10.png", "/assets/img/shoal11.png", "/assets/img/shoal12.png",
      "/assets/img/shoal13.png", "/assets/img/shoal14.png", "/assets/img/shoal15.png" ] }
  ];

  var FISH = [];
  SHOALS.forEach(function (sh) {
    sh.files.forEach(function (src) {
      FISH.push({ src: src, facesLeft: sh.facesLeft, scale: sh.scale });
    });
  });

  var tank = document.getElementById('tank');
  if (!tank || !FISH.length) return;

  var narrowMQ = window.matchMedia('(max-width:719px)');

  /* deterministic hash-noise: same layout every load, no clumping */
  function rnd(i, salt){
    var x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function build(){
    var narrow = narrowMQ.matches;
    var n = narrow ? 14 : 26;
    var band = 100 / n;
    var frag = document.createDocumentFragment();

    for (var i = 0; i < n; i++){
      var fish  = FISH[i % FISH.length];
      var depth = rnd(i, 2);                       /* 0 = far away, 1 = near */
      var rtl   = rnd(i, 4) < 0.42;                /* some swim the other way */
      /* the small ones vary among themselves as well as by depth */
      var vary  = 0.74 + rnd(i, 7) * 0.52;
      var w     = ((narrow ? 56 : 92) + depth * (narrow ? 60 : 116))
                  * fish.scale * (fish.scale < 1 ? vary : 1);
      var dur   = (narrow ? 78 : 92) + (1 - depth) * 96 + rnd(i, 3) * 36;
      var top   = band * i + band * (0.16 + rnd(i, 1) * 0.66);

      var img = document.createElement('img');
      img.src = fish.src;
      img.alt = '';
      img.className = 'fish' + (rtl ? ' rtl' : '');
      img.decoding = 'async';

      var s = img.style;
      s.setProperty('--top',   top.toFixed(2) + '%');
      s.setProperty('--w',     w.toFixed(0) + 'px');
      s.setProperty('--dur',   dur.toFixed(0) + 's');
      s.setProperty('--delay', '-' + (rnd(i, 5) * dur).toFixed(0) + 's');
      s.setProperty('--op',    (0.12 + depth * 0.14).toFixed(2));
      s.setProperty('--blur',  ((1 - depth) * 1.6).toFixed(2) + 'px');
      s.setProperty('--flip',  (rtl === fish.facesLeft) ? '1' : '-1');
      /* where each fish parks when motion is switched off */
      s.setProperty('--park',  (4 + rnd(i, 6) * 76).toFixed(1) + 'vw');

      frag.appendChild(img);
    }

    while (tank.firstChild) tank.removeChild(tank.firstChild);
    tank.appendChild(frag);
  }

  build();
  if (narrowMQ.addEventListener) narrowMQ.addEventListener('change', build);
  else if (narrowMQ.addListener) narrowMQ.addListener(build);

  /* ── SURPRISE ME. with JS off the button is still a real door. ─────────── */
  var pill = document.getElementById('surprise');
  if (pill){
    var doors = Array.prototype.slice.call(document.querySelectorAll('.cols a.it[href^="http"]'));
    if (doors.length){
      var pick = function(){ return doors[Math.floor(Math.random() * doors.length)].href; };
      pill.setAttribute('href', pick());
      pill.addEventListener('click', function(e){
        e.preventDefault();
        window.location.href = pick();
      });
    }
  }
})();
