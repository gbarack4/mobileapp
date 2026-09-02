import suburbPolygons from "./work-suburb-polygons.json";

export type LatLng = {
  latitude: number;
  longitude: number;
};

export type WorkSuburb = {
  id: string;
  name: string;
  centroid: LatLng;
  polygon: LatLng[];
};

type SuburbPolygonsFile = Record<string, WorkSuburb>;

const ALL_SUBURBS = suburbPolygons as SuburbPolygonsFile;

export const MOCK_WORK_SUBURBS: WorkSuburb[] = Object.values(ALL_SUBURBS).sort(
  (a, b) => a.name.localeCompare(b.name),
);

export function filterWorkSuburbs(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return MOCK_WORK_SUBURBS;
  }

  return MOCK_WORK_SUBURBS.filter((suburb) =>
    suburb.name.toLowerCase().includes(normalized),
  );
}

export function findWorkSuburbByName(name: string): WorkSuburb | null {
  const normalized = name.trim().toLowerCase();

  return (
    MOCK_WORK_SUBURBS.find(
      (suburb) => suburb.name.toLowerCase() === normalized,
    ) ?? null
  );
}

export function suburbNamesToIds(names: string[]) {
  const lookup = new Map(
    MOCK_WORK_SUBURBS.map((suburb) => [suburb.name.toLowerCase(), suburb.id]),
  );

  return names
    .map((name) => lookup.get(name.toLowerCase()))
    .filter((id): id is string => Boolean(id));
}

export function suburbIdsToNames(ids: string[]) {
  const lookup = new Map(
    MOCK_WORK_SUBURBS.map((suburb) => [suburb.id, suburb.name]),
  );

  return ids
    .map((id) => lookup.get(id))
    .filter((name): name is string => Boolean(name));
}
