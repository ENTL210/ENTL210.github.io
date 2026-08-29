import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { springSoft, springBouncy } from "../../motion";
import "./StoryBubble.css";

const NARROW_QUERY = "(max-width: 719px)";
const NAVBAR_HEIGHT = 56;
// Room reserved at the bottom for the floating timeline bar.
const TIMELINE_CLEARANCE = 108;
const CARD_GAP = 18;
const COLLAPSED_HEIGHT = 146;
const EXPANDED_MAX_HEIGHT = 520;
// Mirrors the max-height in StoryBubble.css. Kept in JS as well because the
// card is anchored by its top edge, which needs the height up front.
const expandedHeight = (viewportHeight) =>
  Math.min(EXPANDED_MAX_HEIGHT, viewportHeight - NAVBAR_HEIGHT - 160);

function useIsNarrow() {
  const [isNarrow, setIsNarrow] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia(NARROW_QUERY).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(NARROW_QUERY);
    const onChange = (event) => setIsNarrow(event.matches);
    setIsNarrow(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isNarrow;
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function StoryBubble({
  stop,
  stopIndex,
  stopCount,
  point,
  camera,
  viewport,
  isExpanded,
  onExpand,
  onCollapse,
  onSelectStop,
}) {
  const reduceMotion = useReducedMotion();
  const isNarrow = useIsNarrow();
  const bodyRef = useRef(null);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);

  const isFirst = stopIndex === 0;
  const isLast = stopIndex === stopCount - 1;

  // The marker's live screen position, derived from the same camera rect the
  // map is animating toward, so the card follows its pin as the view zooms.
  const screenX = ((point[0] - camera.x) / camera.w) * viewport.width;
  const screenY = ((point[1] - camera.y) / camera.h) * viewport.height;

  // Anchored by the top edge rather than centred with a CSS transform: the
  // `layout` prop below writes its own inline transform, which would overwrite
  // a translateY and drop the card by half its height.
  const height = isExpanded
    ? expandedHeight(viewport.height)
    : COLLAPSED_HEIGHT;
  const flipLeft = screenX > viewport.width / 2;
  const minTop = NAVBAR_HEIGHT + 12;
  const maxTop = viewport.height - TIMELINE_CLEARANCE - height;
  const top =
    maxTop < minTop
      ? minTop
      : Math.min(maxTop, Math.max(minTop, screenY - height / 2));

  const anchorStyle = isNarrow
    ? undefined
    : {
        top: `${top}px`,
        ...(flipLeft
          ? { right: `${viewport.width - screenX + CARD_GAP}px` }
          : { left: `${screenX + CARD_GAP}px` }),
      };

  const syncScrollAffordance = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    setHasMoreBelow(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
  }, []);

  useEffect(() => {
    if (!isExpanded) return undefined;
    const el = bodyRef.current;
    if (!el) return undefined;
    el.scrollTop = 0;
    syncScrollAffordance();
    el.addEventListener("scroll", syncScrollAffordance, { passive: true });
    window.addEventListener("resize", syncScrollAffordance);
    return () => {
      el.removeEventListener("scroll", syncScrollAffordance);
      window.removeEventListener("resize", syncScrollAffordance);
    };
  }, [isExpanded, stop.id, syncScrollAffordance]);

  function handleKeyDown(event) {
    if (event.key === "ArrowRight" && !isLast) {
      event.preventDefault();
      onSelectStop(stopIndex + 1);
    } else if (event.key === "ArrowLeft" && !isFirst) {
      event.preventDefault();
      onSelectStop(stopIndex - 1);
    }
  }

  return (
    <motion.div
      className={`story-bubble bm-glass bm-glass--strong ${
        isExpanded ? "story-bubble--expanded" : "story-bubble--collapsed"
      } ${isNarrow ? "story-bubble--sheet" : ""}`}
      style={anchorStyle}
      layout={!reduceMotion}
      transition={reduceMotion ? { duration: 0.15 } : springSoft}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      aria-live="polite"
    >
      <div className="story-bubble__header">
        <p className="story-bubble__year">{stop.year}</p>
        <h2 className="story-bubble__title">{stop.title}</h2>
        {isExpanded ? (
          <motion.button
            type="button"
            className="story-bubble__close"
            aria-label={`Collapse ${stop.title}`}
            onClick={onCollapse}
            whileTap={reduceMotion ? undefined : { scale: 0.9 }}
            transition={springBouncy}
          >
            <CloseIcon />
          </motion.button>
        ) : null}
      </div>

      {isExpanded ? (
        <div className="story-bubble__scroll">
          <div className="story-bubble__body" ref={bodyRef}>
            <StopImage stop={stop} />

            <p className="story-bubble__text">{stop.content.intro}</p>

            <ul className="story-bubble__bullets">
              {stop.content.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>

            <p className="story-bubble__text">{stop.content.outro}</p>

            {/* Sticky inside the scroll container, so body text passes behind
                it rather than stopping at a hard edge. */}
            <div className="story-bubble__footer">
              <button
                type="button"
                className="story-bubble__nav"
                aria-label="Go to the previous stop"
                disabled={isFirst}
                aria-disabled={isFirst}
                onClick={() => onSelectStop(stopIndex - 1)}
              >
                ← Back
              </button>
              <button
                type="button"
                className="story-bubble__nav"
                aria-label="Go to the next stop"
                disabled={isLast}
                aria-disabled={isLast}
                onClick={() => onSelectStop(stopIndex + 1)}
              >
                Next →
              </button>
            </div>
          </div>

          <div
            className={`story-bubble__fade ${
              hasMoreBelow ? "" : "story-bubble__fade--hidden"
            }`}
            aria-hidden="true"
          />
        </div>
      ) : (
        <motion.button
          type="button"
          className="story-bubble__explore"
          aria-label={`Explore ${stop.title}`}
          onClick={onExpand}
          whileTap={reduceMotion ? undefined : { scale: 0.96 }}
          transition={springBouncy}
        >
          Explore me →
        </motion.button>
      )}
    </motion.div>
  );
}

// Real photographs get dropped in at stop.image later. Until a file exists the
// frame stays as an empty surface rather than a broken-image glyph, and it
// holds its 4/3 box so nothing reflows when a photo arrives.
function StopImage({ stop }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [stop.id]);

  return (
    <span className="story-bubble__figure">
      {failed ? null : (
        <img
          className="story-bubble__image"
          src={stop.image}
          alt={stop.imageAlt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
