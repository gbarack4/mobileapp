import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import {
  GoogleMap,
  useJsApiLoader,
  OverlayViewF,
  OverlayView,
} from "@react-google-maps/api";

import { colors } from "../../constants/theme";
import type { School } from "../../types/school";
import {
  buildSchoolMarkerHtml,
  schoolToLatLng,
} from "./school-map-marker-html";

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

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = { lat: 0, lng: 0 };

export const SchoolsMapView = forwardRef<
  SchoolsMapViewHandle,
  SchoolsMapViewProps
>(function SchoolsMapView(
  { schools, selectedSchoolId, onSelectSchool, userLocation },
  ref,
) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const getValidSchools = () =>
    schools.filter(
      (s): s is School & { latitude: number; longitude: number } =>
        s.latitude != null && s.longitude != null,
    );

  const fitSchools = (mapInstance: google.maps.Map) => {
    const validSchools = getValidSchools();

    if (validSchools.length === 0) {
      if (userLocation) {
        mapInstance.panTo({ lat: userLocation.lat, lng: userLocation.lng });
        mapInstance.setZoom(13);
      }
      return;
    }

    if (validSchools.length === 1) {
      const [lat, lng] = schoolToLatLng(validSchools[0]);
      mapInstance.panTo({ lat, lng });
      mapInstance.setZoom(13);
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    validSchools.forEach((school) => {
      const [lat, lng] = schoolToLatLng(school);
      bounds.extend({ lat, lng });
    });

    mapInstance.fitBounds(bounds, {
      top: 120,
      right: 64,
      bottom: 64,
      left: 64,
    });
  };

  useImperativeHandle(ref, () => ({
    recenter: () => {
      if (mapRef.current) {
        fitSchools(mapRef.current);
      }
    },
  }));

  useEffect(() => {
    if (mapRef.current && mapReady) {
      fitSchools(mapRef.current);
    }
  }, [schools, userLocation, mapReady]);

  const onLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    setMapReady(true);
    fitSchools(map);
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

  const validSchools = getValidSchools();
  const initialCenter = userLocation
    ? { lat: userLocation.lat, lng: userLocation.lng }
    : defaultCenter;

  const initialZoom = validSchools.length === 0 && !userLocation ? 2 : 13;

  return (
    <View style={styles.container}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={initialCenter}
        zoom={initialZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
        }}
      >
        {validSchools.map((school) => {
          const selected = school.id === selectedSchoolId;
          const [lat, lng] = schoolToLatLng(school);
          const htmlContent = buildSchoolMarkerHtml(school, selected);

          return (
            <OverlayViewF
              key={school.locationId ?? school.id}
              position={{ lat, lng }}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              getPixelPositionOffset={(width, height) => ({
                x: -(width / 2),
                y: -height,
              })}
            >
              <div
                onClick={() => onSelectSchool(school.id)}
                style={{ cursor: "pointer" }}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </OverlayViewF>
          );
        })}
      </GoogleMap>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.inputBackground,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
});
