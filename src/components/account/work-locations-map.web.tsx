import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import {
  GoogleMap,
  useJsApiLoader,
  PolygonF,
} from "@react-google-maps/api";

import { colors } from "../../constants/theme";
import type { WorkSuburb } from "../../data/mock-work-locations";
import {
  findSuburbAtPoint,
  getMapFitSuburbs,
} from "../../utils/work-locations-map";

type WorkLocationsMapProps = {
  suburbs: WorkSuburb[];
  selectedIds: string[];
  onToggleSuburb: (suburbId: string) => void;
};

const MAP_HEIGHT = 260;

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = { lat: -27.55, lng: 153.0 };

export function WorkLocationsMap({
  suburbs,
  selectedIds,
  onToggleSuburb,
}: Readonly<WorkLocationsMapProps>) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const suburbsRef = useRef(suburbs);
  const onToggleSuburbRef = useRef(onToggleSuburb);
  const [mapReady, setMapReady] = useState(false);

  suburbsRef.current = suburbs;
  onToggleSuburbRef.current = onToggleSuburb;

  const fitMap = (mapInstance: google.maps.Map) => {
    const focus = getMapFitSuburbs(suburbs, selectedIds);

    if (focus.length === 0) {
      mapInstance.panTo(defaultCenter);
      mapInstance.setZoom(10);
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();

    focus.forEach((suburb) => {
      suburb.polygon.forEach((point) => {
        bounds.extend({ lat: point.latitude, lng: point.longitude });
      });
    });

    mapInstance.fitBounds(bounds, 28);
  };

  useEffect(() => {
    if (mapRef.current && mapReady) {
      fitMap(mapRef.current);
    }
  }, [suburbs, mapReady]);

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) {
      return;
    }

    const hit = findSuburbAtPoint(
      {
        latitude: event.latLng.lat(),
        longitude: event.latLng.lng(),
      },
      suburbsRef.current,
    );

    if (hit) {
      onToggleSuburbRef.current(hit.id);
    }
  };

  const onLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    setMapReady(true);
    fitMap(map);

    if (clickListenerRef.current) {
      google.maps.event.removeListener(clickListenerRef.current);
    }

    clickListenerRef.current = google.maps.event.addListener(
      map,
      "click",
      handleMapClick,
    );
  };

  const onUnmount = () => {
    if (clickListenerRef.current) {
      google.maps.event.removeListener(clickListenerRef.current);
      clickListenerRef.current = null;
    }

    mapRef.current = null;
    setMapReady(false);
  };

  if (loadError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading Google Maps</Text>
      </View>
    );
  }

  if (!isLoaded) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={11}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
        }}
      >
        {suburbs.map((suburb) => {
          const selected = selectedIds.includes(suburb.id);
          const paths = suburb.polygon.map((p) => ({
            lat: p.latitude,
            lng: p.longitude,
          }));

          return (
            <PolygonF
              key={`polygon-${suburb.id}-${selected ? "on" : "off"}`}
              paths={paths}
              options={{
                clickable: false,
                fillColor: selected ? colors.primary : "#fde68a",
                fillOpacity: selected ? 0.45 : 0.55,
                strokeColor: selected ? "#0047cc" : "#fde68a",
                strokeOpacity: selected ? 1 : 0,
                strokeWeight: selected ? 2 : 0,
                zIndex: selected ? 2 : 1,
              }}
            />
          );
        })}
      </GoogleMap>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: MAP_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#eef2f7",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  centerContainer: {
    height: MAP_HEIGHT,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eef2f7",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
});
