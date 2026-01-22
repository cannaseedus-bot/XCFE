import fs from "node:fs";
import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import {
  loadSiblingAsx,
  isImportDenied,
  resolveLocalImport
} from "../util/loadEnvelope.js";

type Finding = { file: string; kind: "net" | "dom" | "eval" | "function"; sample: string };

function scanText(file: string, text: string): Finding[] {
  const out: Finding[] = [];
  if (/\bfetch\b|\bWebSocket\b|\bXMLHttpRequest\b/.test(text)) {
    out.push({ file, kind: "net", sample: "net primitive" });
  }
  if (/\bdocument\b|\bwindow\b/.test(text)) {
    out.push({ file, kind: "dom", sample: "dom primitive" });
  }
  if (/\beval\b/.test(text)) out.push({ file, kind: "eval", sample: "eval" });
  if (/\bFunction\b/.test(text)) out.push({ file, kind: "function", sample: "Function" });
  return out;
}

export default ESLintUtils.RuleCreator(
  () => "https://asx.spec/forbidden-transitive-imports"
)({
  name: "forbidden-transitive-imports",
  meta: {
    type: "problem",
    docs: {
      description: "Reject forbidden effects/caps reachable through transitive local imports",
      recommended: "error"
    },
    schema: [],
    messages: {
      deniedDirect: "Import '{{spec}}' is denied by .asx",
      deniedTransitive: "Forbidden transitive authority '{{kind}}' reachable via {{file}}",
      unreadable: "Could not read transitive dependency {{file}}"
    }
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    if (filename === "<input>" || !/\.(ts|js)x?$/.test(filename)) return {};
    const env = loadSiblingAsx(filename);
    if (!env) return {};

    const denyEffects = new Set(env["@imports"]?.transitive?.deny_effects ?? []);
    const denyCaps = new Set(env["@imports"]?.transitive?.deny_caps ?? ["eval", "Function"]);
    const maxDepth = env["@imports"]?.transitive?.max_depth ?? 32;

    function isDeniedKind(kind: Finding["kind"]) {
      if (kind === "net" && denyEffects.has("net")) return true;
      if (kind === "dom" && denyEffects.has("dom")) return true;
      if (kind === "eval" && denyCaps.has("eval")) return true;
      if (kind === "function" && denyCaps.has("Function")) return true;
      return false;
    }

    function walkFrom(entry: string): Finding | null {
      const seen = new Set<string>();
      const stack: Array<{ file: string; depth: number }> = [{ file: entry, depth: 0 }];

      while (stack.length) {
        const current = stack.pop();
        if (!current) continue;
        const { file, depth } = current;
        if (seen.has(file)) continue;
        seen.add(file);
        if (depth > maxDepth) continue;

        let text: string;
        try {
          text = fs.readFileSync(file, "utf8");
        } catch {
          return { file, kind: "eval", sample: "unreadable" } as Finding;
        }

        for (const finding of scanText(file, text)) {
          if (isDeniedKind(finding.kind)) return finding;
        }

        const re = /import\s+[^'"]*['"]([^'"]+)['"]|import\(['"]([^'"]+)['"]\)/g;
        let match: RegExpExecArray | null;
        while ((match = re.exec(text))) {
          const spec = (match[1] ?? match[2]) as string | undefined;
          if (!spec) continue;

          if (isImportDenied(env, spec)) {
            return { file, kind: "eval", sample: `denied:${spec}` } as Finding;
          }
          if (spec.startsWith("./") || spec.startsWith("../")) {
            const resolved = resolveLocalImport(file, spec);
            if (resolved) stack.push({ file: resolved, depth: depth + 1 });
          }
        }
      }
      return null;
    }

    return {
      Program(node) {
        const finding = walkFrom(filename);
        if (!finding) return;

        if (finding.sample.startsWith("denied:")) {
          const spec = finding.sample.slice("denied:".length);
          context.report({ node, messageId: "deniedDirect", data: { spec } });
          return;
        }
        if (finding.sample === "unreadable") {
          context.report({ node, messageId: "unreadable", data: { file: finding.file } });
          return;
        }
        context.report({
          node,
          messageId: "deniedTransitive",
          data: { kind: finding.kind, file: finding.file }
        });
      }
    };
  }
});
