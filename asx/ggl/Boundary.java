package asx.ggl;

public final class Boundary {
  public static final String BOUNDARY_OPEN = "<GGL>";
  public static final String BOUNDARY_CLOSE = "</GGL>";

  public static final class Extract {
    public final boolean ok;
    public final String inner;
    public final String code;
    public final String msg;
    public final double score;

    private Extract(boolean ok, String inner, String code, String msg, double score) {
      this.ok = ok;
      this.inner = inner;
      this.code = code;
      this.msg = msg;
      this.score = score;
    }

    public static Extract ok(String inner) {
      return new Extract(true, inner, "OK", "", 0.0);
    }

    public static Extract err(String code, String msg, double score) {
      return new Extract(false, null, code, msg, score);
    }
  }

  public static Extract extract(String text) {
    int a = text.indexOf(BOUNDARY_OPEN);
    int b = text.indexOf(BOUNDARY_CLOSE);
    if (a < 0 || b < 0 || b < a) {
      return Extract.err("E_GGL_BOUNDARY", "missing or malformed <GGL>...</GGL> boundary", 0.0);
    }
    String inner = text.substring(a + BOUNDARY_OPEN.length(), b).trim();
    String outside = (text.substring(0, a) + text.substring(b + BOUNDARY_CLOSE.length())).trim();
    if (!outside.isEmpty()) {
      return Extract.err("E_GGL_OUTSIDE_TEXT", "non-empty text outside GGL boundary", 0.05);
    }
    return Extract.ok(inner);
  }

  private Boundary() {}
}
