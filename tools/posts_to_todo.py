"""投稿ライブラリの投稿文を、TODOページ（daily-plan.html）の「今日の投稿文」に流し込む。

使い方：python3 tools/posts_to_todo.py
- Threads（MUSUBI）：投稿ライブラリ/MUSUBI_Threads/*_投稿.md の「## 11/8（日）」「① 本文」形式
- 田中家：投稿ライブラリ/田中家_Instagram/YYYY-MM-DD_*/台本とキャプション.md の最後の「キャプション案：」〜「ハッシュタグ：」
同じ日付が複数のファイルにあるときは、ファイル名の日付が新しいほうを使う。
daily-plan.html の /* POSTS:BEGIN */ と /* POSTS:END */ の間を書きかえる。
"""
import glob, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.path.join(ROOT, '投稿ライブラリ')
YEAR = 2026
FROM = '2026-11-08'  # これより前の日は、投稿済みかストックに回したので表示しない
NOTE = re.compile(r'^【[^】]*】$')
# 希が書きかえる【】（例：【希の例を1行】【日程が決まったら】）。タイトルの【】とは分ける
FILL = re.compile(r'【[^】]*(希|行|たら|から|書|メモ|例)[^】]*】')


def date_key(m, d):
    return f'{YEAR}-{int(m):02d}-{int(d):02d}'


def parse_threads(path):
    out = {}
    text = open(path, encoding='utf-8').read()
    for sec in re.split(r'\n(?=#{2,3} \d+/\d+)', text):
        h = re.match(r'#{2,3} (\d+)/(\d+)', sec)
        if not h:
            continue
        k = date_key(*h.groups())
        posts, cur = [], None
        for line in sec.split('\n')[1:]:
            mk = re.match(r'^\s*([①②③])\s*(.*)$', line)
            if mk:
                cur = {'label': mk.group(1), 'head': mk.group(2).strip(), 'lines': []}
                posts.append(cur)
            elif cur is not None:
                if line.startswith('## ') or line.startswith('---'):
                    break
                cur['lines'].append(line)
        res = []
        for p in posts:
            ls = '\n'.join(p['lines']).strip('\n').split('\n')
            notes = []
            # 本文のあとに書いた【…】の行は、希へのメモ（コピーしない）。本文の中の【…】はそのまま
            while len(ls) > 1 and (not ls[-1].strip() or NOTE.match(ls[-1].strip())):
                if ls[-1].strip():
                    notes.insert(0, ls[-1].strip())
                ls.pop()
            body = '\n'.join(ls).strip('\n')
            head = p['head']
            if not body:  # 「① 本文」が1行で書かれている形式
                body, head = head, ''
            note = '　'.join(([head] if head else []) + [n.strip('【】') for n in notes])
            if FILL.search(body):
                note = (note + '　' if note else '') + '【】は書きかえてから投稿'
            res.append({'label': 'Threads ' + p['label'], 'text': body, 'note': note})
        if res:
            out[k] = res
    return out


def parse_caption(path):
    lines = open(path, encoding='utf-8').read().split('\n')
    idx = [i for i, l in enumerate(lines) if l.strip().startswith('キャプション案：') or l.strip() == 'キャプション：']
    if not idx:
        return None
    body = []
    for l in lines[idx[-1] + 1:]:
        if l.startswith('ハッシュタグ：'):
            body.append('')
            body.append(l.split('：', 1)[1].strip())
            break
        if l.startswith('## ') or l.startswith('---'):
            break
        body.append(l)
    return '\n'.join(body).strip('\n')


def main():
    posts = {}
    for f in sorted(glob.glob(os.path.join(LIB, 'MUSUBI_Threads', '*_投稿.md'))):
        for k, v in parse_threads(f).items():
            posts.setdefault(k, {})['threads'] = v
    for d in sorted(glob.glob(os.path.join(LIB, '田中家_Instagram', '2026-*'))):
        name = os.path.basename(d)
        k = name[:10]
        f = os.path.join(d, '台本とキャプション.md')
        if not os.path.exists(f):
            continue
        cap = parse_caption(f)
        if cap and '決定稿' in open(f, encoding='utf-8').read():
            title = re.sub(r'^\d{4}-\d{2}-\d{2}_', '', name).replace('_', ' ')
            posts.setdefault(k, {})['reel'] = {'label': '田中家のキャプション', 'title': title, 'text': cap}
    posts = {k: v for k, v in posts.items() if k >= FROM}
    page = os.path.join(ROOT, 'daily-plan.html')
    html = open(page, encoding='utf-8').read()
    js = 'const POSTS = ' + json.dumps(posts, ensure_ascii=False, indent=1, sort_keys=True) + ';'
    new, n = re.subn(r'/\* POSTS:BEGIN \*/.*?/\* POSTS:END \*/', lambda m: '/* POSTS:BEGIN */\n' + js + '\n/* POSTS:END */', html, flags=re.S)
    assert n == 1, 'POSTS markers not found'
    open(page, 'w', encoding='utf-8').write(new)
    for k in sorted(posts):
        print(k, 'threads', len(posts[k].get('threads', [])), 'reel', 'reel' in posts[k])


if __name__ == '__main__':
    main()
