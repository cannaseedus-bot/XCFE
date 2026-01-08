package asx.hash;

import java.security.MessageDigest;

public final class Sha256 {
  private Sha256() {}

  public static String hex(byte[] data) throws Exception {
    MessageDigest md = MessageDigest.getInstance("SHA-256");
    byte[] digest = md.digest(data);
    StringBuilder sb = new StringBuilder(digest.length * 2);
    for (byte b : digest) {
      sb.append(String.format("%02x", b));
    }
    return sb.toString();
  }
}
