# TODO

## Missing or Desired Capabilities
- [ ] Implement inference dispatch adapters in `@xcfe/server` (API/local routing, retries, streaming).
- [ ] Ship production inference response schemas with structured tool calls and provenance metadata.
- [ ] Provide a shared adapter registry + config format for inference and execution backends.
- [ ] Expand execution adapters beyond stubs (HTTP, filesystem, secure sandbox, GPU, etc.).
- [ ] Add integration tests for CLI commands, server endpoints, and proof verification.
- [ ] Add end-to-end examples that include policy, proofs, and inference calls.
- [ ] Publish Docker images for the server and add-ons with sample compose files.
- [ ] Document environment variables for all services in a single reference page.
- [ ] Add telemetry hooks (metrics/logging) for verification/inference gateways.
- [ ] Add CI workflows for linting, unit tests, and release packaging.
- [ ] Document oracle and hive flows in `docs/` with runnable examples.
- [ ] Provide golden fixture validation scripts for `xjson-golden/`.
