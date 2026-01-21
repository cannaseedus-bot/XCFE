export function renderFederation(svg, brains, positions) {
  const existing = svg.querySelector("#federation");
  if (existing) existing.remove();

  const group = document.createElementNS(svg.namespaceURI, "g");
  group.setAttribute("id", "federation");
  svg.appendChild(group);

  const conflictMap = detectConflicts(brains);

  brains.forEach((brain) => {
    brain.edges.forEach((edge) => {
      const from = positions.get(edge.from);
      const to = positions.get(edge.to);
      if (!from || !to) return;

      const line = document.createElementNS(svg.namespaceURI, "line");
      line.classList.add("edge", "federated");
      line.setAttribute("x1", from.x);
      line.setAttribute("y1", from.y);
      line.setAttribute("x2", to.x);
      line.setAttribute("y2", to.y);
      line.setAttribute("stroke", brain.color);
      line.setAttribute("stroke-opacity", (0.4 + 0.6 * edge.w).toFixed(2));
      line.setAttribute("stroke-width", (1.5 + edge.w * 2).toFixed(2));
      line.setAttribute("data-brain", brain.id);

      const key = `${edge.from}->${edge.to}`;
      if (conflictMap.has(key)) {
        line.classList.add("conflict");
      }

      group.appendChild(line);
    });
  });
}

function detectConflicts(brains) {
  const map = new Map();
  brains.forEach((brain) => {
    brain.edges.forEach((edge) => {
      const key = `${edge.from}->${edge.to}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
  });

  return new Map([...map.entries()].filter(([, count]) => count > 1));
}
