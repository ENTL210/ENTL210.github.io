import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import topology from "world-atlas/countries-110m.json";

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 480;

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
