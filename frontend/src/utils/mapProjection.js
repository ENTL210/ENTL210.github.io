import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import topology from "world-atlas/countries-110m.json";

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 480;
export const MAP_ASPECT = MAP_WIDTH / MAP_HEIGHT;

export function createProjection(worldGeoJson) {
  return geoNaturalEarth1().fitSize([MAP_WIDTH, MAP_HEIGHT], worldGeoJson);
}

export function createPathGenerator(projection) {
  return geoPath(projection);
}

// Returns [x, y] in the same 0 0 960 480 coordinate space as the map SVG.
export function projectPoint(projection, lon, lat) {
  return projection([lon, lat]);
}

// The single projection instance for this feature. Country paths and marker
// coordinates both come from here, so markers land on the coastline they were
// drawn against rather than on an estimate.
export const worldGeoJson = feature(topology, topology.objects.countries);
export const projection = createProjection(worldGeoJson);
export const pathGenerator = createPathGenerator(projection);

export const countryFeatures = worldGeoJson.features;

export function clamp(value, min, max) {
  // When the rect is larger than the extent there is nothing to clamp against,
  // so centre it on the extent instead of inverting the bounds.
  if (max < min) return (min + max) / 2;
  return Math.min(max, Math.max(min, value));
}

// Returns a viewBox rect centred on a projected point at a given zoom, clamped
// so it never runs past the projection's extent.
//
// `aspect` defaults to the map's own 2:1, which makes this identical to a
// width/zoom by height/zoom rect. It is overridable because the SVG is rendered
// edge to edge: if the rect keeps a 2:1 shape while the container is tall and
// narrow, preserveAspectRatio="slice" crops the width down to ~125 units on a
// phone, which is far too narrow to hold Paris and Saigon at once. Matching the
// container's shape means the rect *is* the visible region and framing stays
// under our control at every viewport.
export function buildViewBox(centerX, centerY, zoom, aspect = MAP_ASPECT) {
  const h = MAP_HEIGHT / zoom;
  const w = h * aspect;
  const x = clamp(centerX - w / 2, 0, MAP_WIDTH - w);
  const y = clamp(centerY - h / 2, 0, MAP_HEIGHT - h);
  return { x, y, w, h };
}

// Largest zoom at which a span of the given size still fits in frame.
export function zoomToFit(spanWidth, spanHeight, aspect) {
  return Math.min((MAP_HEIGHT * aspect) / spanWidth, MAP_HEIGHT / spanHeight);
}
