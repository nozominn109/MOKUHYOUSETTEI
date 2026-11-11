// MUSUBI デジタル会員カードを PNG で作る
// 使い方: node tools/musubi_cards.js   （カードの中身は下の CARDS を書きかえる）
const { chromium } = require('playwright');
const path = require('path');

const OUT = path.join(__dirname, '..', '投稿ライブラリ', 'MUSUBI_会員カード');
const CARDS = [
  { file: 'No001_NOZOMI', name: 'NOZOMI', no: '001', date: '2026.11.11', skill: '腸活の人' },
  { file: 'No002_RINKA',  name: 'RINKA',  no: '002', date: '2026.11.11', skill: 'AIの人' },
  { file: 'No003_未記入', name: '【ニックネーム】', no: '003', date: '2026.11.12', skill: '【ちょっと詳しいこと】', blank: true },
];

const html = (c) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700;900&family=Cormorant+Garamond:wght@600&display=block" rel="stylesheet">
<style>
*{margin:0;box-sizing:border-box}
body{width:1200px;height:756px;background:transparent;font-family:'Zen Maru Gothic',sans-serif}
.card{position:absolute;inset:0;border-radius:44px;overflow:hidden;
  background:radial-gradient(circle at 88% 12%,#f6dcc4 0,transparent 42%),
             radial-gradient(circle at 6% 96%,#dfe8d2 0,transparent 45%),#fbf6ee;
  color:#3d3a33;padding:56px 64px}
.ring{position:absolute;border-radius:50%;border:2px solid #c98c5a33}
.top{display:flex;justify-content:space-between;align-items:flex-start}
.brand{font-family:'Cormorant Garamond',serif;font-size:66px;letter-spacing:.18em;color:#5b6e4a;line-height:1}
.sub{font-size:22px;letter-spacing:.2em;color:#8a7f6e;margin-top:10px}
.seal{width:168px;height:168px;border-radius:50%;background:#c4703f;color:#fff;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  box-shadow:0 0 0 6px #fbf6ee,0 0 0 8px #c4703f;transform:rotate(-8deg);text-align:center}
.seal small{font-size:18px;letter-spacing:.12em;opacity:.9}
.seal b{font-size:30px;font-weight:900;line-height:1.15;margin:4px 0}
.seal i{font-style:normal;font-size:14px;letter-spacing:.2em;opacity:.85}
.no{position:absolute;left:64px;top:250px;font-weight:900;color:#5b6e4a;line-height:1;font-size:200px;letter-spacing:.02em}
.no span{font-size:84px;margin-right:12px;letter-spacing:.04em}
.bottom{position:absolute;left:64px;right:64px;bottom:52px;display:flex;justify-content:space-between;align-items:flex-end}
.name{font-size:${c.blank?44:60}px;font-weight:700;letter-spacing:.08em;${c.blank?'color:#b3a894;':''}}
.date{font-size:22px;color:#8a7f6e;margin-top:10px;letter-spacing:.1em}
.tag{background:#fff;border:3px solid #5b6e4a;border-radius:24px;padding:16px 28px 18px;min-width:300px;text-align:center
  ${c.blank?';border-style:dashed;border-color:#b3a894':''}}
.tag small{display:block;font-size:18px;color:#5b6e4a;letter-spacing:.15em;font-weight:700}
.tag b{display:block;font-size:${c.blank?28:40}px;margin-top:4px;${c.blank?'color:#b3a894;':''}}
</style></head><body><div class="card">
<div class="ring" style="width:520px;height:520px;right:-140px;bottom:-220px"></div>
<div class="ring" style="width:380px;height:380px;right:-70px;bottom:-150px"></div>
<div class="top"><div><div class="brand">MUSUBI</div><div class="sub">MEMBERSHIP CARD</div></div>
<div class="seal"><small>はじまりの</small><b>10人</b><i>FOUNDING</i></div></div>
<div class="no"><span>No.</span>${c.no}</div>
<div class="bottom"><div><div class="name">${c.name}</div><div class="date">入会日 ${c.date}</div></div>
<div class="tag"><small>✿ ちょっと詳しいこと</small><b>${c.skill}</b></div></div>
</div></body></html>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 756 }, deviceScaleFactor: 2 });
  for (const c of CARDS) {
    await p.setContent(html(c), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(OUT, c.file + '.png'), omitBackground: true });
    console.log('ok', c.file);
  }
  await b.close();
})();
