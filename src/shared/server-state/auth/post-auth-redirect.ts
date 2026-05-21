import { LocalStorageKeys } from '~/shared/config/enums/local-storage-keys';

export function setPostAuthRedirect(path: string) {
  localStorage.setItem(LocalStorageKeys.POST_AUTH_REDIRECT, path);
}

export function consumePostAuthRedirect() {
  const path = localStorage.getItem(LocalStorageKeys.POST_AUTH_REDIRECT);

  if (!path) {
    return null;
  }

  localStorage.removeItem(LocalStorageKeys.POST_AUTH_REDIRECT);

  return path;
}
