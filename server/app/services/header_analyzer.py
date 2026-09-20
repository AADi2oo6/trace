"""TRACE Header Analyzer Service — HTTP Header Categorization and Explanation."""

from dataclasses import dataclass
from typing import Mapping

from app.schemas.request import HeaderAnalysisItem, HeaderCategory, HeaderSource


@dataclass(frozen=True)
class HeaderMetadata:
    """Catalog entry metadata for standard HTTP headers."""

    category: HeaderCategory
    description: str


HEADER_CATALOG: dict[str, HeaderMetadata] = {
    # --- Content Headers ---
    "content-type": HeaderMetadata(
        category=HeaderCategory.CONTENT,
        description="Specifies the media type and character encoding of the payload body.",
    ),
    "content-length": HeaderMetadata(
        category=HeaderCategory.CONTENT,
        description="Indicates the size of the payload body in octets (bytes).",
    ),
    "content-encoding": HeaderMetadata(
        category=HeaderCategory.CONTENT,
        description="Lists compression algorithms applied to the payload (e.g. gzip, br, deflate).",
    ),
    "content-language": HeaderMetadata(
        category=HeaderCategory.CONTENT,
        description="Describes the natural language(s) intended for the audience of the payload.",
    ),
    "content-disposition": HeaderMetadata(
        category=HeaderCategory.CONTENT,
        description="Indicates whether the payload should be displayed inline or downloaded as an attachment.",
    ),
    "accept": HeaderMetadata(
        category=HeaderCategory.CONTENT,
        description="Advertises which media types the client understands and accepts in the response.",
    ),
    "accept-encoding": HeaderMetadata(
        category=HeaderCategory.CONTENT,
        description="Advertises which content compression encodings the client is capable of decoding.",
    ),
    "accept-language": HeaderMetadata(
        category=HeaderCategory.CONTENT,
        description="Advertises which human languages the client prefers for the response.",
    ),
    # --- Caching Headers ---
    "cache-control": HeaderMetadata(
        category=HeaderCategory.CACHING,
        description="Directs caching mechanisms along the request/response chain on how and whether to cache.",
    ),
    "etag": HeaderMetadata(
        category=HeaderCategory.CACHING,
        description="Provides an entity tag / fingerprint identifying a specific version of the resource.",
    ),
    "last-modified": HeaderMetadata(
        category=HeaderCategory.CACHING,
        description="Indicates the date and time at which the origin server believes the resource was last modified.",
    ),
    "expires": HeaderMetadata(
        category=HeaderCategory.CACHING,
        description="Gives the date/time after which the response is considered stale by caches.",
    ),
    "age": HeaderMetadata(
        category=HeaderCategory.CACHING,
        description="Indicates the duration in seconds that the response has been cached in an intermediate proxy.",
    ),
    "vary": HeaderMetadata(
        category=HeaderCategory.CACHING,
        description="Determines how future requests should match cached responses based on request header names.",
    ),
    "if-none-match": HeaderMetadata(
        category=HeaderCategory.CACHING,
        description="Conditional request header asking the server to return 304 if the resource ETag matches.",
    ),
    "if-modified-since": HeaderMetadata(
        category=HeaderCategory.CACHING,
        description="Conditional request header asking the server to return 304 if not modified since the specified date.",
    ),
    "pragma": HeaderMetadata(
        category=HeaderCategory.CACHING,
        description="Legacy HTTP/1.0 header often used for backward-compatible no-cache directives.",
    ),
    # --- Security Headers ---
    "strict-transport-security": HeaderMetadata(
        category=HeaderCategory.SECURITY,
        description="Enforces secure (HTTPS) connections and prevents SSL-stripping downgrade attacks (HSTS).",
    ),
    "content-security-policy": HeaderMetadata(
        category=HeaderCategory.SECURITY,
        description="Restricts the resources (scripts, images, frames) the browser is allowed to load to mitigate XSS.",
    ),
    "x-content-type-options": HeaderMetadata(
        category=HeaderCategory.SECURITY,
        description="Instructs the browser not to MIME-sniff the response away from the declared Content-Type.",
    ),
    "x-frame-options": HeaderMetadata(
        category=HeaderCategory.SECURITY,
        description="Indicates whether the browser should render the page inside a frame or iframe (clickjacking defense).",
    ),
    "referrer-policy": HeaderMetadata(
        category=HeaderCategory.SECURITY,
        description="Controls how much referrer information (URL) is sent with requests made from the document.",
    ),
    "permissions-policy": HeaderMetadata(
        category=HeaderCategory.SECURITY,
        description="Controls which browser features and hardware APIs (camera, geolocation, etc.) the site can access.",
    ),
    "cross-origin-opener-policy": HeaderMetadata(
        category=HeaderCategory.SECURITY,
        description="Isolates browsing contexts from cross-origin documents to protect against cross-origin attacks.",
    ),
    "cross-origin-embedder-policy": HeaderMetadata(
        category=HeaderCategory.SECURITY,
        description="Prevents a document from loading cross-origin resources that do not explicitly grant permission.",
    ),
    "cross-origin-resource-policy": HeaderMetadata(
        category=HeaderCategory.SECURITY,
        description="Restricts which origins are permitted to embed and read this resource.",
    ),
    # --- CORS Headers ---
    "access-control-allow-origin": HeaderMetadata(
        category=HeaderCategory.CORS,
        description="Specifies which origin(s) are permitted to access this resource cross-origin.",
    ),
    "access-control-allow-methods": HeaderMetadata(
        category=HeaderCategory.CORS,
        description="Specifies the HTTP methods permitted when accessing the resource in a cross-origin preflight.",
    ),
    "access-control-allow-headers": HeaderMetadata(
        category=HeaderCategory.CORS,
        description="Lists the HTTP request headers that can be used during an actual cross-origin request.",
    ),
    "access-control-allow-credentials": HeaderMetadata(
        category=HeaderCategory.CORS,
        description="Indicates whether the response can be exposed when the credentials flag is true.",
    ),
    "access-control-expose-headers": HeaderMetadata(
        category=HeaderCategory.CORS,
        description="Lists response headers that browsers are allowed to expose to client-side scripts.",
    ),
    "access-control-max-age": HeaderMetadata(
        category=HeaderCategory.CORS,
        description="Indicates how long (in seconds) the results of a preflight request can be cached by the browser.",
    ),
    "origin": HeaderMetadata(
        category=HeaderCategory.CORS,
        description="Indicates the origin (scheme, hostname, port) from which the cross-origin request originated.",
    ),
    # --- Authentication Headers ---
    "authorization": HeaderMetadata(
        category=HeaderCategory.AUTHENTICATION,
        description="Contains authentication credentials used to authenticate the client to the server.",
    ),
    "www-authenticate": HeaderMetadata(
        category=HeaderCategory.AUTHENTICATION,
        description="Defines the authentication scheme and parameters required to access the requested resource.",
    ),
    "proxy-authenticate": HeaderMetadata(
        category=HeaderCategory.AUTHENTICATION,
        description="Defines the authentication method that must be used to authenticate with a proxy server.",
    ),
    "proxy-authorization": HeaderMetadata(
        category=HeaderCategory.AUTHENTICATION,
        description="Contains credentials used by the client to authenticate with an intermediate proxy.",
    ),
    # --- Cookies Headers ---
    "set-cookie": HeaderMetadata(
        category=HeaderCategory.COOKIES,
        description="Transmits HTTP cookies from the server to the client storage.",
    ),
    "cookie": HeaderMetadata(
        category=HeaderCategory.COOKIES,
        description="Contains stored HTTP cookies previously transmitted by the server.",
    ),
    # --- Connection Headers ---
    "connection": HeaderMetadata(
        category=HeaderCategory.CONNECTION,
        description="Controls whether the underlying network connection stays open after the transaction completes.",
    ),
    "keep-alive": HeaderMetadata(
        category=HeaderCategory.CONNECTION,
        description="Specifies connection persistence parameters such as timeout and maximum requests.",
    ),
    "upgrade": HeaderMetadata(
        category=HeaderCategory.CONNECTION,
        description="Invites or requests a transition to a different network communication protocol.",
    ),
    "transfer-encoding": HeaderMetadata(
        category=HeaderCategory.CONNECTION,
        description="Specifies the form of encoding used to safely transfer the payload body (e.g. chunked).",
    ),
    # --- Redirection Headers ---
    "location": HeaderMetadata(
        category=HeaderCategory.REDIRECTION,
        description="Indicates the target URL for a redirection or the location of a newly created resource.",
    ),
    # --- Server / Infrastructure Headers ---
    "server": HeaderMetadata(
        category=HeaderCategory.SERVER,
        description="Advertises the software used by the handling server. May be customized, masked, or proxy-set.",
    ),
    "via": HeaderMetadata(
        category=HeaderCategory.SERVER,
        description="Lists intermediate proxies, gateways, and protocols traversed by the message.",
    ),
    "x-powered-by": HeaderMetadata(
        category=HeaderCategory.SERVER,
        description="Advertises technology or framework stack used by the backend.",
    ),
    "host": HeaderMetadata(
        category=HeaderCategory.SERVER,
        description="Specifies the domain name and port number of the target host.",
    ),
    "user-agent": HeaderMetadata(
        category=HeaderCategory.SERVER,
        description="Identifies the client application or software library making the request.",
    ),
    # --- General Headers ---
    "date": HeaderMetadata(
        category=HeaderCategory.GENERAL,
        description="Indicates the date and time at which the message was generated.",
    ),
    "allow": HeaderMetadata(
        category=HeaderCategory.GENERAL,
        description="Lists the set of HTTP methods supported by the target resource.",
    ),
}

