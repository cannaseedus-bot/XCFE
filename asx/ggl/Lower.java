package asx.ggl;

import java.util.HashMap;
import java.util.Map;

public final class Lower {
  @SuppressWarnings("unchecked")
  public static Object lower(Object ast, Object grammarAbi) {
    if (grammarAbi instanceof Map) {
      Map<String, Object> abi = (Map<String, Object>) grammarAbi;
      if ("deny".equals(abi.get("lowering"))) {
        throw new IllegalArgumentException("lowering disabled by grammar ABI");
      }
    }

    Map<String, Object> astMap = (Map<String, Object>) ast;
    Map<String, Object> out = new HashMap<>();
    String type = "scene.ir.v1";
    if (grammarAbi instanceof Map) {
      Object sceneType = ((Map<?, ?>) grammarAbi).get("scene_ir_type");
      if (sceneType != null) {
        type = sceneType.toString();
      }
    }
    out.put("@type", type);
    out.put("ggl", astMap.getOrDefault("text", ""));
    return out;
  }

  private Lower() {}
}
