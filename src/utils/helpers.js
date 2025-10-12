export function parseFrom(fromHeader) {
  const m = fromHeader.match(/(.*)<(.+@.+\..+)>/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  const m2 = fromHeader.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (m2) return { name: fromHeader.replace(m2[1], "").trim() || m2[1], email: m2[1] };
  return { name: fromHeader, email: fromHeader };
}

export async function waitForRetry(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
