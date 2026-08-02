import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";

type LessonMapProps = {
  latitude: number;
  longitude: number;
  locationName: string;
};

const MAP_HEIGHT = 220;

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

export function LessonMap({
  latitude,
  longitude,
  locationName,
}: Readonly<LessonMapProps>) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const center = { lat: latitude, lng: longitude };

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
        <ActivityIndicator size="large" color="#0047cc" />
      </View>
    );
  }

  return (
    <View style={styles.webMapContainer}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={14}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "cooperative",
        }}
      >
        <MarkerF position={center} title={locationName} />
      </GoogleMap>
    </View>
  );
}

const styles = StyleSheet.create({
  webMapContainer: {
    height: MAP_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  centerContainer: {
    height: MAP_HEIGHT,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
});
