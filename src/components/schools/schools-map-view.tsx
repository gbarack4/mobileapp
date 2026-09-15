import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import { colors } from "../../constants/theme";
import type { School } from "../../types/school";
import { logGoogleMapsDiagnostics } from "../../utils/maps-diagnostics";
import { getCityMapRegion } from "../../utils/schools";
import { SchoolMapMarker } from "./school-map-marker";

export type SchoolsMapViewHandle = {
  recenter: () => void;
};

type SchoolsMapViewProps = {
  schools: School[];
  selectedSchoolId: string | null;
  onSelectSchool: (schoolId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
};

export const SchoolsMapView = forwardRef<
  SchoolsMapViewHandle,
  SchoolsMapViewProps
>(function SchoolsMapView(
  { schools, selectedSchoolId, onSelectSchool, userLocation },
  ref,
) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    logGoogleMapsDiagnostics("SchoolsMapView");
  }, []);

  const validSchools = schools.filter(
    (school): school is School & { latitude: number; longitude: number } =>
      school.latitude != null && school.longitude != null,
  );

  const cityCenter = userLocation
    ? { latitude: userLocation.lat, longitude: userLocation.lng }
    : validSchools[0]
      ? {
          latitude: validSchools[0].latitude,
          longitude: validSchools[0].longitude,
        }
      : null;

  const initialRegion = cityCenter ? getCityMapRegion(cityCenter) : undefined;

  function focusCity() {
    if (!cityCenter || !mapRef.current) {
      return;
    }

    mapRef.current.animateToRegion(getCityMapRegion(cityCenter), 400);
  }

  useImperativeHandle(ref, () => ({
    recenter: focusCity,
  }));

  useEffect(() => {
    focusCity();
  }, [userLocation, schools]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled
        onMapReady={() => {
          console.log("[Maps:SchoolsMapView] onMapReady");
          focusCity();
        }}
        onMapLoaded={() => {
          console.log("[Maps:SchoolsMapView] onMapLoaded");
        }}
      >
        {validSchools.map((school) => (
          <Marker
            key={school.locationId ?? school.id}
            coordinate={{
              latitude: school.latitude,
              longitude: school.longitude,
            }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
            onPress={() => onSelectSchool(school.id)}
          >
            <SchoolMapMarker
              school={school}
              selected={selectedSchoolId === school.id}
            />
          </Marker>
        ))}
      </MapView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 1,
    backgroundColor: colors.inputBackground,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
});
