import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { SearchIcon } from '../icons/dashboard-icons';
import { colors } from '../../constants/theme';

type SchoolSearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  placeholder?: string;
};

type PressableState = {
  pressed: boolean;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 94, 255, 0.12)' } : undefined;

export function SchoolSearchBar({
  value,
  onChangeText,
  onSearch,
  placeholder = 'Enter suburb or postcode',
}: SchoolSearchBarProps) {
  return (
    <View style={styles.container}>
      <SearchIcon />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSearch}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        accessibilityLabel="Search schools by suburb or postcode"
      />
      <Pressable
        onPress={onSearch}
        android_ripple={ANDROID_RIPPLE}
        style={({ pressed }: PressableState) => [styles.searchButton, pressed && styles.pressed]}>
        <Text style={styles.searchButtonText}>Search</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.inputBackground,
    borderRadius: 14,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 48,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    color: colors.text,
    paddingVertical: Platform.OS === 'web' ? 8 : 0,
    ...(Platform.OS === 'web'
      ? ({ outlineStyle: 'none', width: '100%' } as object)
      : {}),
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 36,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.88,
  },
});
