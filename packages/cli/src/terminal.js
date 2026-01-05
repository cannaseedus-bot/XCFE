/**
 * XCFE Terminal Command v1
 *
 * Lightweight interactive shell for XCFE CLI commands.
 * Executes commands against the same router without JSON wrapping.
 *
 * @artifact xcfe://cli/terminal/v1
 */

import readline from "readline";

/**
 * xcfe terminal
 *
 * Starts an interactive prompt. Type `help` for commands, `exit` to quit.
 */
export async function cmdTerminal(_args, { route }) {
  if (typeof route !== "function") {
    throw new Error("terminal requires router dispatch");
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "xcfe> "
  });

  printHelp();
  rl.prompt();

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) {
      rl.prompt();
      continue;
    }

    if (trimmed === "exit" || trimmed === "quit") {
      rl.close();
      break;
    }

    if (trimmed === "help") {
      printHelp();
      rl.prompt();
      continue;
    }

    const argv = tokenize(trimmed);
    try {
      await route(argv);
    } catch (e) {
      const msg = e?.message ?? String(e);
      console.error(msg);
    }

    rl.prompt();
  }
}

function tokenize(line) {
  // Simple shell-like tokenizer supporting single/double quotes
  const out = [];
  const re = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|\\S+/g;
  let m;
  while ((m = re.exec(line)) !== null) {
    if (m[1] !== undefined) {
      out.push(unescapeQuotes(m[1]));
    } else if (m[2] !== undefined) {
      out.push(unescapeQuotes(m[2]));
    } else {
      out.push(m[0]);
    }
  }
  return out;
}

function unescapeQuotes(s) {
  return s.replace(/\\(["'])/g, "$1");
}

function printHelp() {
  console.log(`XCFE Terminal

Commands:
  parse <file>
  ast <file>
  hash <file>
  verify <file> [--policy policy.json]
  infer <file> [--endpoint url] [--model name] [--out file]
  sign <file> --policy policy.json --kid <kid> --key <handle> [...]
  prove <envelope.json>
  keygen [--kid <kid>] [--out key.json] [--compact]
  pub --key <handle>
  auth exchange|google [...]
  key register|provision [...]
  test
  version
  help
  exit|quit
`);
}
