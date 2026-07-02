import { MOCK_SCHOOLS } from '../data/mock-schools';
import type { School } from '../types/school';

export function getSchoolById(id: string): School | undefined {
  return MOCK_SCHOOLS.find((school) => school.id === id);
}

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
      school.serviceTypes,
    ]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(trimmedQuery);
  });
}

export function getSchoolMapRegion(schools: School[]) {
  if (schools.length === 0) {
    return {
      latitude: -27.62,
      longitude: 153.02,
      latitudeDelta: 0.2,
      longitudeDelta: 0.2,
    };
  }

  if (schools.length === 1) {
    return {
      latitude: schools[0].latitude,
      longitude: schools[0].longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }

  const latitudes = schools.map((school) => school.latitude);
  const longitudes = schools.map((school) => school.longitude);
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
