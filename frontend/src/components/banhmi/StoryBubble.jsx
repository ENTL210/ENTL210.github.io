import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MAP_HEIGHT, MAP_WIDTH } from "../../utils/mapProjection";
import { springSoft, springBouncy } from "../../motion";
import "./StoryBubble.css";

const NARROW_QUERY = "(max-width: 719px)";

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
  point,
  isExpanded,
  onExpand,
  onCollapse,
}) {
  const reduceMotion = useReducedMotion();
  const isNarrow = useIsNarrow();

  const anchorX = (point[0] / MAP_WIDTH) * 100;
  const anchorY = (point[1] / MAP_HEIGHT) * 100;

  // Flip to the opposite side of the marker when the card would run off the
  // right edge, and keep the vertical anchor away from the wrapper edges.
  const flipLeft = anchorX > 55;
  const clampedY = Math.min(78, Math.max(24, anchorY));

  const anchorStyle = isNarrow
    ? undefined
    : {
        top: `${clampedY}%`,
        ...(flipLeft
          ? { right: `${100 - anchorX}%`, marginRight: "18px" }
          : { left: `${anchorX}%`, marginLeft: "18px" }),
      };

  return (
    <motion.div
      className={`story-bubble banhmi-glass ${
        isExpanded ? "story-bubble--expanded" : "story-bubble--collapsed"
      } ${isNarrow ? "story-bubble--sheet" : ""}`}
      style={anchorStyle}
      layout={!reduceMotion}
      transition={reduceMotion ? { duration: 0.15 } : springSoft}
      aria-live="polite"
    >
      <div className="story-bubble__glow" aria-hidden="true" />

      <motion.p layout={!reduceMotion} className="story-bubble__year">
        {stop.year}
      </motion.p>

      <motion.h2 layout={!reduceMotion} className="story-bubble__title">
        {stop.title}
      </motion.h2>

      {isExpanded ? (
        <motion.div
          className="story-bubble__body"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduceMotion ? { duration: 0.15 } : { delay: 0.08 }}
        >
          <img
            className="story-bubble__image"
            src={stop.image}
            alt={stop.imageAlt}
            width="320"
            height="240"
          />
          <p className="story-bubble__text">{stop.body}</p>
        </motion.div>
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
    </motion.div>
  );
}
