// MUSUBI「お花スタンプカード」を PNG で作る（ランチ会に参加するたびに、ちがうお花のスタンプが1つ増える）
// 使い方: node tools/musubi_stamp.js [出力フォルダ] [見本=sample]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const LIB = path.join(__dirname, '..', '投稿ライブラリ', 'MUSUBI_会員カード');
const OUT = process.argv[2] || path.join(LIB, 'スタンプ');
const BG = 'data:image/webp;base64,' + fs.readFileSync(path.join(LIB, '背景_大理石と5本のバラ.webp')).toString('base64');

// お花の一覧（回ごとに1つ。花言葉は希が選んだもの）。順番・追加は希と決める
const FLOWERS = [
  { lines: ['5本の', 'バラ'], en: 'ROSE', word: ['あなたに出会えて', 'よかった'] },
  { lines: ['バーベナ'], en: 'VERBENA', word: ['家族の和合・団結'] },
  { lines: ['ジャーマン', 'アイリス'], en: 'IRIS', word: ['素晴らしい出会い'] },
  { lines: ['ハーデン', 'ベルギア'], en: 'HARDENBERGIA', word: ['出会えてよかった'] },
];
const SLOTS = 6;

// stamps: これまでに押したスタンプ [{ n: お花の番号(0始まり), date: '11/12' }]
const card = (m, stamps) => {
  let cells = '';
  for (let i = 0; i < SLOTS; i++) {
    const st = stamps[i];
    if (st) {
      const f = FLOWERS[st.n];
      cells += `<div class="cell"><div class="seal"><div class="in"><small>第${i + 1}回　${st.date}</small>
        <b style="font-size:${Math.max(...f.lines.map(l => l.length)) > 4 ? 21 : 25}px">${f.lines.join('<br>')}</b><i style="letter-spacing:${f.en.length > 8 ? '.04em' : '.16em'};font-size:${f.en.length > 8 ? 11 : 12}px">${f.en}</i></div></div><p>${f.word.join('<br>')}</p></div>`;
    } else {
      cells += `<div class="cell"><div class="seal empty"><span>${i + 1}</span></div><p class="q">次のお花は？</p></div>`;
    }
  }
  return `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500;6..96,600&family=Shippori+Mincho:wght@500;600;700&display=block" rel="stylesheet">
<style>
*{box-sizing:border-box}
body{margin:0;background:transparent;width:1200px;height:800px}
.card{position:absolute;inset:0;border-radius:36px;overflow:hidden;background:#f6f1ec;font-family:'Shippori Mincho',serif;color:#4a3a32}
.bg{position:absolute;inset:0;background:url(${BG}) center/cover;filter:saturate(.72) sepia(.08) brightness(1.01)}
.card div,.card p,.card b{text-shadow:0 0 10px #fbf8f4,0 0 4px #fbf8f4}
.frame{position:absolute;inset:26px;border:1.5px solid #b8944f99;border-radius:20px}
.brand{position:absolute;left:0;right:0;top:44px;text-align:center;font-family:'Bodoni Moda';font-weight:600;font-size:64px;letter-spacing:.3em;padding-left:.3em;color:#7a5c2a;line-height:1}
.title{position:absolute;left:0;right:0;top:124px;text-align:center;font-size:30px;font-weight:700;letter-spacing:.3em;padding-left:.3em}
.grid{position:absolute;left:310px;top:204px;width:640px;display:grid;grid-template-columns:repeat(3,1fr);row-gap:14px}
.cell{text-align:center}
.seal{width:150px;height:150px;margin:0 auto;border-radius:50%;border:3px solid #a8822f;background:#fffaf0cc;padding:6px;box-shadow:0 2px 10px #7a5c2a30;transform:rotate(-3deg)}
.cell:nth-child(2n) .seal{transform:rotate(3deg)}
.seal .in{width:100%;height:100%;border-radius:50%;border:1.5px solid #a8822f;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#7a5c2a}
.seal small{font-size:13px;font-weight:700;letter-spacing:.04em}
.seal b{font-size:25px;font-weight:700;line-height:1.15;margin:3px 0;letter-spacing:.04em}
.seal i{font-family:'Bodoni Moda';font-style:normal;font-size:12px;letter-spacing:.16em}
.seal.empty{border:2px dashed #b8944f99;background:#ffffff55;box-shadow:none;transform:none;display:flex;align-items:center;justify-content:center}
.seal.empty span{font-family:'Bodoni Moda';font-size:44px;color:#b8944f99}
.cell p{margin:8px 0 0;font-size:20px;font-weight:600;line-height:1.35;color:#4a3a32;min-height:54px}
.cell p.q{color:#8d7464;font-weight:500}
.who{position:absolute;left:90px;bottom:62px;font-size:28px;font-weight:600;letter-spacing:.14em}
.who small{display:block;font-family:'Bodoni Moda';font-size:22px;color:#7a5c2a;margin-bottom:2px;letter-spacing:.1em}
</style>
<div class="card"><div class="bg"></div><div class="frame"></div>
<div class="brand">MUSUBI</div><div class="title">お花スタンプカード</div>
<div class="grid">${cells}</div>
<div class="who"><small>No.${m.no}</small>${m.name}</div></div>`;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 2 });
  const jobs = process.argv[3] === 'sample'
    ? [{ file: '見本_4回後', m: { no: '001', name: 'NOZOMI' }, stamps: [0, 1, 2, 3].map((n, i) => ({ n, date: ['11/12', '12/10', '1/14', '2/11'][i] })) },
       { file: '見本_第1回後', m: { no: '001', name: 'NOZOMI' }, stamps: [{ n: 0, date: '11/12' }] }]
    : [];
  for (const j of jobs) {
    await p.setContent(card(j.m, j.stamps), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(OUT, j.file + '.png'), omitBackground: true });
    console.log('ok', j.file);
  }
  await b.close();
})();
