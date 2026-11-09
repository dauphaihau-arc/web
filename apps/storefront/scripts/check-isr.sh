#!/usr/bin/env bash
# Verify that ISR route rules are live on a deployed storefront route.
#
# ISR is implemented by the Netlify/Vercel preset runtime: the route rule becomes
# CDN cache headers and the platform reports the cache outcome per request in
# Cache-Status. Locally (node-server preset) `isr` is inert, so this must run
# against a deploy.
#
# usage: ./scripts/check-isr.sh <base-url> [route] [options]
# exit:  0 = cached response observed and validated
#        1 = usage error
#        2 = never served from cache
#        3 = deploy unreachable
#        4 = cached, but the response breaks the ISR contract
#        5 = control route was cached (probe would pass for the wrong reason)
set -euo pipefail

usage() {
  cat <<'EOF'
usage: ./scripts/check-isr.sh <base-url> [route] [options]

  --expect <seconds>     require age + ttl to match the configured ISR TTL
  --control <route>      require the control route to never be cached
  --attempts <n>         max requests for the probe (default 5)
  --interval <seconds>   delay between requests (default 1)
  --require-no-cookie    reject a cached HTML response that sets cookies
  --payload              require the route payload (_payload.json) to be cached
  -h, --help             show this help
EOF
}

BASE_URL="${1:-}"
if [[ -z "$BASE_URL" || "$BASE_URL" == -* ]]; then
  usage >&2
  exit 1
fi
shift

ROUTE="/"
if [[ $# -gt 0 && "$1" != -* ]]; then
  ROUTE="$1"
  shift
fi

EXPECT=""
CONTROL=""
ATTEMPTS=5
INTERVAL=1
REQUIRE_NO_COOKIE=0
CHECK_PAYLOAD=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --expect) EXPECT="${2:-}"; shift 2 ;;
    --control) CONTROL="${2:-}"; shift 2 ;;
    --attempts) ATTEMPTS="${2:-}"; shift 2 ;;
    --interval) INTERVAL="${2:-}"; shift 2 ;;
    --require-no-cookie) REQUIRE_NO_COOKIE=1; shift ;;
    --payload) CHECK_PAYLOAD=1; shift ;;
    -h | --help) usage; exit 0 ;;
    *)
      echo "unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if ! [[ "$ATTEMPTS" =~ ^[1-9][0-9]*$ && "$INTERVAL" =~ ^[0-9]+$ ]]; then
  echo "--attempts must be a positive integer and --interval a non-negative integer" >&2
  exit 1
fi

if [[ -n "$EXPECT" ]] && ! [[ "$EXPECT" =~ ^[1-9][0-9]*$ ]]; then
  echo "--expect must be a positive integer" >&2
  exit 1
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

header_value() {
  local file="$1" key="$2"
  awk -v k="$key" '
    tolower(substr($0, 1, length(k) + 1)) == tolower(k ":") {
      line = $0
      sub(/^[^:]*:[[:space:]]*/, "", line)
      sub(/\r$/, "", line)
      out = (out == "" ? line : out "; " line)
    }
    END { print out }
  ' "$file"
}

classify() {
  local status="$1"
  case "$status" in
    *hit*"fwd=stale"*) echo "stale-served" ;;
    *hit*) echo "hit" ;;
    *fwd=bypass*) echo "bypass" ;;
    *fwd=stale*) echo "stale" ;;
    *fwd=miss*) echo "miss" ;;
    *) echo "unknown" ;;
  esac
}

# fetch_probe <url> <prefix>
# Prints a tab-separated record: code, age, ttl, verdict, cache-status,
# cache-control, set-cookie, netlify-cdn-cache-control.
fetch_probe() {
  local url="$1" prefix="$2" code cache_status cache_control set_cookie age ttl cdn_cache

  if ! code="$(curl -sS -o "$prefix.body" -D "$prefix.headers" -w '%{http_code}' --max-time 30 "$url")"; then
    printf 'curl-error\n'
    return 0
  fi

  cache_status="$(header_value "$prefix.headers" cache-status)"
  cache_control="$(header_value "$prefix.headers" cache-control)"
  set_cookie="$(header_value "$prefix.headers" set-cookie)"
  age="$(header_value "$prefix.headers" age)"
  cdn_cache="$(header_value "$prefix.headers" netlify-cdn-cache-control)"
  ttl="$(printf '%s' "$cache_status" | sed -n 's/.*ttl=\(-\{0,1\}[0-9]\{1,\}\).*/\1/p' | head -n 1)"

  printf '%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\n' \
    "$code" "${age:-}" "${ttl:-}" "$(classify "$cache_status")" \
    "$cache_status" "$cache_control" "$set_cookie" "$cdn_cache"
}

fail_assertion() {
  echo "FAIL $*"
  exit 4
}

URL="${BASE_URL%/}${ROUTE}"
echo "GET $URL  (up to $ATTEMPTS requests, ${INTERVAL}s apart)"
echo

