// verify.mjs — 인트로 시점별 컷 + 히어로 배경 폰 폭 검사
// 사용: node verify.mjs <url> <출력폴더>   (playwright 필요: npm i -D playwright 또는 기존 설치본 경로에서 실행)
// 왜 이렇게: 헤드리스 WebGL(swiftshader)은 느려서 실시간 타이밍 캡처가 어긋난다.
//            그래서 인트로는 애니메이션을 멈추고 currentTime을 직접 옮겨(seek) 찍는다.
import { chromium } from 'playwright';
const [,, url, out = '.'] = process.argv;
if (!url) { console.error('usage: node verify.mjs <url> <outdir>'); process.exit(1); }
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const log = [];
for (const [w, h] of [[1440, 820], [390, 844], [320, 700]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  p.on('pageerror', e => log.push(`${w} pageerror ${e.message}`));
  p.on('console', m => m.type() === 'error' && log.push(`${w} console ${m.text()}`));
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  for (const t of [300, 1400, 2300]) {
    await p.evaluate(ms => {
      document.documentElement.classList.remove('bl-open');
      document.querySelectorAll('#bl-intro, #bl-intro *').forEach(el => el.getAnimations().forEach(a => { a.pause(); a.currentTime = ms; }));
    }, t);
    await p.screenshot({ path: `${out}/intro-${w}-${t}.png` });
  }
  // 인트로를 열고 히어로 확인
  await p.evaluate(() => { document.documentElement.classList.add('bl-open'); document.getAnimations().forEach(a => a.play()); });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${out}/hero-${w}.png` });
  const r = await p.evaluate(() => {
    const c = document.getElementById('bl-bg'), hero = c && c.parentElement;
    return {
      hscroll: document.documentElement.scrollWidth - innerWidth,
      canvasCss: c ? `${c.clientWidth}x${c.clientHeight}` : 'none',
      heroCss: hero ? `${hero.clientWidth}x${hero.clientHeight}` : 'none',
      on: c ? c.classList.contains('on') : false,
    };
  });
  // 캔버스 높이가 히어로 높이와 다르면 height:100% 누락 (2:1 기본비율 버그)
  const ok = r.hscroll === 0 && r.on && r.canvasCss.split('x')[1] === r.heroCss.split('x')[1];
  log.push(`${w} ${ok ? 'OK' : 'CHECK'} ${JSON.stringify(r)}`);
  await p.close();
}
console.log(log.join('\n'));
await b.close();
