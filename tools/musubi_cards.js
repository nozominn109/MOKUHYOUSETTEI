// MUSUBI デジタル会員カードを PNG で作る
// 使い方: node tools/musubi_cards.js [デザイン A|B|C] [出力フォルダ]
const { chromium } = require('playwright');
const path = require('path');

const DESIGN = process.argv[2] || 'A';
const OUT_LIB = path.join(__dirname, '..', '投稿ライブラリ', 'MUSUBI_会員カード');
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

// W：くすみピンクベージュの水彩・正方形（希の見本から）
const SIZE = { W: [1080, 1080], T: [1080, 1920] };
const FONTS3 = `<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500&family=Pinyon+Script&family=Shippori+Mincho:wght@400;500;600&display=block" rel="stylesheet">`;
const wc = (c, H, y) => `${FONTS3}<style>
body{background:transparent;width:1080px;height:${H}px;margin:0}
.card{position:absolute;inset:0;overflow:hidden;background:#f3e6df;font-family:'Shippori Mincho',serif;color:#8a6a66}
.wash{position:absolute;inset:-80px;filter:url(#wc)}
.wash i{position:absolute;border-radius:50%;filter:blur(40px)}
.grain{position:absolute;inset:0;filter:url(#grain);opacity:.55}
.frame{position:absolute;inset:44px;border:1px solid #ffffffcc}
.brand{position:absolute;top:${y.brand}px;left:0;right:0;text-align:center;font-family:'Bodoni Moda';font-size:30px;letter-spacing:.6em;padding-left:.6em;color:#9c7a74}
.script{position:absolute;top:${y.brand+40}px;left:0;right:0;text-align:center;font-family:'Pinyon Script';font-size:64px;color:#b98d86}
.no{position:absolute;top:${y.no}px;left:0;right:0;text-align:center;font-family:'Bodoni Moda';font-weight:400;color:#fff;line-height:1;
  font-size:260px;transform:scaleX(.72);letter-spacing:.02em;text-shadow:0 2px 30px #a0706a55}
.no small{font-size:70px;letter-spacing:.06em;margin-right:6px}
.name{position:absolute;top:${y.name}px;left:0;right:0;text-align:center;font-size:${c.blank ? 34 : 44}px;font-weight:500;letter-spacing:.32em;padding-left:.32em;${c.blank ? 'color:#c4aaa3' : ''}}
.date{position:absolute;top:${y.name+70}px;left:0;right:0;text-align:center;font-family:'Bodoni Moda';font-size:20px;letter-spacing:.3em;color:#a8908b}
.date span{font-family:'Shippori Mincho';letter-spacing:.2em;margin-right:12px}
.skill{position:absolute;top:${y.skill}px;left:0;right:0;text-align:center}
.skill small{display:block;font-size:17px;letter-spacing:.4em;color:#b48f88;margin-bottom:12px}
.skill small:before,.skill small:after{content:'';display:inline-block;width:40px;height:1px;background:#c9aaa3;vertical-align:middle;margin:0 16px}
.skill b{font-size:${c.blank ? 26 : 34}px;font-weight:600;letter-spacing:.16em;${c.blank ? 'color:#c4aaa3' : ''}}
.ten{position:absolute;right:92px;top:${y.ten}px;width:132px;height:132px;border-radius:50%;border:1px solid #fff;background:#ffffff38;
  display:flex;flex-direction:column;align-items:center;justify-content:center;color:#9c7a74}
.ten em{font-family:'Pinyon Script';font-style:normal;font-size:30px;line-height:1}
.ten span{font-size:15px;letter-spacing:.14em;margin-top:6px}
</style>
<svg width="0" height="0" style="position:absolute"><filter id="wc"><feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="3" seed="4"/><feDisplacementMap in="SourceGraphic" scale="160"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="9"/><feColorMatrix values="0 0 0 0 .6  0 0 0 0 .45  0 0 0 0 .42  0 0 0 .12 0"/></filter></svg>
<div class="card"><div class="wash" style="transform:scaleY(${H/1080});transform-origin:top">
<i style="width:640px;height:520px;left:-60px;top:-40px;background:#ead0c8"></i>
<i style="width:560px;height:620px;right:-80px;top:120px;background:#e6c4bd"></i>
<i style="width:700px;height:420px;left:120px;bottom:-60px;background:#efdcd2"></i>
<i style="width:380px;height:380px;left:360px;top:300px;background:#dcb3ab;opacity:.75"></i>
<i style="width:300px;height:260px;left:40px;top:560px;background:#f7ece6"></i>
</div><div class="grain"></div><div class="frame"></div>
<div class="ten"><em>the first</em><span>はじまりの10人</span></div>
<div class="brand">MUSUBI</div><div class="script">Member's card</div>
<div class="no"><small>No.</small>${c.no}</div>
<div class="name">${c.name}</div>
<div class="date"><span>入会日</span>${c.date}</div>
<div class="skill"><small>ちょっと詳しいこと</small><b>${c.skill}</b></div></div>`;

