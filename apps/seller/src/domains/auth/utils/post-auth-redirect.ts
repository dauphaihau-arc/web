// Guard redirects carry the intended target in the login URL, because
// localStorage is not available while the server renders a protected route.
// Only same-origin paths are usable, so a crafted `?redirect=` value cannot
// send the seller to another origin.
export function resolvePostAuthRedirect(rawRedirect: unknown) {
  if (typeof rawRedirect !== 'string' || !rawRedirect.startsWith('/') || rawRedirect.startsWith('//')) {
    return null;
  }

  return rawRedirect;
}
