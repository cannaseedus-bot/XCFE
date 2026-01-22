export function playTraining(svg, events, { interval = 300 } = {}) {
  if (!svg || !Array.isArray(events) || events.length === 0) return;
  let index = 0;

  const step = () => {
    if (index >= events.length) return;
    const event = events[index++];
    const edgeId = `e-${event.edge[0]}-${event.edge[1]}`;
    const edge = svg.querySelector(`#${edgeId}`);

    if (edge) {
      edge.style.strokeWidth =
        2 + Math.min(6, Math.abs(event.delta) * 20);
      edge.style.stroke = event.delta > 0 ? "#16f2aa" : "#ff6b6b";
    }

    setTimeout(step, interval);
  };

  step();
}
