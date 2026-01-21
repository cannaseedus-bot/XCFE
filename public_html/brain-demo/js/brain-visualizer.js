export function computeLayout(nodeCount, width, height) {
  const positions = new Map();
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.35;

  for (let i = 0; i < nodeCount; i++) {
    const angle = (i / nodeCount) * Math.PI * 2 - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    positions.set(i, { x, y });
  }

  return positions;
}

export function renderBrain(svg, graph, path, options = {}) {
  const { heat = {}, width = 900, height = 520 } = options;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.innerHTML = "";

  const positions = computeLayout(graph.gramCount, width, height);

  const edgesGroup = document.createElementNS(svg.namespaceURI, "g");
  edgesGroup.setAttribute("id", "edges");
  svg.appendChild(edgesGroup);

  graph.edges.forEach((edge) => {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (!from || !to) return;

    const line = document.createElementNS(svg.namespaceURI, "line");
    line.classList.add("edge", "local");
    line.setAttribute("x1", from.x);
    line.setAttribute("y1", from.y);
    line.setAttribute("x2", to.x);
    line.setAttribute("y2", to.y);
    line.setAttribute("stroke", heatColor(edge.w));
    line.setAttribute("stroke-width", (1.5 + edge.w * 2.5).toFixed(2));
    edgesGroup.appendChild(line);
  });

  const nodesGroup = document.createElementNS(svg.namespaceURI, "g");
  nodesGroup.setAttribute("id", "nodes");
  svg.appendChild(nodesGroup);

  positions.forEach((pos, id) => {
    const circle = document.createElementNS(svg.namespaceURI, "circle");
    circle.classList.add("node");
    circle.setAttribute("id", `n${id}`);
    circle.setAttribute("cx", pos.x);
    circle.setAttribute("cy", pos.y);
    circle.setAttribute("r", 14);
    nodesGroup.appendChild(circle);

    const label = document.createElementNS(svg.namespaceURI, "text");
    label.setAttribute("x", pos.x);
    label.setAttribute("y", pos.y + 4);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("fill", "#cbd2ff");
    label.setAttribute("font-size", "10");
    label.textContent = String(id);
    nodesGroup.appendChild(label);
  });

  animatePath(svg, path);

  if (heat && Object.keys(heat).length) {
    renderHeatLegend(svg, heat);
  }

  return positions;
}

export function animatePath(svg, path) {
  if (!Array.isArray(path)) return;
  path.forEach((nodeId) => {
    const node = svg.querySelector(`#n${nodeId}`);
    node?.classList.add("active");
  });
}

function heatColor(w) {
  if (w > 0.8) return "#ff4444";
  if (w > 0.5) return "#ffaa00";
  return "#44ff44";
}

function renderHeatLegend(svg, heat) {
  const legend = document.createElementNS(svg.namespaceURI, "g");
  legend.setAttribute("id", "heat-legend");
  const lanes = ["GRAM", "EDGE", "PATH", "PROOF"];

  lanes.forEach((lane, i) => {
    const text = document.createElementNS(svg.namespaceURI, "text");
    text.classList.add("heat-label");
    text.setAttribute("x", 20);
    text.setAttribute("y", 24 + i * 18);
    text.textContent = `${lane}: ${(heat[lane] ?? 0).toFixed(2)}`;
    legend.appendChild(text);
  });

  svg.appendChild(legend);
}
