# XJSON Tutor Wireframes (SVG)

> **Note:** These SVGs are text assets. Save each block to an `.svg` file to view.

## Brain Overview Wireframe

```svg
<svg width="720" height="420" viewBox="0 0 720 420"
     xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: monospace; font-size: 14px; fill: #0f172a }
    .box { fill: #f8fafc; stroke: #0f172a; stroke-width: 1.5 }
    .edge { stroke: #334155; stroke-width: 1.2; marker-end: url(#arrow) }
  </style>

  <defs>
    <marker id="arrow" markerWidth="8" markerHeight="8"
            refX="6" refY="4" orient="auto">
      <path d="M0,0 L8,4 L0,8 Z" fill="#334155"/>
    </marker>
  </defs>

  <rect x="40" y="40" width="180" height="60" class="box"/>
  <text x="60" y="75">Concepts (grams)</text>

  <rect x="260" y="40" width="200" height="60" class="box"/>
  <text x="280" y="75">Edges (relationships)</text>

  <rect x="520" y="40" width="160" height="60" class="box"/>
  <text x="540" y="75">Inference</text>

  <line x1="220" y1="70" x2="260" y2="70" class="edge"/>
  <line x1="460" y1="70" x2="520" y2="70" class="edge"/>

  <text x="260" y="120">
    Inference = bounded graph walk
  </text>
</svg>
```

---

## Federated Tutor Wireframe

```svg
<svg width="720" height="420" viewBox="0 0 720 420"
     xmlns="http://www.w3.org/2000/svg">
  <style>
    text { font-family: monospace; font-size: 13px; fill: #020617 }
    .brain { fill: #ecfeff; stroke: #0f172a; stroke-width: 1.2 }
  </style>

  <rect x="260" y="40" width="200" height="70" class="brain"/>
  <text x="300" y="80">Tutor Brain</text>

  <rect x="60" y="160" width="120" height="50" class="brain"/>
  <text x="70" y="190">Grams</text>

  <rect x="220" y="160" width="120" height="50" class="brain"/>
  <text x="230" y="190">Graph</text>

  <rect x="380" y="160" width="120" height="50" class="brain"/>
  <text x="390" y="190">Proof</text>

  <rect x="540" y="160" width="120" height="50" class="brain"/>
  <text x="550" y="190">Policy</text>

  <line x1="320" y1="110" x2="120" y2="160" stroke="#334155"/>
  <line x1="360" y1="110" x2="280" y2="160" stroke="#334155"/>
  <line x1="400" y1="110" x2="440" y2="160" stroke="#334155"/>
  <line x1="440" y1="110" x2="600" y2="160" stroke="#334155"/>

  <text x="180" y="260">
    Federation = merge, not retrain
  </text>
</svg>
```
