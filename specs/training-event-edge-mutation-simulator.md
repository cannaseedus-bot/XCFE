# TRAINING EVENT → EDGE MUTATION SIMULATOR (REFERENCE IMPLEMENTATION)

This is the **authoritative training mechanic**.  
No gradients. No tensors.

---

## 1. Training Event Schema

```json
{
  "@event": {
    "input_grams": ["g:what", "g:is"],
    "output_grams": ["s:Σ42"],
    "success": true,
    "confidence": 0.92
  }
}
```

---

## 2. Edge Mutation Rules

### Constants

```python
ALPHA = 0.05   # positive reinforcement rate
BETA  = 0.08   # negative reinforcement rate
W_MIN = 0.0
W_MAX = 1.0
```

---

## 3. Simulator (Executable)

```python
class GramGraph:
    def __init__(self):
        self.edges = {}  # (src, dst) -> weight

    def get_weight(self, src, dst):
        return self.edges.get((src, dst), 0.0)

    def set_weight(self, src, dst, w):
        self.edges[(src, dst)] = max(W_MIN, min(W_MAX, w))

    def apply_event(self, event):
        confidence = event["confidence"]
        success = event["success"]

        path = event["input_grams"] + event["output_grams"]

        for i in range(len(path) - 1):
            src, dst = path[i], path[i + 1]
            w = self.get_weight(src, dst)

            if success:
                w_new = w + ALPHA * confidence
            else:
                w_new = w - BETA * (1.0 - confidence)

            self.set_weight(src, dst, w_new)

    def snapshot(self):
        return dict(self.edges)
```

---

## 4. New Edge Formation Rule

```python
def maybe_create_edge(graph, g1, g2, co_occurrence, threshold=32):
    if co_occurrence >= threshold and (g1, g2) not in graph.edges:
        graph.set_weight(g1, g2, 0.1)
```

---

## 5. What “Training” Means (Normative)

Training consists of:

- strengthening lawful edges
- weakening failing edges
- creating edges via recurrence
- collapsing stable subgraphs into supgrams
- decaying unstable abstractions

**Nothing else is permitted.**
