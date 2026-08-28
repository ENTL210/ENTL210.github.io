"""AWS Lambda handler for the YT Music Download tool."""

from __future__ import annotations

import base64
import json
import logging
import os
import traceback
from pathlib import Path

from core import download_audio

# CloudWatch-friendly logging. Set YT_MUSIC_VERBOSE=1 (or true) on the function.
_level = (
    logging.DEBUG
    if os.getenv("YT_MUSIC_VERBOSE", "").lower() in {"1", "true", "yes", "on"}
    else logging.INFO
)
logging.basicConfig(level=_level, format="%(asctime)s %(levelname)s [%(name)s] %(message)s")
log = logging.getLogger("ed-tools.lambda")


def _response(status: int, body, *, is_base64: bool = False, content_type: str = "application/json"):
    headers = {
        "Content-Type": content_type,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,X-App-Secret",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
    }
    if is_base64:
        return {
            "statusCode": status,
            "headers": headers,
            "body": body,
            "isBase64Encoded": True,
        }
    return {
        "statusCode": status,
        "headers": headers,
        "body": json.dumps(body) if not isinstance(body, str) else body,
        "isBase64Encoded": False,
    }


def handler(event, _context):
    request_id = getattr(_context, "aws_request_id", "-") if _context else "-"
    method = (
        event.get("requestContext", {}).get("http", {}).get("method")
        or event.get("httpMethod")
        or "POST"
    )
    log.info("[%s] %s invoke", request_id, method)

    if method == "OPTIONS":
        return _response(204, "")

    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    secret = headers.get("x-app-secret", "")
    expected = os.getenv("APP_SHARED_SECRET", "")
    if not expected or secret != expected:
        log.warning("[%s] unauthorized", request_id)
        return _response(401, {"error": "Unauthorized"})

    try:
        raw_body = event.get("body") or "{}"
        if event.get("isBase64Encoded"):
            raw_body = base64.b64decode(raw_body).decode("utf-8")
        data = json.loads(raw_body)
        url = (data.get("url") or "").strip()
        if not url:
            return _response(400, {"error": "Missing YouTube URL"})

        log.info("[%s] download start: %s", request_id, url)
        path = None
        try:
            path = download_audio(url)
            audio_bytes = Path(path).read_bytes()
            log.info("[%s] download ok: %s bytes", request_id, len(audio_bytes))
            encoded = base64.b64encode(audio_bytes).decode("ascii")
            return _response(
                200,
                encoded,
                is_base64=True,
                content_type="audio/mpeg",
            )
        finally:
            if path:
                try:
                    p = Path(path)
                    p.unlink(missing_ok=True)
                    parent = p.parent
                    if parent.exists() and parent.name.startswith("yt_"):
                        for leftover in parent.iterdir():
                            leftover.unlink(missing_ok=True)
                        parent.rmdir()
                except OSError:
                    pass
    except ValueError as exc:
        log.warning("[%s] rejected: %s", request_id, exc)
        return _response(400, {"error": str(exc)})
    except Exception as exc:  # noqa: BLE001
        log.exception("[%s] failed: %s", request_id, exc)
        traceback.print_exc()
        return _response(500, {"error": "Download failed — try again"})
