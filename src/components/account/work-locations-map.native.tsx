import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Polygon, PROVIDER_GOOGLE } from "react-native-maps";

import {
  type WorkSuburb,
} from "../../data/mock-work-locations";
import {
  findSuburbAtPoint,
  getMapFitSuburbs,
  getWorkLocationsRegion,
} from "../../utils/work-locations-map";

type WorkLocationsMapProps = {
  suburbs: WorkSuburb[];
  selectedIds: string[];
  onToggleSuburb: (suburbId: string) => void;
};

const MAP_HEIGHT = 260;

export function WorkLocationsMap({
  suburbs,
  selectedIds,
  onToggleSuburb,
}: Readonly<WorkLocationsMapProps>) {
  const mapRef = useRef<MapView>(null);
  const suburbsRef = useRef(suburbs);
  const onToggleSuburbRef = useRef(onToggleSuburb);
  const initialRegion = getWorkLocationsRegion(suburbs, selectedIds);

  suburbsRef.current = suburbs;
  onToggleSuburbRef.current = onToggleSuburb;

  useEffect(() => {
    if (!mapRef.current || suburbs.length === 0) {
      return;
    }

    mapRef.current.fitToCoordinates(
      getMapFitSuburbs(suburbs, selectedIds).flatMap((suburb) => suburb.polygon),
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
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        scrollEnabled
        zoomEnabled
        rotateEnabled={false}
        pitchEnabled={false}
        showsCompass={false}
        onPress={(event) => {
          const { latitude, longitude } = event.nativeEvent.coordinate;
          const hit = findSuburbAtPoint(
            { latitude, longitude },
            suburbsRef.current,
          );

          if (hit) {
            onToggleSuburbRef.current(hit.id);
          }
        }}
      >
        {suburbs.map((suburb) => {
          const selected = selectedIds.includes(suburb.id);

          return (
            <Polygon
              key={`${suburb.id}-${selected ? "on" : "off"}`}
              coordinates={suburb.polygon}
              fillColor={
                selected
                  ? "rgba(0, 94, 255, 0.45)"
                  : "rgba(253, 230, 138, 0.55)"
              }
              strokeColor={selected ? "#0047cc" : "transparent"}
              strokeWidth={selected ? 2 : 0}
              tappable
              zIndex={selected ? 2 : 1}
              onPress={() => onToggleSuburb(suburb.id)}
            />
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
    overflow: "hidden",
    backgroundColor: "#eef2f7",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  map: {
    width: "100%",
    height: "100%",
  },
});
