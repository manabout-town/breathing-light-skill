/*
 * window-light.js — 히어로 배경 「호흡하는 창가 빛」 (WebGL, 의존성 없음)
 * 커튼 너머 대각선 햇살 + 화분 잎 그림자 + 먼지 결 + 필름 그레인이 호흡 주기로 밝아졌다 어두워진다.
 *
 * 사용:
 *   HTML: canvas#bl-bg 를 히어로 섹션 안에 두고, 이 파일을 불러온 뒤
 *   JS:   WindowLight.mount(document.getElementById('bl-bg'), { preset: 'warm' })
 *   (주의: 이 주석에 닫는 script 태그 문자열을 쓰지 말 것 — HTML에 인라인하면 거기서 스크립트가 끊긴다)
 *
 * 옵션 (모두 선택):
 *   preset    'warm' | 'linen' | 'dusk' | 'mint' — 아래 PRESETS
 *   base/shade/sun  [r,g,b] 0~1 — 바탕 · 그늘 · 햇빛 색 (preset 덮어씀)
 *   strength  빛 세기 0~1.2 (기본 1)        leaf   잎 그림자 진하기 0~.35 (기본 .22)
 *   period    호흡 주기 초 (기본 8)        sway   커튼 흔들림 속도 배수 (기본 1)
 *   scale     렌더 해상도 배수 (기본 .5)   angle  빛줄기 기울기 [x,y] (기본 [1,.62])
 *   pointer   마우스 따라 빛이 살짝 이동 (기본 true)
 *   narrowStrength  폭 760px 미만에서 쓸 빛 세기 (기본 = strength). 세로 화면은 빛줄기가 넓어져 과해지기 쉽다
 *   mode      'fill'(기본: 배경을 직접 칠함) | 'overlay'(사진 hero 위에 빛만 더함 — 검정 바탕 + screen 합성)
 *   tint      overlay 모드의 빛 색 [r,g,b] (기본 따뜻한 햇빛)
 * 반환: { stop() }
 */
