Here’s a **brand SVG icon pack** you can drop straight into the repo (or publish as `@xjson/icon-pack`). It’s designed to work as:

* npm README badges / headers
* CLI help icons
* web dashboards
* favicon-ish usage (scaled down)
* monochrome (inherits `currentColor`) so it matches any theme

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
