export class LowerError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function lowerAstToSceneXjson(ast, grammarAbi) {
  if (grammarAbi.lowering === "deny") {
    throw new LowerError("E_LOWER_DISABLED", "lowering disabled by grammar ABI");
  }

  return {
    "@type": grammarAbi.scene_ir_type || "scene.ir.v1",
    ggl: ast.text || "",
  };
}
