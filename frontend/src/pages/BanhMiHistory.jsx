import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMotionValue, useReducedMotion } from "framer-motion";
import BanhMiNavbar from "../components/banhmi/BanhMiNavbar";
import WorldMapJourney from "../components/banhmi/WorldMapJourney";
import StoryBubble from "../components/banhmi/StoryBubble";
import TimelineScrubber from "../components/banhmi/TimelineScrubber";
import BibliographyModal from "../components/banhmi/BibliographyModal";
import { stops } from "../data/banhmiJourney";
import {
  buildViewBox,
  projectPoint,
  projection,
  zoomToFit,
} from "../utils/mapProjection";
import "../styles/banhmi-theme.css";
import "./BanhMiHistory.css";

const AUTOPLAY_INTERVAL_MS = 5000;

// Idle framing: the eastern hemisphere, centred on the bounding box of Paris,
// the Fertile Crescent, and Saigon so all three are in view with the Americas
// out of frame.
const IDLE_ZOOM = 1.9;
const IDLE_MARGIN = 1.25;
const DEFAULT_STOP_ZOOM = 3.2;
// Never zoom in so far that less than this much context is left around a stop.
const MIN_CONTEXT = { width: 140, height: 100 };

function useViewportSize() {
  const [size, setSize] = useState(() => ({
    width: typeof window === "undefined" ? 1440 : window.innerWidth,
    height: typeof window === "undefined" ? 900 : window.innerHeight,
  }));

  useEffect(() => {
    const onResize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return size;
}

export default function BanhMiHistory() {
  const [currentStopIndex, setCurrentStopIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [expandedStopId, setExpandedStopId] = useState(null);
  const [isBibliographyOpen, setIsBibliographyOpen] = useState(false);

  const reduceMotion = useReducedMotion();
  const bibliographyButtonRef = useRef(null);
  const viewport = useViewportSize();

  // Progress toward the next stop, 0 to 1. Held as a MotionValue so the
  // per-frame updates that drive the timeline fill never re-render the map.
  const stopProgress = useMotionValue(0);
  const frameRef = useRef(0);

  const points = useMemo(
    () => stops.map((stop) => projectPoint(projection, stop.lon, stop.lat)),
    [],
  );

  const idleFraming = useMemo(() => {
    const xs = [points[2][0], points[0][0], points[4][0]];
    const ys = [points[2][1], points[0][1], points[4][1]];
    return {
      centerX: (Math.max(...xs) + Math.min(...xs)) / 2,
      centerY: (Math.max(...ys) + Math.min(...ys)) / 2,
      spanWidth: (Math.max(...xs) - Math.min(...xs)) * IDLE_MARGIN,
      spanHeight: (Math.max(...ys) - Math.min(...ys)) * IDLE_MARGIN,
    };
  }, [points]);

  // The camera target. One source of truth: the map springs toward it, and the
  // story card anchors against it so the card tracks its marker.
  const camera = useMemo(() => {
    const aspect = viewport.width / viewport.height;

    if (currentStopIndex == null) {
      const fitZoom = zoomToFit(
        idleFraming.spanWidth,
        idleFraming.spanHeight,
        aspect,
      );
      return buildViewBox(
        idleFraming.centerX,
        idleFraming.centerY,
        Math.min(IDLE_ZOOM, fitZoom),
        aspect,
      );
    }

    const stop = stops[currentStopIndex];
    const contextZoom = zoomToFit(
      MIN_CONTEXT.width,
      MIN_CONTEXT.height,
      aspect,
    );
    const zoom = Math.min(stop.zoom ?? DEFAULT_STOP_ZOOM, contextZoom);
    const [x, y] = points[currentStopIndex];
    return buildViewBox(x, y, zoom, aspect);
  }, [currentStopIndex, viewport, idleFraming, points]);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "The History of Bánh Mì";

    let meta = document.querySelector('meta[name="robots"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    const prevContent = meta.getAttribute("content");
    meta.setAttribute("content", "noindex, nofollow");

    return () => {
      document.title = prevTitle;
      if (created && meta.parentNode) {
        meta.parentNode.removeChild(meta);
      } else if (prevContent != null) {
        meta.setAttribute("content", prevContent);
      } else {
        meta.removeAttribute("content");
      }
    };
  }, []);

  const goToStop = useCallback(
    (index) => {
      setCurrentStopIndex(index);
      setExpandedStopId(null);
      stopProgress.set(0);
    },
    [stopProgress],
  );

  // Auto-play. Driven by requestAnimationFrame rather than an interval so the
  // timeline fill advances continuously instead of stepping between dots.
  useEffect(() => {
    if (!isPlaying) return undefined;

    if (currentStopIndex == null || currentStopIndex >= stops.length - 1) {
      setIsPlaying(false);
      return undefined;
    }

    // Back-date the segment start by whatever progress is already banked, so
    // resuming continues mid-segment instead of restarting it.
    const startedAt =
      performance.now() - stopProgress.get() * AUTOPLAY_INTERVAL_MS;

    const tick = (now) => {
      const elapsed = (now - startedAt) / AUTOPLAY_INTERVAL_MS;
      if (elapsed >= 1) {
        stopProgress.set(0);
        setCurrentStopIndex(currentStopIndex + 1);
        setExpandedStopId(null);
        return;
      }
      stopProgress.set(elapsed);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") setIsPlaying(false);
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelAnimationFrame(frameRef.current);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isPlaying, currentStopIndex, stopProgress]);

  const activeStop = currentStopIndex == null ? null : stops[currentStopIndex];

  return (
    <div className="banhmi-page">
      <div className="banhmi-map-wrap">
        <WorldMapJourney
          stops={stops}
          points={points}
          currentStopIndex={currentStopIndex}
          camera={camera}
          reduceMotion={reduceMotion}
          onSelectStop={goToStop}
        />
      </div>

      <BanhMiNavbar
        bibliographyButtonRef={bibliographyButtonRef}
        onOpenBibliography={() => setIsBibliographyOpen(true)}
      />

      {activeStop ? (
        <StoryBubble
          stop={activeStop}
          stopIndex={currentStopIndex}
          stopCount={stops.length}
          point={points[currentStopIndex]}
          camera={camera}
          viewport={viewport}
          isExpanded={expandedStopId === activeStop.id}
          onExpand={() => setExpandedStopId(activeStop.id)}
          onCollapse={() => setExpandedStopId(null)}
          onSelectStop={goToStop}
        />
      ) : null}

      <TimelineScrubber
        stops={stops}
        currentStopIndex={currentStopIndex}
        stopProgress={stopProgress}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((playing) => !playing)}
        onSelectStop={goToStop}
      />

      <BibliographyModal
        open={isBibliographyOpen}
        onClose={() => setIsBibliographyOpen(false)}
        returnFocusRef={bibliographyButtonRef}
      />
    </div>
  );
}
