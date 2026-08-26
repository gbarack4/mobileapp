export default {
  expo: {
    name: "instructor-hub",
    slug: "instructor-hub",
    version: "1.0.0",
    scheme: "instructorhub",
    orientation: "portrait",
    userInterfaceStyle: "light",
    backgroundColor: "#005eff",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash-mark.png",
      backgroundColor: "#005eff",
      resizeMode: "contain",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "pro.driveinstructor.instructorhub",
      backgroundColor: "#005eff",
      icon: "./assets/icon.png",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription:
          "Instructor Hub uses your location to show nearby schools and your position on the map.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Instructor Hub uses your location to show nearby schools and your position on the map.",
      },
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
    android: {
      package: "pro.driveinstructor.instructorhub",
      backgroundColor: "#005eff",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#005eff",
      },
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },
    plugins: [
      "expo-router",
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
          iosGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
          androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      ],
      "expo-secure-store",
      "expo-web-browser",
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
    },
    extra: {
      eas: {
        projectId: "598440c1-e7be-4572-b192-a7ffcb4ed2b1",
      },
    },
    owner: "driver-apps",
  },
};
