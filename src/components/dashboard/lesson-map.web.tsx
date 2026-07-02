import { StyleSheet, View } from 'react-native';

type LessonMapProps = {
  latitude: number;
  longitude: number;
  locationName: string;
};

const MAP_HEIGHT = 220;

export function LessonMap({ latitude, longitude, locationName }: LessonMapProps) {
  return (
    <View style={styles.webMapContainer}>
      <iframe
        title={`Map for ${locationName}`}
        src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=14&output=embed`}
        style={{
          border: 0,
          width: '100%',
          height: '100%',
        }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  webMapContainer: {
    height: MAP_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
});
