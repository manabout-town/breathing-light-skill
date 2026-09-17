/*
 * breathing-intro.js — 인트로를 duration 뒤에 열고(html.bl-open), 스크롤·탭·키로 건너뛰게 한다.
 * 사용: BreathingIntro.start({ duration: 3000, shape: 'circle', words: ['들이마시고','내쉬고'], onOpen: fn })
 *   shape  'circle'(호흡·원형 구멍) | 'key'(키캡이 한 번 눌림·둥근 사각 구멍) | 'square'(호흡·각진 구멍)
 *          브랜드 성격에 맞춰 고른다 — 웰니스·감성은 circle, 테크·키보드·게임 기기는 key, 건축·가구·편집숍은 square
 *   words  두 줄 문구 [전반, 후반]
 * duration은 CSS --bl-dur와 맞춘다. onOpen에서 히어로 등장 클래스를 붙이면 구멍이 열리는 순간과 겹친다.
 */
(function (root) {
  var R = { key: 22, square: 14 };
  function shapeSvg(shape) {
    if (!R[shape]) return '<circle class="bl-track" cx="50" cy="50" r="49"/><circle class="bl-arc" cx="50" cy="50" r="49" pathLength="308"/>';
    var r = R[shape], a = 'x="1" y="1" width="98" height="98" rx="' + r + '"';
    return '<rect class="bl-track" ' + a + '/><rect class="bl-arc" ' + a + ' pathLength="308"/>';
  }
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
    var shape = o.shape || el.dataset.shape || 'circle';
    el.dataset.shape = shape;
    var svg = el.querySelector('.bl-orb svg');
    if (svg) svg.innerHTML = shapeSvg(shape);
    if (R[shape]) {
      el.style.setProperty('--bl-shape-mask', 'url("data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="' + R[shape] + '"/></svg>') + '")');
    }
    if (o.words) el.querySelectorAll('.bl-say span').forEach(function (s, i) { if (o.words[i]) s.textContent = o.words[i]; });
    setTimeout(open, o.duration || 3000);
    ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(function (t) {
      addEventListener(t, open, { passive: true, once: true });
    });
    return open;
  }
  root.BreathingIntro = { start: start };
})(window);
