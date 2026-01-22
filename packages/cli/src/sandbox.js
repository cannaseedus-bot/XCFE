/**
 * XCFE Sandbox Runner v1
 *
 * Best-effort process isolation: scoped cwd, no stdin inheritance, timeout.
 *
 * @artifact xcfe://cli/sandbox/v1
 */

import { spawn } from "child_process";

export function runSandboxed({ command, args = [], cwd = process.cwd(), timeoutMs = 15000, input = "" }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`sandbox_timeout: ${command}`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code && code !== 0) {
        const err = new Error(stderr || `sandbox_exit_${code}`);
        err.code = code;
        err.stdout = stdout;
        err.stderr = stderr;
        reject(err);
        return;
      }
      resolve({ stdout, stderr });
    });

    if (input) {
      child.stdin.write(input);
    }
    child.stdin.end();
  });
}
