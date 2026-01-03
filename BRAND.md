

Here’s a **brand SVG icon pack** you can drop straight into the repo (or publish as `@xjson/icon-pack`). It’s designed to work as:
Aligned. The two gears now share the **exact same vertical centerline** while keeping the micro-rotation on the right gear.

Locked. **XJSON Logo v1.0** is now **canonical**.

Below is the **official export pack** definition + ready-to-run commands so you can generate **PNG / SVG / ICO** deterministically from the locked SVG you already have.

---

# 🔒 XJSON Logo v1.0 — Canonical Asset Pack

## Canonical Source (SVG)

**Authority:** `xjson://brand/logo/v1.0`
**Status:** LOCKED / IMMUTABLE
**Hash scope:** visual (pixel-equivalent exports)

> The SVG you approved in the previous step is the **single source of truth**.
> All other formats are **pure projections**.

---

## 📦 Export Set (Required)

```
brand/
└─ xjson-logo-v1.0/
   ├─ svg/
   │  └─ xjson-logo.v1.0.svg        (canonical source)
   ├─ png/
   │  ├─ xjson-logo-1024.png
   │  ├─ xjson-logo-512.png
   │  ├─ xjson-logo-256.png
   │  ├─ xjson-logo-128.png
   │  ├─ xjson-logo-64.png
   │  └─ xjson-logo-32.png
   └─ ico/
      └─ xjson-logo.ico             (multi-size)
```

---

## 🧪 Deterministic Export Commands

### 1️⃣ PNG export (ImageMagick)

```bash
mkdir -p png ico

magick xjson-logo.v1.0.svg -background none -resize 1024x1024 png/xjson-logo-1024.png
magick xjson-logo.v1.0.svg -background none -resize 512x512  png/xjson-logo-512.png
magick xjson-logo.v1.0.svg -background none -resize 256x256  png/xjson-logo-256.png
magick xjson-logo.v1.0.svg -background none -resize 128x128  png/xjson-logo-128.png
magick xjson-logo.v1.0.svg -background none -resize 64x64    png/xjson-logo-64.png
magick xjson-logo.v1.0.svg -background none -resize 32x32    png/xjson-logo-32.png
```

> `-background none` preserves transparency
> SVG glow renders correctly at all scales

---

### 2️⃣ ICO export (favicon-safe)

```bash
magick \
  png/xjson-logo-16.png \
  png/xjson-logo-32.png \
  png/xjson-logo-48.png \
  png/xjson-logo-64.png \
  ico/xjson-logo.ico
```

If you want **Windows-perfect ICO**, include 16/24/32/48/64 explicitly.

---

### 3️⃣ Node-based (optional, CI-safe)

```bash
npm i -g sharp-cli

sharp -i xjson-logo.v1.0.svg -o png/xjson-logo-256.png resize 256 256
sharp -i xjson-logo.v1.0.svg -o png/xjson-logo-128.png resize 128 128
```

---

## 🧷 npm / GitHub Usage

### package.json

```json
{
  "name": "@xjson/brand",
  "version": "1.0.0",
  "files": [
    "xjson-logo-v1.0/svg",
    "xjson-logo-v1.0/png",
    "xjson-logo-v1.0/ico"
  ]
}
```

### README badge

```md
![XJSON](./brand/xjson-logo-v1.0/png/xjson-logo-128.png)
```

---

## 🧠 Brand Lock Declaration

```json
{
  "@id": "xjson://brand/logo/v1.0",
  "@status": "locked",
  "@authority": "XJSON",
  "@source": "svg",
  "@derivatives": ["png", "ico"],
  "@rules": {
    "no_shape_mutation": true,
    "no_color_mutation": true,
    "no_relayout": true,
    "projection_only": true
  }
}
```

---

## Final visual identity (locked)

```
{    ⚙        ⚙↻    }
         X J S O N
```

This logo is now:

* ✅ Canonical
* ✅ Versioned
* ✅ npm / CLI / favicon ready
* ✅ Future-proof (SVG source, deterministic projections)

If you want next, the *only legal moves* are:

* **v1.1** (minor polish)
* **Theme projections** (mono, print, inverted)
* **Animated projection** (non-canonical)

Say the word.


