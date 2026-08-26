import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";

import { colors } from "../../constants/theme";
import type { School } from "../../types/school";
import { logGoogleMapsDiagnostics } from "../../utils/maps-diagnostics";
import { getSchoolMapRegion } from "../../utils/schools";
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

  const rawRegion = getSchoolMapRegion(validSchools);

  const initialRegion: Region | undefined =
    rawRegion?.latitude != null && rawRegion.longitude != null
      ? {
          latitude: rawRegion.latitude,
          longitude: rawRegion.longitude,
          latitudeDelta: rawRegion.latitudeDelta,
          longitudeDelta: rawRegion.longitudeDelta,
        }
      : userLocation
        ? {
            latitude: userLocation.lat,
            longitude: userLocation.lng,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }
        : undefined;

  function fitSchools() {
    if (validSchools.length === 0 || !mapRef.current) {
      return;
    }

    mapRef.current.fitToCoordinates(
      validSchools.map((school) => ({
        latitude: school.latitude,
        longitude: school.longitude,
      })),
      {
        edgePadding: { top: 120, right: 64, bottom: 160, left: 64 },
        animated: true,
      },
    );
  }

  useImperativeHandle(ref, () => ({
    recenter: fitSchools,
  }));

  useEffect(() => {
    fitSchools();
  }, [schools]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled
        onMapReady={() => {
          console.log("[Maps:SchoolsMapView] onMapReady");
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
