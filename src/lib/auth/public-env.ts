import Constants from "expo-constants";

type CognitoExtra = {
  region?: string;
  userPoolId?: string;
  clientId?: string;
  domain?: string;
};

function extraCognito(): CognitoExtra {
  const value = Constants.expoConfig?.extra?.cognito;

  if (typeof value !== "object" || value === null) {
    return {};
  }

  return value as CognitoExtra;
}

function firstPresent(...values: Array<string | undefined>) {
  for (const value of values) {
    const trimmed = value?.trim();

    if (trimmed) {
      return trimmed;
    }
  }

  return "";
}

export function readCognitoPublicEnv() {
  const extra = extraCognito();

  return {
    region: firstPresent(
      process.env.EXPO_PUBLIC_COGNITO_REGION,
      extra.region,
    ),
    userPoolId: firstPresent(
      process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID,
      extra.userPoolId,
    ),
    clientId: firstPresent(
      process.env.EXPO_PUBLIC_COGNITO_INSTRUCTOR_CLIENT_ID,
      extra.clientId,
    ),
    domain: firstPresent(
      process.env.EXPO_PUBLIC_COGNITO_DOMAIN,
      extra.domain,
    ),
  };
}
