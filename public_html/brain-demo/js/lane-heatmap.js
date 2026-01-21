export function renderLaneHeat(svg, heat) {
  const existing = svg.querySelector("#lane-heatmap");
  if (existing) existing.remove();

  const group = document.createElementNS(svg.namespaceURI, "g");
  group.setAttribute("id", "lane-heatmap");

  const lanes = ["GRAM", "EDGE", "PATH", "PROOF"];

  lanes.forEach((lane, i) => {
    const value = heat[lane] ?? 0;
    const rect = document.createElementNS(svg.namespaceURI, "rect");
    rect.setAttribute("x", 20);
    rect.setAttribute("y", 360 + i * 28);
    rect.setAttribute("width", 200 * value);
    rect.setAttribute("height", 18);
    rect.setAttribute("fill", heatColor(value));
    rect.setAttribute("rx", 4);

    const label = document.createElementNS(svg.namespaceURI, "text");
    label.classList.add("heat-label");
    label.setAttribute("x", 230);
    label.setAttribute("y", 374 + i * 28);
    label.textContent = `${lane}`;

    group.appendChild(rect);
    group.appendChild(label);
  });

  svg.appendChild(group);
}

function heatColor(v) {
  if (v > 0.75) return "#ff3333";
  if (v > 0.45) return "#ffaa00";
  return "#33ff66";
}
