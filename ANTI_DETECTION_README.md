# Cloudflare Anti-Detection Implementation

This implementation includes multiple layers of protection against Cloudflare's detection mechanisms:

## 1. Enhanced HTTP Headers
- **Random User-Agents**: Uses `user-agents` library to generate realistic browser user agents
- **Browser-like Headers**: Includes proper `sec-ch-ua`, `sec-fetch-*` headers that modern browsers send
- **Session Simulation**: Generates consistent session IDs to mimic browser sessions
- **Origin Headers**: Sets proper origin and referer headers for warframe.market

## 2. Proxy Management
- **Smart Proxy Rotation**: Avoids using proxies that have been flagged or show high failure rates
- **Performance Tracking**: Monitors proxy success/failure rates to identify compromised proxies
- **Immediate Rotation**: Switches proxies on 403/429/503 errors with retry logic

## 3. Request Timing
- **Human-like Delays**: Every HTTP request is paced by a random delay before it fires
  (default 500ms-2000ms). The `sync_prices` bulk job tunes this down to 100-300ms via
  `MIN_DELAY`/`MAX_DELAY` env vars and leans on retry/backoff + proxy rotation instead,
  trading anti-detection margin for throughput across thousands of items - pass your own
  `minDelay`/`maxDelay` to `WarframeUndici` to change the tradeoff.
- **Exponential Backoff**: Uses jittered exponential backoff for retries

## 4. TLS Fingerprinting
- **Cipher Randomization**: Rotates TLS ciphers to avoid consistent fingerprinting
- **Protocol Variants**: Uses different TLS versions and security options

## 5. Session Management
- **Session Reset**: Resets session data when switching proxies
- **Request Counting**: Tracks requests per session to mimic browser behavior
- **Consistent Headers**: Maintains session consistency while randomizing detectible elements

## Key Features:

### Retry Logic
- Retries up to 10 times by default on 403 (Forbidden), 429 (Rate Limited), and any 5xx response
  (the `sync_*` scripts tune this down to 5 to keep multi-thousand-item runs fast; pass
  `maxRetries` to `WarframeUndici`/`UndiciHttpService` to override)
- Each retry uses a new proxy and fresh headers
- Implements jittered exponential backoff to avoid predictable retry patterns

### Proxy Health Management
- Automatically marks proxies as problematic after failures
- Maintains success/failure statistics for each proxy
- Avoids reusing proxies with high failure rates

### Browser Simulation
- Mimics Chrome/Chromium browser headers exactly
- Includes proper sec-fetch-* headers for CORS requests
- Uses realistic Accept headers for JSON API requests

## Environment Variables:
- `PROXY_LESS=true`: Disable proxy usage for testing
- `DEBUG=true` (or `DEBUG=warframe:*`): verbose anti-detection/retry/rotation logging
- Standard proxy configuration through your existing proxy system (see README.md)

## Usage Notes:
1. The system will automatically handle 403 errors by rotating proxies and headers
2. Each request includes random delays to appear more human-like
3. Failed proxies are automatically avoided in subsequent requests
4. Session data is reset when encountering blocks to start fresh

## Monitoring:
The system logs:
- Retry attempts with status codes
- Proxy rotations
- Performance statistics
- Session resets

This multi-layered approach should significantly improve success rates against Cloudflare's detection systems.
