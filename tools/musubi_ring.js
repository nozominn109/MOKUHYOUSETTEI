// 「はじまりの10人」の金の輪を、背景なし（透明）のPNGで作る。Canvaや背景画像に重ねて使う
// 使い方: node tools/musubi_ring.js
const { chromium } = require('playwright');
const path = require('path');
const OUT = path.join(__dirname, '..', '投稿ライブラリ', 'MUSUBI_会員カード');
const ring = (no) => {
  const cx = 300, cy = 270, r = 210;
  const p = [...Array(10)].map((_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 10; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
  let s = '';
  for (let i = 0; i < 10; i++) for (let j = i + 1; j < 10; j++) s += `<line x1="${p[i][0]}" y1="${p[i][1]}" x2="${p[j][0]}" y2="${p[j][1]}" stroke="url(#g)" stroke-width="1.6" opacity=".55"/>`;
  p.forEach((q, i) => {
    s += i + 1 === no
      ? `<circle cx="${q[0]}" cy="${q[1]}" r="30" fill="none" stroke="url(#g)" stroke-width="2"/><circle cx="${q[0]}" cy="${q[1]}" r="20" fill="url(#g)"/>`
      : `<circle cx="${q[0]}" cy="${q[1]}" r="11" fill="url(#g)"/>`;
  });
  return s;
};
const html = (no) => `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Pinyon+Script&family=Shippori+Mincho:wght@500&display=block" rel="stylesheet">
<style>body{margin:0;background:transparent;width:600px;height:640px;text-align:center}
em{display:block;font-family:'Pinyon Script';font-style:normal;font-size:44px;color:#b8924a;margin-top:-6px;line-height:1}
span{display:block;font-family:'Shippori Mincho';font-size:24px;letter-spacing:.3em;color:#a8843f;margin-top:6px}</style>
<svg width="600" height="520"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#e3c77f"/><stop offset=".5" stop-color="#b8924a"/><stop offset="1" stop-color="#d9b866"/></linearGradient></defs>${ring(no)}</svg>
<em>the first ten</em><span>はじまりの10人</span>`;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 600, height: 640 }, deviceScaleFactor: 2 });
  for (const no of [1, 2, 3]) {
    await p.setContent(html(no), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    const f = path.join(OUT, `金の輪_No${String(no).padStart(3, '0')}.png`);
    await p.screenshot({ path: f, omitBackground: true });
    console.log('ok', f);
  }
  await b.close();
})();
