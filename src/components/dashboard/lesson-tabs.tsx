import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../constants/theme';
import type { LessonTab } from '../../types/dashboard';

type LessonTabsProps = {
  activeTab: LessonTab;
  onTabChange: (tab: LessonTab) => void;
};

const TABS: { id: LessonTab; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 94, 255, 0.08)' } : undefined;

export function LessonTabs({ activeTab, onTabChange }: LessonTabsProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const active = activeTab === tab.id;

        return (
          <Pressable
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            android_ripple={ANDROID_RIPPLE}
            style={styles.tab}>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
            {active ? <View style={styles.indicator} /> : <View style={styles.indicatorPlaceholder} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textMuted,
    paddingVertical: 10,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  indicator: {
    width: '100%',
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  indicatorPlaceholder: {
    width: '100%',
    height: 2,
  },
});
