type StorageUrlInput = {
  url?: string
  storageKey?: string
  assetHost?: string
};

export function resolveStoragePublicUrl(input: StorageUrlInput): string | undefined {
  if (input.url) {
    return input.url;
  }

  if (!input.storageKey || !input.assetHost) {
    return undefined;
  }

  const baseUrl = input.assetHost.replace(/\/+$/, '');
  const encodedKey = input.storageKey
    .split('/')
    .filter(Boolean)
    .map(segment => encodeURIComponent(segment))
    .join('/');

  return `${baseUrl}/${encodedKey}`;
}

export function resolveStorageKeyFromPublicUrl(url: string | undefined, assetHost: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  const normalizedAssetHost = assetHost?.replace(/\/+$/, '');

  if (normalizedAssetHost && url.startsWith(`${normalizedAssetHost}/`)) {
    return decodeURIComponent(url.slice(normalizedAssetHost.length + 1));
  }

  return url;
}
