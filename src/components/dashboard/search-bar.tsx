import { useState } from "react";
import { Platform, StyleSheet, TextInput, View } from "react-native";

import { SearchIcon } from "../icons/dashboard-icons";
import { colors } from "../../constants/theme";

type SearchBarProps = {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search by name, email, number",
}: Readonly<SearchBarProps>) {
  const [internalQuery, setInternalQuery] = useState("");
  const isControlled = value !== undefined;
  const query = isControlled ? value : internalQuery;

  function handleChangeText(text: string) {
    if (!isControlled) {
      setInternalQuery(text);
    }

    onChangeText?.(text);
  }

  return (
    <View style={styles.container}>
      <SearchIcon />
      <TextInput
        value={query}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        returnKeyType="search"
        accessibilityLabel="Search by name, email, number"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 14,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    color: colors.text,
    paddingVertical: Platform.OS === "web" ? 12 : 0,
    ...(Platform.OS === "web"
      ? ({ outlineStyle: "none", width: "100%" } as object)
      : {}),
  },
});
