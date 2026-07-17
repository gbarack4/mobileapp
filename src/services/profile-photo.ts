import { Platform } from 'react-native';

const PROFILE_PHOTO_KEY = 'ih_profile_photo_uri';

type Listener = () => void;

let memoryPhotoUri: string | null = null;
const listeners = new Set<Listener>();

function canUseLocalStorage() {
  return Platform.OS === 'web' && typeof localStorage !== 'undefined';
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function getProfilePhotoUri(): string | null {
  if (memoryPhotoUri) {
    return memoryPhotoUri;
  }

  if (canUseLocalStorage()) {
    const stored = localStorage.getItem(PROFILE_PHOTO_KEY);
    // Blob URLs die after navigation/refresh — ignore them if memory is empty.
    if (stored?.startsWith('blob:')) {
      return null;
    }
    memoryPhotoUri = stored;
    return stored;
  }

  return null;
}

export function setProfilePhotoUri(uri: string | null) {
  memoryPhotoUri = uri;

  if (canUseLocalStorage()) {
    if (uri == null || uri.startsWith('blob:')) {
      // Don't persist ephemeral blob URLs — they break after remount.
      if (uri == null) {
        localStorage.removeItem(PROFILE_PHOTO_KEY);
      }
    } else {
      localStorage.setItem(PROFILE_PHOTO_KEY, uri);
    }
  }

  notify();
}

/** Convert a picker URI into something that survives remounts (data URL on web). */
export async function persistProfilePhotoUri(uri: string): Promise<string> {
  if (!uri.startsWith('blob:') && !uri.startsWith('file:')) {
    setProfilePhotoUri(uri);
    return uri;
  }

  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Could not read photo'));
        }
      };
      reader.onerror = () => reject(new Error('Could not read photo'));
      reader.readAsDataURL(blob);
    });

    setProfilePhotoUri(dataUrl);
    return dataUrl;
  } catch {
    setProfilePhotoUri(uri);
    return uri;
  }
}

export function subscribeProfilePhoto(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