SENSITIVE_HEADER_NAMES = {
    "authorization",
    "proxy-authorization",
    "cookie",
    "set-cookie",
}


def mask_sensitive_value(header_name: str, value: str) -> str:
    """Mask credentials, tokens, or cookie contents for safe logging or display where appropriate."""
    h_lower = header_name.lower().strip()
    if h_lower in ("authorization", "proxy-authorization"):
        val_strip = value.strip()
        if val_strip.lower().startswith("bearer "):
            token = val_strip[7:].strip()
            if len(token) > 8:
                return f"Bearer {token[:3]}...{token[-3:]}"
            return "Bearer [masked]"
        if val_strip.lower().startswith("basic "):
            return "Basic [masked]"
        return "[masked credentials]"

    if h_lower in ("cookie", "set-cookie"):
        # Mask cookie values while preserving attribute names if possible
        parts = value.split(";")
        masked_parts: list[str] = []
        for i, part in enumerate(parts):
            kv = part.split("=", 1)
            if len(kv) == 2:
                k, _ = kv
                if i == 0:
                    masked_parts.append(f"{k.strip()}=[masked]")
                else:
                    # Preserve standard security directives (HttpOnly, Secure, SameSite)
                    attr_name = k.strip().lower()
                    if attr_name in ("httponly", "secure"):
                        masked_parts.append(k.strip())
                    elif attr_name in ("samesite", "path", "domain", "max-age", "expires"):
                        masked_parts.append(part.strip())
                    else:
                        masked_parts.append(f"{k.strip()}=[masked]")
            else:
                masked_parts.append(part.strip())
        return "; ".join(masked_parts)

    return value


