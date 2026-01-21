# GitHub Template Set

This guide describes how to structure XJSON organization repositories as templates.

## Organization

**Name:** `xjson-lang`
**Description:** Deterministic, inspectable AI as a language.

## Template Repositories

### `xjson-spec`

```
xjson-spec/
├─ XJSON_MODEL_LANGUAGE_v1.md
├─ CHANGELOG.md
├─ CONTRIBUTING.md
├─ LICENSE
└─ README.md
```

### `xjson-schema`

```
xjson-schema/
├─ v1/
│  └─ xjson-model-schema-v1.xjson
├─ CONTRIBUTING.md
├─ LICENSE
└─ README.md
```

### `xjson-validator`

```
xjson-validator/
├─ python/
├─ node/
├─ wasm/
├─ golden/
├─ CONTRIBUTING.md
├─ LICENSE
└─ README.md
```

### `scxq2`

```
scxq2/
├─ spec/
├─ wasm/
├─ tools/
├─ CONTRIBUTING.md
├─ LICENSE
└─ README.md
```

### `xjson-playground`

```
xjson-playground/
├─ index.html
├─ app.js
├─ worker.js
├─ wasm/
├─ examples/
├─ CONTRIBUTING.md
├─ LICENSE
└─ README.md
```

## Auto-Generation Workflow

1. Create each repository as a GitHub template.
2. Use **Use this template** for new versioned repos.
3. Pin the five core repositories in the organization.
