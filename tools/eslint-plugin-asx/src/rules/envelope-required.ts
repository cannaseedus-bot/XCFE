import { ESLintUtils } from "@typescript-eslint/utils";
import { loadSiblingAsx } from "../util/loadEnvelope.js";

export default ESLintUtils.RuleCreator(
  () => "https://asx.spec/envelope-required"
)({
  name: "envelope-required",
  meta: {
    type: "problem",
    docs: { description: "Require sibling .asx envelope", recommended: "error" },
    schema: [],
    messages: {
      missing: "Missing ASX envelope (.asx) for this module"
    }
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();
    if (filename === "<input>" || !/\.(ts|js)x?$/.test(filename)) return {};
    const env = loadSiblingAsx(filename);
    if (env) return {};

    return {
      Program(node) {
        context.report({ node, messageId: "missing" });
      }
    };
  }
});
