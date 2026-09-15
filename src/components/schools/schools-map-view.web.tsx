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
import { CITY_MAP_ZOOM } from "../../utils/schools";
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

const defaultCenter = { lat: -27.4698, lng: 153.0251 };

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

  const getCityCenter = () => {
    if (userLocation) {
      return { lat: userLocation.lat, lng: userLocation.lng };
    }

    const validSchools = getValidSchools();
    if (validSchools.length > 0) {
      const [lat, lng] = schoolToLatLng(validSchools[0]);
      return { lat, lng };
    }

    return defaultCenter;
  };

  const focusCity = (mapInstance: google.maps.Map) => {
    const center = getCityCenter();
    mapInstance.panTo(center);
    mapInstance.setZoom(CITY_MAP_ZOOM);
  };

  useImperativeHandle(ref, () => ({
    recenter: () => {
      if (mapRef.current) {
        focusCity(mapRef.current);
      }
    },
  }));

  useEffect(() => {
    if (mapRef.current && mapReady) {
      focusCity(mapRef.current);
    }
  }, [schools, userLocation, mapReady]);

  const onLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    setMapReady(true);
    focusCity(map);
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
  const initialCenter = getCityCenter();

  return (
    <View style={styles.container}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={initialCenter}
        zoom={CITY_MAP_ZOOM}
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
