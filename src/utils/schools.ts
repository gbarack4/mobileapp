import type { School } from "../types/school";

export function filterSchools(schools: School[], query: string): School[] {
  const trimmedQuery = query.trim().toLowerCase();

  if (!trimmedQuery) {
    return schools;
  }

  return schools.filter((school) => {
    const searchableText = [
      school.name,
      school.suburb,
      school.postcode,
      school.address,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(trimmedQuery);
  });
}

function hasValidCoordinates(
  school: School,
): school is School & { latitude: number; longitude: number } {
  return school.latitude != null && school.longitude != null;
}

/** Roughly a single city (~25km), not a country or world view. */
export const CITY_MAP_LATITUDE_DELTA = 0.25;
export const CITY_MAP_LONGITUDE_DELTA = 0.25;
export const CITY_MAP_ZOOM = 11;

export function getCityMapRegion(center: {
  latitude: number;
  longitude: number;
}) {
  return {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: CITY_MAP_LATITUDE_DELTA,
    longitudeDelta: CITY_MAP_LONGITUDE_DELTA,
  };
}

export function getSchoolMapRegion(schools: School[]) {
  const validSchools = schools.filter(hasValidCoordinates);

  if (validSchools.length === 0) {
    return null;
  }

  if (validSchools.length === 1) {
    return {
      latitude: validSchools[0].latitude,
      longitude: validSchools[0].longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }

  const latitudes = validSchools.map((school) => school.latitude);
  const longitudes = validSchools.map((school) => school.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.06),
    longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.06),
  };
}
