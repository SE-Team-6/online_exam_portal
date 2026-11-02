# HTTPS and TLS deployment

The backend accepts TLS 1.2 or later when it serves HTTPS directly. In production, either configure a certificate and private key or terminate TLS at a trusted reverse proxy. Production startup fails if neither mode is selected. HTTP requests are rejected with `426 HTTPS_REQUIRED` by default in production.

## Backend serves HTTPS

Set these environment values to certificate files mounted securely into the backend container or host:

```env
NODE_ENV=production
TLS_KEY_PATH=/run/secrets/portal-key.pem
TLS_CERT_PATH=/run/secrets/portal-cert.pem
REQUIRE_HTTPS=true
```

The private key must be readable by the service account and must not be committed to the repository. The HTTPS server negotiates TLS 1.2 or later.

## TLS terminates at a reverse proxy

Configure the proxy to accept HTTPS only, use TLS 1.2 or later to clients, and forward requests to the backend over a private trusted network. Set:

```env
NODE_ENV=production
TLS_TERMINATED_BY_PROXY=true
TRUST_PROXY_HOPS=1
REQUIRE_HTTPS=true
```

Set `TRUST_PROXY_HOPS` to the exact number of trusted proxies between the client and Express. The proxy must overwrite the forwarded protocol header; do not expose the backend directly to untrusted clients in this mode.

## Frontend

Use the same HTTPS origin for the frontend and `/api` requests, or set `VITE_API_BASE_URL` to an `https://` API URL. The default `/api` path keeps production API traffic on the page's HTTPS origin. Vite proxies `/api` to the local HTTP backend only during local development.

The production backend adds the `Strict-Transport-Security` header after it observes a secure request. Local development can continue to use HTTP.
