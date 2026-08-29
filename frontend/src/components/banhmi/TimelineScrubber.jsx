import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { springSoft, springBouncy } from "../../motion";
import "./TimelineScrubber.css";

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6.5 4.2l9 5.8-9 5.8z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
      <rect x="5.5" y="4.5" width="3.5" height="11" rx="1.2" fill="currentColor" />
      <rect x="11" y="4.5" width="3.5" height="11" rx="1.2" fill="currentColor" />
    </svg>
  );
}

export default function TimelineScrubber({
  stops,
  currentStopIndex,
  isPlaying,
  onTogglePlay,
  onSelectStop,
}) {
  const reduceMotion = useReducedMotion();
  const started = currentStopIndex != null;
  const progress =
    stops.length > 1 ? (currentStopIndex ?? 0) / (stops.length - 1) : 0;

  return (
    <AnimatePresence>
      {started ? (
        <motion.div
          className="timeline-scrubber banhmi-glass"
          initial={reduceMotion ? { opacity: 0 } : { y: "120%" }}
          animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { y: "120%" }}
          transition={reduceMotion ? { duration: 0.15 } : springSoft}
        >
          <motion.button
            type="button"
            className={`timeline-scrubber__play ${
              isPlaying
                ? "timeline-scrubber__play--playing"
                : "timeline-scrubber__play--paused"
            }`}
            aria-label={isPlaying ? "Pause the journey" : "Play the journey"}
            aria-pressed={isPlaying}
            onClick={onTogglePlay}
            whileTap={reduceMotion ? undefined : { scale: 0.92 }}
            transition={springBouncy}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isPlaying ? "pause" : "play"}
                className="timeline-scrubber__play-icon"
                initial={reduceMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
                animate={reduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
                transition={reduceMotion ? { duration: 0.1 } : springBouncy}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </motion.span>
            </AnimatePresence>
          </motion.button>

          <div className="timeline-scrubber__track">
            <div className="timeline-scrubber__rail" aria-hidden="true" />
            <motion.div
              className="timeline-scrubber__fill"
              aria-hidden="true"
              initial={false}
              animate={{ scaleX: progress }}
              transition={reduceMotion ? { duration: 0.15 } : springSoft}
            />
            <div className="timeline-scrubber__dots">
              {stops.map((stop, index) => {
                const state =
                  index === currentStopIndex
                    ? "active"
                    : index < currentStopIndex
                      ? "visited"
                      : "upcoming";
                return (
                  <button
                    key={stop.id}
                    type="button"
                    className={`timeline-scrubber__dot timeline-scrubber__dot--${state}`}
                    aria-label={`Go to ${stop.title}, ${stop.year}`}
                    aria-current={index === currentStopIndex ? "step" : undefined}
                    onClick={() => onSelectStop(index)}
                  >
                    <span className="timeline-scrubber__dot-visual" />
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
