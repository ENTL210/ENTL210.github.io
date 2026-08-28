"""Local Flask server that routes to each tool's core logic."""

from __future__ import annotations

import logging
import os
import traceback
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, Response, jsonify, request
from flask_cors import CORS

from tools.yt_music.core import download_audio

load_dotenv(Path(__file__).resolve().parent / ".env")

_verbose = os.getenv("YT_MUSIC_VERBOSE", "").lower() in {"1", "true", "yes", "on"}
logging.basicConfig(
    level=logging.DEBUG if _verbose else logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
log = logging.getLogger("ed-tools")

app = Flask(__name__)
# Dev: allow Vite from localhost and LAN IPs (phone testing)
_cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://192.168.68.88:5173",
]
if os.getenv("FLASK_ENV") == "development":
    # Any private-LAN Vite origin while developing
    _cors_origins = "*"

CORS(
    app,
    origins=_cors_origins,
    allow_headers=["Content-Type", "X-App-Secret"],
    methods=["GET", "POST", "OPTIONS"],
)

APP_SHARED_SECRET = os.getenv("APP_SHARED_SECRET", "")


def _check_secret() -> tuple[dict, int] | None:
    provided = request.headers.get("X-App-Secret", "")
    if not APP_SHARED_SECRET or provided != APP_SHARED_SECRET:
        return {"error": "Unauthorized"}, 401
    return None


def _cleanup_audio_path(path: str) -> None:
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


@app.get("/api/health")
def health():
    return jsonify({"ok": True})


@app.post("/api/yt-music/download")
def yt_music_download():
    auth_error = _check_secret()
    if auth_error:
        body, status = auth_error
        return jsonify(body), status

    data = request.get_json(silent=True) or {}
    url = (data.get("url") or "").strip()
    if not url:
        return jsonify({"error": "Missing YouTube URL"}), 400

    log.info("yt-music download start: %s", url)
    path = None
    try:
        path = download_audio(url)
        audio_bytes = Path(path).read_bytes()
        log.info("yt-music download ok: %s bytes", len(audio_bytes))
        return Response(
            audio_bytes,
            status=200,
            mimetype="audio/mpeg",
            headers={
                "Content-Length": str(len(audio_bytes)),
                "Cache-Control": "no-store",
            },
        )
    except ValueError as exc:
        log.warning("yt-music rejected: %s", exc)
        return jsonify({"error": str(exc)}), 400
    except Exception as exc:  # noqa: BLE001
        traceback.print_exc()
        log.error("yt-music failed: %s", exc)
        return jsonify({"error": "Download failed — try again"}), 500
    finally:
        if path:
            _cleanup_audio_path(path)


if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", "5000"))
    # use_reloader=False — reloader kills in-flight downloads and Vite shows 502.
    app.run(
        # host="127.0.0.1",
        host="0.0.0.0",
        port=port,
        debug=False,
        threaded=True,
        use_reloader=False,
    )