(function (root) {
  var PRESETS = {
    // 밝은 웜 미니멀 (필라테스·요가·카페·스튜디오) — align-pilates에서 검증한 값
    warm:  { base: [.90, .885, .852], shade: [.82, .795, .75],  sun: [1, .968, .912] },
    // 더 밝고 담백한 린넨 (웨딩·꽃집·리빙)
    linen: { base: [.93, .922, .9],   shade: [.87, .855, .826], sun: [1, .985, .955] },
    // 해질녘 짙은 톤 (바·와인·호텔) — 흰 글씨용
    dusk:  { base: [.2, .165, .13],   shade: [.14, .115, .09],  sun: [.46, .34, .23] },
    // 서늘한 민트 (치과·클리닉·스킨케어)
    mint:  { base: [.9, .925, .91],   shade: [.82, .855, .84],  sun: [.985, 1, .99] }
  };

  var FS = [
    'precision mediump float;',
    'uniform vec2 R; uniform float T; uniform vec2 M;',
    'uniform vec3 BASE, SHADE, SUN; uniform float STR, LEAF, PER, SWAY; uniform vec2 ANG;',
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p*=2.03;a*=.5;}return v;}',
    'void main(){',
    '  vec2 uv=gl_FragCoord.xy/R; float asp=R.x/R.y; vec2 p=vec2(uv.x*asp,uv.y);',
    '  float breath=.5-.5*cos(T*6.28318/PER);',
    '  vec2 d=normalize(ANG);',
    '  float s=dot(p+vec2(M.x*.05,M.y*.03),vec2(-d.y,d.x));',            // 빛줄기에 수직인 좌표
    '  float k=fract(s*1.7+.1);',
    '  float pane=smoothstep(.03,.09,k)*smoothstep(.97,.86,k);',          // 창틀 사이 면
    '  float region=smoothstep(-asp*.55,-asp*.2,s)*smoothstep(1.1,.55,s);',
    '  float sway=sin(p.x*6.+T*.9*SWAY+sin(p.y*2.6+T*.5*SWAY)*1.9)*.5+.5;', // 시어 커튼
    '  float haze=fbm(p*2.+vec2(T*.018,-T*.012));',
    '  float light=clamp(pane*region*mix(.45,1.,sway)*(.65+.35*haze)*(.35+.65*breath)*STR,0.,1.);',
    '  vec3 col=mix(SHADE,BASE,smoothstep(0.,.9,uv.y*.6+uv.x*.4));',
    '  col=mix(col,SUN,light);',
    '  float leaf=smoothstep(.52,.6,fbm(p*2.6+vec2(T*.04,sin(T*.5)*.08)));', // 잎 그림자
    '  col-=leaf*light*LEAF;',
    '  col+=(h(gl_FragCoord.xy+fract(T))-.5)*.016;',                     // 그레인
    '  gl_FragColor=vec4(col,1.);',
    '}'].join('\n');

  function mount(cv, o) {
    o = o || {};
    var pr0 = PRESETS[o.preset] || PRESETS.warm;
    var cfg = {
      base: o.base || pr0.base, shade: o.shade || pr0.shade, sun: o.sun || pr0.sun,
      strength: o.strength == null ? 1 : o.strength, leaf: o.leaf == null ? .22 : o.leaf,
      period: o.period || 8, sway: o.sway == null ? 1 : o.sway, scale: o.scale || .5,
      angle: o.angle || [1, .62], pointer: o.pointer !== false
    };
    cfg.narrow = o.narrowStrength == null ? cfg.strength : o.narrowStrength;
    if (o.mode === 'overlay') {
      // 검정 바탕이면 screen 합성에서 아무것도 안 바뀌고 빛줄기만 사진 위에 더해진다
      cfg.base = [.01, .01, .012]; cfg.shade = [0, 0, 0]; cfg.sun = o.tint || [.9, .62, .34];
      cv.classList.add('bl-overlay');
    }
    var hero = cv.parentElement;
    var gl = cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    // WebGL이 없으면 CSS 그라디언트(.on 배경)만 보여줌
    if (!gl) { cv.classList.add('on'); return { stop: function () {} }; }

    function sh(type, src) { var x = gl.createShader(type); gl.shaderSource(x, src); gl.compileShader(x); return x; }
    var pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.classList.add('on'); return { stop: function () {} }; }
    gl.useProgram(pr);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    var U = function (n) { return gl.getUniformLocation(pr, n); };
    var uR = U('R'), uT = U('T'), uM = U('M');
    gl.uniform3fv(U('BASE'), cfg.base); gl.uniform3fv(U('SHADE'), cfg.shade); gl.uniform3fv(U('SUN'), cfg.sun);
    var uS = U('STR'); gl.uniform1f(U('LEAF'), cfg.leaf);
    gl.uniform1f(U('PER'), cfg.period); gl.uniform1f(U('SWAY'), cfg.sway); gl.uniform2fv(U('ANG'), cfg.angle);

    function size() {
      var w = Math.max(1, Math.round(cv.clientWidth * cfg.scale)), h = Math.max(1, Math.round(cv.clientHeight * cfg.scale));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); }
      gl.uniform2f(uR, w, h);
      gl.uniform1f(uS, innerWidth < 760 ? cfg.narrow : cfg.strength);
    }
    var mx = 0, my = 0, tx = 0, ty = 0;
    function onMove(e) { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; }
    if (cfg.pointer) addEventListener('pointermove', onMove, { passive: true });

    var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var visible = true, raf = 0, dead = false, t0 = performance.now();
    function draw(now) {
      raf = 0; if (dead) return; size();
      mx += (tx - mx) * .04; my += (ty - my) * .04;
      gl.uniform1f(uT, RM ? 2.5 : (now - t0) / 1000);  // 시간 기준 → 주사율과 무관
      gl.uniform2f(uM, mx, my);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!RM && visible && !document.hidden) raf = requestAnimationFrame(draw);
    }
    function kick() { if (!raf && !dead) raf = requestAnimationFrame(draw); }
    // 히어로가 화면 밖이거나 탭이 숨으면 멈춤
    var io = new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) kick(); });
    io.observe(hero);
    document.addEventListener('visibilitychange', kick);
    addEventListener('resize', kick);
    kick();
    requestAnimationFrame(function () { cv.classList.add('on'); });
    return {
      stop: function () {
        dead = true; io.disconnect();
        removeEventListener('pointermove', onMove); removeEventListener('resize', kick);
        document.removeEventListener('visibilitychange', kick);
      }
    };
  }

  root.WindowLight = { mount: mount, PRESETS: PRESETS };
})(window);
