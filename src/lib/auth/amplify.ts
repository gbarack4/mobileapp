import { loadGetRandomValues } from "@aws-amplify/react-native";
import { Amplify } from "aws-amplify";

import { readCognitoPublicEnv } from "./public-env";

loadGetRandomValues();

let configured = false;

export function getCognitoPublicConfig() {
  const { region, userPoolId, clientId } = readCognitoPublicEnv();

  if (!region) {
    throw new Error("EXPO_PUBLIC_COGNITO_REGION is not configured");
  }

  if (!userPoolId) {
    throw new Error("EXPO_PUBLIC_COGNITO_USER_POOL_ID is not configured");
  }

  if (!clientId) {
    throw new Error("EXPO_PUBLIC_COGNITO_INSTRUCTOR_CLIENT_ID is not configured");
  }

  return { region, userPoolId, userPoolClientId: clientId };
}

export function ensureAmplifyConfigured() {
  if (configured) {
    return;
  }

  const { userPoolId, userPoolClientId } = getCognitoPublicConfig();

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        loginWith: {
          email: true,
        },
        signUpVerificationMethod: "code",
      },
    },
  });

  configured = true;
}
