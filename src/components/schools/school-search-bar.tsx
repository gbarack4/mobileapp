import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SearchIcon } from '../icons/dashboard-icons';
import { colors, spacing } from '../../constants/theme';
import { searchSchools } from '../../services/schools';
import type { School } from '../../types/school';

type SchoolSearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  onSelectSuggestion?: (school: School) => void;
  placeholder?: string;
};

type PressableState = {
  pressed: boolean;
};

const ANDROID_RIPPLE =
  Platform.OS === 'android' ? { color: 'rgba(0, 94, 255, 0.12)' } : undefined;

const SUGGESTION_DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 1;
const MAX_SUGGESTIONS = 6;

function rankByNameSimilarity(schools: School[], query: string): School[] {
  const q = query.trim().toLowerCase();

  return [...schools]
    .map((school) => {
      const name = school.name.toLowerCase();
      let score = 0;

      if (name === q) score = 300;
      else if (name.startsWith(q)) score = 200;
      else if (name.includes(` ${q}`)) score = 150;
      else if (name.includes(q)) score = 100;

      // Prefer shorter names when scores tie (closer match).
      score += Math.max(0, 40 - name.length);

      return { school, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.school.name.localeCompare(b.school.name))
    .slice(0, MAX_SUGGESTIONS)
    .map((item) => item.school);
}

export function SchoolSearchBar({
  value,
  onChangeText,
  onSearch,
  onSelectSuggestion,
  placeholder = 'Enter school name',
}: Readonly<SchoolSearchBarProps>) {
  const [suggestions, setSuggestions] = useState<School[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const requestIdRef = useRef(0);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trimmed = value.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsSuggesting(false);
      setShowSuggestions(false);
      return;
    }

    setIsSuggesting(true);
    const requestId = ++requestIdRef.current;

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const results = await searchSchools(trimmed);
          if (requestId !== requestIdRef.current) {
            return;
          }

          const ranked = rankByNameSimilarity(results, trimmed);
          setSuggestions(ranked);
          setShowSuggestions(true);
        } catch {
          if (requestId !== requestIdRef.current) {
            return;
          }
          setSuggestions([]);
        } finally {
          if (requestId === requestIdRef.current) {
            setIsSuggesting(false);
          }
        }
      })();
    }, SUGGESTION_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [value]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  function handleSelect(school: School) {
    onChangeText(school.name);
    setShowSuggestions(false);
    setSuggestions([]);
    onSelectSuggestion?.(school);
  }

  function handleBlur() {
    // Allow suggestion press to register before closing.
    blurTimeoutRef.current = setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  }

  const shouldShowDropdown =
    showSuggestions && value.trim().length >= MIN_QUERY_LENGTH && (isSuggesting || suggestions.length > 0);

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <SearchIcon />
        <TextInput
          value={value}
          onChangeText={(text) => {
            onChangeText(text);
            setShowSuggestions(true);
          }}
          onSubmitEditing={() => {
            setShowSuggestions(false);
            onSearch();
          }}
          onFocus={() => {
            if (value.trim().length >= MIN_QUERY_LENGTH) {
              setShowSuggestions(true);
            }
          }}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search schools by name"
        />
        {isSuggesting ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />
        ) : null}
        <Pressable
          onPress={() => {
            setShowSuggestions(false);
            onSearch();
          }}
          android_ripple={ANDROID_RIPPLE}
          style={({ pressed }: PressableState) => [styles.searchButton, pressed && styles.pressed]}>
          <Text style={styles.searchButtonText}>Search</Text>
        </Pressable>
      </View>

      {shouldShowDropdown ? (
        <View style={styles.suggestions}>
          {isSuggesting && suggestions.length === 0 ? (
            <Text style={styles.suggestionEmpty}>Finding schools…</Text>
          ) : (
            suggestions.map((school, index) => (
              <Pressable
                key={school.id}
                onPress={() => handleSelect(school)}
                android_ripple={ANDROID_RIPPLE}
                style={({ pressed }: PressableState) => [
                  styles.suggestionRow,
                  index < suggestions.length - 1 && styles.suggestionRowDivider,
                  pressed && styles.pressed,
                ]}>
                <View style={[styles.suggestionAvatar, { backgroundColor: school.avatarColor }]}>
                  <Text style={styles.suggestionAvatarText}>{school.initials}</Text>
                </View>
                <View style={styles.suggestionText}>
                  <Text style={styles.suggestionName} numberOfLines={1}>
                    {school.name}
                  </Text>
                  {school.suburb || school.address ? (
                    <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                      {[school.suburb, school.address].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 20,
    ...(Platform.OS === 'web' ? ({ position: 'relative' } as object) : {}),
  },
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
  spinner: {
    marginRight: 2,
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
  suggestions: {
    marginTop: 6,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eef2f7',
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)' } as object)
      : {
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 4,
        }),
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  suggestionRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eef2f7',
  },
  suggestionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionAvatarText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  suggestionText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  suggestionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  suggestionEmpty: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.88,
  },
});
