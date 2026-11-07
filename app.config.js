const iosGoogleMapsApiKey =
  typeof process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY === "string"
    ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY.trim()
    : "";
const androidGoogleMapsApiKey =
  typeof process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY === "string"
    ? process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY.trim()
    : "";
const hasGoogleMapsApiKey =
  iosGoogleMapsApiKey.length > 0 || androidGoogleMapsApiKey.length > 0;

if (
  !hasGoogleMapsApiKey &&
  (process.env.NODE_ENV !== "production" ||
    process.env.EXPO_PUBLIC_ENABLE_DEBUG_INGEST === "true")
) {
  console.warn(
    "[Maps:app.config] EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY / EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY are missing. Native Google Maps tiles will not load until they are set for the native build.",
  );
}

export default {
  expo: {
    name: "instructor-hub",
    slug: "instructor-hub",
    version: "1.0.0",
    scheme: "instructorhub",
    orientation: "portrait",
    userInterfaceStyle: "light",
    backgroundColor: "#ffffff",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash-mark.png",
      backgroundColor: "#005eff",
      resizeMode: "contain",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "pro.driveinstructor.instructorhub",
      backgroundColor: "#ffffff",
      icon: "./assets/icon.png",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryUsageDescription:
          "Instructor Hub uses your photo library so you can upload a profile photo.",
        NSLocationWhenInUseUsageDescription:
          "Instructor Hub uses your location to show nearby schools and your position on the map.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Instructor Hub uses your location to show nearby schools and your position on the map.",
      },
      config: {
        googleMapsApiKey: iosGoogleMapsApiKey || undefined,
      },
    },
    android: {
      package: "pro.driveinstructor.instructorhub",
      backgroundColor: "#ffffff",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#005eff",
      },
      permissions: [
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
      ],
      config: {
        googleMaps: {
          apiKey: androidGoogleMapsApiKey || undefined,
        },
      },
    },
    plugins: [
      "expo-router",
      "expo-asset",
      [
        "expo-splash-screen",
        {
          image: "./assets/splash-mark.png",
          backgroundColor: "#005eff",
          resizeMode: "contain",
        },
      ],
      "expo-system-ui",
      [
        "react-native-maps",
        {
          // Required for PROVIDER_GOOGLE on iOS: enables Google Maps pods +
          // GMSServices.provideAPIKey in AppDelegate. ios.config.googleMapsApiKey
          // alone is not enough for this plugin.
          iosGoogleMapsApiKey: iosGoogleMapsApiKey || undefined,
          androidGoogleMapsApiKey: androidGoogleMapsApiKey || undefined,
        },
      ],
      "expo-secure-store",
      "expo-web-browser",
      [
        "expo-image-picker",
        {
          photosPermission:
            "Instructor Hub uses your photo library so you can upload a profile photo.",
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Instructor Hub uses your location to show nearby schools and your position on the map.",
        },
      ],
    ],
    experiments: {
      tsconfigPaths: true,
    },
    web: {
      favicon: "./public/favicon.png",
      backgroundColor: "#ffffff",
      themeColor: "#ffffff",
    },
    extra: {
      eas: {
        projectId: "598440c1-e7be-4572-b192-a7ffcb4ed2b1",
      },
      // Boolean only — never put the API key in extra.
      hasGoogleMapsApiKey,
    },
    owner: "driver-apps",
  },
};
