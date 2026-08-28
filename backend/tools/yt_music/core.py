"""Download YouTube audio via yt-dlp + ffmpeg. Pure function, no Flask/Lambda."""

from __future__ import annotations

import logging
import os
import re
import uuid
from pathlib import Path

from yt_dlp import YoutubeDL

log = logging.getLogger("ed-tools.yt_music")

YT_REGEX = re.compile(
    r"^(https?://)?(www\.)?(youtube\.com/(watch\?v=|shorts/)|youtu\.be/)[\w-]{11}"
)

VIDEO_ID_PATTERNS = [
    re.compile(r"(?:youtube\.com/watch\?.*?v=)([\w-]{11})"),
    re.compile(r"(?:youtu\.be/)([\w-]{11})"),
    re.compile(r"(?:youtube\.com/shorts/)([\w-]{11})"),
]


def _verbose() -> bool:
    return os.getenv("YT_MUSIC_VERBOSE", "").lower() in {"1", "true", "yes", "on"}


def _max_length() -> int:
    return int(os.getenv("MAX_VIDEO_LENGTH_SECONDS", "600"))


def _temp_root() -> Path:
    root = Path(os.getenv("TEMP_DIR", "/tmp/downloads"))
    root.mkdir(parents=True, exist_ok=True)
    return root


def _extract_video_id(url: str) -> str | None:
    for pattern in VIDEO_ID_PATTERNS:
        match = pattern.search(url)
        if match:
            return match.group(1)
    return None


def normalize_youtube_url(url: str) -> str:
    """
    Collapse playlist/mix/radio query junk into a single-video watch URL.

    Example:
      https://www.youtube.com/watch?v=xxx&list=RDxxx&start_radio=1
      → https://www.youtube.com/watch?v=xxx
    """
    url = url.strip()
    video_id = _extract_video_id(url)
    if not video_id:
        return url
    clean = f"https://www.youtube.com/watch?v={video_id}"
    if clean != url:
        log.info("normalized URL → %s (from %s)", clean, url)
    return clean


def _progress_hook(status: dict) -> None:
    if not _verbose():
        return
    state = status.get("status")
    if state == "downloading":
        total = status.get("total_bytes") or status.get("total_bytes_estimate") or 0
        done = status.get("downloaded_bytes") or 0
        speed = status.get("speed") or 0
        eta = status.get("eta")
        pct = (100.0 * done / total) if total else 0.0
        log.info(
            "download progress: %.1f%% (%s/%s) speed=%s eta=%s",
            pct,
            done,
            total or "?",
            f"{speed:.0f}B/s" if speed else "?",
            eta if eta is not None else "?",
        )
    elif state == "finished":
        log.info("download finished: %s — converting to mp3…", status.get("filename"))
    elif state == "error":
        log.error("download error hook: %s", status)


def _ydl_opts(**extra) -> dict:
    quiet = not _verbose()
    opts = {
        # Critical: never expand Mix / playlist / radio links
        "noplaylist": True,
        "format": "bestaudio/best",
        "quiet": quiet,
        "no_warnings": quiet,
        "verbose": _verbose(),
        "progress_hooks": [_progress_hook],
        **extra,
    }
    return opts


def download_audio(url: str) -> str:
    """
    Download audio from a YouTube URL and return the path to an MP3 file.

    Raises ValueError for invalid / too-long videos; other errors propagate.
    """
    if not url or not YT_REGEX.match(url.strip()):
        raise ValueError("Invalid YouTube URL")

    original = url.strip()
    url = normalize_youtube_url(original)
    work_dir = _temp_root() / f"yt_{uuid.uuid4().hex}"
    work_dir.mkdir(parents=True, exist_ok=True)
    log.info("work dir: %s", work_dir)

    # Probe metadata first so we can reject long videos before downloading.
    log.info("probing metadata…")
    probe_opts = _ydl_opts(skip_download=True)
    with YoutubeDL(probe_opts) as ydl:
        info = ydl.extract_info(url, download=False)

    # If a playlist dict slipped through, pick the first entry
    if info and info.get("_type") == "playlist":
        entries = [e for e in (info.get("entries") or []) if e]
        if not entries:
            raise ValueError("No video found in playlist")
        info = entries[0]
        log.warning("playlist response received; using first entry id=%s", info.get("id"))

    title = info.get("title") or "(unknown)"
    duration = info.get("duration") or 0
    max_len = _max_length()
    log.info("video: %r duration=%ss max=%ss", title, duration, max_len)

    if duration and duration > max_len:
        raise ValueError("Video is too long")

    outtmpl = str(work_dir / "audio.%(ext)s")
    ydl_opts = _ydl_opts(
        outtmpl=outtmpl,
        postprocessors=[
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }
        ],
    )

    log.info("downloading audio…")
    with YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    mp3_path = work_dir / "audio.mp3"
    if not mp3_path.exists():
        matches = list(work_dir.glob("*.mp3"))
        if not matches:
            raise RuntimeError("Audio extraction failed")
        mp3_path = matches[0]

    size = mp3_path.stat().st_size
    log.info("mp3 ready: %s (%s bytes)", mp3_path, size)
    return str(mp3_path)


if __name__ == "__main__":
    import sys

    logging.basicConfig(
        level=logging.DEBUG if _verbose() else logging.INFO,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )

    if len(sys.argv) < 2:
        print("Usage: YT_MUSIC_VERBOSE=1 python -m tools.yt_music.core <youtube_url>")
        sys.exit(1)

    result = download_audio(sys.argv[1])
    print(result)
