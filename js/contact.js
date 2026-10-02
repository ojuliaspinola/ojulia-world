(function () {
  "use strict";
  /* The email addresses copy on click. Nobody wants their mail client
     launched at them; they want the address in their clipboard. */
  document.querySelectorAll('.stn.copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () {
        btn.classList.add('copied');
        clearTimeout(btn._t);
        btn._t = setTimeout(function () { btn.classList.remove('copied'); }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else { fallback(); }

      function fallback() {
        /* no clipboard API, or it was refused: select it so ⌘C works */
        var r = document.createRange();
        r.selectNodeContents(btn.querySelector('.dest'));
        var sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(r);
        try { document.execCommand('copy'); done(); } catch (e) {}
      }
    });
  });
})();
