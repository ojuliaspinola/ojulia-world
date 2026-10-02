(function(){
  "use strict";
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var els = Array.prototype.slice.call(document.querySelectorAll('.body'));
  if (!els.length) return;

  var bodies = els.map(function(el, i){
    return { el:el, a:el.querySelector('a'), px:0, py:0, vx:0, vy:0, rot:0, spin:0,
             ph:i*1.9+0.4, w:0.55+i*0.13, amp:5+(i%3)*3.5, cx:0, cy:0, r:40, mass:1 };
  });

  function measure(){
    bodies.forEach(function(b){
      var prev = b.el.style.transform;
      b.el.style.transform = 'translate(-50%,-50%)';
      var r = b.el.getBoundingClientRect();
      b.cx = r.left + r.width/2; b.cy = r.top + r.height/2; b.r = r.width/2;
      b.mass = Math.max(0.5, Math.pow(b.r/78, 1.25));
      b.el.style.transform = prev;
    });
  }

  var mx = -9999, my = -9999, live = false;
  window.addEventListener('pointermove', function(e){ mx = e.clientX; my = e.clientY; live = true; }, {passive:true});
  window.addEventListener('pointerleave', function(){ live = false; }, {passive:true});
  window.addEventListener('pointerdown', function(e){
    mx = e.clientX; my = e.clientY; live = true;
    var onPlanet = e.target && e.target.closest ? e.target.closest('.body') : null;
    bodies.forEach(function(b){
      if (b.el === onPlanet) return;          /* never shove the one being clicked */
      var dx = b.cx + b.px - mx, dy = b.cy + b.py - my, d = Math.sqrt(dx*dx+dy*dy) || 1;
      if (d < b.r) return;                    /* pointer is inside it: leave it alone */
      var reach = b.r + 130;
      if (d < reach){ var f = (1 - d/reach) * 34 / b.mass; b.vx += dx/d*f; b.vy += dy/d*f; b.spin += (dx>0?1:-1)*2.6; }
    });
  }, {passive:true});

  /* A planet under the cursor STOPS. It still turns, so it is not dead, but it
     does not travel — a target that drifts between pointerdown and pointerup
     never fires a click at all, which is what made the small ones unhittable. */
  bodies.forEach(function(b){
    if(!b.a) return;
    var hold = function(){ b.hover = true; b.spin += 5/b.mass; };
    var free = function(){ b.hover = false; };
    b.a.addEventListener('pointerenter', hold);
    b.a.addEventListener('pointerleave', free);
    b.a.addEventListener('focus', hold);
    b.a.addEventListener('blur', free);
  });

  var t0 = performance.now();
  function frame(now){
    var t = (now - t0)/1000;
    for (var i=0;i<bodies.length;i++){
      var b = bodies[i];
      b.near = false;
      b.vx += -0.04 * b.px;
      b.vy += -0.04 * b.py;
      if (live){
        var dx = (b.cx + b.px) - mx, dy = (b.cy + b.py) - my;
        var d = Math.sqrt(dx*dx+dy*dy) || 1;
        var rim = b.r * 0.92, reach = b.r + 150;
        if (d < rim){
          b.near = true;   /* cursor is on it — it holds still, see below */
        } else if (d < reach){
          /* Shy, but only at arm's length. The push peaks halfway and falls to
             nothing at the rim, so closing in settles the planet instead of
             shoving it out from under the cursor. */
          var u = (d - rim) / (reach - rim);
          var f = u * (1 - u) * 4 * 1.15 / b.mass;
          b.vx += dx/d*f; b.vy += dy/d*f;
          b.spin += (dy>0? -1:1) * f * 0.22;
        }
      }
      b.vx *= 0.902; b.vy *= 0.902;
      b.px += b.vx;  b.py += b.vy;
      /* A planet never runs further than half its own radius from home, so
         aiming at the middle of one always lands on it. */
      var cap = Math.max(20, b.r * 0.5), off = Math.sqrt(b.px*b.px + b.py*b.py);
      if (off > cap){ var k = cap/off; b.px *= k; b.py *= k; b.vx *= k; b.vy *= k; }
      b.spin += b.vx * 0.06;
      b.spin *= 0.93;
      b.rot += b.spin;
      b.rot *= 0.975;
      var bob = Math.sin(t*b.w + b.ph) * b.amp;
      var sway = Math.cos(t*b.w*0.72 + b.ph) * (b.amp*0.42);
      if (b.hover || b.near){
        /* held: reuse the last position exactly, so it does not move a pixel */
        if (b.hx === undefined){ b.hx = b.px + sway; b.hy = b.py + bob; }
        b.vx = 0; b.vy = 0; b.px = b.hx; b.py = b.hy;
        bob = 0; sway = 0;
      } else if (b.hx !== undefined){  /* released */
        b.hx = undefined; b.hy = undefined;
      }
      var sp = Math.min(Math.sqrt(b.vx*b.vx+b.vy*b.vy)/19, 1);
      var ang = Math.atan2(b.vy, b.vx);
      var ca = Math.abs(Math.cos(ang)), sa = Math.abs(Math.sin(ang));
      var st = b.el.style;
      st.setProperty('--dx', (b.px + sway).toFixed(2)+'px');
      st.setProperty('--dy', (b.py + bob).toFixed(2)+'px');
      st.setProperty('--rz', b.rot.toFixed(2)+'deg');
      st.setProperty('--sx', (1 + sp*0.22*ca - sp*0.15*sa).toFixed(3));
      st.setProperty('--sy', (1 + sp*0.22*sa - sp*0.15*ca).toFixed(3));
    }
    requestAnimationFrame(frame);
  }

  var ro;
  window.addEventListener('load', measure);
  window.addEventListener('resize', function(){ clearTimeout(ro); ro = setTimeout(measure, 140); }, {passive:true});
  window.addEventListener('scroll', measure, {passive:true});
  measure();
  requestAnimationFrame(frame);
})();
