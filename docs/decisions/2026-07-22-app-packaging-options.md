# App Packaging — Options & Recommendation (PWA / TWA / Native)

Date: 2026-07-22
Status: **Options doc — decision pending (Shawn/Iggie)**
Task: #13b (New-Asks). This is a decision-first item — no code until a direction is picked.

## Problem
The SBD platform is a live web app (`belt.sterilebydesign.ai`) reached in the browser. Staff use it on
phones on the floor. The ask is to decide whether — and how — to ship it as an "installable app"
(home-screen icon, app-store presence, more native feel) versus staying browser-only.

## What we are today (constrains the options)
Per `ARCHITECTURE.md`: a **vanilla HTML/CSS/JS single-page app, no build step, no bundler, no
framework**, served static on Vercel, backed by Supabase (Auth/Postgres/Edge Functions). This matters:
- We have **no native codebase** and no React Native / Flutter skill surface in the repo.
- The app already works on mobile browsers; the gap is "installability" and app-store discoverability,
  not core functionality.

## Options

### Option 1 — PWA (Progressive Web App) — *recommended first step*
Add a `manifest.webmanifest` (name, icons, `display: standalone`, theme colors) + a service worker
(offline shell / caching) + iOS meta tags. Users "Add to Home Screen"; it launches full-screen with an
icon, no browser chrome.
- **Effort:** ~½–1 day. No rewrite; additive to the existing static app.
- **Reach:** iOS Safari + Android Chrome both support install. No app store needed.
- **Limits:** iOS PWAs have caveats (push notifications supported only iOS 16.4+; limited background;
  no App Store listing). Service worker + our hand-incremented `?v=` cache-busting must be reconciled so
  the SW doesn't serve stale JS (real risk given our cache-bust convention — must be designed carefully).
- **Prereq for everything below:** both TWA and a hybrid wrapper build *on top of* a PWA.

### Option 2 — TWA (Trusted Web Activity) — Android/Play Store only
Wrap the PWA in a thin Android shell (Bubblewrap) so it can be **published to the Google Play Store**
while still loading the live web app. Requires Digital Asset Links verification on our domain.
- **Effort:** ~1–2 days *after* the PWA exists + a Play Console account ($25 one-time) + signing setup.
- **Reach:** Play Store listing, Android only. **iOS has no TWA equivalent** — Apple does not allow a
  pure web wrapper on the App Store (guideline 4.2 rejects "just a website").
- **Best when:** Android Play-Store presence is genuinely wanted; otherwise the PWA already covers Android.

### Option 3 — Native / hybrid (Capacitor) — both stores, most work
Wrap the web app with **Capacitor** (keeps our HTML/JS, adds native shells + plugins for push/camera/etc.)
to ship real iOS + Android app-store builds; or a full native/React-Native rewrite (not justified).
- **Effort:** Capacitor wrap ~1–2 weeks incl. store setup, signing, review cycles, and CI for two
  binaries; Apple Developer account ($99/yr) + Play Console. Full rewrite = months (rejected — no driver).
- **Reach:** both stores, native APIs (real push, biometrics, offline).
- **Cost:** ongoing — every release now means store review + versioned binaries, not just a Vercel deploy.

## Comparison

| | PWA | TWA | Capacitor |
|---|---|---|---|
| Effort | ½–1 day | +1–2 days | 1–2 weeks |
| iOS install | Yes (Add to Home Screen) | No | Yes (App Store) |
| Android install | Yes | Yes (Play Store) | Yes (Play Store) |
| App-store listing | No | Android only | Both |
| Native push (iOS) | 16.4+ only | n/a | Full |
| Rewrite needed | No | No | No (wrap) / Yes (RN) |
| Release friction | Vercel deploy | + Play review | + two store reviews |
| Recurring cost | $0 | $25 once | $99/yr + $25 |

## Recommendation
**Do the PWA now (Option 1); defer TWA/native until there's a concrete driver.** It's the cheapest, has
no rewrite, covers both platforms for installability, and is the mandatory foundation for TWA/Capacitor
anyway. Only escalate to TWA (Android store presence) or Capacitor (both stores + real native push) if a
specific requirement appears — e.g. "must be discoverable in the App Store" or "must have reliable iOS
push." The one real engineering task inside the PWA is making the **service worker cache strategy respect
our `?v=` cache-busting** so staff never get stale JS.

## Open questions for the deciders
1. Is **app-store presence** actually required, or is a home-screen install enough? (This alone chooses
   PWA-only vs TWA/Capacitor.)
2. Is **reliable push notification** a hard requirement (and on iOS specifically)? (Pushes toward Capacitor.)
3. Any need for **offline use** on the floor, or is the app always online? (Shapes the service-worker scope.)

## Next step
On a "PWA" decision, the build is: add `manifest.webmanifest` + icon set + iOS meta tags in `index.html`,
a versioned service worker aligned to the `?v=` scheme, and an install prompt. Small, additive, no
migration.
