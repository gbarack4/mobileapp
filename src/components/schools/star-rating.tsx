import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/theme";

type StarRatingProps = {
  rating: number;
  reviewCount: number;
  variant?: "card" | "detail";
  showReviewCount?: boolean;
};

function formatRating(rating: number) {
  if (Number.isInteger(rating)) {
    return String(rating);
  }

  return rating.toFixed(2).replace(/0$/, "");
}

function StarIcon({
  filled,
  half,
}: Readonly<{ filled: boolean; half: boolean }>) {
  const fillColor = filled || half ? "#facc15" : "transparent";
  const strokeColor = filled || half ? "#facc15" : "#d1d5db";

  return (
    <View style={styles.star}>
      <Text style={[styles.starGlyph, { color: strokeColor }]}>★</Text>
      {filled || half ? (
        <Text
          style={[
            styles.starGlyph,
            styles.starFill,
            { color: fillColor },
            half && styles.starHalf,
          ]}
        >
          ★
        </Text>
      ) : null}
    </View>
  );
}

export function StarRating({
  rating,
  reviewCount,
  variant = "card",
  showReviewCount = true,
}: StarRatingProps) {
  const reviewLabel =
    variant === "detail"
      ? `(${reviewCount} reviews)`
      : `${reviewCount} reviews`;

  return (
    <View style={styles.row}>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = rating >= star;
          const half = !filled && rating >= star - 0.5;

          return <StarIcon key={star} filled={filled} half={half} />;
        })}
      </View>
      <Text style={styles.ratingValue}>{formatRating(rating)}</Text>
      {showReviewCount ? (
        <Text style={styles.reviewCount}>{reviewLabel}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  stars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  star: {
    width: 14,
    height: 14,
    position: "relative",
  },
  starGlyph: {
    fontSize: 14,
    lineHeight: 14,
    position: "absolute",
    left: 0,
    top: 0,
  },
  starFill: {
    overflow: "hidden",
  },
  starHalf: {
    width: 7,
    overflow: "hidden",
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  reviewCount: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
