package asx.canon;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public final class JsonCanonV1 {
  private JsonCanonV1() {}

  public static byte[] canonBytes(Object obj, JsonAdapter json) throws Exception {
    Object canonical = canonicalize(obj);
    String text = json.stringify(canonical);
    return text.getBytes(StandardCharsets.UTF_8);
  }

  @SuppressWarnings("unchecked")
  private static Object canonicalize(Object obj) {
    if (obj instanceof Map) {
      Map<String, Object> map = (Map<String, Object>) obj;
      Map<String, Object> sorted = new TreeMap<>();
      for (Map.Entry<String, Object> entry : map.entrySet()) {
        sorted.put(entry.getKey(), canonicalize(entry.getValue()));
      }
      return sorted;
    }
    if (obj instanceof List) {
      List<Object> list = (List<Object>) obj;
      List<Object> out = new ArrayList<>(list.size());
      for (Object item : list) {
        out.add(canonicalize(item));
      }
      return out;
    }
    return obj;
  }

  public interface JsonAdapter {
    String stringify(Object o) throws Exception;
  }
}
