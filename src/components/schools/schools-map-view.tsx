import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { colors } from '../../constants/theme';
import type { School } from '../../types/school';
import { getSchoolMapRegion } from '../../utils/schools';
import { SchoolMapMarker } from './school-map-marker';

export type SchoolsMapViewHandle = {
  recenter: () => void;
};

type SchoolsMapViewProps = {
  schools: School[];
  selectedSchoolId: string | null;
  onSelectSchool: (schoolId: string) => void;
};

export const SchoolsMapView = forwardRef<SchoolsMapViewHandle, SchoolsMapViewProps>(
  function SchoolsMapView({ schools, selectedSchoolId, onSelectSchool }, ref) {
    const mapRef = useRef<MapView>(null);
    const initialRegion = getSchoolMapRegion(schools);

    function fitSchools() {
      if (schools.length === 0 || !mapRef.current) {
        return;
      }

      mapRef.current.fitToCoordinates(
        schools.map((school) => ({
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
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          rotateEnabled>
          {schools.map((school) => (
            <Marker
              key={school.id}
              coordinate={{
                latitude: school.latitude,
                longitude: school.longitude,
              }}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={false}
              onPress={() => onSelectSchool(school.id)}>
              <SchoolMapMarker
                initials={school.initials}
                color={school.avatarColor}
                selected={selectedSchoolId === school.id}
              />
            </Marker>
          ))}
        </MapView>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.inputBackground,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
