/**
 * XCFE CLI Splash v1
 *
 * Prints a lightweight splash header that references the packaged logo.
 * Uses stderr and only runs for TTY sessions to avoid polluting JSON output.
 *
 * @artifact xcfe://cli/splash/v1
 */

import path from "path";
import { fileURLToPath } from "url";

const logoUrl = new URL("../assets/xjson-logo.svg", import.meta.url);
const logoPath = fileURLToPath(logoUrl);

export function printSplash() {
  if (!process.stderr.isTTY) return;
  if (process.env.XCFE_NO_SPLASH === "1") return;

  const rel = path.relative(process.cwd(), logoPath);
  const lines = [
    "╔══════════════════════════════════════╗",
    "║      XJSON / XCFE CLI Runtime        ║",
    "╠══════════════════════════════════════╣",
    `║  Logo: ${rel.padEnd(32).slice(0, 32)}║`,
    "║  Native XJSON execution surface (@)  ║",
    "╚══════════════════════════════════════╝"
  ];

  console.error(lines.join("\n"));
}
