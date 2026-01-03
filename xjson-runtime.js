// Optional helper: wraps /xjson/run for a given base URL.
export async function xjsonRun(baseUrl, program, context = {}) {
  const res = await fetch(baseUrl.replace(/\/$/, '') + "/xjson/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ program, context })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error("XJSON request failed (" + res.status + "): " + text);
  }

  const data = await res.json().catch(() => ({}));
  if (!data.ok) {
    throw new Error("XJSON error: " + (data.error || "unknown"));
  }
  return data.result;
}
