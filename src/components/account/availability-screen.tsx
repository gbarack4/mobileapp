import { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ChevronLeftIcon, MapPinIcon, SearchIcon } from '../icons/dashboard-icons';
import { colors, spacing } from '../../constants/theme';
import {
  cloneAvailability,
  DAY_LABELS,
  DAY_OF_WEEK_ORDER,
  DAY_SHORT_LABELS,
  DEFAULT_SLOT,
  MOCK_INSTRUCTOR_AVAILABILITY,
  type AvailabilitySlot,
  type DayAvailability,
  type DayOfWeek,
} from '../../data/mock-availability';
import { filterWorkSuburbs } from '../../data/mock-work-locations';
import { openWorkLocationPicker } from '../../utils/availability-location-bridge';
import {
  CheckIcon,
  ClockIcon,
  CopyIcon,
  LocationPinSmallIcon,
  CloseSmallIcon,
  MapLayersIcon,
  TrashIcon,
} from './availability-icons';
import { TimePickerSheet } from './time-picker-sheet';

type AvailabilityScreenProps = {
  onClose: () => void;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 0, 0, 0.06)' } : undefined;

function getDayAvailability(days: DayAvailability[], dayOfWeek: DayOfWeek) {
  return days.find((day) => day.dayOfWeek === dayOfWeek)!;
}

function slotCountLabel(slot: AvailabilitySlot | null) {
  if (!slot) {
    return 'Off';
  }

  return '1 slot';
}

type DaySelectorProps = {
  days: DayAvailability[];
  selectedDay: DayOfWeek;
  onSelectDay: (day: DayOfWeek) => void;
};

