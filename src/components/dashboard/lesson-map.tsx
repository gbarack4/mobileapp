import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import { logGoogleMapsDiagnostics } from "../../utils/maps-diagnostics";

type LessonMapProps = {
  latitude: number;
  longitude: number;
  locationName: string;
};

const MAP_HEIGHT = 220;

function hasValidCoordinates(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
}

export function LessonMap({
  latitude,
  longitude,
  locationName,
}: Readonly<LessonMapProps>) {
  const [mapMounted, setMapMounted] = useState(false);
  const canShowMap = hasValidCoordinates(latitude, longitude);

  useEffect(() => {
    logGoogleMapsDiagnostics("LessonMap");
  }, []);

  useEffect(() => {
    if (!canShowMap) {
      setMapMounted(false);
      return;
    }

    const timeout = setTimeout(() => setMapMounted(true), 50);
    return () => clearTimeout(timeout);
  }, [canShowMap, latitude, longitude]);

  if (!canShowMap || !mapMounted) {
    return (
      <View style={styles.nativeMapContainer}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            {canShowMap ? "Loading map..." : "Map unavailable for this pickup"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.nativeMapContainer} collapsable={false}>
      <MapView
        style={styles.nativeMap}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        onMapReady={() => {
          console.log("[Maps:LessonMap] onMapReady");
        }}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title={locationName}
          pinColor="#005eff"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  nativeMapContainer: {
    height: MAP_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
  },
  nativeMap: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  placeholderText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});
