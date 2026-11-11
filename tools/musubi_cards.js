// MUSUBI デジタル会員カードを PNG で作る
// 使い方: node tools/musubi_cards.js [デザイン A|B|C] [出力フォルダ]
const { chromium } = require('playwright');
const path = require('path');

const DESIGN = process.argv[2] || 'A';
const OUT = process.argv[3] || path.join(__dirname, '..', '投稿ライブラリ', 'MUSUBI_会員カード');
const CARDS = [
  { file: 'No001_NOZOMI', name: 'NOZOMI', no: '001', date: '2026.11.11', skill: '腸活の人' },
  { file: 'No002_RINKA',  name: 'RINKA',  no: '002', date: '2026.11.11', skill: 'AIの人' },
  { file: 'No003_未記入', name: '【ニックネーム】', no: '003', date: '2026.11.12', skill: '【ちょっと詳しいこと】', blank: true },
];

// 結び目（水引のような3重の紐）を描く
function knot(cx, cy, s, colors, bg) {
  const pts = [];
  const N = 600;
  for (let i = 0; i <= N; i++) {
    const t = Math.PI / 2 + 0.55 + (i / N) * (2 * Math.PI - 1.1); // 下を開けて紐の端にする
    pts.push([cx + s * (Math.sin(t) + 2 * Math.sin(2 * t)), cy + s * (-Math.cos(t) + 2 * Math.cos(2 * t))]);
  }
  // 両端に垂れる紐
  const a = pts[0], b = pts[pts.length - 1];
  const tail = (p, dir) => { const r = []; for (let k = 1; k <= 40; k++) r.push([p[0] + dir * k * s * 0.02, p[1] + k * s * 0.06]); return r; };
  const all = [...tail(a, -1).reverse(), ...pts, ...tail(b, 1)];
  const widths = [s * 0.42, s * 0.32, s * 0.2, s * 0.08];
  const cols = [bg, ...colors];
  let out = '';
  for (let i = 0; i < all.length - 3; i += 2) {
    const d = `M${all[i][0]},${all[i][1]} L${all[i + 1][0]},${all[i + 1][1]} L${all[i + 3][0]},${all[i + 3][1]}`;
    widths.forEach((w, j) => { out += `<path d="${d}" stroke="${cols[j]}" stroke-width="${w}" fill="none" stroke-linecap="butt" stroke-linejoin="round"/>`; });
  }
  return out;
}

