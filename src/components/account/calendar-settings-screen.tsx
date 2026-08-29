import { useAuth } from "@clerk/clerk-expo";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ChevronLeftIcon, ChevronRightIcon } from "../icons/dashboard-icons";
import { colors, spacing } from "../../constants/theme";
import {
  formatBreakTimeLabel,
  getCalendarSettings,
  loadCalendarSettingsFromApi,
  saveCalendarSettingsToApi,
  setCalendarSettings,
  subscribeCalendarSettings,
  type CalendarSettings,
} from "../../services/calendar-settings";
import { LightningIcon } from "./availability-icons";
import { BlueToggle } from "./blue-toggle";
import { DynamicSchedulingInfoDialog } from "./dynamic-scheduling-info-dialog";
import { TimePickerSheet } from "./time-picker-sheet";

type CalendarSettingsScreenProps = {
  onClose: () => void;
};

const ANDROID_RIPPLE =
  Platform.OS === "android" ? { color: "rgba(0, 0, 0, 0.06)" } : undefined;

const TRAVEL_OPTIONS = [15, 20, 30, 45, 60] as const;
const BREAK_OPTIONS = [0, 10, 15, 20, 30] as const;
const SAVE_DEBOUNCE_MS = 400;

function isValidTime(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return false;
  }

  const [hours, minutes] = value.split(":").map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function formatMinutes(minutes: number) {
  if (minutes === 0) {
    return "None";
  }

  return `${minutes} min`;
}

type PillOptionProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function PillOption({ label, selected, onPress }: Readonly<PillOptionProps>) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={ANDROID_RIPPLE}
      style={({ pressed }) => [
        styles.pill,
        selected && styles.pillSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function CalendarSettingsScreen({
  onClose,
}: Readonly<CalendarSettingsScreenProps>) {
  const { getToken } = useAuth();
  const [settings, setSettings] = useState<CalendarSettings>(() =>
    getCalendarSettings(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [dynamicInfoOpen, setDynamicInfoOpen] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPatchRef = useRef<Partial<CalendarSettings>>({});

  useEffect(() => {
    return subscribeCalendarSettings(() => {
      setSettings(getCalendarSettings());
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setSaveError(null);
      try {
        await loadCalendarSettingsFromApi(getToken);
        if (!cancelled) {
          setSettings(getCalendarSettings());
        }
      } catch (error) {
        console.error("Failed to load calendar settings:", error);
        if (!cancelled) {
          setSaveError("Couldn’t load settings from the server.");
          setSettings(getCalendarSettings());
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [getToken]);

  function queueSave(patch: Partial<CalendarSettings>) {
    pendingPatchRef.current = {
      ...pendingPatchRef.current,
      ...patch,
    };

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      const nextPatch = pendingPatchRef.current;
      pendingPatchRef.current = {};
      void persistSettings(nextPatch);
    }, SAVE_DEBOUNCE_MS);
  }

  async function persistSettings(patch: Partial<CalendarSettings>) {
    setIsSaving(true);
    setSaveError(null);

    try {
      // Dynamic scheduling is UI-only for now — keep it local and still sync
      // travel/break fields to the live availability API.
      if (
        Object.keys(patch).length === 1 &&
        Object.prototype.hasOwnProperty.call(patch, "dynamicScheduling")
      ) {
        setCalendarSettings(patch);
        setSettings(getCalendarSettings());
        return;
      }

      await saveCalendarSettingsToApi(getToken, patch);
      setSettings(getCalendarSettings());
    } catch (error) {
      console.error("Failed to save calendar settings:", error);
      setSaveError("Couldn’t save settings. Try again.");
      try {
        await loadCalendarSettingsFromApi(getToken);
        setSettings(getCalendarSettings());
      } catch {
        // keep current UI state
      }
    } finally {
      setIsSaving(false);
    }
  }

  function updateSetting<K extends keyof CalendarSettings>(
    key: K,
    value: CalendarSettings[K],
  ) {
    const patch = { [key]: value } as Partial<CalendarSettings>;
    setCalendarSettings(patch);
    setSettings(getCalendarSettings());
    queueSave(patch);
  }

  const breaksEnabled = settings.breakMinutes > 0;
  const hasBreakTime = Boolean(
    settings.breakStartTime && isValidTime(settings.breakStartTime),
  );

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading calendar settings…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          android_ripple={ANDROID_RIPPLE}
          accessibilityLabel="Back"
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <ChevronLeftIcon size={22} />
        </Pressable>

        <Text style={styles.headerTitle}>Calendar settings</Text>
        <View style={styles.headerSpacer}>
          {isSaving ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.description}>
          Set buffers between lessons so your schedule stays realistic. These
          settings sync with your live availability.
        </Text>

        {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Travel time</Text>
            <Text style={styles.cardValue}>
              {formatMinutes(settings.travelTimeMinutes)}
            </Text>
          </View>
          <Text style={styles.cardBody}>
            Time blocked before and after lessons for driving between jobs.
          </Text>
          <View style={styles.pillRow}>
            {TRAVEL_OPTIONS.map((option) => (
              <PillOption
                key={option}
                label={formatMinutes(option)}
                selected={settings.travelTimeMinutes === option}
                onPress={() => updateSetting("travelTimeMinutes", option)}
              />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Breaks</Text>
            <Text style={styles.cardValue}>
              {formatMinutes(settings.breakMinutes)}
            </Text>
          </View>
          <Text style={styles.cardBody}>
            Choose how long your break is, and when it should be kept free in
            your calendar.
          </Text>

          <Text style={styles.fieldLabel}>Duration</Text>
          <View style={styles.pillRow}>
            {BREAK_OPTIONS.map((option) => (
              <PillOption
                key={option}
                label={formatMinutes(option)}
                selected={settings.breakMinutes === option}
                onPress={() => updateSetting("breakMinutes", option)}
              />
            ))}
          </View>

          {breaksEnabled ? (
            <>
              <Text style={styles.fieldLabel}>Break starts at</Text>
              <Pressable
                onPress={() => setTimePickerOpen(true)}
                android_ripple={ANDROID_RIPPLE}
                style={({ pressed }) => [
                  styles.timeButton,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.timeButtonTextWrap}>
                  <Text
                    style={[
                      styles.timeButtonValue,
                      !hasBreakTime && styles.timeButtonPlaceholder,
                    ]}
                  >
                    {hasBreakTime
                      ? formatBreakTimeLabel(settings.breakStartTime)
                      : "Set break time"}
                  </Text>
                  <Text style={styles.timeButtonHint}>
                    Tap to choose hour and minutes
                  </Text>
                </View>
                <ChevronRightIcon size={18} color={colors.textMuted} />
              </Pressable>
              <Text style={styles.helperText}>
                {hasBreakTime
                  ? `${formatMinutes(settings.breakMinutes)} break starting at ${formatBreakTimeLabel(settings.breakStartTime)}.`
                  : "Open the time picker to set when your break starts."}
              </Text>
            </>
          ) : null}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Your buffers</Text>
          <Text style={styles.summaryValue}>
            {settings.travelTimeMinutes + settings.breakMinutes} min combined
          </Text>
          <Text style={styles.summaryDetail}>
            {formatMinutes(settings.travelTimeMinutes)} travel
            {breaksEnabled
              ? hasBreakTime
                ? ` · ${formatMinutes(settings.breakMinutes)} break at ${formatBreakTimeLabel(settings.breakStartTime)}`
                : ` · ${formatMinutes(settings.breakMinutes)} break (set a start time)`
              : " · no break"}
          </Text>
        </View>

        <View style={styles.dynamicCard}>
          <View style={styles.dynamicIconWrap}>
            <LightningIcon />
          </View>

          <View style={styles.dynamicText}>
            <Text style={styles.dynamicTitle}>Dynamic Scheduling</Text>
            <Text style={styles.dynamicSubtitle}>
              Auto-adjust slots based on demand
            </Text>
          </View>

          <BlueToggle
            value={settings.dynamicScheduling}
            onValueChange={(enabled) => {
              updateSetting("dynamicScheduling", enabled);
              if (enabled) {
                setDynamicInfoOpen(true);
              }
            }}
            accessibilityLabel="Dynamic Scheduling"
          />
        </View>
      </ScrollView>

      <TimePickerSheet
        visible={timePickerOpen}
        value={settings.breakStartTime}
        title="Set break time"
        onClose={() => setTimePickerOpen(false)}
        onConfirm={(time) => {
          updateSetting("breakStartTime", time);
          setTimePickerOpen(false);
        }}
      />

      <DynamicSchedulingInfoDialog
        visible={dynamicInfoOpen}
        travelTimeMinutes={settings.travelTimeMinutes}
        onClose={() => setDynamicInfoOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  headerSpacer: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.error,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginTop: spacing.xs,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pill: {
    minWidth: 72,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#f9f9f9",
    alignItems: "center",
  },
  pillSelected: {
    backgroundColor: colors.primary,
  },
  pillText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  pillTextSelected: {
    color: colors.white,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 64,
  },
  timeButtonTextWrap: {
    flex: 1,
    gap: 2,
  },
  timeButtonValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  timeButtonPlaceholder: {
    color: colors.textMuted,
    fontWeight: "600",
  },
  timeButtonHint: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  summaryCard: {
    borderRadius: 16,
    padding: spacing.lg,
    gap: 4,
    backgroundColor: "#f9f9f9",
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
  },
  summaryDetail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  dynamicCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: spacing.lg,
  },
  dynamicIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#fff7ed",
    alignItems: "center",
    justifyContent: "center",
  },
  dynamicText: {
    flex: 1,
    gap: 2,
  },
  dynamicTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  dynamicSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  pressed: {
    opacity: 0.85,
  },
});
