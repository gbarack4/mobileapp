import { Image, StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/theme";
import type { School } from "../../types/school";
import { getSchoolUIData } from "../../utils/school-ui";

type SchoolMapMarkerProps = {
  school: School;
  selected?: boolean;
};

export function SchoolMapMarker({
  school,
  selected = false,
}: Readonly<SchoolMapMarkerProps>) {
  const ui = getSchoolUIData(school);
  const color = ui.avatarColor;

  return (
    <View style={[styles.wrapper, selected && styles.wrapperSelected]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: color,
            borderColor: selected ? color : colors.white,
          },
          selected && styles.bubbleSelected,
        ]}
      >
        {school.logoUrl ? (
          <Image
            source={{ uri: school.logoUrl }}
            style={styles.logo}
            resizeMode="cover"
          />
        ) : (
          <>
            <View style={styles.innerGlow} />
            <Text style={styles.initials}>{ui.initials.slice(0, 3)}</Text>
          </>
        )}
      </View>
      <View style={[styles.pointer, { borderTopColor: color }]} />
      <View style={styles.groundShadow} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  wrapperSelected: {
    transform: [{ scale: 1.1 }],
  },
  bubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: colors.white,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },
  bubbleSelected: {
    borderWidth: 3,
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  innerGlow: {
    ...StyleSheet.absoluteFill,
    margin: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  initials: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 0.4,
  },
  pointer: {
    width: 0,
    height: 0,
    marginTop: -1,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  groundShadow: {
    width: 12,
    height: 6,
    marginTop: 2,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.2)",
  },
});