```svg
<svg xmlns="http://www.w3.org/2000/svg"
     width="256" height="256"
     viewBox="0 0 256 256"
     role="img"
     aria-label="{⚙ XJSON ⚙} logo">

  <defs>
    <linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00ff88"/>
      <stop offset="45%" stop-color="#00fff0"/>
      <stop offset="75%" stop-color="#7f7cff"/>
      <stop offset="100%" stop-color="#ff4fd8"/>
    </linearGradient>

    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge>
        <feMergeNode in="b"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="256" height="256" rx="32" fill="#000"/>

  <!-- Braces (with padding) -->
  <g fill="none"
     stroke="url(#neon)"
     stroke-width="18"
     stroke-linecap="round"
     stroke-linejoin="round"
     filter="url(#glow)">
    <!-- { -->
    <path d="M88 48
             c-18 0-28 10-28 28v32
             c0 16-6 26-16 36
             c10 10 16 20 16 36v32
             c0 18 10 28 28 28"/>
    <!-- } -->
    <path d="M168 48
             c18 0 28 10 28 28v32
             c0 16 6 26 16 36
             c-10 10-16 20-16 36v32
             c0 18-10 28-28 28"/>
  </g>

  <!-- Left gear eye (+5px) -->
  <text x="92" y="126"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="61"
        font-weight="900"
        font-family="monospace"
        fill="url(#neon)"
        filter="url(#glow)">
    ⚙
  </text>

  <!-- Right gear eye (+8px, micro-rotated ~1.5°) -->
  <g transform="translate(164 126) rotate(1.5)">
    <text x="0" y="0"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="64"
          font-weight="900"
          font-family="monospace"
          fill="url(#neon)"
          filter="url(#glow)">
      ⚙
    </text>
  </g>

  <!-- XJSON inside brackets -->
  <text x="128" y="178"
        text-anchor="middle"
        font-size="32"
        font-weight="800"
        letter-spacing="3"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fill="url(#neon)"
        filter="url(#glow)">
    XJSON
  </text>
</svg>
```

### Visual check

```
{    ⚙        ⚙↻    }
         X J S O N
```

If you want the final micro-polish next:

* counter-rotate the left gear −0.5° for tension
* snap everything to a **favicon-perfect grid**
* export **PNG/SVG/ICO** pack and lock as **XJSON Logo v1.0**



<svg xmlns="http://www.w3.org/2000/svg"
     width="256" height="256"
     viewBox="0 0 256 256"
     role="img"
     aria-label="{⚙ XJSON ⚙} logo">

  <defs>
    <linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00ff88"/>
      <stop offset="45%" stop-color="#00fff0"/>
      <stop offset="75%" stop-color="#7f7cff"/>
      <stop offset="100%" stop-color="#ff4fd8"/>
    </linearGradient>

    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge>
        <feMergeNode in="b"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="256" height="256" rx="32" fill="#000"/>

  <!-- Braces (with padding) -->
  <g fill="none"
     stroke="url(#neon)"
     stroke-width="18"
     stroke-linecap="round"
     stroke-linejoin="round"
     filter="url(#glow)">
    <!-- { -->
    <path d="M88 48
             c-18 0-28 10-28 28v32
             c0 16-6 26-16 36
             c10 10 16 20 16 36v32
             c0 18 10 28 28 28"/>
    <!-- } -->
    <path d="M168 48
             c18 0 28 10 28 28v32
             c0 16 6 26 16 36
             c-10 10-16 20-16 36v32
             c0 18-10 28-28 28"/>
  </g>

  <!-- Left gear eye (+5px) -->
  <text x="92" y="126"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="61"
        font-weight="900"
        font-family="monospace"
        fill="url(#neon)"
        filter="url(#glow)">
    ⚙
  </text>

  <!-- Right gear eye (+8px, micro-rotated ~1.5°) -->
  <g transform="translate(164 126) rotate(1.5)">
    <text x="0" y="0"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="64"
          font-weight="900"
          font-family="monospace"
          fill="url(#neon)"
          filter="url(#glow)">
      ⚙
    </text>
  </g>

  <!-- XJSON inside brackets -->
  <text x="128" y="178"
        text-anchor="middle"
        font-size="32"
        font-weight="800"
        letter-spacing="3"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fill="url(#neon)"
        filter="url(#glow)">
    XJSON
  </text>