function DaySelector({ days, selectedDay, onSelectDay }: Readonly<DaySelectorProps>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.daySelectorContent}>
      {DAY_OF_WEEK_ORDER.map((dayOfWeek) => {
        const day = getDayAvailability(days, dayOfWeek);
        const selected = selectedDay === dayOfWeek;
        const active = Boolean(day.slot);

        return (
          <Pressable
            key={dayOfWeek}
            onPress={() => onSelectDay(dayOfWeek)}
            style={({ pressed }) => [
              styles.dayPill,
              selected && styles.dayPillSelected,
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.dayPillLabel, selected && styles.dayPillLabelSelected]}>
              {DAY_SHORT_LABELS[dayOfWeek]}
            </Text>
            <Text
              style={[
                styles.dayPillMeta,
                selected && styles.dayPillMetaSelected,
                !selected && active && styles.dayPillMetaActive,
              ]}>
              {slotCountLabel(day.slot)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

type SlotCardProps = {
  slot: AvailabilitySlot;
  locationDraft: string;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onLocationDraftChange: (value: string) => void;
  onAddLocation: () => void;
  onSelectLocation: (location: string) => void;
  onRemoveLocation: (location: string) => void;
  onDeleteSlot: () => void;
  onViewMap: () => void;
};

function SlotCard({
  slot,
  locationDraft,
  onStartTimeChange,
  onEndTimeChange,
  onLocationDraftChange,
  onAddLocation,
  onSelectLocation,
  onRemoveLocation,
  onDeleteSlot,
  onViewMap,
}: Readonly<SlotCardProps>) {
  const [activeTimeField, setActiveTimeField] = useState<'start' | 'end' | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suburbSuggestions = useMemo(() => {
    const query = locationDraft.trim();
    if (query.length < 1) {
      return [];
    }

    const selected = new Set(slot.locations.map((location) => location.toLowerCase()));
    return filterWorkSuburbs(query)
      .filter((suburb) => !selected.has(suburb.name.toLowerCase()))
      .slice(0, 6);
  }, [locationDraft, slot.locations]);

  const shouldShowSuggestions =
    showSuggestions && locationDraft.trim().length > 0 && suburbSuggestions.length > 0;

  return (
    <View style={styles.slotCard}>
      <View style={styles.slotCardHeader}>
        <Text style={styles.slotLabel}>SLOT 1</Text>
        <Pressable
          onPress={onDeleteSlot}
          hitSlop={8}
          accessibilityLabel="Delete slot"
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <TrashIcon />
        </Pressable>
      </View>

      <View style={styles.timeRow}>
        <View style={styles.timeField}>
          <View style={styles.fieldLabelRow}>
            <ClockIcon />
            <Text style={styles.fieldLabel}>Start</Text>
          </View>
          <Pressable
            onPress={() => setActiveTimeField('start')}
            android_ripple={ANDROID_RIPPLE}
            style={({ pressed }) => [styles.timeInput, pressed && styles.pressed]}>
            <Text style={styles.timeInputText}>{slot.startTime || '9:00 am'}</Text>
          </Pressable>
        </View>

        <View style={styles.timeField}>
          <View style={styles.fieldLabelRow}>
            <ClockIcon />
            <Text style={styles.fieldLabel}>End</Text>
          </View>
          <Pressable
            onPress={() => setActiveTimeField('end')}
            android_ripple={ANDROID_RIPPLE}
            style={({ pressed }) => [styles.timeInput, pressed && styles.pressed]}>
            <Text style={styles.timeInputText}>{slot.endTime || '12:00 pm'}</Text>
          </Pressable>
        </View>
      </View>

      <TimePickerSheet
        visible={activeTimeField !== null}
        value={activeTimeField === 'end' ? slot.endTime : slot.startTime}
        title={activeTimeField === 'end' ? 'Set end time' : 'Set start time'}
        outputFormat="12h"
        onClose={() => setActiveTimeField(null)}
        onConfirm={(time) => {
          if (activeTimeField === 'end') {
            onEndTimeChange(time);
          } else {
            onStartTimeChange(time);
          }
          setActiveTimeField(null);
        }}
      />

      <View style={styles.locationsSection}>
        <View style={styles.fieldLabelRow}>
          <MapPinIcon size={14} color={colors.textMuted} />
          <Text style={styles.fieldLabel}>Add locations</Text>
        </View>

        <View style={styles.locationSearchWrap}>
          <View style={styles.locationSearchBar}>
            <SearchIcon />
            <TextInput
              value={locationDraft}
              onChangeText={(value) => {
                onLocationDraftChange(value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                // Allow suggestion press to register before closing.
                setTimeout(() => setShowSuggestions(false), 150);
              }}
              placeholder="Enter suburb or postcode"
              placeholderTextColor={colors.textMuted}
              style={styles.locationSearchInput}
              onSubmitEditing={onAddLocation}
              returnKeyType="search"
              autoCapitalize="words"
              autoCorrect={false}
            />
            <Pressable
              onPress={onViewMap}
              android_ripple={ANDROID_RIPPLE}
              style={({ pressed }) => [styles.viewMapButton, pressed && styles.pressed]}>
              <MapLayersIcon />
              <Text style={styles.viewMapButtonText}>View map</Text>
            </Pressable>
          </View>

          {shouldShowSuggestions ? (
            <View style={styles.suggestions}>
              {suburbSuggestions.map((suburb, index) => (
                <Pressable
                  key={suburb.id}
                  onPress={() => {
                    onSelectLocation(suburb.name);
                    setShowSuggestions(false);
                  }}
                  android_ripple={ANDROID_RIPPLE}
                  style={({ pressed }) => [
                    styles.suggestionRow,
                    index < suburbSuggestions.length - 1 && styles.suggestionRowDivider,
                    pressed && styles.pressed,
                  ]}>
                  <LocationPinSmallIcon size={14} />
                  <Text style={styles.suggestionText}>{suburb.name}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        {slot.locations.length > 0 ? (
          <View style={styles.locationTags}>
            {slot.locations.map((location) => (
              <View key={location} style={styles.locationTag}>
                <LocationPinSmallIcon size={12} />
                <Text style={styles.locationTagText}>{location}</Text>
                <Pressable
                  onPress={() => onRemoveLocation(location)}
                  hitSlop={6}
                  accessibilityLabel={`Remove ${location}`}
                  style={({ pressed }) => [styles.tagRemoveButton, pressed && styles.pressed]}>
                  <CloseSmallIcon size={12} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function AvailabilityScreen({ onClose }: Readonly<AvailabilityScreenProps>) {
  const [draftAvailability, setDraftAvailability] = useState(() =>
    cloneAvailability(MOCK_INSTRUCTOR_AVAILABILITY),
  );
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('monday');
  const [locationDraft, setLocationDraft] = useState('');

  const selectedDayData = useMemo(
    () => getDayAvailability(draftAvailability.days, selectedDay),
    [draftAvailability.days, selectedDay],
  );

  function updateDay(dayOfWeek: DayOfWeek, slot: AvailabilitySlot | null) {
    setDraftAvailability((current) => ({
      ...current,
      days: current.days.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, slot } : day,
      ),
    }));
  }

  function updateSelectedSlot(patch: Partial<AvailabilitySlot>) {
    if (!selectedDayData.slot) {
      return;
    }

    updateDay(selectedDay, { ...selectedDayData.slot, ...patch });
  }

  function handleAddLocation() {
    const draft = locationDraft.trim();

    if (!draft || !selectedDayData.slot) {
      return;
    }

    if (
      selectedDayData.slot.locations.some(
        (location) => location.toLowerCase() === draft.toLowerCase(),
      )
    ) {
      setLocationDraft('');
      return;
    }

    updateSelectedSlot({
      locations: [...selectedDayData.slot.locations, draft],
    });
    setLocationDraft('');
  }

  function handleSelectLocation(location: string) {
    if (!selectedDayData.slot) {
      return;
    }

    const alreadyAdded = selectedDayData.slot.locations.some(
      (item) => item.toLowerCase() === location.toLowerCase(),
    );

    if (!alreadyAdded) {
      updateSelectedSlot({
        locations: [...selectedDayData.slot.locations, location],
      });
    }

    setLocationDraft('');
  }

  function handleRemoveLocation(location: string) {
    if (!selectedDayData.slot) {
      return;
    }

    updateSelectedSlot({
      locations: selectedDayData.slot.locations.filter((item) => item !== location),
    });
  }

  function handleDeleteSlot() {
    updateDay(selectedDay, null);
    setLocationDraft('');
  }

  function handleAddSlot() {
    updateDay(selectedDay, {
      ...DEFAULT_SLOT,
      locations: [...DEFAULT_SLOT.locations],
    });
  }

  function handleCopyToAll() {
    if (!selectedDayData.slot) {
      return;
    }

    const template = {
      startTime: selectedDayData.slot.startTime,
      endTime: selectedDayData.slot.endTime,
      locations: [...selectedDayData.slot.locations],
    };

    setDraftAvailability((current) => ({
      ...current,
      days: current.days.map((day) => ({
        ...day,
        slot: { ...template, locations: [...template.locations] },
      })),
    }));
  }

  function handleSave() {
    // TODO: connect to NestJS availability API
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          android_ripple={ANDROID_RIPPLE}
          accessibilityLabel="Back"
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <ChevronLeftIcon size={22} />
        </Pressable>
        <Text style={styles.headerTitle}>Availability</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <DaySelector
          days={draftAvailability.days}
          selectedDay={selectedDay}
          onSelectDay={(day) => {
            setSelectedDay(day);
            setLocationDraft('');
          }}
        />

        <View style={styles.dayHeaderRow}>
          <View style={styles.dayHeaderText}>
            <Text style={styles.dayTitle}>{DAY_LABELS[selectedDay]}</Text>
            <Text style={styles.daySubtitle}>
              {selectedDayData.slot ? '1 time slot' : 'Off'}
            </Text>
          </View>

          {selectedDayData.slot ? (
            <Pressable
              onPress={handleCopyToAll}
              android_ripple={ANDROID_RIPPLE}
              style={({ pressed }) => [styles.copyButton, pressed && styles.pressed]}>
              <CopyIcon />
              <Text style={styles.copyButtonText}>Copy to all</Text>
            </Pressable>
          ) : null}
        </View>

        {selectedDayData.slot ? (
          <SlotCard
            slot={selectedDayData.slot}
            locationDraft={locationDraft}
            onStartTimeChange={(value) => updateSelectedSlot({ startTime: value })}
            onEndTimeChange={(value) => updateSelectedSlot({ endTime: value })}
            onLocationDraftChange={setLocationDraft}
            onAddLocation={handleAddLocation}
            onSelectLocation={handleSelectLocation}
            onRemoveLocation={handleRemoveLocation}
            onDeleteSlot={handleDeleteSlot}
            onViewMap={() => {
              if (!selectedDayData.slot) {
                return;
              }

              openWorkLocationPicker(selectedDayData.slot.locations, (locations) => {
                updateSelectedSlot({ locations });
              });
            }}
          />
        ) : (
          <View style={styles.offDayCard}>
            <Text style={styles.offDayTitle}>No availability set</Text>
            <Text style={styles.offDayText}>
              Add one time slot for {DAY_LABELS[selectedDay]} to start taking bookings.
            </Text>
            <Pressable
              onPress={handleAddSlot}
              android_ripple={ANDROID_RIPPLE}
              style={({ pressed }) => [styles.addSlotButton, pressed && styles.pressed]}>
              <Text style={styles.addSlotButtonText}>Add time slot</Text>
            </Pressable>
          </View>
        )}

      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleSave}
          android_ripple={ANDROID_RIPPLE}
          style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
          <CheckIcon />
          <Text style={styles.saveButtonText}>Save availability</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  daySelectorContent: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  dayPill: {
    minWidth: 58,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 2,
  },
  dayPillSelected: {
    backgroundColor: colors.primary,
  },
  dayPillLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.3,
  },
  dayPillLabelSelected: {
    color: colors.white,
  },
  dayPillMeta: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  dayPillMetaSelected: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  dayPillMetaActive: {
    color: colors.primary,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  dayHeaderText: {
    flex: 1,
    gap: 2,
  },
  dayTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  daySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  slotCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  slotCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timeField: {
    flex: 1,
    gap: spacing.sm,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timeInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    minHeight: 46,
    justifyContent: 'center',
  },
  timeInputText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  locationsSection: {
    gap: spacing.md,
  },
  locationSearchWrap: {
    gap: 6,
    zIndex: 10,
  },
  locationSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 48,
  },
  locationSearchInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: colors.text,
    paddingVertical: Platform.OS === 'web' ? 8 : 0,
    ...(Platform.OS === 'web'
      ? ({ outlineStyle: 'none', width: '100%' } as object)
      : {}),
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 36,
  },
  viewMapButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  suggestions: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eef2f7',
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' } as object)
      : {
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        }),
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  suggestionRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  locationTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#e8f1ff',
    borderRadius: 999,
    paddingVertical: 5,
    paddingLeft: 10,
    paddingRight: 6,
  },
  locationTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    flexShrink: 1,
  },
  tagRemoveButton: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offDayCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    padding: spacing.xl,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  offDayTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  offDayText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  addSlotButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  addSlotButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  pressed: {
    opacity: 0.88,
  },
});
