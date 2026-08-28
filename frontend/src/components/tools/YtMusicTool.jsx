import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import { isValidYoutubeUrl } from "../../utils/youtube";
import { exportTrimmedMp3 } from "../../utils/audioExport";
import { springBouncy } from "../../motion";
import "./YtMusicTool.css";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const APP_SECRET = import.meta.env.VITE_APP_SECRET || "";
const FETCH_TIMEOUT_MS = 90_000;

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

export default function YtMusicTool({ onComplete }) {
  const [url, setUrl] = useState("");
  const [touched, setTouched] = useState(false);
  const [step, setStep] = useState("input"); // input | loading | trim
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [audioBytes, setAudioBytes] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [region, setRegion] = useState({ start: 0, end: 0 });
  const [duration, setDuration] = useState(0);
  const [waveReady, setWaveReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const regionRef = useRef(null);
  const audioUrlRef = useRef(null);
  const regionStateRef = useRef({ start: 0, end: 0 });
  const scrubbingRef = useRef(false);
  const previewStopRef = useRef(null);

  const urlValid = useMemo(() => isValidYoutubeUrl(url), [url]);
  const showUrlError = touched && url.trim().length > 0 && !urlValid;
  const loading = step === "loading";

  const scrubFill = useMemo(() => {
    if (!duration) {
      return { background: "rgba(128,128,128,0.2)" };
    }
    const startPct = (region.start / duration) * 100;
    const endPct = (region.end / duration) * 100;
    return {
      background: `linear-gradient(
        to right,
        rgba(128,128,128,0.22) 0%,
        rgba(128,128,128,0.22) ${startPct}%,
        color-mix(in srgb, var(--color-accent) 42%, transparent) ${startPct}%,
        color-mix(in srgb, var(--color-accent) 42%, transparent) ${endPct}%,
        rgba(128,128,128,0.22) ${endPct}%,
        rgba(128,128,128,0.22) 100%
      )`,
    };
  }, [duration, region.start, region.end]);

  useEffect(() => {
    regionStateRef.current = region;
  }, [region]);

  useEffect(() => {
    return () => {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (step !== "trim" || !audioUrl) return undefined;

    let cancelled = false;
    setWaveReady(false);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    const raf = requestAnimationFrame(() => {
      if (cancelled || !waveformRef.current) return;

      const accent =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--color-accent")
          .trim() || "#FF6B2C";

      const regions = RegionsPlugin.create();
      const ws = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "rgba(128, 128, 128, 0.45)",
        progressColor: accent,
        cursorColor: accent,
        cursorWidth: 2,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 110,
        url: audioUrl,
        // Seeking happens on the scrubber below — keep waveform for trim only
        interact: false,
        dragToSeek: false,
        plugins: [regions],
      });

      wavesurferRef.current = ws;

      ws.on("ready", () => {
        if (cancelled) return;
        const total = ws.getDuration();
        setDuration(total);
        const defaultEnd = Math.min(total, Math.max(total * 0.5, 10));
        const r = regions.addRegion({
          start: 0,
          end: defaultEnd,
          color: "rgba(255, 107, 44, 0.28)",
          drag: true,
          resize: true,
        });
        regionRef.current = r;
        const next = { start: r.start, end: r.end };
        regionStateRef.current = next;
        setRegion(next);
        setWaveReady(true);
        ws.setTime(next.start);
        setCurrentTime(next.start);

        const syncRegion = () => {
          const updated = { start: r.start, end: r.end };
          regionStateRef.current = updated;
          setRegion(updated);
        };

        r.on("update", syncRegion);
        r.on("update-end", syncRegion);
      });

      ws.on("play", () => setPlaying(true));
      ws.on("pause", () => setPlaying(false));
      ws.on("finish", () => {
        setPlaying(false);
      });

      ws.on("timeupdate", (t) => {
        if (!scrubbingRef.current) setCurrentTime(t);
      });

      ws.on("error", (err) => {
        if (cancelled) return;
        console.error(err);
        setError("Could not load waveform — try downloading again");
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
      regionRef.current = null;
      setPlaying(false);
    };
  }, [step, audioUrl]);

  function seekTo(time) {
    const ws = wavesurferRef.current;
    if (!ws || !waveReady) return;
    const clamped = Math.min(Math.max(0, time), duration || ws.getDuration());
    ws.setTime(clamped);
    setCurrentTime(clamped);
  }

  function onScrubInput(e) {
    const value = Number(e.target.value);
    scrubbingRef.current = true;
    setCurrentTime(value);
    wavesurferRef.current?.setTime(value);
  }

  function onScrubEnd(e) {
    const value = Number(e.target.value);
    scrubbingRef.current = false;
    seekTo(value);
  }

  function clearPreviewStop() {
    const ws = wavesurferRef.current;
    if (ws && previewStopRef.current) {
      ws.un("timeupdate", previewStopRef.current);
      previewStopRef.current = null;
    }
  }

  function togglePlayback() {
    const ws = wavesurferRef.current;
    if (!ws || !waveReady) return;
    clearPreviewStop();

    if (ws.isPlaying()) {
      ws.pause();
      return;
    }

    if (ws.getCurrentTime() >= (duration || ws.getDuration()) - 0.05) {
      ws.setTime(0);
    }
    ws.play();
  }

  function playSelection() {
    const ws = wavesurferRef.current;
    if (!ws || !waveReady) return;
    clearPreviewStop();

    const { start } = regionStateRef.current;
    ws.pause();
    ws.setTime(start);
    setCurrentTime(start);

    const onTime = (t) => {
      const { end } = regionStateRef.current;
      if (t >= end - 0.02) {
        ws.pause();
        ws.setTime(start);
        setCurrentTime(start);
        clearPreviewStop();
      }
    };
    previewStopRef.current = onTime;
    ws.on("timeupdate", onTime);
    ws.play();
  }

  async function handleFetchAudio(e) {
    e.preventDefault();
    setTouched(true);
    if (!urlValid || loading) return;

    setStep("loading");
    setError("");
    setStatus("Contacting server…");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      setStatus("Downloading audio from YouTube…");
      const res = await fetch(`${API_URL}/api/yt-music/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-App-Secret": APP_SECRET,
        },
        body: JSON.stringify({ url: url.trim() }),
        signal: controller.signal,
        cache: "no-store",
      });

      if (!res.ok) {
        let message = "Download failed — try again";
        if (res.status === 502 || res.status === 504) {
          message =
            "Backend gateway error — restart Flask (port 5001) and try again";
        } else {
          try {
            const data = await res.json();
            if (data?.error) message = data.error;
          } catch {
            message = `Download failed (${res.status})`;
          }
        }
        throw new Error(message);
      }

      setStatus("Preparing trimmer…");
      const buffer = await res.arrayBuffer();
      if (!buffer.byteLength) {
        throw new Error("Download returned empty audio");
      }

      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      const blobUrl = URL.createObjectURL(
        new Blob([buffer], { type: "audio/mpeg" }),
      );
      audioUrlRef.current = blobUrl;
      setAudioBytes(buffer);
      setAudioUrl(blobUrl);
      setStep("trim");
      setStatus("");
    } catch (err) {
      if (err?.name === "AbortError") {
        setError("Request timed out — try a shorter video or try again");
      } else {
        setError(
          err.message === "Failed to fetch"
            ? "Could not reach the server — is the backend running on port 5001?"
            : err.message || "Download failed — try again",
        );
      }
      setAudioBytes(null);
      setAudioUrl(null);
      setStep("input");
      setStatus("");
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async function handleDownload() {
    if (!audioBytes || exporting) return;
    wavesurferRef.current?.pause();
    setExporting(true);
    setError("");
    try {
      await exportTrimmedMp3(
        audioBytes,
        region.start,
        region.end,
        "ed-tools-trim.mp3",
      );
      onComplete?.();
    } catch (err) {
      setError(err.message || "Export failed — try again");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="yt-music">
      <h2 className="yt-music__title">YT Music Download + Trim</h2>

      {step !== "trim" ? (
        <form className="yt-music__form" onSubmit={handleFetchAudio}>
          <label className="yt-music__label" htmlFor="yt-url">
            YouTube URL
          </label>
          <input
            id="yt-url"
            className="yt-music__input"
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder="https://youtu.be/…"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (!touched) setTouched(true);
            }}
            onBlur={() => setTouched(true)}
            disabled={loading}
          />

          {showUrlError ? (
            <motion.p
              key="url-error"
              className="yt-music__error"
              initial={{ x: 0 }}
              animate={{ x: [0, -6, 6, -4, 4, 0], fontWeight: [700, 700, 400] }}
              transition={{ duration: 0.4 }}
            >
              Please enter a valid YouTube link
            </motion.p>
          ) : null}

          {error ? <p className="yt-music__error">{error}</p> : null}
          {loading && status ? (
            <p className="yt-music__status">{status}</p>
          ) : null}

          <motion.button
            type="submit"
            className="yt-music__primary"
            disabled={!urlValid || loading}
            whileTap={urlValid && !loading ? { scale: 0.96 } : undefined}
            transition={springBouncy}
          >
            {loading ? (
              <span className="yt-music__loading">
                <span className="yt-music__pulse" />
                Fetching…
              </span>
            ) : (
              "Get Audio"
            )}
          </motion.button>
        </form>
      ) : (
        <div className="yt-music__trim">
          <p className="yt-music__hint">
            Drag the orange handles on the waveform to trim. Use the scrubber
            below to scroll and play through the track.
          </p>

          <div className="yt-music__waveform-wrap">
            <div className="yt-music__waveform" ref={waveformRef} />
          </div>

          {!waveReady ? (
            <p className="yt-music__status">Loading waveform…</p>
          ) : (
            <>
              <div className="yt-music__transport">
                <motion.button
                  type="button"
                  className="yt-music__play"
                  aria-label={playing ? "Pause" : "Play"}
                  onClick={togglePlayback}
                  whileTap={{ scale: 0.92 }}
                  transition={springBouncy}
                >
                  {playing ? <PauseIcon /> : <PlayIcon />}
                </motion.button>

                <div className="yt-music__scrub">
                  <div className="yt-music__scrub-track" style={scrubFill}>
                    <input
                      className="yt-music__scrubber"
                      type="range"
                      min={0}
                      max={duration || 0}
                      step={0.01}
                      value={Math.min(currentTime, duration || 0)}
                      aria-label="Scrub playback"
                      onChange={onScrubInput}
                      onMouseUp={onScrubEnd}
                      onTouchEnd={onScrubEnd}
                      onKeyUp={onScrubEnd}
                    />
                  </div>
                  <div className="yt-music__scrub-meta">
                    <span className="yt-music__time-now">
                      {formatTime(currentTime)}
                    </span>
                    <span className="yt-music__time-total">
                      {formatTime(duration)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="yt-music__selection-row">
                <p className="yt-music__selection">
                  Cut: {formatTime(region.start)} – {formatTime(region.end)}
                  <span className="yt-music__selection-len">
                    ({formatTime(Math.max(0, region.end - region.start))})
                  </span>
                </p>
                <button
                  type="button"
                  className="yt-music__preview-cut"
                  onClick={playSelection}
                >
                  Preview cut
                </button>
              </div>
            </>
          )}

          {error ? <p className="yt-music__error">{error}</p> : null}
          <motion.button
            type="button"
            className="yt-music__primary yt-music__primary--full"
            onClick={handleDownload}
            disabled={exporting || !waveReady}
            whileTap={!exporting && waveReady ? { scale: 0.97 } : undefined}
            transition={springBouncy}
          >
            {exporting ? "Preparing…" : "Download music"}
          </motion.button>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}
