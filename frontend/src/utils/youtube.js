const YT_REGEX =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[\w-]{11}/;

export function isValidYoutubeUrl(url) {
  if (!url || !url.trim()) return false;
  return YT_REGEX.test(url.trim());
}