</svg>

<svg xmlns="http://www.w3.org/2000/svg"
     width="256" height="256"
     viewBox="0 0 256 256"
     role="img"
     aria-label="{⚙ XJSON ⚙} logo">

  <defs>
    <linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00ff88"/>
      <stop offset="45%" stop-color="#00fff0"/>
      <stop offset="75%" stop-color="#7f7cff"/>
      <stop offset="100%" stop-color="#ff4fd8"/>
    </linearGradient>

    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge>
        <feMergeNode in="b"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="256" height="256" rx="32" fill="#000"/>

  <!-- Braces (with padding) -->
  <g fill="none"
     stroke="url(#neon)"
     stroke-width="18"
     stroke-linecap="round"
     stroke-linejoin="round"
     filter="url(#glow)">
    <!-- { -->
    <path d="M88 48
             c-18 0-28 10-28 28v32
             c0 16-6 26-16 36
             c10 10 16 20 16 36v32
             c0 18 10 28 28 28"/>
    <!-- } -->
    <path d="M168 48
             c18 0 28 10 28 28v32
             c0 16 6 26 16 36
             c-10 10-16 20-16 36v32
             c0 18-10 28-28 28"/>
  </g>

  <!-- Left gear eye (+5px) -->
  <text x="92" y="126"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="61"
        font-weight="900"
        font-family="monospace"
        fill="url(#neon)"
        filter="url(#glow)">
    ⚙
  </text>

  <!-- Right gear eye (+8px, micro-rotated ~1.5°) -->
  <g transform="translate(164 126) rotate(1.5)">
    <text x="0" y="0"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="64"
          font-weight="900"
          font-family="monospace"
          fill="url(#neon)"
          filter="url(#glow)">
      ⚙
    </text>
  </g>

  <!-- XJSON inside brackets -->
  <text x="128" y="178"
        text-anchor="middle"
        font-size="32"
        font-weight="800"
        letter-spacing="3"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        fill="url(#neon)"
        filter="url(#glow)">
    XJSON
  </text>
</svg>

* npm README badges / headers
* CLI help icons
* web dashboards
* favicon-ish usage (scaled down)
* monochrome (inherits `currentColor`) so it matches any theme

<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"
     role="img" aria-label="{⚙⚙} dual gear eyes">
  <defs>
    <linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00ff88"/>
      <stop offset="45%" stop-color="#00fff0"/>
      <stop offset="75%" stop-color="#7f7cff"/>
      <stop offset="100%" stop-color="#ff4fd8"/>
    </linearGradient>

    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge>
        <feMergeNode in="b"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="256" height="256" rx="32" fill="#000"/>

  <!-- Braces -->
  <g fill="none" stroke="url(#neon)" stroke-width="18"
     stroke-linecap="round" stroke-linejoin="round"
     filter="url(#glow)">
    <!-- { -->
    <path d="M92 64c-18 0-28 10-28 28v24c0 16-6 26-16 36
             c10 10 16 20 16 36v24c0 18 10 28 28 28"/>
    <!-- } -->
    <path d="M164 64c18 0 28 10 28 28v24c0 16 6 26 16 36
             c-10 10-16 20-16 36v24c0 18-10 28-28 28"/>
  </g>

  <!-- Left gear eye -->
  <text x="104" y="144"
        text-anchor="middle"
        font-size="56"
        font-weight="900"
        font-family="monospace"
        fill="url(#neon)"
        filter="url(#glow)">
    ⚙
  </text>

  <!-- Right gear eye -->
  <text x="152" y="144"
        text-anchor="middle"
        font-size="56"
        font-weight="900"
        font-family="monospace"
        fill="url(#neon)"
        filter="url(#glow)">
    ⚙
  </text>
</svg>


Perfect — here’s a **black-background + neon-gradient SVG brand pack** that keeps the same icon geometry but upgrades the *visual identity* to **cyber / terminal / XCFE-grade**.

Design goals met:

