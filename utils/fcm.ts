import messaging from "@react-native-firebase/messaging";
import { PermissionsAndroid, Platform } from "react-native";

async function requestAndroidPostNotifications(): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  try {
    // On Android 13+ (API 33) this is a runtime prompt. On older versions it will no-op.
    const res = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    return res === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return true;
  }
}

export async function askNotificationPermissionAndGetFcmToken(): Promise<
  string | null
> {
  if (Platform.OS === "ios") {
    // 1) Ask user
    const status = await messaging().requestPermission();
    const enabled =
      status === messaging.AuthorizationStatus.AUTHORIZED ||
      status === messaging.AuthorizationStatus.PROVISIONAL;
    if (!enabled) return null;

    // 2) VERY IMPORTANT: register for remote notifications before getToken()
    await messaging().registerDeviceForRemoteMessages();
  } else {
    const ok = await requestAndroidPostNotifications();
    if (!ok) return null;
  }

  // 3) Get the FCM device token
  const token = await messaging().getToken();
  // 4) Track refresh
  messaging().onTokenRefresh((t) => {
    console.log("[FCM] token refreshed:", t);
    // send to backend if needed
  });
  return token ?? null;
}

export function attachForegroundListener(onMessage?: (msg: any) => void) {
  // Called when app is in foreground
  return messaging().onMessage(async (remoteMessage) => {
    console.log("[FCM] foreground:", remoteMessage);
    onMessage?.(remoteMessage);
  });
}

export function registerBackgroundHandler() {
  // Put this once at process entry (index.js)
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log("[FCM] background:", remoteMessage);
  });
}