D.W = (c) => wc(c, 1080, { brand: 118, no: 300, name: 640, skill: 800, ten: 92 });
D.T = (c) => wc(c, 1920, { brand: 430, no: 740, name: 1200, skill: 1410, ten: 210 });

// M：白〜ベージュの大理石とピオニー（ChatGPTで作った背景）＋金の輪
SIZE.M = [1200, 800];
const BG_M = 'data:image/webp;base64,' + require('fs').readFileSync(path.join(OUT_LIB, '背景_大理石と5本のバラ.webp')).toString('base64');
function goldRing(cx, cy, r, no) {
  const n = parseInt(no, 10);
  const p = [...Array(10)].map((_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 10; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
  let s = `<defs><linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2c682"/><stop offset=".5" stop-color="#b48d45"/><stop offset="1" stop-color="#d7b66a"/></linearGradient></defs>`;
  for (let i = 0; i < 10; i++) for (let j = i + 1; j < 10; j++) s += `<line x1="${p[i][0]}" y1="${p[i][1]}" x2="${p[j][0]}" y2="${p[j][1]}" stroke="url(#gold)" stroke-width="1" opacity=".6"/>`;
  p.forEach((q, i) => {
    s += i + 1 === n
      ? `<circle cx="${q[0]}" cy="${q[1]}" r="17" fill="none" stroke="url(#gold)" stroke-width="1.4"/><circle cx="${q[0]}" cy="${q[1]}" r="11" fill="url(#gold)"/>`
      : `<circle cx="${q[0]}" cy="${q[1]}" r="6" fill="url(#gold)"/>`;
  });
  return s;
}
D.M = (c) => `${FONTS3}<style>
body{background:transparent;width:1200px;height:800px;margin:0}
.card{position:absolute;inset:0;border-radius:36px;overflow:hidden;background:#f6f1ec;font-family:'Shippori Mincho',serif;color:#6e5a50}
.frame{position:absolute;inset:26px;border:1px solid #c8a8607a;border-radius:20px}
.brand{position:absolute;left:300px;top:70px;font-family:'Bodoni Moda';font-size:26px;letter-spacing:.55em;color:#a8854a}
.script{position:absolute;left:296px;top:100px;font-family:'Pinyon Script';font-size:52px;color:#9c7b5e}
.no{position:absolute;left:96px;top:228px;font-family:'Bodoni Moda';color:#5f4d44;line-height:1;font-size:210px;transform:scaleX(.78);transform-origin:left;letter-spacing:.01em}
.no small{font-size:58px;color:#a8854a;margin-right:8px;letter-spacing:.04em}
.gl{position:absolute;left:104px;top:470px;width:360px;height:1px;background:linear-gradient(90deg,#b48d45,#e2c68200)}
.name{position:absolute;left:104px;top:494px;font-size:${c.blank ? 32 : 42}px;font-weight:500;letter-spacing:.28em;${c.blank ? 'color:#b9a89c' : ''}}
.date{position:absolute;left:106px;top:556px;font-size:18px;letter-spacing:.24em;color:#9a877b}
.date b{font-family:'Bodoni Moda';font-weight:400}
.skill{position:absolute;left:104px;top:628px}
.skill small{display:block;font-size:15px;letter-spacing:.34em;color:#a8854a;margin-bottom:8px}
.skill small:before{content:'';display:inline-block;width:30px;height:1px;background:#b48d45;vertical-align:middle;margin-right:12px}
.skill b{font-size:${c.blank ? 24 : 32}px;font-weight:600;letter-spacing:.14em;${c.blank ? 'color:#b9a89c' : ''}}
.ring{position:absolute;left:0;top:0}
.hana{position:absolute;left:0;right:0;bottom:44px;text-align:center;font-family:'Pinyon Script';font-size:28px;color:#a8854a;opacity:.9}
.rcap{position:absolute;left:770px;width:340px;top:452px;text-align:center}
.rcap em{display:block;font-family:'Pinyon Script';font-style:normal;font-size:30px;color:#a8854a;line-height:1}
.rcap span{display:block;font-size:16px;letter-spacing:.3em;color:#8d7464;margin-top:4px}
</style><div class="card"><div style="position:absolute;inset:0;background:url(${BG_M}) center/cover;filter:saturate(.72) sepia(.08) brightness(1.01)"></div><div class="frame"></div>
<svg class="ring" width="1200" height="800">${goldRing(940, 290, 140, c.no)}</svg>
<div class="rcap"><em>the first ten</em><span>はじまりの10人</span></div>
<div class="brand">MUSUBI</div><div class="script">Member's card</div>
<div class="no"><small>No.</small>${c.no}</div><div class="gl"></div>
<div class="name">${c.name}</div><div class="date">入会日　<b>${c.date}</b></div>
<div class="skill"><small>ちょっと詳しいこと</small><b>${c.skill}</b></div>
<div class="hana">So glad I met you</div></div>`;
SIZE.Q = [1080, 1080];
D.Q = (c) => `${FONTS3}<style>
body{background:transparent;width:1080px;height:1080px;margin:0}
.card{position:absolute;inset:0;border-radius:36px;overflow:hidden;background:#f6f1ec;font-family:'Shippori Mincho',serif;color:#6e5a50}
.frame{position:absolute;inset:26px;border:1px solid #c8a8607a;border-radius:20px}
.brand{position:absolute;left:310px;top:84px;font-family:'Bodoni Moda';font-size:26px;letter-spacing:.55em;color:#a8854a}
.script{position:absolute;left:306px;top:114px;font-family:'Pinyon Script';font-size:52px;color:#9c7b5e}
.no{position:absolute;left:92px;top:270px;font-family:'Bodoni Moda';color:#5f4d44;line-height:1;font-size:200px;transform:scaleX(.78);transform-origin:left;letter-spacing:.01em}
.no small{font-size:58px;color:#a8854a;margin-right:8px;letter-spacing:.04em}
.gl{position:absolute;left:100px;top:540px;width:360px;height:1px;background:linear-gradient(90deg,#b48d45,#e2c68200)}
.name{position:absolute;left:100px;top:566px;font-size:${c.blank ? 32 : 42}px;font-weight:500;letter-spacing:.28em;${c.blank ? 'color:#b9a89c' : ''}}
.date{position:absolute;left:102px;top:628px;font-size:18px;letter-spacing:.24em;color:#9a877b}
.date b{font-family:'Bodoni Moda';font-weight:400}
.skill{position:absolute;left:100px;top:710px}
.skill small{display:block;font-size:15px;letter-spacing:.34em;color:#a8854a;margin-bottom:8px}
.skill small:before{content:'';display:inline-block;width:30px;height:1px;background:#b48d45;vertical-align:middle;margin-right:12px}
.skill b{font-size:${c.blank ? 24 : 32}px;font-weight:600;letter-spacing:.14em;${c.blank ? 'color:#b9a89c' : ''}}
.ring{position:absolute;left:0;top:0}
.hana{position:absolute;left:0;right:0;bottom:44px;text-align:center;font-family:'Pinyon Script';font-size:28px;color:#a8854a;opacity:.9}
.rcap{position:absolute;left:640px;width:320px;top:540px;text-align:center}
.rcap em{display:block;font-family:'Pinyon Script';font-style:normal;font-size:30px;color:#a8854a;line-height:1}
.rcap span{display:block;font-size:16px;letter-spacing:.3em;color:#8d7464;margin-top:4px}
</style><div class="card"><div style="position:absolute;inset:0;background:url(${BG_M}) center/cover;filter:saturate(.72) sepia(.08) brightness(1.01)"></div><div class="frame"></div>
<svg class="ring" width="1080" height="1080">${goldRing(800, 400, 115, c.no)}</svg>
<div class="rcap"><em>the first ten</em><span>はじまりの10人</span></div>
<div class="brand">MUSUBI</div><div class="script">Member's card</div>
<div class="no"><small>No.</small>${c.no}</div><div class="gl"></div>
<div class="name">${c.name}</div><div class="date">入会日　<b>${c.date}</b></div>
<div class="skill"><small>ちょっと詳しいこと</small><b>${c.skill}</b></div>
<div class="hana">So glad I met you</div></div>`;

(async () => {
  const b = await chromium.launch();
  const [W, H] = (typeof SIZE !== 'undefined' && SIZE[DESIGN]) || [1200, 756];
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  const only = process.argv[4]; // 1枚だけ作るときのファイル名
  for (const c of CARDS.filter(x => !only || x.file === only)) {
    await p.setContent(`<!doctype html><meta charset="utf-8">${FONTS}${paper()}${D[DESIGN](c)}`, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(OUT, c.file + (process.argv[4] ? '_' + DESIGN : '') + '.png'), omitBackground: true });
    console.log('ok', DESIGN, c.file);
  }
  await b.close();
})();
