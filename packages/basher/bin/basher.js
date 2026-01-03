#!/usr/bin/env node
/**
 * XCFE Basher v1
 *
 * Basher is NOT a shell. It is a structured XCFE command layer.
 *
 * Key properties:
 * - Basher commands lower into XCFE programs internally
 * - Same AST, same hashes
 * - No stringly-typed pipelines
 * - Basher scripts are auditable artifacts, not ad-hoc glue
 *
 * @artifact xcfe://basher/v1
 */

import { run } from "../src/basher.js";

const argv = process.argv.slice(2);

try {
  await run(argv);
} catch (err) {
  console.error(err.message);
  process.exit(err.exitCode ?? 1);
}
