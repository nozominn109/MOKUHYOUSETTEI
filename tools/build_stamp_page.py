# お花スタンプカードのページ（Artifact用の1枚のHTML）を作る
# 使い方: python3 tools/build_stamp_page.py 背景.jpg 出力.html [1つ目のスタンプ用の写真.jpg]
import base64, sys
bg = base64.b64encode(open(sys.argv[1], 'rb').read()).decode()
rose = base64.b64encode(open(sys.argv[3] if len(sys.argv) > 3 else '投稿ライブラリ/MUSUBI_会員カード/スタンプ_5本のバラの花束.jpg', 'rb').read()).decode()
html = open('tools/stamp_page_template.html', encoding='utf-8').read().replace('__BG__', 'data:image/jpeg;base64,' + bg).replace('__ROSE__', 'data:image/jpeg;base64,' + rose)
open(sys.argv[2], 'w', encoding='utf-8').write(html)
