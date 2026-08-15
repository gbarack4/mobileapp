export default {
  expo: {
    name: "instructor-hub",
    slug: "instructor-hub",
    version: "1.0.0",
    scheme: "instructorhub",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    backgroundColor: "#005eff",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
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
          image: "./assets/splash.png",
          backgroundColor: "#005eff",
          resizeMode: "contain",
        },
      ],
      "expo-system-ui",
      "react-native-maps",
      "expo-secure-store",
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
