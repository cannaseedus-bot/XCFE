import { ESLintUtils } from "@typescript-eslint/utils";
import { loadSiblingAsx, effectDeclared } from "../util/loadEnvelope.js";

function hasNetEffect(text: string) {
  return /\bfetch\b|\bWebSocket\b|\bXMLHttpRequest\b/.test(text);
}

function hasDomEffect(text: string) {
  return /\bdocument\b|\bwindow\b/.test(text);
}

function hasEvalEffect(text: string) {
  return /\beval\b|\bFunction\b/.test(text);
}

export default ESLintUtils.RuleCreator(
  () => "https://asx.spec/effects-subset"
)({
  name: "effects-subset",
  meta: {
    type: "problem",
    docs: { description: "Detect direct effect usage without declarations", recommended: "error" },
    schema: [],
    messages: {
      net: "Network effect detected but not declared in .asx (@effects.net includes 'read')",
      dom: "DOM access detected but not declared in .asx (@effects.dom includes 'access')",
      eval: "Forbidden dynamic authority detected (eval/Function)"
    }
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    if (filename === "<input>" || !/\.(ts|js)x?$/.test(filename)) return {};
    const env = loadSiblingAsx(filename);
    if (!env) return {};

    const text = context.getSourceCode().getText();

    return {
      Program(node) {
        if (hasNetEffect(text) && !effectDeclared(env, "net", "read")) {
          context.report({ node, messageId: "net" });
        }
        if (hasDomEffect(text) && !effectDeclared(env, "dom", "access")) {
          context.report({ node, messageId: "dom" });
        }
        if (hasEvalEffect(text)) {
          context.report({ node, messageId: "eval" });
        }
      }
    };
  }
});
