import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { animate, useMotionValue, useReducedMotion } from "framer-motion";
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

// Idle framing: the eastern hemisphere, centred on the bounding box of Paris,
// the Fertile Crescent, and Saigon so all three are in view with the Americas
// out of frame.
const IDLE_ZOOM = 1.9;
const IDLE_MARGIN = 1.25;
const DEFAULT_STOP_ZOOM = 3.2;
// Never zoom in so far that less than this much context is left around a stop.
const MIN_CONTEXT = { width: 140, height: 100 };

// Padding applied to the two-stop bounding box that frames the pull-out. The
// flat pad keeps the box sane when both stops are effectively the same point.
const PAIR_MARGIN = 1.35;
const PAIR_PAD = 48;
// Even a hop between two coincident stops pulls back this much, so the phase
// still reads as a pull-out rather than a pause. The camera spring only covers
// about 87% of its travel inside the pull-out window, so this is deliberately
// wider than the pull-out that actually lands on screen.
const PAIR_MIN_PULL_OUT = 0.72;

// Guided-tour phases. Each begins when the previous finishes.
const PHASE_COLLAPSE_MS = 250;
const PHASE_PULL_OUT_MS = 550;
const PHASE_PUSH_IN_MS = 700;
const TRANSITION_MS =
  PHASE_COLLAPSE_MS + PHASE_PULL_OUT_MS + PHASE_PUSH_IN_MS;
// The beat between the card appearing and it opening itself.
const EXPAND_BEAT_MS = 500;
// How long the finished card sits on screen before the tour moves on.
const DWELL_MS = 2500;

