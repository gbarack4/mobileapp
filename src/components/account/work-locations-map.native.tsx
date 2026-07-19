import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';

import { colors } from '../../constants/theme';
import type { WorkSuburb } from '../../data/mock-work-locations';
import { getWorkLocationsRegion } from '../../utils/work-locations-map';

type WorkLocationsMapProps = {
  suburbs: WorkSuburb[];
  selectedIds: string[];
  onToggleSuburb: (suburbId: string) => void;
};

const MAP_HEIGHT = 260;

function SuburbLabel({ name, selected }: Readonly<{ name: string; selected: boolean }>) {
  return (
    <View style={[styles.label, selected && styles.labelSelected]}>
      <Text style={[styles.labelText, selected && styles.labelTextSelected]} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

export function WorkLocationsMap({ suburbs, selectedIds, onToggleSuburb }: Readonly<WorkLocationsMapProps>) {
  const mapRef = useRef<MapView>(null);
  const initialRegion = getWorkLocationsRegion(suburbs);

  useEffect(() => {
    if (!mapRef.current || suburbs.length === 0) {
      return;
    }

    mapRef.current.fitToCoordinates(
      suburbs.flatMap((suburb) => suburb.polygon),
      {
        edgePadding: { top: 28, right: 28, bottom: 28, left: 28 },
        animated: false,
      },
    );
  }, [suburbs]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        scrollEnabled
        zoomEnabled
        rotateEnabled={false}
        pitchEnabled={false}
        showsCompass={false}>
        {suburbs.map((suburb) => {
          const selected = selectedIds.includes(suburb.id);

          return (
            <Polygon
              key={suburb.id}
              coordinates={suburb.polygon}
              fillColor={selected ? 'rgba(0, 94, 255, 0.38)' : 'rgba(226, 232, 240, 0.72)'}
              strokeColor={selected ? '#0047cc' : '#94a3b8'}
              strokeWidth={1.5}
              tappable
              onPress={() => onToggleSuburb(suburb.id)}
            />
          );
        })}

        {suburbs.map((suburb) => {
          const selected = selectedIds.includes(suburb.id);

          return (
            <Marker
              key={`${suburb.id}-label`}
              coordinate={suburb.centroid}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              onPress={() => onToggleSuburb(suburb.id)}>
              <SuburbLabel name={suburb.name} selected={selected} />
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: MAP_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#eef2f7',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  label: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    maxWidth: 88,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.45)',
  },
  labelSelected: {
    backgroundColor: colors.primary,
    borderColor: '#0047cc',
  },
  labelText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'center',
  },
  labelTextSelected: {
    color: colors.white,
  },
});
