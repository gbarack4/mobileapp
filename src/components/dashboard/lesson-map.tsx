import { Platform, StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

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
  return (
    <View style={styles.nativeMapContainer}>
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
