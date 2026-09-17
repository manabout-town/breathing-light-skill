/*
 * breathing-intro.js — 인트로를 duration 뒤에 열고(html.bl-open), 스크롤·탭·키로 건너뛰게 한다.
 * 사용: BreathingIntro.start({ duration: 3000, onOpen: function(){ document.body.classList.add('ready') } })
 * duration은 CSS --bl-dur와 맞춘다. onOpen에서 히어로 텍스트 등장 클래스를 붙이면 원이 열리는 순간과 겹친다.
 */
(function (root) {
  function start(o) {
    o = o || {};
    var el = document.getElementById('bl-intro'), html = document.documentElement, opened = false;
    function open() {
      if (opened) return; opened = true;
      html.classList.add('bl-open');
      if (el) el.setAttribute('aria-hidden', 'true');
      if (o.onOpen) o.onOpen();
    }
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) { open(); return open; }
    setTimeout(open, o.duration || 3000);
    ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (t) {
      addEventListener(t, open, { passive: true, once: true });
    });
    return open;
  }
  root.BreathingIntro = { start: start };
})(window);
