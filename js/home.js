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
    bodies.forEach(function(b){
      var dx = b.cx + b.px - mx, dy = b.cy + b.py - my, d = Math.sqrt(dx*dx+dy*dy) || 1;
      var reach = b.r + 130;
      if (d < reach){ var f = (1 - d/reach) * 34 / b.mass; b.vx += dx/d*f; b.vy += dy/d*f; b.spin += (dx>0?1:-1)*2.6; }
    });
  }, {passive:true});

  bodies.forEach(function(b){
    if(!b.a) return;
    var kick = function(){ b.vy -= 9/b.mass; b.spin += 4/b.mass; };
    b.a.addEventListener('pointerenter', kick);
    b.a.addEventListener('focus', kick);
  });

  var t0 = performance.now();
  function frame(now){
    var t = (now - t0)/1000;
    for (var i=0;i<bodies.length;i++){
      var b = bodies[i];
      b.vx += -0.04 * b.px;
      b.vy += -0.04 * b.py;
      if (live){
        var dx = (b.cx + b.px) - mx, dy = (b.cy + b.py) - my;
        var d = Math.sqrt(dx*dx+dy*dy) || 1;
        var reach = b.r + 135;
        if (d < reach){
          var f = (1 - d/reach); f = Math.pow(f,1.5)*7.4/b.mass;
          b.vx += dx/d*f; b.vy += dy/d*f;
          b.spin += (dy>0? -1:1) * f * 0.22;
        }
      }
      b.vx *= 0.902; b.vy *= 0.902;
      b.px += b.vx;  b.py += b.vy;
      b.spin += b.vx * 0.06;
      b.spin *= 0.93;
      b.rot += b.spin;
      b.rot *= 0.975;
      var bob = Math.sin(t*b.w + b.ph) * b.amp;
      var sway = Math.cos(t*b.w*0.72 + b.ph) * (b.amp*0.42);
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