// The card is on screen for these phases and unmounted for the rest, so the
// camera flies between stops unobstructed.
const CARD_PHASES = new Set(["idle", "collapsing", "settling"]);

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
  const [phase, setPhase] = useState("idle");
  // Only set during the pull-out, which is the one phase framed on two stops.
  const [pullOutPair, setPullOutPair] = useState(null);

  const reduceMotion = useReducedMotion();
  const bibliographyButtonRef = useRef(null);
  const viewport = useViewportSize();

  // Fractional stop index driving the timeline fill. A MotionValue so the
  // transition sweep never re-renders the map.
  const fillPosition = useMotionValue(0);
  const fillAnimationRef = useRef(null);
  const timeoutsRef = useRef([]);

  const points = useMemo(
    () => stops.map((stop) => projectPoint(projection, stop.lon, stop.lat)),
    [],
  );

  // Latest values for callbacks that must keep a stable identity, since
  // re-creating them would restart the card's auto-scroll effect.
  const latest = useRef({});
  latest.current = { currentStopIndex, isPlaying, phase };

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  const schedule = useCallback((fn, ms) => {
    timeoutsRef.current.push(window.setTimeout(fn, ms));
  }, []);

  const stopFillAnimation = useCallback(() => {
    fillAnimationRef.current?.stop();
    fillAnimationRef.current = null;
  }, []);

  useEffect(() => () => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    fillAnimationRef.current?.stop();
  }, []);

  const zoomForStop = useCallback(
    (index, aspect) =>
      Math.min(
        stops[index].zoom ?? DEFAULT_STOP_ZOOM,
        zoomToFit(MIN_CONTEXT.width, MIN_CONTEXT.height, aspect),
      ),
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

    // Pull-out: framed on the two stops involved rather than on a fixed wide
    // view, so a hop between the two Saigon stops barely moves the camera
    // while Paris to Saigon opens right out.
    if (pullOutPair) {
      const [ax, ay] = points[pullOutPair.from];
      const [bx, by] = points[pullOutPair.to];
      const fitZoom = zoomToFit(
        Math.abs(bx - ax) * PAIR_MARGIN + PAIR_PAD,
        Math.abs(by - ay) * PAIR_MARGIN + PAIR_PAD,
        aspect,
      );
      const zoom = Math.min(
        fitZoom,
        zoomForStop(pullOutPair.to, aspect) * PAIR_MIN_PULL_OUT,
      );
      return buildViewBox((ax + bx) / 2, (ay + by) / 2, zoom, aspect);
    }

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

    const [x, y] = points[currentStopIndex];
    return buildViewBox(x, y, zoomForStop(currentStopIndex, aspect), aspect);
  }, [
    currentStopIndex,
    pullOutPair,
    viewport,
    idleFraming,
    points,
    zoomForStop,
  ]);

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

  // Direct navigation. Cancels any transition in flight and lands on the
  // requested stop immediately, never leaving the camera at a pull-out framing.
  const jumpToStop = useCallback(
    (index) => {
      clearTimeouts();
      stopFillAnimation();
      setPullOutPair(null);
      setPhase("idle");
      setCurrentStopIndex(index);
      setExpandedStopId(null);
      fillPosition.jump(index);
    },
    [clearTimeouts, stopFillAnimation, fillPosition],
  );

  // The guided three-phase move: collapse, pull out, push in.
  const runTransition = useCallback(
    (to) => {
      clearTimeouts();
      stopFillAnimation();

      if (reduceMotion) {
        // A single instant cut. The beat before expansion still happens, via
        // the auto-expansion effect below.
        setPullOutPair(null);
        setCurrentStopIndex(to);
        setExpandedStopId(null);
        setPhase("settling");
        fillPosition.jump(to);
        return;
      }

      const from = latest.current.currentStopIndex;

      setPhase("collapsing");
      setExpandedStopId(null);
      fillAnimationRef.current = animate(fillPosition, to, {
        duration: TRANSITION_MS / 1000,
        ease: "easeInOut",
      });

      schedule(() => {
        // The connector segment is mounted by this index change, so it draws
        // during the pull-out, the one moment both endpoints share the screen.
        setCurrentStopIndex(to);
        setPullOutPair({ from, to });
        setPhase("pullingOut");
      }, PHASE_COLLAPSE_MS);

      schedule(() => {
        setPullOutPair(null);
        setPhase("pushingIn");
      }, PHASE_COLLAPSE_MS + PHASE_PULL_OUT_MS);

      schedule(() => setPhase("settling"), TRANSITION_MS);
    },
    [clearTimeouts, stopFillAnimation, schedule, reduceMotion, fillPosition],
  );

  // Navigation from the card's Next and Back. During the tour this is a guided
  // transition; otherwise, and when a transition is already mid-flight, it is a
  // direct jump.
  const navigateToStop = useCallback(
    (index) => {
      if (latest.current.isPlaying && latest.current.phase === "idle") {
        runTransition(index);
      } else {
        jumpToStop(index);
      }
    },
    [runTransition, jumpToStop],
  );

  // Auto-expansion. One effect covers every entry point: the end of a
  // transition, pressing play on a collapsed stop, and jumping to another stop
  // while the tour runs. Being effect-scoped, its timeout can never be orphaned.
  useEffect(() => {
    if (!isPlaying || currentStopIndex == null) return undefined;
    if (phase !== "idle" && phase !== "settling") return undefined;
    if (expandedStopId === stops[currentStopIndex].id) return undefined;

    const id = window.setTimeout(() => {
      setExpandedStopId(stops[currentStopIndex].id);
      setPhase("idle");
    }, EXPAND_BEAT_MS);
    return () => window.clearTimeout(id);
  }, [isPlaying, phase, currentStopIndex, expandedStopId]);

  // Leaving the tour. The card stays exactly as it is; only playback stops.
  const exitTour = useCallback(() => {
    clearTimeouts();
    stopFillAnimation();
    setIsPlaying(false);
    setPullOutPair(null);
    setPhase("idle");
    const index = latest.current.currentStopIndex;
    if (index != null) fillPosition.jump(index);
  }, [clearTimeouts, stopFillAnimation, fillPosition]);

  const startTour = useCallback(() => {
    setIsPlaying(true);
    if (latest.current.currentStopIndex != null) {
      // A stop is already open. The auto-expansion effect handles a collapsed
      // card, and an expanded one just resumes its scroll where it left off.
      return;
    }
    setCurrentStopIndex(0);
    fillPosition.jump(0);
    if (reduceMotion) {
      setPhase("settling");
      return;
    }
    setPhase("pushingIn");
    schedule(() => setPhase("settling"), PHASE_PUSH_IN_MS);
  }, [fillPosition, reduceMotion, schedule]);

  // The card reached the bottom of its content. Dwell, then move on.
  const handleTourScrollEnd = useCallback(() => {
    if (!latest.current.isPlaying) return;
    schedule(() => {
      const index = latest.current.currentStopIndex;
      if (index == null || index >= stops.length - 1) {
        setIsPlaying(false);
        return;
      }
      runTransition(index + 1);
    }, DWELL_MS);
  }, [schedule, runTransition]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") exitTour();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [isPlaying, exitTour]);

  const activeStop = currentStopIndex == null ? null : stops[currentStopIndex];
  const showCard = activeStop != null && CARD_PHASES.has(phase);
  const isWaitingOnReader =
    isPlaying && phase === "idle" && expandedStopId != null;

  return (
    <div className="banhmi-page">
      <div className="banhmi-map-wrap">
        <WorldMapJourney
          stops={stops}
          points={points}
          currentStopIndex={currentStopIndex}
          camera={camera}
          reduceMotion={reduceMotion}
          onSelectStop={jumpToStop}
        />
      </div>

      <BanhMiNavbar
        bibliographyButtonRef={bibliographyButtonRef}
        onOpenBibliography={() => setIsBibliographyOpen(true)}
      />

      {showCard ? (
        <StoryBubble
          stop={activeStop}
          stopIndex={currentStopIndex}
          stopCount={stops.length}
          point={points[currentStopIndex]}
          camera={camera}
          viewport={viewport}
          isExpanded={expandedStopId === activeStop.id}
          isTouring={isPlaying}
          onExpand={() => setExpandedStopId(activeStop.id)}
          onCollapse={() => {
            exitTour();
            setExpandedStopId(null);
          }}
          onSelectStop={navigateToStop}
          onTourScrollEnd={handleTourScrollEnd}
          onTourInterrupt={exitTour}
        />
      ) : null}

      <TimelineScrubber
        stops={stops}
        currentStopIndex={currentStopIndex}
        fillPosition={fillPosition}
        isPlaying={isPlaying}
        isWaitingOnReader={isWaitingOnReader}
        onTogglePlay={() => (isPlaying ? exitTour() : startTour())}
        onSelectStop={jumpToStop}
      />

      <BibliographyModal
        open={isBibliographyOpen}
        onClose={() => setIsBibliographyOpen(false)}
        returnFocusRef={bibliographyButtonRef}
      />
    </div>
  );
}
