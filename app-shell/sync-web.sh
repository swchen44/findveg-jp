#!/bin/bash
# 把上層 repo 的「網頁資產」複製到 app-shell/www/（Capacitor 打包用）。
# 只複製 app 需要的檔案，不含 python 腳本、.git、docs、app-shell 本身。
set -e
cd "$(dirname "$0")"
SRC=..
DST=www
rm -rf "$DST"; mkdir -p "$DST"
cp "$SRC/index.html"            "$DST/"
cp "$SRC/manifest.json"         "$DST/"
cp "$SRC/sw.js"                 "$DST/"
cp "$SRC/vegan_japan_places.csv" "$DST/"
cp "$SRC/素食溝通卡.html"        "$DST/"
cp "$SRC/素食溝通卡.png"         "$DST/"
cp -R "$SRC/icons"             "$DST/icons"
cp -R "$SRC/images"            "$DST/images"
echo "✅ 已同步網頁資產 → $DST（$(ls "$DST/images" | wc -l | tr -d ' ') 張圖）"
