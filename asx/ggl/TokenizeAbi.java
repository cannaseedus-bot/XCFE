package asx.ggl;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;

public final class TokenizeAbi {
  public static final class Err {
    public final String code;
    public final String msg;

    public Err(String code, String msg) {
      this.code = code;
      this.msg = msg;
    }
  }

  @SuppressWarnings("unchecked")
  public static Err check(String text, Object tokenizerAbi) {
    if (!(tokenizerAbi instanceof Map)) {
      return null;
    }
    Map<String, Object> abi = (Map<String, Object>) tokenizerAbi;
    List<List<Number>> allowedRanges = (List<List<Number>>) abi.get("allowed_codepoint_ranges");
    List<List<Number>> forbiddenRanges = (List<List<Number>>) abi.get("forbidden_codepoint_ranges");
    Set<Integer> disallowed = new HashSet<>();
    Object disallowedObj = abi.get("disallowed_codepoints");
    if (disallowedObj instanceof List) {
      for (Object item : (List<?>) disallowedObj) {
        if (item instanceof Number) {
          disallowed.add(((Number) item).intValue());
        }
      }
    }

    for (int i = 0; i < text.length(); i++) {
      int codepoint = text.codePointAt(i);
      if (!disallowed.isEmpty() && disallowed.contains(codepoint)) {
        return new Err("E_TOKEN_DISALLOWED_CODEPOINT", String.format("disallowed codepoint: U+%04X", codepoint));
      }
      if (forbiddenRanges != null && inRanges(codepoint, forbiddenRanges)) {
        return new Err("E_TOKEN_FORBIDDEN_RANGE", String.format("forbidden codepoint: U+%04X", codepoint));
      }
      if (allowedRanges != null && !inRanges(codepoint, allowedRanges)) {
        return new Err("E_TOKEN_OUTSIDE_ALLOWED_RANGE", String.format("codepoint outside allowed ranges: U+%04X", codepoint));
      }
    }
    return null;
  }

  private static boolean inRanges(int codepoint, List<List<Number>> ranges) {
    for (List<Number> range : ranges) {
      if (range.size() < 2) {
        continue;
      }
      int start = range.get(0).intValue();
      int end = range.get(1).intValue();
      if (start <= codepoint && codepoint <= end) {
        return true;
      }
    }
    return false;
  }

  private TokenizeAbi() {}
}
