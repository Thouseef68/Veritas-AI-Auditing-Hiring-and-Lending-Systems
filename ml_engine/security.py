"""
SSRF & External URL Security Validator.
- Enforces HTTPS in production (VERITAS_ENV=production).
- Blocks private IP ranges, loopback, link-local / cloud metadata endpoints, and non-HTTP(S) schemes.
- Provides a NoRedirectHandler to prevent unsafe redirect-based SSRF.
"""

import ipaddress
import os
import socket
import urllib.request
from urllib.parse import urlparse


def is_production_env() -> bool:
    return (
        os.environ.get("VERITAS_ENV", "").lower() == "production"
        or bool(os.environ.get("RENDER") or os.environ.get("RAILWAY_ENVIRONMENT") or os.environ.get("MODAL_ENVIRONMENT"))
    )


class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    """Prevents urllib from following redirects to internal/private targets."""

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError(f"Unsafe HTTP redirect blocked (status {code} -> {newurl}).")


def validate_external_url(url: str, require_https: bool | None = None) -> str:
    if require_https is None:
        require_https = is_production_env()

    if not url or not isinstance(url, str):
        raise ValueError("URL must be a non-empty string.")
    parsed = urlparse(url.strip())
    allowed_schemes = ("https",) if require_https else ("http", "https")
    if parsed.scheme not in allowed_schemes:
        raise ValueError(f"Blocked URL scheme '{parsed.scheme}'. Allowed: {allowed_schemes}.")
    host = parsed.hostname
    if not host:
        raise ValueError("URL missing hostname.")
    if host.lower() in ("localhost", "127.0.0.1", "::1", "0.0.0.0", "metadata.google.internal"):
        raise ValueError(f"Blocked internal/loopback host: {host}")

    try:
        infos = socket.getaddrinfo(host, None)
        for info in infos:
            ip_str = info[4][0]
            ip_obj = ipaddress.ip_address(ip_str)
            if (
                ip_obj.is_private
                or ip_obj.is_loopback
                or ip_obj.is_link_local
                or ip_obj.is_multicast
                or ip_obj.is_reserved
                or ip_obj.is_unspecified
            ):
                raise ValueError(f"Blocked non-public IP address resolved for {host}: {ip_str}")
    except socket.gaierror:
        pass

    return url.strip()