class HeaderAnalyzer:
    """Service providing technical categorization and neutral observations for HTTP headers."""

    @classmethod
    def analyze_request_headers(cls, headers: Mapping[str, str]) -> list[HeaderAnalysisItem]:
        """Analyze request headers with source='request'."""
        return cls._analyze_mapping(headers, HeaderSource.REQUEST)

    @classmethod
    def analyze_response_headers(cls, headers: Mapping[str, str]) -> list[HeaderAnalysisItem]:
        """Analyze response headers with source='response'."""
        return cls._analyze_mapping(headers, HeaderSource.RESPONSE)

    @classmethod
    def analyze_all(
        cls,
        request_headers: Mapping[str, str],
        response_headers: Mapping[str, str],
    ) -> list[HeaderAnalysisItem]:
        """Analyze both request and response headers while maintaining strict source separation."""
        req_items = cls.analyze_request_headers(request_headers)
        res_items = cls.analyze_response_headers(response_headers)
        return req_items + res_items

    @classmethod
    def _analyze_mapping(
        cls,
        headers: Mapping[str, str],
        source: HeaderSource,
    ) -> list[HeaderAnalysisItem]:
        """Iterate through headers, normalize keys case-insensitively, and generate analysis items."""
        items: list[HeaderAnalysisItem] = []

        for name, value in headers.items():
            key = name.strip().lower()
            metadata = HEADER_CATALOG.get(key)

            if metadata:
                category = metadata.category
                description = metadata.description
            else:
                category = HeaderCategory.OTHER
                description = "Custom or unrecognized HTTP header."

            observations = cls._generate_observations(key, value)

            items.append(
                HeaderAnalysisItem(
                    name=name,
                    value=value,
                    category=category,
                    description=description,
                    source=source,
                    observations=observations,
                )
            )

        return items

    @staticmethod
    def _generate_observations(header_key: str, value: str) -> list[str] | None:
        """Produce neutral, technical observations based on header content without overinterpretation."""
        observations: list[str] = []
        val_lower = value.lower()

        if header_key == "strict-transport-security":
            observations.append("HSTS policy is declared to enforce HTTPS connections.")
            if "includesubdomains" in val_lower:
                observations.append("Policy extends to all subdomains (includeSubDomains).")
            if "preload" in val_lower:
                observations.append("Preload directive is present for browser HSTS preload lists.")

        elif header_key == "x-content-type-options":
            if "nosniff" in val_lower:
                observations.append("nosniff directive is active, preventing MIME-type sniffing.")

        elif header_key == "cache-control":
            if "no-store" in val_lower:
                observations.append("Instructs caches not to store any part of the request or response.")
            if "no-cache" in val_lower:
                observations.append("Requires caches to validate with origin server before using cached copy.")
            if "max-age" in val_lower:
                observations.append("Specifies maximum resource freshness lifetime in seconds.")

        elif header_key == "content-security-policy":
            observations.append("Content Security Policy is defined to govern executable resource origins.")

        elif header_key == "x-frame-options":
            observations.append(f"Frame embedding constraint set to '{value.strip()}'.")

        elif header_key == "access-control-allow-origin":
            if value.strip() == "*":
                observations.append("Wildcard origin specified; resource is accessible to any origin.")
            else:
                observations.append(f"Permitted origin explicitly restricted to '{value.strip()}'.")

        elif header_key == "server":
            observations.append("Server software advertised; values may be customized or set by intermediate reverse proxies.")

        elif header_key == "set-cookie":
            if "httponly" in val_lower:
                observations.append("HttpOnly flag present (inaccessible to client JavaScript).")
            if "secure" in val_lower:
                observations.append("Secure flag present (transmitted only over HTTPS).")
            if "samesite" in val_lower:
                observations.append("SameSite attribute configured to control cross-site cookie transmission.")

        elif header_key == "authorization":
            observations.append("Client authentication credentials transmitted.")

        return observations if observations else None


header_analyzer = HeaderAnalyzer()
