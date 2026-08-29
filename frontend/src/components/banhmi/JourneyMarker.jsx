import { motion, useReducedMotion } from "framer-motion";
import { springBouncy } from "../../motion";
import "./JourneyMarker.css";

export default function JourneyMarker({
  cx,
  cy,
  stop,
  state,
  hitRadius,
  hideDot,
  onSelect,
}) {
  const reduceMotion = useReducedMotion();
  const isActive = state === "active";

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      onSelect();
    }
  }

  return (
    <g
      className={`journey-marker journey-marker--${state}`}
      role="button"
      tabIndex={0}
      aria-label={`${stop.title}, ${stop.year}`}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
    >
      {/* Geometry is authored around the origin and moved into place by this
          transform, which also carries the inverse-zoom scale. That keeps the
          pin, its ring, and its hit area a constant size on screen at every
          camera zoom without touching their radii. */}
      <g
        className="journey-marker__scale"
        style={{
          transform: `translate(${cx}px, ${cy}px) scale(var(--bm-map-scale))`,
        }}
      >
        {isActive && !hideDot ? (
          <motion.circle
            className="journey-marker__pulse"
            cx={0}
            cy={0}
            initial={
              reduceMotion ? { r: 12, opacity: 0.35 } : { r: 7, opacity: 0.6 }
            }
            animate={
              reduceMotion
                ? { r: 12, opacity: 0.35 }
                : { r: [7, 22], opacity: [0.6, 0] }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : { ...springBouncy, repeat: Infinity, repeatDelay: 0.35 }
            }
          />
        ) : null}

        <circle className="journey-marker__hit" cx={0} cy={0} r={hitRadius} />

        {hideDot ? null : (
          <motion.circle
            className="journey-marker__dot"
            cx={0}
            cy={0}
            initial={false}
            animate={{ r: isActive ? 7 : state === "visited" ? 4.5 : 3.5 }}
            transition={reduceMotion ? { duration: 0 } : springBouncy}
          />
        )}
      </g>
    </g>
  );
}
