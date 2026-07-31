import L from "leaflet";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { StyleSheet, View } from "react-native";

import { colors } from "../../constants/theme";
import type { School } from "../../types/school";
import {
  buildSchoolMarkerHtml,
  schoolToLatLng,
} from "./school-map-marker-html";

import "leaflet/dist/leaflet.css";
import "./schools-map.web.css";

export type SchoolsMapViewHandle = {
  recenter: () => void;
};

type SchoolsMapViewProps = {
  schools: School[];
  selectedSchoolId: string | null;
  onSelectSchool: (schoolId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
};

const MAP_PADDING: L.PointExpression = [120, 64];

export const SchoolsMapView = forwardRef<
  SchoolsMapViewHandle,
  SchoolsMapViewProps
>(function SchoolsMapView(
  { schools, selectedSchoolId, onSelectSchool, userLocation },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const onSelectSchoolRef = useRef(onSelectSchool);

  onSelectSchoolRef.current = onSelectSchool;

  const getValidSchools = () =>
    schools.filter(
      (s): s is School & { latitude: number; longitude: number } =>
        s.latitude != null && s.longitude != null,
    );

  function fitSchools(map: L.Map) {
    if (!containerRef.current || containerRef.current.clientHeight === 0) {
      return;
    }

    const validSchools = getValidSchools();
    if (validSchools.length === 0) {
      return;
    }

    try {
      if (validSchools.length === 1) {
        const [lat, lng] = schoolToLatLng(validSchools[0]);
        map.setView([lat, lng], 13, { animate: false });
        return;
      }

      const bounds = L.latLngBounds(
        validSchools.map((school) => schoolToLatLng(school)),
      );
      map.fitBounds(bounds, { padding: MAP_PADDING, animate: false });
    } catch (err) {
      console.warn("Leaflet fitBounds error:", err);
    }
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

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
      fadeAnimation: false,
      zoomAnimation: false,
      markerZoomAnimation: false,
    }).setView([0, 0], 2);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const rafId = requestAnimationFrame(() => {
      if (
        mapRef.current &&
        containerRef.current &&
        containerRef.current.clientHeight > 0
      ) {
        mapRef.current.invalidateSize(false);
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;

    if (!map || !markersLayer) {
      return;
    }

    markersLayer.clearLayers();
    const validSchools = getValidSchools();

    validSchools.forEach((school) => {
      const selected = school.id === selectedSchoolId;
      const [lat, lng] = schoolToLatLng(school);

      const icon = L.divIcon({
        className: "school-map-marker",
        html: buildSchoolMarkerHtml(school, selected),
        iconSize: [48, 66],
        iconAnchor: [24, 66],
      });

      const marker = L.marker([lat, lng], { icon });
      marker.on("click", () => onSelectSchoolRef.current(school.id));
      marker.addTo(markersLayer);
    });

    if (validSchools.length > 0) {
      fitSchools(map);
    } else if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 13, { animate: false });
    }
  }, [schools, selectedSchoolId, userLocation]);

  return (
    <View style={styles.container}>
      <div ref={containerRef} style={styles.mapElement} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.inputBackground,
  },
  mapElement: {
    width: "100%",
    height: "100%",
  } as const,
});
