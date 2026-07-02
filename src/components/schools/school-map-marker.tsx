import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../constants/theme';

type SchoolMapMarkerProps = {
  initials: string;
  color: string;
  selected?: boolean;
};

export function SchoolMapMarker({ initials, color, selected }: SchoolMapMarkerProps) {
  return (
    <View style={[styles.wrapper, selected && styles.wrapperSelected]}>
      <View style={[styles.bubble, { backgroundColor: color }]}>
        <Text style={styles.initials}>{initials}</Text>
      </View>
      <View style={[styles.pointer, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  wrapperSelected: {
    transform: [{ scale: 1.08 }],
  },
  bubble: {
    minWidth: 38,
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  initials: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.3,
  },
  pointer: {
    width: 10,
    height: 10,
    marginTop: -5,
    transform: [{ rotate: '45deg' }],
    borderRadius: 1,
  },
});