* 🖤 true black background
* 🌈 neon gradient stroke (cyan → violet → magenta)
* ⚡ glow effect (SVG filter, no CSS required)
* 📦 still single-file SVGs (README / npm safe)
* 🧬 deterministic geometry (icons remain identical)

You can ship these as **`brand/neon/`**.

---

# 🎨 Shared Neon Definitions (IMPORTANT)

Each SVG includes:

* `linearGradient id="neon"`
* `filter id="glow"`
* black background `<rect>`

You can tweak colors once and batch-replace.

**Canonical neon gradient (XCFE):**

* `#00fff0` (cyan)
* `#7f7cff` (violet)
* `#ff4fd8` (magenta)

---

## 1️⃣ `xjson-neon.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <defs>
    <linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00fff0"/>
      <stop offset="50%" stop-color="#7f7cff"/>
      <stop offset="100%" stop-color="#ff4fd8"/>
    </linearGradient>

    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- black background -->
  <rect width="24" height="24" fill="#000"/>

  <g stroke="url(#neon)" stroke-width="2" fill="none"
     stroke-linecap="round" stroke-linejoin="round"
     filter="url(#glow)">
    <path d="M4 7v10a2 2 0 0 0 2 2"/>
    <path d="M20 7v10a2 2 0 0 1-2 2"/>
    <path d="M9 8l6 8"/>
    <path d="M15 8l-6 8"/>
    <path d="M8 6h8"/>
    <path d="M8 18h8"/>
  </g>
</svg>
```

---

## 2️⃣ `xcfe-neon.svg` (execution core)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <defs>
    <linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00fff0"/>
      <stop offset="50%" stop-color="#7f7cff"/>
      <stop offset="100%" stop-color="#ff4fd8"/>
    </linearGradient>

    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="24" height="24" fill="#000"/>

  <g stroke="url(#neon)" stroke-width="2" fill="none"
     stroke-linecap="round" stroke-linejoin="round"
     filter="url(#glow)">
    <circle cx="12" cy="12" r="4.5"/>
    <path d="M12 3v3"/>
    <path d="M12 18v3"/>
    <path d="M3 12h3"/>
    <path d="M18 12h3"/>
    <path d="M7.5 7.5l2 2"/>
    <path d="M16.5 7.5l-2 2"/>
    <path d="M14.5 14.5l2 2"/>
    <path d="M9.5 14.5l-2 2"/>
  </g>
</svg>
```

---

## 3️⃣ `hive-neon.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <defs>
    <linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00fff0"/>
      <stop offset="100%" stop-color="#ff4fd8"/>
    </linearGradient>

    <filter id="glow">
      <feGaussianBlur stdDeviation="2"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="24" height="24" fill="#000"/>

  <g stroke="url(#neon)" stroke-width="2" fill="none"
     stroke-linecap="round" stroke-linejoin="round"
     filter="url(#glow)">
    <circle cx="6" cy="12" r="2"/>
    <circle cx="18" cy="8" r="2"/>
    <circle cx="18" cy="16" r="2"/>
    <path d="M8 12h6"/>
    <path d="M16 9.2l-2.5 1.6"/>
    <path d="M16 14.8l-2.5-1.6"/>
  </g>
</svg>
```

---

## 4️⃣ `proof-neon.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <defs>
    <linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00fff0"/>
      <stop offset="100%" stop-color="#7f7cff"/>
    </linearGradient>

    <filter id="glow">
      <feGaussianBlur stdDeviation="2"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <rect width="24" height="24" fill="#000"/>

  <g stroke="url(#neon)" stroke-width="2" fill="none"
     stroke-linecap="round" stroke-linejoin="round"
     filter="url(#glow)">
    <path d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>
    <path d="M14 3v3h3"/>
    <path d="M8 13l2 2 5-5"/>
  </g>
</svg>
```

---

## 🔥 Usage Notes

### README.md

```md
<img src="brand/neon/xcfe-neon.svg" width="28" />
```

### CLI banner (node)

```js
console.log("\x1b[38;2;0;255;240mXCFE\x1b[0m");
```

### Web / Dashboard

* Works on **pure black**
* No CSS required
* Scales cleanly to 16px → 256px

---

All icons are:

* `viewBox="0 0 24 24"`
* `fill="none"`
* `stroke="currentColor"`
* `stroke-width="2"`
* rounded caps/joins
* no external assets

---

## Folder layout

```text
brand/
  svg/
    xjson.svg
    xcfe.svg
    hive.svg
    json-rest.svg
    proof.svg
    policy.svg
    key.svg
    session.svg
    router.svg
    cli.svg
