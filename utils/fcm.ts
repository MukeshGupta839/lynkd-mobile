// Migrated to React Native Firebase v22+ modular API to avoid namespaced/deprecated
// methods (see https://rnfirebase.io/migrating-to-v22). Use getMessaging(getApp())
// and modular functions instead of the old `messaging()` namespaced API.
import { getApp } from "@react-native-firebase/app";
import {
  AuthorizationStatus,
  FirebaseMessagingTypes,
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  requestPermission,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";
import { useContext, useEffect } from "react";
import { Alert, PermissionsAndroid, Platform } from "react-native";
import { AuthContext } from "../context/AuthContext";
import { apiCall } from "../lib/api/apiService";

// Messaging module instance used by modular APIs
const messagingModule = getMessaging(getApp());

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
    const status = await requestPermission(messagingModule);
    const enabled =
      status === AuthorizationStatus.AUTHORIZED ||
      status === AuthorizationStatus.PROVISIONAL;
    if (!enabled) return null;

    // 2) VERY IMPORTANT: register for remote notifications before getToken()
    await registerDeviceForRemoteMessages(messagingModule);
  } else {
    const ok = await requestAndroidPostNotifications();
    if (!ok) return null;
  }

  // 3) Get the FCM device token
  const token = await getToken(messagingModule);
  // 4) Track refresh
  onTokenRefresh(messagingModule, (t: string) => {
    console.log("[FCM] token refreshed:", t);
    // send to backend if needed
  });
  return token ?? null;
}

export function attachForegroundListener(
  onMessageHandler?: (msg: FirebaseMessagingTypes.RemoteMessage) => void
) {
  // Called when app is in foreground
  return onMessage(messagingModule, async (remoteMessage) => {
    console.log("[FCM] foreground:", remoteMessage);
    onMessageHandler?.(remoteMessage);
  });
}

export function registerBackgroundHandler() {
  // Put this once at process entry (index.js)
  setBackgroundMessageHandler(messagingModule, async (remoteMessage) => {
    console.log("[FCM] background:", remoteMessage);
  });
}

export const useInitializeFCM = () => {
  const authCtx = useContext(AuthContext);
  const firebaseUser = authCtx?.firebaseUser;

  useEffect(() => {
    let unsubForeground: undefined | (() => void);
    let tokenRefreshUnsub: undefined | (() => void);

    // Function to send the FCM token to the backend
    const sendFCMTokenToBackend = async (
      firebaseUID?: string,
      fcmToken?: string
    ) => {
      if (!firebaseUID || !fcmToken) return;
      try {
        const url = `/api/users/fcm-token/${firebaseUID}`;
        const payload = { fcmToken };
        console.log("Sending FCM token to:", url);
        const response = await apiCall(url, "PUT", payload);
        console.log("FCM Token registered successfully:", response);
      } catch (error) {
        console.error("Failed to send FCM token:", error);
      }
    };

    const checkPermission = async (): Promise<boolean> => {
      try {
        if (Platform.OS === "android") {
          const granted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          return granted;
        } else if (Platform.OS === "ios") {
          const status = await requestPermission(messagingModule);
          const enabled =
            status === AuthorizationStatus.AUTHORIZED ||
            status === AuthorizationStatus.PROVISIONAL;
          return enabled;
        }
        return false;
      } catch (error) {
        console.error("Error checking notification permissions:", error);
        return false;
      }
    };

    const registerForIOSIfNeeded = async (): Promise<void> => {
      if (Platform.OS === "ios") {
        try {
          await registerDeviceForRemoteMessages(messagingModule);
        } catch (error) {
          console.error("Error registering for iOS remote messages:", error);
        }
      }
    };

    const setupFCM = async () => {
      // Check if permission is granted (permissions are requested at app startup)
      const permissionGranted = await checkPermission();
      if (!permissionGranted) {
        console.log("Notification permission not granted. Skipping FCM setup.");
        return;
      }

      // Register for iOS remote messages if needed
      await registerForIOSIfNeeded();

      // Get FCM token
      const token = await getToken(messagingModule);
      console.log(
        `FCM Token ${Platform.OS === "android" ? "Android" : "iOS"}: ${token}`
      );
      if (token && firebaseUser?.uid) {
        await sendFCMTokenToBackend(firebaseUser.uid, token);
      }

      // Foreground messages
      unsubForeground = onMessage(messagingModule, async (remoteMessage) => {
        console.log("FCM Message Data:", remoteMessage);
        const title = remoteMessage.notification?.title ?? "Notification";
        const body =
          remoteMessage.notification?.body ?? "You have a new message.";
        Alert.alert(title, body);
      });

      // Background handler (register at app entry if needed)
      setBackgroundMessageHandler(messagingModule, async (remoteMessage) => {
        console.log("FCM Background Message:", remoteMessage);
      });

      // Token refresh
      tokenRefreshUnsub = onTokenRefresh(
        messagingModule,
        async (newToken: string) => {
          console.log("[FCM] token refreshed:", newToken);
          if (firebaseUser?.uid) {
            await sendFCMTokenToBackend(firebaseUser.uid, newToken);
          }
        }
      );
    };

    setupFCM();

    return () => {
      if (unsubForeground) unsubForeground();
      if (tokenRefreshUnsub) tokenRefreshUnsub();
    };
  }, [firebaseUser]);
};

// Alias for convenience — the hook itself must be named with `use` to satisfy React Hooks rules.
export const initializeFCM = useInitializeFCM;
