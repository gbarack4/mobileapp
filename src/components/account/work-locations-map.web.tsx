import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import {
  GoogleMap,
  useJsApiLoader,
  PolygonF,
  OverlayViewF,
} from "@react-google-maps/api";

import { colors } from "../../constants/theme";
import type { WorkSuburb } from "../../data/mock-work-locations";

import "./work-locations-map.web.css";

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

const defaultCenter = { lat: 0, lng: 0 };

function buildLabelHtml(name: string, selected: boolean) {
  return `<div class="work-location-map-label${selected ? " selected" : ""}">${name}</div>`;
}

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
  const [mapReady, setMapReady] = useState(false);

  const fitSuburbs = (mapInstance: google.maps.Map) => {
    if (suburbs.length === 0) {
      mapInstance.panTo(defaultCenter);
      mapInstance.setZoom(2);
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();

    suburbs.forEach((suburb) => {
      suburb.polygon.forEach((point) => {
        bounds.extend({ lat: point.latitude, lng: point.longitude });
      });
    });

    mapInstance.fitBounds(bounds, 24);
  };

  useEffect(() => {
    if (mapRef.current && mapReady) {
      fitSuburbs(mapRef.current);
    }
  }, [suburbs, mapReady]);

  const onLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    setMapReady(true);
    fitSuburbs(map);
  };

  const onUnmount = () => {
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
        zoom={suburbs.length === 0 ? 2 : 11}
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
              key={`polygon-${suburb.id}`}
              paths={paths}
              onClick={() => onToggleSuburb(suburb.id)}
              options={{
                fillColor: selected ? colors.primary : "#e2e8f0",
                fillOpacity: selected ? 0.42 : 0.72,
                strokeColor: selected ? "#0047cc" : "#94a3b8",
                strokeOpacity: 1,
                strokeWeight: 1.5,
              }}
            />
          );
        })}

        {suburbs.map((suburb) => {
          const selected = selectedIds.includes(suburb.id);
          const htmlContent = buildLabelHtml(suburb.name, selected);

          return (
            <OverlayViewF
              key={`label-${suburb.id}`}
              position={{
                lat: suburb.centroid.latitude,
                lng: suburb.centroid.longitude,
              }}
              mapPaneName="overlayMouseTarget"
              getPixelPositionOffset={(width, height) => ({
                x: -(width / 2),
                y: -(height / 2),
              })}
            >
              <div
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                style={{
                  pointerEvents: "none",
                }}
              />
            </OverlayViewF>
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