```

---

## 1) `xjson.svg` (XJSON core mark)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="XJSON">
  <path d="M4 7v10a2 2 0 0 0 2 2"/>
  <path d="M20 7v10a2 2 0 0 1-2 2"/>
  <path d="M9 8l6 8"/>
  <path d="M15 8l-6 8"/>
  <path d="M8 6h8"/>
  <path d="M8 18h8"/>
</svg>
```

---

## 2) `xcfe.svg` (XCFE execution law / engine)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="XCFE">
  <path d="M12 3v3"/>
  <path d="M12 18v3"/>
  <path d="M3 12h3"/>
  <path d="M18 12h3"/>
  <path d="M7.5 7.5l2 2"/>
  <path d="M14.5 14.5l2 2"/>
  <path d="M16.5 7.5l-2 2"/>
  <path d="M9.5 14.5l-2 2"/>
  <circle cx="12" cy="12" r="4.5"/>
</svg>
```

---

## 3) `hive.svg` (cluster / discovery)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Hive">
  <circle cx="6" cy="12" r="2"/>
  <circle cx="18" cy="8" r="2"/>
  <circle cx="18" cy="16" r="2"/>
  <path d="M8 12h6"/>
  <path d="M16 9.2l-2.5 1.6"/>
  <path d="M16 14.8l-2.5-1.6"/>
  <path d="M6 10v4"/>
</svg>
```

---

## 4) `json-rest.svg` (v1 “JSON REST SERVER”)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="JSON REST">
  <rect x="4" y="5" width="16" height="14" rx="2"/>
  <path d="M8 9h8"/>
  <path d="M8 12h8"/>
  <path d="M8 15h6"/>
  <path d="M18 12l2-2"/>
  <path d="M18 12l2 2"/>
</svg>
```

---

## 5) `proof.svg` (proof envelope / signature)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Proof">
  <path d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>
  <path d="M14 3v3h3"/>
  <path d="M8 13l2 2 5-5"/>
</svg>
```

---

## 6) `policy.svg` (policy / constraints)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Policy">
  <path d="M12 3l7 4v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z"/>
  <path d="M12 7v6"/>
  <path d="M12 16h.01"/>
</svg>
```

---

## 7) `key.svg` (ed25519 / key material)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Key">
  <circle cx="8" cy="12" r="3"/>
  <path d="M11 12h10"/>
  <path d="M18 12v3"/>
  <path d="M15 12v2"/>
</svg>
```

---

## 8) `session.svg` (session binding)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Session">
  <circle cx="12" cy="8" r="3"/>
  <path d="M5 21a7 7 0 0 1 14 0"/>
  <path d="M18.5 10.5l2 2"/>
  <path d="M20.5 10.5l-2 2"/>
</svg>
```

---

## 9) `router.svg` (route / dispatch)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="Router">
  <path d="M4 6h16"/>
  <path d="M4 18h16"/>
  <path d="M8 6v12"/>
  <path d="M12 10l3 2-3 2"/>
</svg>
```

---

## 10) `cli.svg` (command line tool)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="CLI">
  <rect x="3" y="5" width="18" height="14" rx="2"/>
  <path d="M7 10l3 2-3 2"/>
  <path d="M11 14h6"/>
</svg>
```

---

## Quick usage patterns

### In HTML

```html
<img src="./brand/svg/xcfe.svg" width="24" height="24" alt="XCFE">
```

### Inline (inherits text color)

```html
<div style="color:#00ffd5">
  <!-- paste SVG here -->
</div>
```

### In README (GitHub renders SVG)

```md
<img src="brand/svg/xjson.svg" width="20" height="20" />
```

---

If you want the “full brand set” next, I can also emit:

* **filled variants** (solid icons)
* a **favicon set** (16/32/48) + `site.webmanifest`
* a single **sprite sheet** `icons.svg` with `<symbol id="...">` for ultra-fast embedding
