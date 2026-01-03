#!/usr/bin/env node
/**
 * XCFE CLI v1
 *
 * Human + CI tooling. Thin wrapper around @xcfe/core.
 *
 * Rules:
 * - CLI NEVER mutates semantics
 * - CLI NEVER invents fields
 * - CLI just wires core + adapters
 *
 * @artifact xcfe://cli/v1
 */

import { route } from "../src/router.js";

const argv = process.argv.slice(2);

try {
  await route(argv);
} catch (err) {
  console.error(err.message);
  process.exit(err.exitCode ?? 1);
}