// 10人の輪（その人の番号だけ光る）
function ring(cx, cy, r, no, line, dot, on, fontcol) {
  const n = parseInt(no, 10);
  const p = [...Array(10)].map((_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 10; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
  let s = '';
  for (let i = 0; i < 10; i++) for (let j = i + 1; j < 10; j++) s += `<line x1="${p[i][0]}" y1="${p[i][1]}" x2="${p[j][0]}" y2="${p[j][1]}" stroke="${line}" stroke-width="1.2"/>`;
  p.forEach((q, i) => {
    const me = i + 1 === n;
    s += `<circle cx="${q[0]}" cy="${q[1]}" r="${me ? 17 : 9}" fill="${me ? on : dot}" ${me ? `stroke="${on}" stroke-opacity=".25" stroke-width="16"` : ''}/>`;
  });
  return s;
}

const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700;800&family=Zen+Maru+Gothic:wght@500;700;900&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&display=block" rel="stylesheet">`;
const paper = (base) => `<svg width="0" height="0" style="position:absolute"><filter id="washi"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="7"/><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .45  0 0 0 0 .35  0 0 0 .09 0"/></filter></svg>`;

const D = {};
// A：水引（ご縁を結ぶ）＋落款の「はじまりの十人」
D.A = (c) => `<style>
body{background:transparent;width:1200px;height:756px;margin:0}
.card{position:absolute;inset:0;border-radius:40px;overflow:hidden;background:#f7f1e6;font-family:'Shippori Mincho',serif;color:#2f2a25}
.tex{position:absolute;inset:0;filter:url(#washi)}
.knot{position:absolute;right:0;top:0}
.brand{position:absolute;left:72px;top:64px;font-family:'Cormorant Garamond',serif;font-size:30px;letter-spacing:.42em;color:#a2463a}
.brand small{display:block;font-family:'Shippori Mincho';font-size:17px;letter-spacing:.32em;color:#8b7d6b;margin-top:8px}
.no{font-variant-numeric:lining-nums;position:absolute;left:66px;top:200px;font-family:'Cormorant Garamond',serif;font-weight:500;font-size:250px;line-height:1;color:#2f2a25;letter-spacing:.01em}
.no em{font-style:italic;font-size:70px;color:#a2463a;margin-right:10px;vertical-align:.9em}
.name{position:absolute;left:74px;bottom:118px;font-size:${c.blank ? 36 : 50}px;font-weight:700;letter-spacing:.16em;${c.blank ? 'color:#b0a28c' : ''}}
.date{position:absolute;left:76px;bottom:72px;font-size:19px;letter-spacing:.2em;color:#8b7d6b}
.skill{position:absolute;right:76px;bottom:66px;text-align:right}
.skill small{display:block;font-size:17px;letter-spacing:.3em;color:#a2463a;margin-bottom:12px}
.skill small:before{content:'';display:inline-block;width:46px;height:1px;background:#a2463a;vertical-align:middle;margin-right:14px}
.skill b{font-size:${c.blank ? 28 : 40}px;font-weight:700;letter-spacing:.1em;${c.blank ? 'color:#b0a28c' : ''}}
.seal{position:absolute;left:74px;top:470px;transform:rotate(-4deg);width:118px;height:118px;border:3px solid #b8463a;border-radius:10px;color:#b8463a;
 display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1;opacity:.92}
.seal span{font-size:19px;font-weight:800;letter-spacing:.12em}.seal b{font-size:34px;font-weight:800;letter-spacing:.06em}
.rule{position:absolute;left:72px;right:72px;bottom:178px;height:1px;background:#d7cbb8}
</style><div class="card"><div class="tex"></div>
<svg class="knot" width="1200" height="756">${knot(905, 250, 62, ['#c9a45c', '#f7f1e6', '#b8463a'], '#f7f1e6')}</svg>
<div class="brand">MUSUBI<small>お役立ち合いの、ご縁を結ぶ</small></div>
<div class="no"><em>No.</em>${c.no}</div>
<div class="seal" style="left:auto;right:84px;top:450px"><span>はじまりの</span><b>十人</b></div>
<div class="rule"></div>
<div class="name">${c.name}</div><div class="date">入会日　${c.date}</div>
<div class="skill"><small>ちょっと詳しいこと</small><b>${c.skill}</b></div></div>`;

// B：10人の輪（みんなが、みんなとつながる）
D.B = (c) => `<style>
body{background:transparent;width:1200px;height:756px;margin:0}
.card{position:absolute;inset:0;border-radius:40px;overflow:hidden;background:linear-gradient(135deg,#fbf3e7,#f3e3d3);font-family:'Zen Maru Gothic',sans-serif;color:#3a3029}
.tex{position:absolute;inset:0;filter:url(#washi)}
.brand{position:absolute;left:70px;top:62px;font-size:34px;font-weight:900;letter-spacing:.3em;color:#c0623e}
.brand small{display:block;font-size:17px;font-weight:500;letter-spacing:.24em;color:#8f7e6d;margin-top:10px}
.no{position:absolute;left:62px;top:205px;font-weight:900;font-size:220px;line-height:1;color:#3a3029}
.no span{font-size:60px;color:#c0623e;margin-right:8px}
.name{position:absolute;left:72px;bottom:118px;font-size:${c.blank ? 36 : 52}px;font-weight:700;letter-spacing:.1em;${c.blank ? 'color:#b5a593' : ''}}
.date{position:absolute;left:74px;bottom:70px;font-size:20px;letter-spacing:.14em;color:#8f7e6d}
.ring{position:absolute;right:0;top:0}
.ringcap{position:absolute;right:150px;top:372px;width:240px;text-align:center;font-size:20px;letter-spacing:.2em;color:#c0623e;font-weight:700}
.skill{position:absolute;right:70px;bottom:62px;background:#3a3029;color:#fbf3e7;border-radius:999px;padding:16px 34px 18px;text-align:center}
.skill small{display:block;font-size:15px;letter-spacing:.24em;color:#f2b98f}
.skill b{font-size:${c.blank ? 24 : 34}px;letter-spacing:.06em}
</style><div class="card"><div class="tex"></div>
<svg class="ring" width="1200" height="756">${ring(870, 210, 130, c.no, '#c0623e33', '#d9b79c', '#c0623e')}</svg>
<div class="ringcap">はじまりの10人</div>
<div class="brand">MUSUBI<small>ちょっと知ってるを、分け合う場所</small></div>
<div class="no"><span>No.</span>${c.no}</div>
<div class="name">${c.name}</div><div class="date">入会日 ${c.date}</div>
<div class="skill"><small>ちょっと詳しいこと</small><b>${c.skill}</b></div></div>`;

// C：藍と金の特別なカード（はじまりの10人だけの限定感）
D.C = (c) => `<style>
body{background:transparent;width:1200px;height:756px;margin:0}
.card{position:absolute;inset:0;border-radius:40px;overflow:hidden;background:radial-gradient(circle at 80% 20%,#2c4a6b,#17283d 60%);font-family:'Shippori Mincho',serif;color:#f4ead6}
.tex{position:absolute;inset:0;filter:url(#washi);opacity:.6}
.knot{position:absolute;right:0;top:0;opacity:.95}
.brand{position:absolute;left:72px;top:64px;font-family:'Cormorant Garamond',serif;font-size:32px;letter-spacing:.45em;color:#d9b56c}
.brand small{display:block;font-family:'Shippori Mincho';font-size:17px;letter-spacing:.3em;color:#a9b4c2;margin-top:8px}
.no{font-variant-numeric:lining-nums;position:absolute;left:66px;top:205px;font-family:'Cormorant Garamond',serif;font-size:240px;line-height:1;color:#e8cf95}
.no em{font-style:italic;font-size:66px;color:#a9b4c2;margin-right:10px;vertical-align:.95em}
.badge{position:absolute;right:76px;top:470px;border:1.5px solid #d9b56c;color:#d9b56c;padding:10px 22px;font-size:20px;letter-spacing:.3em;border-radius:4px}
.name{position:absolute;left:74px;bottom:118px;font-size:${c.blank ? 36 : 50}px;font-weight:700;letter-spacing:.16em;${c.blank ? 'color:#7d8a9c' : ''}}
.date{position:absolute;left:76px;bottom:72px;font-size:19px;letter-spacing:.2em;color:#a9b4c2}
.skill{position:absolute;right:76px;bottom:66px;text-align:right}
.skill small{display:block;font-size:17px;letter-spacing:.3em;color:#d9b56c;margin-bottom:12px}
.skill b{font-size:${c.blank ? 28 : 40}px;letter-spacing:.1em;${c.blank ? 'color:#7d8a9c' : ''}}
</style><div class="card"><div class="tex"></div>
<svg class="knot" width="1200" height="756">${knot(905, 250, 62, ['#d9b56c', '#1d324b', '#f4ead6'], '#1d324b')}</svg>
<div class="brand">MUSUBI<small>お役立ち合いの、ご縁を結ぶ</small></div>
<div class="no"><em>No.</em>${c.no}</div>
<div class="badge">はじまりの10人</div>
<div class="name">${c.name}</div><div class="date">入会日　${c.date}</div>
<div class="skill"><small>ちょっと詳しいこと</small><b>${c.skill}</b></div></div>`;

// カラフルな10人の輪（ひとりずつ色がちがう＝いろんな人）
const POP = ['#ff7a59', '#ffb627', '#6cc4a1', '#4aa3df', '#a685e2', '#ff8fab', '#f25c54', '#8cc152', '#2ec4b6', '#ffd23f'];
function popRing(cx, cy, r, no, dotR, meR, line, colors, meStroke) {
  const n = parseInt(no, 10);
  const p = [...Array(10)].map((_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 10; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
  let s = '';
  for (let i = 0; i < 10; i++) for (let j = i + 1; j < 10; j++) s += `<line x1="${p[i][0]}" y1="${p[i][1]}" x2="${p[j][0]}" y2="${p[j][1]}" stroke="${line}" stroke-width="${dotR / 6}" stroke-linecap="round"/>`;
  p.forEach((q, i) => {
    const me = i + 1 === n;
    s += `<circle cx="${q[0]}" cy="${q[1]}" r="${me ? meR : dotR}" fill="${colors[i % colors.length]}" ${me ? `stroke="${meStroke}" stroke-width="${meR / 3}"` : ''}/>`;
  });
  return s;
}
const FONTS2 = `<link href="https://fonts.googleapis.com/css2?family=Mochiy+Pop+One&family=M+PLUS+Rounded+1c:wght@500;700;800&family=Outfit:wght@300;500;700;800&display=block" rel="stylesheet">`;

// P：ポップ（カラフルな10人の輪が主役）
D.P = (c) => `${FONTS2}<style>
body{background:transparent;width:1200px;height:756px;margin:0}
.card{position:absolute;inset:0;border-radius:40px;overflow:hidden;background:#fff6e4;font-family:'M PLUS Rounded 1c',sans-serif;color:#2d2a4a}
.blob{position:absolute;border-radius:50%}
.logo{position:absolute;left:62px;top:52px;display:flex;align-items:center;gap:14px}
.logo b{font-family:'Mochiy Pop One';font-size:50px;color:#ff7a59;letter-spacing:.04em}
.pill{position:absolute;left:66px;top:132px;background:#2d2a4a;color:#fff;border-radius:999px;padding:7px 20px;font-family:'Outfit';font-weight:700;font-size:18px;letter-spacing:.2em}
.no{position:absolute;left:58px;top:220px;font-family:'Mochiy Pop One';font-size:190px;line-height:1;color:#2d2a4a}
.no span{font-size:60px;color:#ff7a59;margin-right:6px}
.name{position:absolute;left:68px;bottom:112px;font-size:${c.blank ? 36 : 50}px;font-weight:800;letter-spacing:.06em;${c.blank ? 'color:#b9ae9c' : ''}}
.date{position:absolute;left:70px;bottom:66px;font-size:21px;font-weight:700;color:#8a8199;letter-spacing:.08em}
.ten{position:absolute;right:122px;top:418px;background:#ffb627;color:#2d2a4a;border-radius:999px;padding:9px 26px;font-weight:800;font-size:24px;transform:rotate(-3deg);box-shadow:0 4px 0 #2d2a4a}
.skill{position:absolute;right:58px;bottom:56px;background:#fff;border:4px solid #2d2a4a;border-radius:26px;padding:12px 30px 16px;text-align:center;transform:rotate(2deg);box-shadow:6px 6px 0 #6cc4a1}
.skill small{display:block;font-size:17px;font-weight:800;color:#ff7a59;letter-spacing:.1em}
.skill b{font-size:${c.blank ? 26 : 38}px;font-weight:800;${c.blank ? 'color:#b9ae9c' : ''}}
</style><div class="card">
<div class="blob" style="width:420px;height:420px;background:#ffe0d3;right:-90px;top:-120px"></div>
<div class="blob" style="width:260px;height:260px;background:#d9f2e6;left:-90px;bottom:-110px"></div>
<div class="blob" style="width:120px;height:120px;background:#dceefa;left:520px;top:-50px"></div>
<svg style="position:absolute;inset:0" width="1200" height="756">${popRing(905, 215, 150, c.no, 20, 34, '#2d2a4a22', POP, '#2d2a4a')}</svg>
<div class="logo"><svg width="56" height="56">${popRing(28, 28, 22, 0, 5, 5, '#2d2a4a33', POP, '#000')}</svg><b>MUSUBI</b></div>
<div class="pill">MEMBER'S CARD</div>
<div class="no"><span>No.</span>${c.no}</div>
<div class="ten">はじまりの10人</div>
<div class="name">${c.name}</div><div class="date">入会日 ${c.date}</div>
<div class="skill"><small>ちょっと詳しいこと</small><b>${c.skill}</b></div></div>`;

// S：シンプルおしゃれ（ロゴが主役・ショップカード風）
D.S = (c) => `${FONTS2}<style>
body{background:transparent;width:1200px;height:756px;margin:0}
.card{position:absolute;inset:0;border-radius:40px;overflow:hidden;background:#fffdf8;font-family:'M PLUS Rounded 1c',sans-serif;color:#2b2622;display:flex}
.left{width:440px;background:#d2653f;color:#fff;position:relative}
.mark{position:absolute;left:50%;top:77px;transform:translateX(-50%)}
.word{position:absolute;left:0;right:0;top:400px;text-align:center;font-family:'Outfit';font-weight:800;font-size:66px;letter-spacing:.14em;padding-left:.14em}
.sub{position:absolute;left:0;right:0;top:486px;text-align:center;font-family:'Outfit';font-weight:500;font-size:17px;letter-spacing:.34em;opacity:.85}
.ten{position:absolute;left:0;right:0;bottom:58px;text-align:center}
.ten span{display:inline-block;border:2px solid #fff;border-radius:999px;padding:8px 24px;font-weight:700;font-size:21px;letter-spacing:.14em}
.right{flex:1;position:relative}
.lab{position:absolute;left:70px;top:72px;font-family:'Outfit';font-weight:500;font-size:20px;letter-spacing:.3em;color:#d2653f}
.no{position:absolute;left:62px;top:96px;font-family:'Outfit';font-weight:300;font-size:250px;line-height:1;letter-spacing:-.01em}
.line{position:absolute;left:70px;right:70px;top:400px;height:2px;background:#2b2622}
.name{position:absolute;left:70px;top:432px;font-size:${c.blank ? 34 : 48}px;font-weight:800;letter-spacing:.08em;${c.blank ? 'color:#b9ae9c' : ''}}
.date{position:absolute;left:72px;top:${c.blank ? 492 : 504}px;font-size:19px;color:#8b8178;letter-spacing:.1em}
.skill{position:absolute;left:70px;bottom:58px;display:flex;align-items:center;gap:18px}
.skill small{background:#2b2622;color:#fff;border-radius:999px;padding:8px 18px;font-size:16px;font-weight:700;letter-spacing:.1em}
.skill b{font-size:${c.blank ? 26 : 36}px;font-weight:800;${c.blank ? 'color:#b9ae9c' : 'color:#d2653f'}}
</style><div class="card"><div class="left">
<svg class="mark" width="300" height="300">${popRing(150, 150, 112, c.no, 13, 22, '#ffffff55', ['#fff'], '#ffd9a8')}</svg>
<div class="word">MUSUBI</div><div class="sub">COMMUNITY MEMBER</div>
<div class="ten"><span>はじまりの10人</span></div></div>
<div class="right"><div class="lab">MEMBER No.</div><div class="no">${c.no}</div><div class="line"></div>
<div class="name">${c.name}</div><div class="date">入会日 ${c.date}</div>
<div class="skill"><small>ちょっと詳しいこと</small><b>${c.skill}</b></div></div></div>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 756 }, deviceScaleFactor: 2 });
  const only = process.argv[4]; // 1枚だけ作るときのファイル名
  for (const c of CARDS.filter(x => !only || x.file === only)) {
    await p.setContent(`<!doctype html><meta charset="utf-8">${FONTS}${paper()}${D[DESIGN](c)}`, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(OUT, c.file + (process.argv[4] ? '_' + DESIGN : '') + '.png'), omitBackground: true });
    console.log('ok', DESIGN, c.file);
  }
  await b.close();
})();
