import L from 'leaflet';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../../constants/theme';
import type { School } from '../../types/school';
import { getSchoolMapRegion } from '../../utils/schools';
import { buildSchoolMarkerHtml, schoolToLatLng } from './school-map-marker-html';

import 'leaflet/dist/leaflet.css';
import './schools-map.web.css';

export type SchoolsMapViewHandle = {
  recenter: () => void;
};

type SchoolsMapViewProps = {
  schools: School[];
  selectedSchoolId: string | null;
  onSelectSchool: (schoolId: string) => void;
};

const MAP_PADDING: L.PointExpression = [120, 64];

export const SchoolsMapView = forwardRef<SchoolsMapViewHandle, SchoolsMapViewProps>(
  function SchoolsMapView({ schools, selectedSchoolId, onSelectSchool }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    const onSelectSchoolRef = useRef(onSelectSchool);

    onSelectSchoolRef.current = onSelectSchool;

    function fitSchools(map: L.Map) {
      if (schools.length === 0) {
        return;
      }

      if (schools.length === 1) {
        const [lat, lng] = schoolToLatLng(schools[0]);
        map.setView([lat, lng], 13);
        return;
      }

      const bounds = L.latLngBounds(schools.map((school) => schoolToLatLng(school)));
      map.fitBounds(bounds, { padding: MAP_PADDING });
    }

    useImperativeHandle(ref, () => ({
      recenter: () => {
        if (mapRef.current) {
          fitSchools(mapRef.current);
        }
      },
    }));

    useEffect(() => {
      if (!containerRef.current || mapRef.current) {
        return;
      }

      const region = getSchoolMapRegion(schools);
      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView([region.latitude, region.longitude], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      requestAnimationFrame(() => {
        map.invalidateSize();
        fitSchools(map);
      });

      return () => {
        map.remove();
        mapRef.current = null;
        markersLayerRef.current = null;
      };
    }, []);

    useEffect(() => {
      const map = mapRef.current;
      const markersLayer = markersLayerRef.current;

      if (!map || !markersLayer) {
        return;
      }

      markersLayer.clearLayers();

      schools.forEach((school) => {
        const selected = school.id === selectedSchoolId;
        const [lat, lng] = schoolToLatLng(school);
        const icon = L.divIcon({
          className: 'school-map-marker',
          html: buildSchoolMarkerHtml(school.initials, school.avatarColor, selected),
          iconSize: [48, 66],
          iconAnchor: [24, 66],
        });

        const marker = L.marker([lat, lng], { icon });
        marker.on('click', () => onSelectSchoolRef.current(school.id));
        marker.addTo(markersLayer);
      });

      fitSchools(map);
    }, [schools, selectedSchoolId]);

    return (
      <View style={styles.container}>
        <div ref={containerRef} style={styles.mapElement} />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.inputBackground,
  },
  mapElement: {
    width: '100%',
    height: '100%',
  } as const,
});
