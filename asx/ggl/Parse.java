package asx.ggl;

import java.util.Map;
import java.util.HashMap;

public final class Parse {
  @SuppressWarnings("unchecked")
  public static Object parseToAst(String text, Object grammarAbi) {
    if (grammarAbi instanceof Map) {
      Map<String, Object> abi = (Map<String, Object>) grammarAbi;
      Object parserKind = abi.get("parser");
      if ("regex".equals(parserKind)) {
        Object pattern = abi.get("pattern");
        if (pattern == null) {
          throw new IllegalArgumentException("regex parser requires pattern");
        }
        if (!text.matches("(?s)" + pattern.toString())) {
          throw new IllegalArgumentException("GGL text failed regex parser");
        }
      }
    }

    Map<String, Object> ast = new HashMap<>();
    ast.put("type", "GGLRaw");
    ast.put("text", text);
    return ast;
  }

  private Parse() {}
}
