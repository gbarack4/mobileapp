import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../../constants/theme';
import type { WorkSuburb } from '../../data/mock-work-locations';
import { getWorkLocationsRegion, suburbPolygonToLatLngArray } from '../../utils/work-locations-map';

import 'leaflet/dist/leaflet.css';
import './work-locations-map.web.css';

type WorkLocationsMapProps = {
  suburbs: WorkSuburb[];
  selectedIds: string[];
  onToggleSuburb: (suburbId: string) => void;
};

const MAP_HEIGHT = 260;

function buildLabelHtml(name: string, selected: boolean) {
  return `<div class="work-location-map-label${selected ? ' selected' : ''}">${name}</div>`;
}

export function WorkLocationsMap({ suburbs, selectedIds, onToggleSuburb }: WorkLocationsMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const polygonsLayerRef = useRef<L.LayerGroup | null>(null);
  const labelsLayerRef = useRef<L.LayerGroup | null>(null);
  const onToggleSuburbRef = useRef(onToggleSuburb);
  const selectedIdsRef = useRef(selectedIds);

  onToggleSuburbRef.current = onToggleSuburb;
  selectedIdsRef.current = selectedIds;

  function fitSuburbs(map: L.Map) {
    if (suburbs.length === 0) {
      return;
    }

    const bounds = L.latLngBounds(
      suburbs.flatMap((suburb) =>
        suburb.polygon.map((point) => [point.latitude, point.longitude] as [number, number]),
      ),
    );

    map.fitBounds(bounds, { padding: [24, 24] });
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const region = getWorkLocationsRegion(suburbs);
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([region.latitude, region.longitude], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    polygonsLayerRef.current = L.layerGroup().addTo(map);
    labelsLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    requestAnimationFrame(() => {
      map.invalidateSize();
      fitSuburbs(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      polygonsLayerRef.current = null;
      labelsLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const polygonsLayer = polygonsLayerRef.current;
    const labelsLayer = labelsLayerRef.current;

    if (!map || !polygonsLayer || !labelsLayer) {
      return;
    }

    polygonsLayer.clearLayers();
    labelsLayer.clearLayers();

    suburbs.forEach((suburb) => {
      const selected = selectedIds.includes(suburb.id);
      const latLngs = suburbPolygonToLatLngArray(suburb.polygon);

      const polygon = L.polygon(latLngs, {
        color: selected ? '#0047cc' : '#94a3b8',
        fillColor: selected ? colors.primary : '#e2e8f0',
        fillOpacity: selected ? 0.42 : 0.72,
        weight: 1.5,
      });

      polygon.on('click', () => onToggleSuburbRef.current(suburb.id));
      polygon.addTo(polygonsLayer);

      const labelIcon = L.divIcon({
        className: 'work-location-map-label-wrap',
        html: buildLabelHtml(suburb.name, selected),
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      L.marker([suburb.centroid.latitude, suburb.centroid.longitude], {
        icon: labelIcon,
        interactive: false,
      }).addTo(labelsLayer);
    });

    fitSuburbs(map);
  }, [suburbs, selectedIds]);

  return (
    <View style={styles.container}>
      <div ref={containerRef} className="work-locations-leaflet" style={styles.mapElement} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: MAP_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#eef2f7',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mapElement: {
    width: '100%',
    height: '100%',
  } as const,
});
