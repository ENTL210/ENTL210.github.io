import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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

// Guided-tour auto-scroll. Reading pace, with the duration derived from the
// content length so a longer card takes longer rather than scrolling faster.
const AUTO_SCROLL_START_DELAY_MS = 1200;
const AUTO_SCROLL_PX_PER_SECOND = 28;
const AUTO_SCROLL_MIN_MS = 6000;
const AUTO_SCROLL_MAX_MS = 30000;
const AT_BOTTOM_EPSILON = 2;

// Keys that scroll a container. Pressing one during the tour is the reader
// taking over, so the tour steps aside.
const SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
  "Spacebar",
]);

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
  isTouring,
  onExpand,
  onCollapse,
  onSelectStop,
  onTourScrollEnd,
  onTourInterrupt,
}) {
  const reduceMotion = useReducedMotion();
  const isNarrow = useIsNarrow();
  const bodyRef = useRef(null);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);

  const isFirst = stopIndex === 0;
  const isLast = stopIndex === stopCount - 1;

  // While the tour is running, Next stays shut until the reader has reached the
  // end of the card. Handing control back drops isTouring and lifts the gate.
  const isNextGated = isTouring && hasMoreBelow;
  const autoScrolling = isTouring && isExpanded && !reduceMotion;

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

  // Measured before paint, so the Next gate is never briefly ungated on the
  // frame the card opens.
  useLayoutEffect(() => {
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

  // Auto-scroll. Hand-rolled on requestAnimationFrame rather than smooth
  // scrollTo or a CSS animation, both of which would have to run to completion
  // and cannot be abandoned mid-motion at an exact position.
  useEffect(() => {
    if (!autoScrolling) return undefined;
    const el = bodyRef.current;
    if (!el) return undefined;

    let frame = 0;
    const startTimer = window.setTimeout(() => {
      const scrollable = el.scrollHeight - el.clientHeight;
      if (scrollable - el.scrollTop <= AT_BOTTOM_EPSILON) {
        onTourScrollEnd();
        return;
      }

      const duration = Math.min(
        AUTO_SCROLL_MAX_MS,
        Math.max(
          AUTO_SCROLL_MIN_MS,
          (scrollable / AUTO_SCROLL_PX_PER_SECOND) * 1000,
        ),
      );
      // Paced over the whole card, so resuming part-way keeps the same speed.
      const pixelsPerMs = scrollable / duration;
      let previous = performance.now();
      // Position is accumulated here rather than by adding to scrollTop each
      // frame: a sub-pixel increment added to a snapped scrollTop rounds away
      // to nothing, and the scroll never leaves the top.
      let position = el.scrollTop;

      const step = (now) => {
        const node = bodyRef.current;
        if (!node) return;
        position += pixelsPerMs * (now - previous);
        node.scrollTop = position;
        previous = now;
        if (
          node.scrollHeight - node.scrollTop - node.clientHeight <=
          AT_BOTTOM_EPSILON
        ) {
          onTourScrollEnd();
          return;
        }
        frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    }, AUTO_SCROLL_START_DELAY_MS);

    return () => {
      window.clearTimeout(startTimer);
      cancelAnimationFrame(frame);
    };
  }, [autoScrolling, stop.id, onTourScrollEnd]);

  // Reader intent. Deliberately not the `scroll` event: the auto-scroll fires
  // that itself, so the tour would cancel on its own motion. Input events only.
  useEffect(() => {
    if (!autoScrolling) return undefined;
    const el = bodyRef.current;
    if (!el) return undefined;

    // Pressing Next or Back is navigation, not the reader taking the wheel.
    const fromFooter = (event) =>
      event.target instanceof Element &&
      event.target.closest(".story-bubble__footer");

    const takeOver = (event) => {
      if (!fromFooter(event)) onTourInterrupt();
    };
    const onPointerDown = (event) => {
      if (fromFooter(event)) return;
      // Only a grab at the scrollbar counts; clicking the text to select it
      // is not a scroll.
      const rect = el.getBoundingClientRect();
      if (event.clientX >= rect.left + el.clientWidth) onTourInterrupt();
    };
    const onKeyDown = (event) => {
      if (!fromFooter(event) && SCROLL_KEYS.has(event.key)) onTourInterrupt();
    };

    const passive = { passive: true };
    el.addEventListener("wheel", takeOver, passive);
    el.addEventListener("touchstart", takeOver, passive);
    el.addEventListener("touchmove", takeOver, passive);
    el.addEventListener("pointerdown", onPointerDown, passive);
    el.addEventListener("keydown", onKeyDown, passive);

    return () => {
      el.removeEventListener("wheel", takeOver);
      el.removeEventListener("touchstart", takeOver);
      el.removeEventListener("touchmove", takeOver);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("keydown", onKeyDown);
    };
  }, [autoScrolling, onTourInterrupt]);

  function handleKeyDown(event) {
    if (event.key === "ArrowRight" && !isLast && !isNextGated) {
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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
          {/* Focusable so arrow, page, home and end keys scroll it natively,
              which is also what makes those keys detectable as reader intent. */}
          <div
            className="story-bubble__body"
            ref={bodyRef}
            tabIndex={0}
            role="region"
            aria-label={`${stop.title}, full story`}
          >
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
              {isNextGated && !isLast ? (
                <span className="story-bubble__hint">Scroll to continue</span>
              ) : null}
              <button
                type="button"
                className="story-bubble__nav"
                aria-label="Go to the next stop"
                disabled={isLast || isNextGated}
                aria-disabled={isLast || isNextGated}
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
