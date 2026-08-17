import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ChevronLeftIcon } from "../icons/dashboard-icons";
import { colors, spacing } from "../../constants/theme";
import {
  MOCK_WORK_SUBURBS,
  suburbIdsToNames,
  suburbNamesToIds,
} from "../../data/mock-work-locations";
import {
  clearWorkLocationBridge,
  getWorkLocationBridge,
} from "../../utils/availability-location-bridge";
import { CloseSmallIcon } from "./availability-icons";
import { InfoCircleIcon } from "./work-locations-icons";
import { WorkLocationsMap } from "./work-locations-map";

type SelectWorkLocationsScreenProps = {
  onClose: () => void;
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 0, 0, 0.06)" } : undefined;

const CONFIRM_DELAY_MS = 2000;

function LegendItem({
  color,
  label,
}: Readonly<{ color: string; label: string }>) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

export function SelectWorkLocationsScreen({
  onClose,
}: Readonly<SelectWorkLocationsScreenProps>) {
  const bridge = getWorkLocationBridge();
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    bridge ? suburbNamesToIds(bridge.initialLocations) : [],
  );
  const [confirming, setConfirming] = useState(false);

  const selectedNames = useMemo(
    () => suburbIdsToNames(selectedIds),
    [selectedIds],
  );

  function toggleSuburb(suburbId: string) {
    if (confirming) {
      return;
    }

    setSelectedIds((current) =>
      current.includes(suburbId)
        ? current.filter((id) => id !== suburbId)
        : [...current, suburbId],
    );
  }

  function handleClearAll() {
    if (confirming) {
      return;
    }

    setSelectedIds([]);
  }

  function handleConfirm() {
    if (confirming) {
      return;
    }

    const names = suburbIdsToNames(selectedIds);
    setConfirming(true);

    setTimeout(() => {
      bridge?.onConfirm(names);
      clearWorkLocationBridge();
      onClose();
    }, CONFIRM_DELAY_MS);
  }

  function handleBack() {
    if (confirming) {
      return;
    }

    clearWorkLocationBridge();
    onClose();
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          android_ripple={ANDROID_RIPPLE}
          accessibilityLabel="Back"
          style={({ pressed }) => [
            styles.headerIconButton,
            pressed && styles.pressed,
          ]}
        >
          <ChevronLeftIcon size={22} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Select Work Locations</Text>
          <Text style={styles.headerSubtitle}>
            Choose the suburbs you want to work in for this day.
          </Text>
        </View>

        <Pressable
          hitSlop={8}
          android_ripple={ANDROID_RIPPLE}
          accessibilityLabel="Info"
          style={({ pressed }) => [
            styles.headerIconButton,
            pressed && styles.pressed,
          ]}
        >
          <InfoCircleIcon />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.legendRow}>
          <LegendItem color="#fde68a" label="Not selected" />
          <LegendItem color={colors.primary} label="Selected" />
        </View>

        <WorkLocationsMap
          suburbs={MOCK_WORK_SUBURBS}
          selectedIds={selectedIds}
          onToggleSuburb={toggleSuburb}
        />

        {selectedIds.length > 0 ? (
          <View style={styles.selectedSection}>
            <View style={styles.selectedHeader}>
              <Text style={styles.selectedTitle}>
                Selected suburbs ({selectedIds.length})
              </Text>
              <Pressable
                onPress={handleClearAll}
                android_ripple={ANDROID_RIPPLE}
                style={({ pressed }) => [
                  styles.clearAllButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.clearAllText}>Clear all</Text>
              </Pressable>
            </View>

            <View style={styles.chipRow}>
              {selectedNames.map((name) => (
                <View key={name} style={styles.chip}>
                  <Text style={styles.chipText}>{name}</Text>
                  <Pressable
                    onPress={() => {
                      const suburb = MOCK_WORK_SUBURBS.find(
                        (item) => item.name === name,
                      );
                      if (suburb) {
                        toggleSuburb(suburb.id);
                      }
                    }}
                    hitSlop={6}
                    style={({ pressed }) => [
                      styles.chipRemove,
                      pressed && styles.pressed,
                    ]}
                  >
                    <CloseSmallIcon size={12} color={colors.white} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleConfirm}
          disabled={confirming}
          android_ripple={ANDROID_RIPPLE}
          style={({ pressed }) => [
            styles.confirmButton,
            pressed && !confirming && styles.pressed,
            confirming && styles.confirmButtonDisabled,
          ]}
        >
          {confirming ? (
            <View style={styles.confirmingRow}>
              <ActivityIndicator color={colors.white} />
              <Text style={styles.confirmButtonText}>Confirming...</Text>
            </View>
          ) : (
            <Text style={styles.confirmButtonText}>Confirm Locations</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  headerText: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  legendRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  selectedSection: {
    gap: spacing.md,
  },
  selectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  clearAllButton: {
    paddingVertical: 4,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 5,
    paddingLeft: 10,
    paddingRight: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
  },
  chipRemove: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  confirmButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonDisabled: {
    opacity: 0.88,
  },
  confirmingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
  pressed: {
    opacity: 0.88,
  },
});
