/**
 * Native Android WebView Bridge Interface for Awaaz AI Studio
 * Facilitates seamless two-way communication between the React Web app and Native Android OS.
 */

declare global {
  interface Window {
    AndroidBridge?: {
      isNativeApp?: () => boolean;
      getAppVersion?: () => string;
      showToast?: (message: string) => void;
      vibrate?: (milliseconds: number) => void;
      shareText?: (text: string, title?: string) => void;
      shareAudio?: (base64Data: string, filename?: string, title?: string) => void;
      saveAudioFile?: (base64Data: string, filename?: string) => boolean;
      hasMicrophonePermission?: () => boolean;
      requestMicrophonePermission?: () => void;
      playNativeAudio?: (base64OrPath: string) => void;
      stopNativeAudio?: () => void;
      openExternalBrowser?: (url: string) => void;
    };
    Android?: {
      isNativeApp?: () => boolean;
      getAppVersion?: () => string;
      showToast?: (message: string) => void;
      vibrate?: (milliseconds: number) => void;
      shareText?: (text: string, title?: string) => void;
      shareAudio?: (base64Data: string, filename?: string, title?: string) => void;
      saveAudioFile?: (base64Data: string, filename?: string) => boolean;
      hasMicrophonePermission?: () => boolean;
      requestMicrophonePermission?: () => void;
      playNativeAudio?: (base64OrPath: string) => void;
      stopNativeAudio?: () => void;
      openExternalBrowser?: (url: string) => void;
    };
    onNativePermissionsResult?: (granted: boolean) => void;
  }
}

function getBridge() {
  if (typeof window === 'undefined') return null;
  return window.AndroidBridge || window.Android || null;
}

/**
 * Returns true if running inside the Awaaz AI Studio Android native APK wrapper.
 */
export function isNativeAndroidApp(): boolean {
  const bridge = getBridge();
  if (bridge && typeof bridge.isNativeApp === 'function') {
    try {
      return bridge.isNativeApp();
    } catch {
      return true;
    }
  }
  return false;
}

/**
 * Displays a native Android Toast notification.
 */
export function showNativeToast(message: string): boolean {
  const bridge = getBridge();
  if (bridge && typeof bridge.showToast === 'function') {
    try {
      bridge.showToast(message);
      return true;
    } catch (err) {
      console.warn('Native toast failed:', err);
    }
  }
  return false;
}

/**
 * Triggers native haptic vibration.
 */
export function triggerNativeHaptic(durationMs = 40): boolean {
  const bridge = getBridge();
  if (bridge && typeof bridge.vibrate === 'function') {
    try {
      bridge.vibrate(durationMs);
      return true;
    } catch (err) {
      console.warn('Native vibrate failed:', err);
    }
  } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(durationMs);
      return true;
    } catch {
      // ignore
    }
  }
  return false;
}

/**
 * Triggers native Android Share Sheet for text or poetry.
 */
export function shareViaNativeOrWeb(text: string, title = 'Awaaz AI Studio'): boolean {
  const bridge = getBridge();
  if (bridge && typeof bridge.shareText === 'function') {
    try {
      bridge.shareText(text, title);
      return true;
    } catch (err) {
      console.warn('Native shareText failed:', err);
    }
  }

  if (typeof navigator !== 'undefined' && navigator.share) {
    navigator.share({ title, text }).catch(() => {});
    return true;
  }

  return false;
}

/**
 * Shares audio file natively via Android Intent.
 */
export function shareNativeAudio(base64Data: string, filename = 'awaaz_audio.wav', title = 'شیئر آواز'): boolean {
  const bridge = getBridge();
  if (bridge && typeof bridge.shareAudio === 'function') {
    try {
      bridge.shareAudio(base64Data, filename, title);
      return true;
    } catch (err) {
      console.warn('Native shareAudio failed:', err);
    }
  }
  return false;
}

/**
 * Saves audio file directly into Android MediaStore / Music / Downloads storage.
 */
export function saveAudioFileToNativeStorage(base64Data: string, filename = 'awaaz_audio.wav'): boolean {
  const bridge = getBridge();
  if (bridge && typeof bridge.saveAudioFile === 'function') {
    try {
      return bridge.saveAudioFile(base64Data, filename);
    } catch (err) {
      console.warn('Native saveAudioFile failed:', err);
    }
  }
  return false;
}

/**
 * Checks if Android microphone permission is granted.
 */
export function hasNativeMicrophonePermission(): boolean {
  const bridge = getBridge();
  if (bridge && typeof bridge.hasMicrophonePermission === 'function') {
    try {
      return bridge.hasMicrophonePermission();
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * Requests native Android microphone permission at runtime.
 */
export function requestNativeMicrophonePermission(): void {
  const bridge = getBridge();
  if (bridge && typeof bridge.requestMicrophonePermission === 'function') {
    try {
      bridge.requestMicrophonePermission();
    } catch (err) {
      console.warn('Native requestMicrophonePermission failed:', err);
    }
  }
}
