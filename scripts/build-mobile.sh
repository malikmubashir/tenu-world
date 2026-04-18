#!/bin/bash
# Mobile static-export wrapper.
#
# Next.js `output: 'export'` requires every route to be statically
# renderable. Many routes under src/app/* are server-only (Supabase
# auth callback, Stripe webhooks, Claude calls) or edge-runtime
# (OG image generators) and would fail the export.
#
# They also don't belong in the mobile bundle — the Capacitor shell
# calls tenu.world/api/* over HTTPS; OG images are served only to web
# crawlers.
#
# This script moves each path aside for the duration of the build and
# restores it on exit (including on failure). Path-preserving stash:
# "src/app/auth/callback" is stashed to ".mobile-build-stash/src/app/auth/callback"
# so nested names don't collide.

set -e

STASH_ROOT=".mobile-build-stash"

STASH_PATHS=(
  # Server-only routes (Stripe webhook, Claude, R2, Supabase SSR auth).
  "src/app/api"
  "src/app/auth/callback"
  # Edge-runtime dynamic image generators (OG images + favicons).
  # Web-only; the mobile app ships its own PNG icon ladder.
  "src/app/icon.tsx"
  "src/app/apple-icon.tsx"
  "src/app/opengraph-image.tsx"
  # Web-only page trees. Every one below uses async cookies()/headers()
  # and/or Server Actions and is not needed in the Capacitor bundle.
  # Mobile routes live under src/app/(mobile)/.
  "src/app/account"
  "src/app/actions"
  "src/app/auth/accept-terms"
  "src/app/auth/login"
  "src/app/features"
  "src/app/inspection"
  "src/app/legal"
  "src/app/pricing"
  "src/app/stories"
  # Sitemap + robots are web-only. Not harmful in the export but wasted
  # bytes in the mobile bundle (and sitemap.ts references stashed routes).
  "src/app/sitemap.ts"
  "src/app/robots.ts"
)

restore() {
  local status=$?
  if [ ! -d "$STASH_ROOT" ]; then
    exit $status
  fi
  # Restore in reverse order so parents come back after nested children.
  for ((i=${#STASH_PATHS[@]}-1; i>=0; i--)); do
    p="${STASH_PATHS[i]}"
    src="$STASH_ROOT/$p"
    if [ ! -e "$src" ]; then
      continue
    fi
    if [ -e "$p" ]; then
      echo "restore: refusing to overwrite existing $p — kept stash at $src" >&2
      continue
    fi
    mkdir -p "$(dirname "$p")"
    mv "$src" "$p" || {
      echo "restore: mv $src -> $p failed" >&2
    }
  done
  find "$STASH_ROOT" -type d -empty -delete 2>/dev/null || true
  rmdir "$STASH_ROOT" 2>/dev/null || true
  exit $status
}
trap restore EXIT INT TERM

for p in "${STASH_PATHS[@]}"; do
  if [ -e "$p" ]; then
    target="$STASH_ROOT/$p"
    mkdir -p "$(dirname "$target")"
    mv "$p" "$target"
  fi
done

MOBILE_BUILD=1 npx next build
