import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import BanhMiNavbar from "../components/banhmi/BanhMiNavbar";
import WorldMapJourney from "../components/banhmi/WorldMapJourney";
import StoryBubble from "../components/banhmi/StoryBubble";
import TimelineScrubber from "../components/banhmi/TimelineScrubber";
import BibliographyModal from "../components/banhmi/BibliographyModal";
import { stops } from "../data/banhmiJourney";
import { projectPoint, projection } from "../utils/mapProjection";
import "../styles/banhmi-theme.css";
import "./BanhMiHistory.css";

const AUTOPLAY_INTERVAL_MS = 5000;

export default function BanhMiHistory() {
  const [currentStopIndex, setCurrentStopIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [expandedStopId, setExpandedStopId] = useState(null);
  const [isBibliographyOpen, setIsBibliographyOpen] = useState(false);

  const bibliographyButtonRef = useRef(null);

  const points = useMemo(
    () => stops.map((stop) => projectPoint(projection, stop.lon, stop.lat)),
    [],
  );

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

  const goToStop = useCallback((index) => {
    setCurrentStopIndex(index);
    setExpandedStopId(null);
  }, []);

  useEffect(() => {
    if (!isPlaying) return undefined;

    if (currentStopIndex == null || currentStopIndex >= stops.length - 1) {
      setIsPlaying(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      goToStop(currentStopIndex + 1);
    }, AUTOPLAY_INTERVAL_MS);

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") setIsPlaying(false);
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isPlaying, currentStopIndex, goToStop]);

  const activeStop = currentStopIndex == null ? null : stops[currentStopIndex];

  return (
    <div className="banhmi-page">
      <div className="banhmi-page__mesh" aria-hidden="true" />

      <BanhMiNavbar
        bibliographyButtonRef={bibliographyButtonRef}
        onOpenBibliography={() => setIsBibliographyOpen(true)}
      />

      <main className="banhmi-page__main">
        <div className="banhmi-stage">
          <div className="banhmi-map-wrap">
            <WorldMapJourney
              stops={stops}
              points={points}
              currentStopIndex={currentStopIndex}
              onSelectStop={goToStop}
            />
          </div>

          {activeStop ? (
            <StoryBubble
              stop={activeStop}
              point={points[currentStopIndex]}
              isExpanded={expandedStopId === activeStop.id}
              onExpand={() => setExpandedStopId(activeStop.id)}
              onCollapse={() => setExpandedStopId(null)}
            />
          ) : null}
        </div>
      </main>

      <TimelineScrubber
        stops={stops}
        currentStopIndex={currentStopIndex}
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
