import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import {
  getOAuthConfig,
  NATIVE_OAUTH_LOGOUT_URI,
  oauthError,
} from "./oauth-config";

export async function logoutOAuthBrowserSession(): Promise<void> {
  const { domain, clientId } = getOAuthConfig();
  const redirectUri =
    Platform.OS === "web"
      ? `${window.location.origin}/login`
      : NATIVE_OAUTH_LOGOUT_URI;
  const query = new URLSearchParams({
    client_id: clientId,
    logout_uri: redirectUri,
  });
  const url = `${domain}/logout?${query.toString()}`;
  if (Platform.OS === "web") {
    window.location.assign(url);
    return;
  }
  const response = await WebBrowser.openAuthSessionAsync(url, redirectUri);
  if (response.type !== "success")
    throw oauthError("OAuthLogoutCancelledError");
}
