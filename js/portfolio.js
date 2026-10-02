(function(){
  "use strict";

  /* ─────────────────────────────────────────────────────────────────────────
     THE FISH.

     TO ADD A FISH: drop the cut-out PNG into /assets/img/ and add one line
     to this array. That is the whole job. Any number works — one, two, ten.
     Lanes, speeds, sizes, depths and swim directions are all derived from
     the array length, so nothing below needs touching.
     ───────────────────────────────────────────────────────────────────── */
  var FISH = [
    "/assets/img/fish1.png",
    "/assets/img/fish2.png"
  ];

  /* Which way the cut-outs face in the PNG itself. Both fish are drawn
     head-left, so a fish swimming left is used as-is and one swimming right
     is mirrored. If you add a PNG that faces the other way, mirror the file
     before dropping it in and nothing here needs changing. */
  var ART_FACES_LEFT = true;

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
    /* one shoal that scales with however many PNGs exist */
    var n = Math.min(narrow ? 9 : 15, Math.max(narrow ? 6 : 7, FISH.length * (narrow ? 3 : 3)));
    var band = 100 / n;
    var frag = document.createDocumentFragment();

    for (var i = 0; i < n; i++){
      var depth = rnd(i, 2);                       /* 0 = far away, 1 = near */
      var rtl   = rnd(i, 4) < 0.42;                /* some swim the other way */
      var w     = (narrow ? 56 : 92) + depth * (narrow ? 60 : 116);
      var dur   = (narrow ? 78 : 92) + (1 - depth) * 96 + rnd(i, 3) * 36;
      var top   = band * i + band * (0.16 + rnd(i, 1) * 0.66);

      var img = document.createElement('img');
      img.src = FISH[i % FISH.length];
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
      s.setProperty('--flip',  (rtl === ART_FACES_LEFT) ? '1' : '-1');
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