hits=0
unreachable=0
validated=0

for ((i = 1; i <= ATTEMPTS; i++)); do
  IFS=$'\x1f' read -r code age ttl verdict cache_status cache_control set_cookie cdn_cache \
    < <(fetch_probe "$URL" "$TMP_DIR/req-$i")

  if [[ "$code" == "curl-error" ]]; then
    echo "[$i] request failed"
    unreachable=$((unreachable + 1))
    sleep "$INTERVAL"
    continue
  fi

  echo "[$i] HTTP $code  verdict=$verdict  age=${age:-<none>}  ttl=${ttl:-<none>}"
  echo "     cache-status=${cache_status:-<none>}"
  echo "     cache-control=${cache_control:-<none>}"
  echo "     netlify-cdn-cache-control=${cdn_cache:-<none>}"

  case "$verdict" in
    hit | stale-served)
      hits=$((hits + 1))

      if [[ -n "$EXPECT" ]]; then
        [[ -n "$age" && -n "$ttl" ]] || fail_assertion "cached response has no age/ttl headers"
        tolerance=$((EXPECT / 10))
        ((tolerance < 60)) && tolerance=60
        observed=$((age + ttl))
        delta=$((observed - EXPECT))
        ((delta < 0)) && delta=$((-delta))
        ((delta <= tolerance)) \
          || fail_assertion "age+ttl=${observed}s does not match expected ISR TTL ${EXPECT}s (±${tolerance}s)"
      fi

      if [[ "$REQUIRE_NO_COOKIE" == 1 && -n "$set_cookie" ]]; then
        fail_assertion "cached response sets cookies: ${set_cookie}"
      fi

      case "$cache_control" in
        *no-store* | *private*)
          fail_assertion "cached response is marked uncacheable: ${cache_control}"
          ;;
      esac

      validated=1
      break
      ;;
  esac

  sleep "$INTERVAL"
done

if ((validated == 0 && unreachable == ATTEMPTS)); then
  echo
  echo "RESULT: all requests failed - deploy unreachable?"
  exit 3
fi

if ((hits == 0)); then
  echo
  echo "RESULT: ISR not observed - no cache hit for $ROUTE"
  echo "        check that the route rule carries isr and that the deploy built with the netlify preset"
  exit 2
fi

echo
echo "RESULT: ISR is live - cached response validated for $ROUTE"

if [[ -n "$CONTROL" ]]; then
  control_hits=0
  control_unreachable=0
  echo
  echo "GET ${BASE_URL%/}${CONTROL}  (control, must not be cached)"

  for ((i = 1; i <= 3; i++)); do
    IFS=$'\x1f' read -r code age ttl verdict cache_status cache_control set_cookie cdn_cache \
      < <(fetch_probe "${BASE_URL%/}${CONTROL}" "$TMP_DIR/control-$i")

    if [[ "$code" == "curl-error" ]]; then
      control_unreachable=$((control_unreachable + 1))
      continue
    fi

    echo "  [$i] HTTP $code  verdict=$verdict  cache-status=${cache_status:-<none>}"

    case "$verdict" in
      hit | stale-served) control_hits=$((control_hits + 1)) ;;
    esac
  done

  if ((control_unreachable == 3)); then
    echo "RESULT: control route unreachable"
    exit 3
  fi

  if ((control_hits > 0)); then
    echo "RESULT: control route $CONTROL was cached - the probe cannot distinguish ISR from a blanket CDN cache"
    exit 5
  fi

  echo "RESULT: control route $CONTROL is not cached"
fi

if [[ "$CHECK_PAYLOAD" == 1 ]]; then
  if [[ "$ROUTE" == "/" ]]; then
    payload_route="/_payload.json"
  else
    payload_route="${ROUTE%/}/_payload.json"
  fi

  payload_hits=0
  echo
  echo "GET ${BASE_URL%/}${payload_route}  (client-side navigation payload)"

  for ((i = 1; i <= ATTEMPTS; i++)); do
    IFS=$'\x1f' read -r code age ttl verdict cache_status cache_control set_cookie cdn_cache \
      < <(fetch_probe "${BASE_URL%/}${payload_route}" "$TMP_DIR/payload-$i")

    if [[ "$code" == "curl-error" ]]; then
      echo "  [$i] request failed"
      sleep "$INTERVAL"
      continue
    fi

    echo "  [$i] HTTP $code  verdict=$verdict  cache-status=${cache_status:-<none>}"

    case "$verdict" in
      hit | stale-served)
        payload_hits=$((payload_hits + 1))
        break
        ;;
    esac

    sleep "$INTERVAL"
  done

  if ((payload_hits == 0)); then
    echo "RESULT: payload $payload_route is not cached - client-side navigation would bypass ISR"
    exit 4
  fi

  echo "RESULT: payload $payload_route is cached"
fi

exit 0
