import { useMemo } from "react";
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  countryFeatures,
  pathGenerator,
} from "../../utils/mapProjection";
import JourneyMarker from "./JourneyMarker";
import JourneyPath from "./JourneyPath";
import "./WorldMapJourney.css";

const LAND_PALETTE = ["var(--bm-mint)", "var(--bm-mint-dark)", "var(--bm-tan)"];

// The stop the user is meant to tap next gets a comfortably large hit area.
const PRIMARY_HIT_RADIUS = 18;
// Everything else stays small enough that it cannot cover a neighbour's centre.
// The closest distinct pair on this map (Levant to Egypt) is ~12.5 units apart.
const SECONDARY_HIT_RADIUS = 5.5;
// Below this, two stops are the same point on screen. The two Saigon stops are
// ~0.4 units apart, so only one of them can own the shared pixels.
const COINCIDENT_DISTANCE = 6;

// Some world-atlas features have no id, so fall back to the array index. Both
// inputs are stable across renders, so fills never reshuffle.
function landFill(feature, index) {
  const numericId = Number(feature.id);
  const key = Number.isFinite(numericId) ? numericId : index;
  return LAND_PALETTE[key % LAND_PALETTE.length];
}

export default function WorldMapJourney({
  stops,
  points,
  currentStopIndex,
  onSelectStop,
}) {
  const countries = useMemo(
    () =>
      countryFeatures.map((feature, index) => ({
        key: feature.id ?? `idx-${index}`,
        d: pathGenerator(feature),
        fill: landFill(feature, index),
      })),
    [],
  );

  function markerState(index) {
    if (currentStopIndex == null) return index === 0 ? "active" : "upcoming";
    if (index === currentStopIndex) return "active";
    if (index < currentStopIndex) return "visited";
    return "upcoming";
  }

  // Before the journey starts the primary target is the opening stop; after
  // that it is always the next one, which is what makes advancing by tapping
  // the map work even where two stops sit on top of each other.
  const primaryIndex =
    currentStopIndex == null
      ? 0
      : Math.min(currentStopIndex + 1, stops.length - 1);
  const activeIndex = currentStopIndex == null ? 0 : currentStopIndex;

  const distanceTo = (index, otherIndex) =>
    Math.hypot(
      points[index][0] - points[otherIndex][0],
      points[index][1] - points[otherIndex][1],
    );

  const markers = stops.map((stop, index) => {
    const isPrimary = index === primaryIndex;
    // A marker sharing the primary target's pixels would swallow its clicks,
    // so it gives up its pointer area. It stays keyboard reachable, and the
    // timeline scrubber still navigates to it directly.
    const occludesPrimary =
      !isPrimary && distanceTo(index, primaryIndex) < COINCIDENT_DISTANCE;

    let hitRadius = SECONDARY_HIT_RADIUS;
    if (isPrimary) hitRadius = PRIMARY_HIT_RADIUS;
    else if (occludesPrimary) hitRadius = 0;

    return {
      stop,
      index,
      cx: points[index][0],
      cy: points[index][1],
      hitRadius,
      // Two dots on identical pixels just muddies the active state, so the
      // non-active one drops its visual.
      hideDot:
        index !== activeIndex &&
        distanceTo(index, activeIndex) < COINCIDENT_DISTANCE,
    };
  });

  return (
    <svg
      className="banhmi-map"
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      role="group"
      aria-label="World map showing the journey of bread from the Fertile Crescent to Saigon"
    >
      <rect
        className="banhmi-map__ocean"
        x="0"
        y="0"
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
      />

      <g className="banhmi-map__land" aria-hidden="true">
        {countries.map((country) => (
          <path
            key={country.key}
            className="banhmi-map__country"
            d={country.d}
            style={{ fill: country.fill }}
          />
        ))}
      </g>

      <JourneyPath points={points} currentStopIndex={currentStopIndex} />

      <g className="banhmi-map__markers">
        {markers.map((marker) => (
          <JourneyMarker
            key={marker.stop.id}
            cx={marker.cx}
            cy={marker.cy}
            stop={marker.stop}
            state={markerState(marker.index)}
            hitRadius={marker.hitRadius}
            hideDot={marker.hideDot}
            onSelect={() => onSelectStop(marker.index)}
          />
        ))}
      </g>
    </svg>
  );
}
