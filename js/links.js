let linkMap = {};

export async function loadLinks() {
  const res = await fetch("data/links.json");
  const data = await res.json();
  linkMap = data.links || {};
  return linkMap;
}

export function resolveUrl(keyOrUrl) {
  if (!keyOrUrl) return linkMap.chsi_school || "#";
  if (keyOrUrl.startsWith("http")) return keyOrUrl;
  return linkMap[keyOrUrl] || linkMap.chsi_school || "#";
}

export function officialUrl(key) {
  return resolveUrl(key);
}
