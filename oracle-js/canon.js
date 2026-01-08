export function canonJsonBytesV1(obj) {
  const canonical = canonicalize(obj);
  const text = JSON.stringify(canonical);
  return new TextEncoder().encode(text);
}

function canonicalize(obj) {
  if (Array.isArray(obj)) {
    return obj.map((item) => canonicalize(item));
  }
  if (obj && typeof obj === "object") {
    const sorted = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = canonicalize(obj[key]);
    }
    return sorted;
  }
  return obj;
}
