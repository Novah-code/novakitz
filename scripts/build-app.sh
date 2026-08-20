#!/usr/bin/env bash
#
# Builds the static bundle that ships inside the Capacitor app.
#
# The app bundle is not the same as the web deploy:
#   - API routes stay on Vercel; the app calls them over HTTPS.
#   - The share/* routes are dynamic segments with no fixed set of ids, so a
#     static export cannot pre-render them. They stay web-only.
#
# Rather than mutate the source tree (and risk leaving it broken when a build
# fails halfway), mirror the project into .appbuild/ and strip those routes
# there. node_modules is symlinked so the mirror costs no install time.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/.appbuild"

# Where the packaged app sends its /api/* calls. Override to point a debug
# build at a preview deployment or a local `next dev`.
: "${NEXT_PUBLIC_API_BASE:=https://www.novakitz.com}"
export NEXT_PUBLIC_API_BASE
export BUILD_TARGET=app

echo "==> API base: $NEXT_PUBLIC_API_BASE"

rm -rf "$OUT"
mkdir -p "$OUT"

echo "==> Mirroring project into .appbuild/"
tar \
  --exclude='./.git' \
  --exclude='./node_modules' \
  --exclude='./.next' \
  --exclude='./.appbuild' \
  --exclude='./ios' \
  --exclude='./android' \
  --exclude='./out' \
  -cf - . | (cd "$OUT" && tar -xf -)

ln -s "$ROOT/node_modules" "$OUT/node_modules"

echo "==> Stripping server-only and dynamic routes"
rm -rf "$OUT/app/api" "$OUT/src/app/api"
rm -rf "$OUT/app/archetype-test/shared" "$OUT/app/profile/shared"

# SEO surface belongs to the website, not the packaged app, and sitemap.ts is a
# dynamic route handler that a static export refuses to pre-render.
rm -f "$OUT/app/sitemap.ts" "$OUT/public/robots.txt"

echo "==> next build (static export)"
cd "$OUT"
npx next build

echo ""
echo "Static app bundle ready: $OUT/out"
