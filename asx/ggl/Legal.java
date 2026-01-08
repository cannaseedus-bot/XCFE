package asx.ggl;

import java.util.Map;

public final class Legal {
  @SuppressWarnings("unchecked")
  public static void check(Object ast, Object grammarAbi) {
    if (!(grammarAbi instanceof Map) || !(ast instanceof Map)) {
      return;
    }
    Map<String, Object> abi = (Map<String, Object>) grammarAbi;
    Object legalPattern = abi.get("legal_regex");
    if (legalPattern == null) {
      return;
    }
    Map<String, Object> astMap = (Map<String, Object>) ast;
    Object text = astMap.get("text");
    String textStr = text == null ? "" : text.toString();
    if (!textStr.matches("(?s)" + legalPattern.toString())) {
      throw new IllegalArgumentException("GGL text failed legality regex");
    }
  }

  private Legal() {}
}
