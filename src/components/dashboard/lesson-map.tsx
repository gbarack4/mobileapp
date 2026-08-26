import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import { logGoogleMapsDiagnostics } from "../../utils/maps-diagnostics";

type LessonMapProps = {
  latitude: number;
  longitude: number;
  locationName: string;
};

const MAP_HEIGHT = 220;

export function LessonMap({
  latitude,
  longitude,
  locationName,
}: Readonly<LessonMapProps>) {
  useEffect(() => {
    logGoogleMapsDiagnostics("LessonMap");
  }, []);

  return (
    <View style={styles.nativeMapContainer}>
      <MapView
        style={styles.nativeMap}
        provider={PROVIDER_GOOGLE}
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
});
