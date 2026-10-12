/**
 * Deterministic backend fixture server for the SSR browser regression suite.
 *
 * Runs as a plain Node process launched by Playwright's `webServer` (SSR mode).
 * It serves the fixture contract from `./ssr-fixtures.mjs` to both the SSR
 * renderer (server-side fetch) and the browser (cross-origin fetch), and
 * records every request so specs can assert which requests a page issued.
 *
 * Any request outside the fixture contract is answered with 500 and recorded
 * as `unexpected`, so a spec can fail on requests the fixture does not model.
 */
import { createServer } from 'node:http';
import { resolveFixtureRequest } from './ssr-fixtures.mjs';

const PORT = Number(process.env.E2E_FIXTURE_PORT ?? 4310);
const HOST = process.env.E2E_FIXTURE_HOST ?? '127.0.0.1';

/** @type {{ method: string, path: string, search: string, unexpected: boolean }[]} */
const requestLog = [];

function sendJson(response, status, body, origin) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    'content-type': 'application/json',
    'cache-control': 'no-store',
    'access-control-allow-origin': origin ?? '*',
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,x-category-identity-generation,x-market-code,x-currency,x-locale,x-channel',
    vary: 'origin',
  });
  response.end(payload);
}

const server = createServer((request, response) => {
  const origin = request.headers.origin;
  const requestUrl = new URL(request.url ?? '/', `http://${HOST}:${PORT}`);

  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {}, origin);
    return;
  }

  // Test control plane: inspect and reset the request log.
  if (requestUrl.pathname === '/__fixture/requests' && request.method === 'GET') {
    sendJson(response, 200, { requests: requestLog }, origin);
    return;
  }

  if (requestUrl.pathname === '/__fixture/reset' && request.method === 'POST') {
    requestLog.length = 0;
    sendJson(response, 200, { ok: true }, origin);
    return;
  }

  // Guest-visible order-events SSE. Hold the stream open with a long retry so
  // the browser does not reconnect in a loop during the test, and record it as
  // an expected request.
  if (requestUrl.pathname === '/v1/me/events' && request.method === 'GET') {
    requestLog.push({
      method: 'GET', path: requestUrl.pathname, search: '', unexpected: false,
    });
    response.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
      'access-control-allow-origin': origin ?? '*',
      'access-control-allow-credentials': 'true',
      vary: 'origin',
    });
    response.write('retry: 60000\n\n');
    return;
  }

  const result = resolveFixtureRequest(request.method ?? 'GET', requestUrl);

  const entry = {
    method: request.method ?? 'GET',
    path: requestUrl.pathname,
    search: requestUrl.search,
    unexpected: result === null,
  };
  requestLog.push(entry);

  if (result === null) {
    sendJson(response, 500, { message: `unexpected fixture request: ${entry.method} ${requestUrl.pathname}` }, origin);
    return;
  }

  sendJson(response, result.status, result.body, origin);
});

server.listen(PORT, HOST, () => {
  // Playwright waits on /health/ready; this line is only for manual runs.
  console.info(`[ssr-fixture] listening on http://${HOST}:${PORT}`);
});
