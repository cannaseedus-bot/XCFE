# MX2GYM — Official Definition (v1.0.0)

MX2GYM is the official weight-training system for MX2LM, Qwen-ASX, and fold-based models. It combines symbolic and tensor execution using **K’UHUL π math**, **SCXQ2 compression**, and **XCFE routing**, turning fold-deltas into full safetensor checkpoints.

## Canonical Definition

```json
MX2GYM = {
  "name": "MX2GYM",
  "purpose": "Hybrid Weight Training Environment for MX2LM, Qwen-ASX, and Fold-Based Models",
  "trains": [
    "Qwen-ASX",
    "MX2LM Tensor-Brain",
    "Fold-Delta Adapters",
    "Symbolic Kernels",
    "SCXQ2 Compressed Weights"
  ],
  "architecture": {
    "@engine": "K’UHUL π math + SCXQ2 compression + XCFE control routing",
    "@memory": "ASX-RAM + MX2DB + Fold-Stack",
    "@mode": ["tensor", "symbolic", "hybrid"],
    "@fold_support": true,
    "@merge_strategy": "horizontal | vertical | hybrid"
  },
  "io": {
    "input": ["fold-deltas", "optimizer.json", "training_args", "MX2 grams", "RLHF traces"],
    "output": ["model.safetensors", "fold-updates", "optimizer-updates", "metrics.json"]
  }
}
```

## What MX2GYM Is

- Trainer, simulator, fold-merging engine, tensor factory, symbolic learning loop, model upgrader, and runtime gym for MX2LM evolution.
- Replaces traditional trainers with a symbolic–tensor hybrid gym built on fold-deltas, SCXQ2 compression, K’UHUL π math, and XCFE routing.

## Interfaces (MX2GYM Routes)

1. `mx2gym.train.fold()` — Train MX2LM or Qwen using fold-deltas.  
2. `mx2gym.merge.horizontal()` — Merge 100+ folds into one safetensor.  
3. `mx2gym.compile.safetensors()` — Build a full model from SCX-expanded deltas.  
4. `mx2gym.optimize.step()` — Optimizers (AdamW, Lion, RMSprop) in K’UHUL π.  
5. `mx2gym.analyze.gradients()` — SCX-compressed gradient inspection.  
6. `mx2gym.export.fold()` — Write fold-deltas after each step.  
7. `mx2gym.evolve.mx2lm()` — Train the MX2LM symbolic brain via fold routes.  

## Weight Training Flow

```
Fold-Input
   ↓
@data (delta/grad/optimizer)
   ↓
@control (priority, clamps, conditions)
   ↓
@flow (XCFE routing)
   ↓
K’UHUL π math (tensor update)
   ↓
SCX expansion/compression
   ↓
Accumulator
   ↓
Finalize → model.safetensors
```

## MX2GYM Fold Trainer JSON Format (v1.0.0)

Canonical fold specification for XCFE-native, K’UHUL-compatible training.

### Top-Level Pattern

```json
{
  "fold_id": "dialogue_v3",
  "version": "1.0.0",
  "model_base": "Qwen-ASX-7B",
  "mx2gym_format": "fold.v1",
  "description": "Dialogue refinement using SCXQ2 deltas + XCFE routing.",
  "@data": {},
  "@control": {},
  "@flow": {},
  "@metrics": {}
}
```

### @data — Weight Material

```json
"@data": {
  "deltas": [
    {
      "layer": "model.layers.0.self_attn.q_proj.weight",
      "encoding": "scxq2",
      "ref": "scxq2://dialogue_v3/l0_qproj.delta",
      "scale": 0.45
    }
  ],
  "gradients": [
    {
      "layer": "model.layers.0.self_attn.q_proj.weight",
      "encoding": "scxq2",
      "ref": "scxq2://dialogue_v3/grad_l0_qproj.grad"
    }
  ],
  "optimizer": {
    "type": "adamw",
    "state": {
      "m": "scxq2://dialogue_v3/adam_m.state",
      "v": "scxq2://dialogue_v3/adam_v.state"
    },
    "lr": 1e-5,
    "betas": [0.9, 0.999],
    "weight_decay": 0.01
  }
}
```

### @control — Behavior Logic

Controls when and how folds apply (priority, mode, clamp, conditions).

```json
"@control": {
  "apply": "if_loss_improves",
  "priority": 2,
  "mode": "additive",
  "target_layers": ["attn"],
  "clamp": [-0.15, 0.15],
  "conditions": {
    "min_loss_improvement": 0.001,
    "cooldown_steps": 25,
    "max_scale": 1.1
  }
}
```

### @flow — XCFE Routing

Defines how deltas move through the K’UHUL pipeline and merge strategy.

```json
"@flow": {
  "entry": "@Pop",
  "route": ["@Wo", "@Sek"],
  "exit": "@Xul",
  "merge_strategy": "horizontal",
  "interaction": ["fold_mathfix_v1"],
  "blend_mode": "smooth"
}
```

### @metrics — Training Reality

Recorded by MX2GYM for evaluation and gating.

```json
"@metrics": {
  "steps_trained": 12600,
  "loss_curve": [1.92, 1.70, 1.44],
  "gradient_norm": 0.88,
  "delta_norm": 0.0038,
  "timestamp": 1890000023000
}
```

### Full Example

```json
{
  "fold_id": "dialogue_v3",
  "version": "1.0.0",
  "model_base": "Qwen-ASX-7B",
  "mx2gym_format": "fold.v1",
  "description": "Dialogue refinement fold using SCXQ2 deltas + AdamW optimizer + XCFE flow.",
  "@data": {
    "deltas": [
      {
        "layer": "model.layers.0.self_attn.q_proj.weight",
        "encoding": "scxq2",
        "ref": "scxq2://dialogue_v3/l0_qproj.delta",
        "scale": 0.45
      }
    ],
    "gradients": [
      {
        "layer": "model.layers.0.self_attn.q_proj.weight",
        "encoding": "scxq2",
        "ref": "scxq2://dialogue_v3/grad_l0_qproj.grad"
      }
    ],
    "optimizer": {
      "type": "adamw",
      "state": {
        "m": "scxq2://dialogue_v3/adam_m.state",
        "v": "scxq2://dialogue_v3/adam_v.state"
      },
      "lr": 1e-5,
      "betas": [0.9, 0.999],
      "weight_decay": 0.01
    }
  },
  "@control": {
    "apply": "if_loss_improves",
    "priority": 2,
    "mode": "additive",
    "target_layers": ["attn"],
    "clamp": [-0.15, 0.15],
    "conditions": {
      "min_loss_improvement": 0.001,
      "cooldown_steps": 25,
      "max_scale": 1.1
    }
  },
  "@flow": {
    "entry": "@Pop",
    "route": ["@Wo", "@Sek"],
    "exit": "@Xul",
    "merge_strategy": "horizontal",
    "interaction": ["fold_mathfix_v1"],
    "blend_mode": "smooth"
  },
  "@metrics": {
    "steps_trained": 12600,
    "loss_curve": [1.92, 1.70, 1.44],
    "gradient_norm": 0.88,
    "delta_norm": 0.0038,
    "timestamp": 1890000023000
  }
}
```

## Horizontal Fold Stacking (Outline)

- Folds are independent training shards (dialogue, mathfix, RLHF, coding, etc.).  
- Merge rule `"horizontal"` accumulates per-layer deltas across multiple folds before writing `model.safetensors`.  
- A manifest can list many fold JSON files alongside the base model metadata to guide merges.  

## Status

This file is the canonical, self-contained MX2GYM definition and fold trainer format. No external network fetch is required.
