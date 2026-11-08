# Finessers / Visual System 02 — Blacktop Command Center

**Intent:** A recognizable streetwear-inspired AI browser, not a generic SaaS dashboard. Preserve the black/neon-lime/graffiti identity while making the actual product feel like a serious, legible browser.

## Visual language
- **Blacktop:** near-black #050705 and #080b08 backgrounds, layered forest-green carbon panels.
- **Acid-lime:** #CAFF24 for focused actions, key headings, progress and the browser frame.
- **Typography:** italic ultra-condensed Barlow Condensed for the Finessers wordmark and large statements, Permanent Marker for the signature motto, DM Mono for controls/telemetry, DM Sans for readable body copy.
- **Browser hardware:** three window-control dots, lime-accented tab strip, secure omnibox, readable viewport and a pinned study copilot.
- **Editorial graffiti:** oversized decorative symbols, angled stamp, crosshairs, faint grids and a kinetic lime capability ticker. Decorations are CSS-based and pointer-inert.
- **UI hierarchy:** browser first, Canvas deadline radar second, supervised computer-use panel third. The AI copilot remains visible alongside the browser on wide displays.
- **Brand detail:** custom F/ favicon and local-beta badges.

## Interaction and performance
- Real navigation buttons, AI prompts, consent switches, Canvas links and browser tabs remain functional.
- Hover states add elevation without changing layout. Keyboard focus rings remain visible.
- Animated ticker, stamp and audio-free decorative waveform stop when the user requests reduced motion.
- Responsive at 1440px desktop and 390px mobile; no horizontal overflow at either tested size.
- No video autoplay, huge generated imagery or background network services were introduced.
- The existing optional background artwork hook `public/finessers-background.webp` is preserved, but the image was **not present in GitHub** during this round. The interface has a CSS-only fallback.

## Visual review
CI executes `npm run visual:snapshots` after the full Chromium suite and uploads four screenshots (desktop/mobile × landing/workspace) as a seven-day GitHub Actions artifact named `finessers-visual-previews`. These use the disconnected local-beta demo state and contain no student account data.

Run locally:
```bash
npm run start:all
npm run visual:snapshots
```

## Product truth
The visual design is a working local beta shell, **not** proof of production-ready public accounts, live Canvas SSO or a logged-in interactive Chrome browser. The actual browser preview remains isolated and read-only; AI computer-use steps still require approval.
