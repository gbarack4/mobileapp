import type { LatLng, WorkSuburb } from '../data/mock-work-locations';

/** Other metros are available on the map but not used for the default camera. */
const OTHER_METRO_ID_PREFIXES = ['perth-', 'sydney-', 'melbourne-'] as const;

/** Ray-cast point-in-polygon for map tap selection. */
export function isPointInPolygon(point: LatLng, polygon: LatLng[]) {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersects =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude <
        ((xj - xi) * (point.latitude - yi)) / (yj - yi + Number.EPSILON) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

export function findSuburbAtPoint(point: LatLng, suburbs: WorkSuburb[]) {
  for (let i = suburbs.length - 1; i >= 0; i -= 1) {
    if (isPointInPolygon(point, suburbs[i].polygon)) {
      return suburbs[i];
    }
  }

  return null;
}

function isOtherMetroSuburb(suburb: WorkSuburb) {
  return OTHER_METRO_ID_PREFIXES.some((prefix) => suburb.id.startsWith(prefix));
}

/** Prefer selected suburbs, else SEQ when other metros are also loaded. */
export function getMapFitSuburbs(
  suburbs: WorkSuburb[],
  selectedIds: string[] = [],
) {
  if (selectedIds.length > 0) {
    const selected = suburbs.filter((suburb) => selectedIds.includes(suburb.id));
    if (selected.length > 0) {
      return selected;
    }
  }

  const seq = suburbs.filter((suburb) => !isOtherMetroSuburb(suburb));
  const other = suburbs.filter(isOtherMetroSuburb);

  if (seq.length > 0 && other.length > 0) {
    return seq;
  }

  return suburbs;
}

export function getWorkLocationsRegion(
  suburbs: WorkSuburb[],
  selectedIds: string[] = [],
) {
  const focus = getMapFitSuburbs(suburbs, selectedIds);

  if (focus.length === 0) {
    return {
      latitude: -27.55,
      longitude: 153.0,
      latitudeDelta: 0.35,
      longitudeDelta: 0.35,
    };
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const suburb of focus) {
    for (const point of suburb.polygon) {
      minLat = Math.min(minLat, point.latitude);
      maxLat = Math.max(maxLat, point.latitude);
      minLng = Math.min(minLng, point.longitude);
      maxLng = Math.max(maxLng, point.longitude);
    }
  }

  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLng + maxLng) / 2;
  const latitudeDelta = Math.max((maxLat - minLat) * 1.2, 0.12);
  const longitudeDelta = Math.max((maxLng - minLng) * 1.2, 0.12);

  return { latitude, longitude, latitudeDelta, longitudeDelta };
}

export function suburbPolygonToLatLngArray(polygon: LatLng[]) {
  return polygon.map((point) => [point.latitude, point.longitude] as [number, number]);
}
