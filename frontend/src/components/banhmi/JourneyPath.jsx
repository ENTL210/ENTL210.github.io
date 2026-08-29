import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { springSoft } from "../../motion";
import "./JourneyPath.css";

// Below this many SVG units apart, two stops are effectively the same point.
// The two Saigon stops sit ~0.4 units apart, which would otherwise render as a
// stray dot rather than a travelled segment.
const DEGENERATE_DISTANCE = 6;

function segmentPath([ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const distance = Math.hypot(dx, dy);

  if (distance < DEGENERATE_DISTANCE) {
    // A short hook that leaves the marker and curls back, so the final leg
    // still reads as movement instead of an artifact.
    return `M ${ax} ${ay} C ${ax + 26} ${ay - 30} ${bx + 34} ${by - 4} ${bx} ${by}`;
  }

  const midX = (ax + bx) / 2;
  const midY = (ay + by) / 2;
  const bulge = distance * 0.16;
  const controlX = midX + (-dy / distance) * bulge;
  const controlY = midY + (dx / distance) * bulge;

  return `M ${ax} ${ay} Q ${controlX} ${controlY} ${bx} ${by}`;
}

export default function JourneyPath({ points, currentStopIndex }) {
  const reduceMotion = useReducedMotion();
  const maskPrefix = useId();

  if (currentStopIndex == null || currentStopIndex < 1) return null;

  const segments = [];
  for (let i = 0; i < currentStopIndex; i += 1) {
    segments.push({ index: i, d: segmentPath(points[i], points[i + 1]) });
  }

  return (
    <g className="journey-path" aria-hidden="true">
      {segments.map(({ index, d }) => {
        const maskId = `${maskPrefix}-seg-${index}`;
        return (
          <g key={index}>
            {/* Framer Motion drives pathLength through strokeDasharray, which
                would clobber the dashed styling. Drawing the reveal inside a
                mask keeps both. */}
            <mask id={maskId} maskUnits="userSpaceOnUse">
              <motion.path
                d={d}
                fill="none"
                stroke="#ffffff"
                strokeWidth={14}
                strokeLinecap="round"
                initial={reduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={reduceMotion ? { duration: 0 } : springSoft}
              />
            </mask>
            <motion.path
              className="journey-path__line"
              d={d}
              mask={`url(#${maskId})`}
              initial={reduceMotion ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={reduceMotion ? { duration: 0.2 } : { duration: 0 }}
            />
          </g>
        );
      })}
    </g>
  );
}
