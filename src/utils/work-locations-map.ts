import type { LatLng, WorkSuburb } from '../data/mock-work-locations';

export function getWorkLocationsRegion(suburbs: WorkSuburb[]) {
  if (suburbs.length === 0) {
    return {
      latitude: -27.58,
      longitude: 152.97,
      latitudeDelta: 0.35,
      longitudeDelta: 0.35,
    };
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const suburb of suburbs) {
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
