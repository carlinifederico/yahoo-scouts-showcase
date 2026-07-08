#!/usr/bin/env bash
# ============================================================
# publish.sh — promote a hidden staging delivery to the public site.
# Called by .github/workflows/publish.yml (workflow_dispatch).
#
#   publish.sh <slug> <target> [title]
#     slug   : staging folder at repo root (e.g. s6-scouts-4k8w1z)
#     target : scouts | icons  -> public destination file
#     title  : optional label (used only in the commit message)
#
# What it does:
#   1. Archives the current public file into deliveries/<target>-<ts>/index.html,
#      injecting <base href="/yahoo-scouts-showcase/"> so its root-relative
#      asset refs keep resolving from the archive's deeper folder.
#   2. Promotes <slug>/index.html to the public file, stripping the staging-only
#      bits (noindex meta, the internal ribbon, the stage.js editor) and fixing
#      the "../" shared-asset paths (staging is one level deep; public is root).
#
# NOTE: the stage.js editor stores draft art in the browser only. Before a
# meaningful publish, commit the real media into the staging folder and
# reference it statically (e.g. <img src="media/…">). Empty galleries publish
# as empty.
# ============================================================
set -euo pipefail

SLUG="${1:?slug required}"
TARGET="${2:?target required (scouts|icons)}"
TITLE="${3:-}"

BASE_HREF="/yahoo-scouts-showcase/"

case "$TARGET" in
  scouts) DEST="index.html" ;;
  icons)  DEST="icons.html" ;;
  *) echo "Unknown target: $TARGET (expected scouts|icons)"; exit 2 ;;
esac

SRC="${SLUG}/index.html"
if [ ! -f "$SRC" ]; then
  echo "Staging source not found: $SRC"; exit 3
fi

# 1) Archive the current public file (if any) as a self-contained snapshot.
if [ -f "$DEST" ]; then
  TS="$(date -u +%Y%m%d-%H%M%S)"
  ARC="deliveries/${TARGET}-${TS}"
  mkdir -p "$ARC"
  # inject <base> right after the first <head> so /assets, d5.css, media/... resolve
  sed "0,/<head>/s##<head>\n<base href=\"${BASE_HREF}\">\n<meta name=\"robots\" content=\"noindex\">#" \
    "$DEST" > "${ARC}/index.html"
  echo "Archived previous ${TARGET} -> ${ARC}/index.html"
fi

# 2) Promote staging -> public.
#    - drop the noindex meta, the .stbar ribbon line, and any stage.js include
#    - collapse "../" (staging is one level deep; public sits at repo root)
sed -e '/name="robots" content="noindex/d' \
    -e '/class="stbar"/d' \
    -e '/stage\.js/d' \
    -e 's#\.\./##g' \
    "$SRC" > "$DEST"

echo "Published ${SLUG} -> ${DEST}  (${TITLE})"
