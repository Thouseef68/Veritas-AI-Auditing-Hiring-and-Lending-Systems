"""
SSRF & External URL Security Validator.
Blocks private IP ranges, loopback, link-local / cloud metadata endpoints, and non-HTTP(S) schemes.
"""

import ipaddress
import socket
from urllib.parse import urlparse


def validate_external_url(url: str, require_https: bool = False) -> str:
    if not url or not isinstance(url, str):
        raise ValueError("URL must be a non-empty string.")
    parsed = urlparse(url.strip())
    if parsed.scheme not in (("https",) if require_https else ("http", "https")):
        raise ValueError(f"Blocked URL scheme '{parsed.scheme}'. Only HTTP(S) is allowed.")
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
        # If DNS resolution fails, let the caller handle network failure as UNKNOWN/FAILED
        pass

    return url.strip()
