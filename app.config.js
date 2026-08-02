export default {
  expo: {
    name: "instructor-hub",
    slug: "instructor-hub",
    version: "1.0.0",
    scheme: "instructorhub",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "pro.driveinstructor.instructorhub",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
    android: {
      package: "pro.driveinstructor.instructorhub",
      adaptiveIcon: {
        backgroundColor: "#ffffff",
      },
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
          backgroundColor: "#ffffff",
        },
      ],
      "react-native-maps",
      "expo-secure-store",
    ],
    experiments: {
      tsconfigPaths: true,
    },
    extra: {
      eas: {
        projectId: "598440c1-e7be-4572-b192-a7ffcb4ed2b1",
      },
    },
    owner: "driver-apps",
  },
};
