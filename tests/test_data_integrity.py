#!/usr/bin/env python3
"""資料完整性測試 — 解析 index.html，檢查店家資料與四個側表的一致性。
用法：
    python3 tests/test_data_integrity.py      # 直接跑，全過 exit 0、有錯 exit 1
    pytest tests/                             # 有裝 pytest 也可

檢查項（專防我們踩過的雷：孤兒 id、座標錯、region 打錯、註解污染、圖檔漏 add）：
  - id 不重複
  - lat/lng 在日本範圍
  - region 值合法
  - photos/PRICES/CLOSED/CHECKED 的 key 都對應真實店家 id（無孤兒）
  - photos 指向本地 images/NNN.jpg 的檔案確實存在
  - CERTAIN_OVERRIDE 與 ASK_OVERRIDE 不重疊
  - CLOSED/CHECKED 的值格式合法（YYYY-MM / YYYY-MM-DD）
"""
import os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
HTML = os.path.join(ROOT, 'index.html')
REGIONS = {'osaka','kyoto','nara','kobe','okinawa','tokyo','hokkaido','kyushu','chubu','hiroshima','tohoku','shikoku'}


def _load():
    html = open(HTML, encoding='utf-8').read()
    # 抓「含 const restaurants 的 <script>」（尾端有 SW 註冊 script，不能用 [-1]）
    js = next(x for x in re.findall(r'<script>(.*?)</script>', html, re.S) if 'const restaurants' in x)

    def table_ids(name):
        m = re.search(r'const %s = \{(.*?)\n\};' % name, js, re.S)
        # 只砍「整行」註解（^\s*//…），不能用 //[^\n]* 否則會砍掉值裡的 https:// URL
        body = re.sub(r'(?m)^\s*//[^\n]*$', '', m.group(1)) if m else ''
        return dict(re.findall(r"(\d+)\s*:\s*'([^']*)'", body))

    arr = re.search(r'const restaurants = \[(.*?)\n\];', js, re.S).group(1)
    starts = [(m.start(), int(m.group(1))) for m in re.finditer(r'\bid:(\d+),\s*rank:', arr)]
    vens = []
    for i, (pos, rid) in enumerate(starts):
        b = arr[pos:(starts[i+1][0] if i+1 < len(starts) else len(arr))]
        reg = re.search(r"region:'([^']*)'", b)
        lat = re.search(r"\blat:\s*([\d.]+)", b); lng = re.search(r"\blng:\s*([\d.]+)", b)
        vens.append({'id': rid, 'region': reg.group(1) if reg else 'osaka',
                     'lat': float(lat.group(1)) if lat else None,
                     'lng': float(lng.group(1)) if lng else None})
    def override_set(name):
        m = re.search(r'const %s = new Set\(\[([^\]]*)\]\)' % name, js)
        return set(int(x) for x in re.findall(r'\d+', m.group(1))) if m else set()

    return {
        'vens': vens,
        'photos': table_ids('photos'), 'prices': table_ids('PRICES'),
        'closed': table_ids('CLOSED'), 'checked': table_ids('CHECKED'),
        'certain': override_set('CERTAIN_OVERRIDE'), 'ask': override_set('ASK_OVERRIDE'),
    }


D = _load()
IDS = set(v['id'] for v in D['vens'])


def test_ids_unique():
    ids = [v['id'] for v in D['vens']]
    dup = [i for i in set(ids) if ids.count(i) > 1]
    assert not dup, f"重複 id: {dup}"


def test_coords_in_japan():
    bad = [v['id'] for v in D['vens']
           if v['lat'] is None or v['lng'] is None
           or not (24 <= v['lat'] <= 46) or not (122 <= v['lng'] <= 154)]
    assert not bad, f"座標超出日本範圍或缺失: {bad}"


def test_region_valid():
    bad = [(v['id'], v['region']) for v in D['vens'] if v['region'] not in REGIONS]
    assert not bad, f"region 值不合法: {bad}"


def test_no_orphan_sidetables():
    for name in ('photos', 'prices', 'closed', 'checked'):
        orphan = [k for k in D[name] if int(k) not in IDS]
        assert not orphan, f"{name} 有孤兒 id（不對應任何店家）: {orphan}"


def test_local_images_exist():
    missing = []
    for k, url in D['photos'].items():
        if not url.startswith('http'):  # 本地 images/NNN.jpg
            if not os.path.isfile(os.path.join(ROOT, url)):
                missing.append((k, url))
    assert not missing, f"photos 指向的本地圖不存在: {missing}"


def test_overrides_disjoint():
    both = D['certain'] & D['ask']
    assert not both, f"同時在 CERTAIN_OVERRIDE 與 ASK_OVERRIDE: {both}"


def test_closed_checked_date_format():
    bad = [(k, v) for k, v in D['closed'].items() if not re.fullmatch(r'\d{4}-\d{2}', v)]
    assert not bad, f"CLOSED 值格式應為 YYYY-MM: {bad}"
    bad = [(k, v) for k, v in D['checked'].items() if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', v)]
    assert not bad, f"CHECKED 值格式應為 YYYY-MM-DD: {bad}"


if __name__ == '__main__':
    tests = [v for k, v in sorted(globals().items()) if k.startswith('test_')]
    fails = 0
    print(f"資料完整性測試（{len(D['vens'])} 家店）")
    for t in tests:
        try:
            t(); print(f"  ✅ {t.__name__}")
        except AssertionError as e:
            fails += 1; print(f"  ❌ {t.__name__}: {e}")
    print(f"\n{'全部通過 🎉' if not fails else f'{fails} 項失敗'}")
    sys.exit(1 if fails else 0)
