/**
 * XCFE Basher Core v1
 *
 * Basher is a structured XCFE command layer.
 * Commands lower to XCFE programs internally - no string scripting.
 *
 * @artifact xcfe://basher/core/v1
 */

import { route } from "@xcfe/cli/src/router.js";

/**
 * Run basher command
 *
 * Basher commands are XCFE-native:
 * - basher xcfe verify app.xjson --policy secure.json
 * - basher xcfe sign app.xjson --intent publish
 * - basher xcfe chain prove session.chain
 *
 * @param {string[]} argv
 */
export async function run(argv) {
  const [prefix, ...rest] = argv;

  // Basher xcfe commands delegate to xcfe CLI
  if (prefix === "xcfe") {
    return route(rest);
  }

  // Basher script execution (v2)
  if (prefix === "run") {
    return runScript(rest);
  }

  // Basher chain commands (v2)
  if (prefix === "chain") {
    return chainCommands(rest);
  }

  // Default: treat as xcfe command
  return route(argv);
}

/**
 * Run a basher script file
 * v2: Not implemented in v1
 */
function runScript(args) {
  const [file] = args;
  if (!file) {
    throw error("basher run <script.basher>", 64);
  }

  // v2: Parse and execute basher script
  console.log(`Script execution not implemented in v1: ${file}`);
  console.log("Basher scripts will lower to XCFE programs internally");
}

/**
 * Chain commands for SCX hash chains
 * v2: Not implemented in v1
 */
function chainCommands(args) {
  const [cmd] = args;

  console.log(`Chain command not implemented in v1: ${cmd}`);
  console.log("Chain commands: init, append, prove, verify");
}

function error(msg, code) {
  const e = new Error(msg);
  e.exitCode = code;
  return e;
}

/**
 * Basher command manifest
 * Documents the command surface for auditing
 */
export const BASHER_MANIFEST = {
  "@type": "xcfe.basher.manifest",
  "@version": "1.0.0",
  commands: [
    {
      name: "xcfe",
      description: "XCFE CLI commands (verify, sign, prove, etc.)",
      delegate: "@xcfe/cli"
    },
    {
      name: "run",
      description: "Execute basher script file",
      status: "v2"
    },
    {
      name: "chain",
      description: "SCX hash chain operations",
      status: "v2",
      subcommands: ["init", "append", "prove", "verify"]
    }
  ]
};
