# breathing-light — 호흡 인트로 + 창가 빛 히어로 (Claude Code 스킬)

웹사이트 첫 화면에 붙이는 두 가지 연출.

1. **인트로** — 어두운 방에서 원이 한 번 호흡(들이마시고 · 내쉬고, 진행 호 · 파문)한 뒤, 가운데 원이 창처럼 넓어지며 페이지가 드러난다.
2. **히어로 배경** — 커튼 너머 대각선 햇살과 화분 잎 그림자가 호흡 주기로 밝아졌다 어두워지는 WebGL 배경. 사진 없이 화면 전체를 채운다.

의존성 없음 · CSS 1개 + JS 2개 · reduced-motion 대응 · 화면 밖/탭 숨김 시 렌더 정지.
실사용 예: https://align-pilates.vercel.app

## 설치

```bash
git clone https://github.com/manabout-town/breathing-light-skill.git
cd breathing-light-skill && ./install.sh     # → ~/.claude/skills/breathing-light
```

Claude Code에서 "필라테스 사이트에 인트로랑 배경 느낌 히어로 붙여줘"처럼 말하면 스킬이 쓰인다.

## 직접 써보기

```bash
cd skill/breathing-light/assets && python3 -m http.server 8000
# http://localhost:8000/demo.html  (?preset=warm|linen|mint|dusk)
```

## 구성

```
skill/breathing-light/
├── SKILL.md                 작업 순서 · 검증 기준
├── assets/
│   ├── breathing-light.css  인트로 + 캔버스 자리 (--bl-* 변수로 색·길이 조절)
│   ├── breathing-intro.js   BreathingIntro.start({duration, onOpen})
│   ├── window-light.js      WindowLight.mount(canvas, {preset, strength, leaf, ...})
│   └── demo.html
├── references/
│   ├── pitfalls.md          실제로 밟은 함정 6개
│   └── tuning.md            업종별 프리셋 · 세기 조절표
└── scripts/verify.mjs       인트로 시점별 컷 + 폰 폭 검사 (playwright)
```
