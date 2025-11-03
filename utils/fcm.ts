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

/**
 * Hook to initialize Firebase Cloud Messaging (FCM) for push notifications.
 *
 * This hook should be called once at the app level (in AuthContext) and will:
 * 1. Check if the user has granted notification permissions
 * 2. Register the device for remote notifications (iOS)
 * 3. Obtain and send the FCM token to the backend
 * 4. Set up foreground message listeners
 * 5. Handle FCM token refresh
 * 6. Clean up listeners on unmount/logout
 *
 * The hook respects the authentication lifecycle:
 * - Only initializes when firebaseUser exists
 * - Automatically cleans up when user logs out
 * - Gracefully handles permission denial (logs but doesn't throw errors)
 *
 * @returns void - No return value, side effects only
 */
export const useInitializeFCM = () => {
  const authCtx = useContext(AuthContext);
  const firebaseUser = authCtx?.firebaseUser;

  useEffect(() => {
    console.log("🔔 [FCM] useEffect triggered");
    console.log(
      "🔔 [FCM] firebaseUser:",
      firebaseUser ? `exists (uid: ${firebaseUser.uid})` : "null"
    );
    let unsubForeground: undefined | (() => void);
    let tokenRefreshUnsub: undefined | (() => void);

    // Function to send the FCM token to the backend
    const sendFCMTokenToBackend = async (
      firebaseUID?: string,
      fcmToken?: string
    ) => {
      if (!firebaseUID || !fcmToken) {
        console.warn("⚠️ [FCM] Cannot send token - missing UID or token");
        return;
      }
      try {
        const url = `/api/users/fcm-token/${firebaseUID}`;
        const payload = { fcmToken };
        console.log("📡 [FCM] Sending FCM token to:", url);
        console.log("📦 [FCM] Payload:", {
          fcmToken: `${fcmToken.substring(0, 20)}...`,
        });

        const response = await apiCall(url, "PUT", payload);

        console.log("✅ [FCM] Token registered successfully!");
        console.log("📥 [FCM] Backend response:", JSON.stringify(response));
      } catch (error) {
        console.error("❌ [FCM] Failed to send FCM token:", error);
        if (error instanceof Error) {
          console.error("❌ [FCM] Error message:", error.message);
          console.error("❌ [FCM] Error stack:", error.stack);
        }
      }
    };

    const checkPermission = async (): Promise<boolean> => {
      try {
        console.log(
          `🔍 [FCM] Checking notification permission for ${Platform.OS}...`
        );
        if (Platform.OS === "android") {
          const granted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          console.log(`🔍 [FCM] Android permission check result: ${granted}`);
          return granted;
        } else if (Platform.OS === "ios") {
          const status = await requestPermission(messagingModule);
          const enabled =
            status === AuthorizationStatus.AUTHORIZED ||
            status === AuthorizationStatus.PROVISIONAL;
          console.log(
            `🔍 [FCM] iOS permission status: ${status}, enabled: ${enabled}`
          );
          return enabled;
        }
        console.log("🔍 [FCM] Unknown platform, returning false");
        return false;
      } catch (error) {
        console.error(
          "❌ [FCM] Error checking notification permissions:",
          error
        );
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
        console.log(
          "⚠️ [FCM] Notification permission not granted. Skipping FCM setup."
        );
        return;
      }
      console.log("✅ [FCM] Notification permission granted");

      // Register for iOS remote messages if needed
      await registerForIOSIfNeeded();

      // Get FCM token
      const token = await getToken(messagingModule);
      console.log(
        `🔑 [FCM] Token obtained for ${Platform.OS === "android" ? "Android" : "iOS"}: ${token?.substring(0, 20)}...`
      );
      if (token && firebaseUser?.uid) {
        console.log(
          `📤 [FCM] Attempting to send token to backend for user: ${firebaseUser.uid}`
        );
        try {
          await sendFCMTokenToBackend(firebaseUser.uid, token);
          console.log("✅ [FCM] sendFCMTokenToBackend completed");
        } catch (error) {
          console.error("❌ [FCM] sendFCMTokenToBackend threw error:", error);
        }
      } else {
        console.warn(
          "⚠️ [FCM] Missing token or firebaseUser, skipping backend registration"
        );
        console.warn("⚠️ [FCM] token:", token ? "exists" : "null");
        console.warn("⚠️ [FCM] firebaseUser.uid:", firebaseUser?.uid || "null");
      }

      // Foreground messages
      console.log("🔔 [FCM] Setting up foreground message listener...");
      unsubForeground = onMessage(messagingModule, async (remoteMessage) => {
        console.log("📨 [FCM] Foreground message received:", remoteMessage);
        const title = remoteMessage.notification?.title ?? "Notification";
        const body =
          remoteMessage.notification?.body ?? "You have a new message.";
        Alert.alert(title, body);
      });
      console.log("✅ [FCM] Foreground listener setup complete");

      // Background handler (register at app entry if needed)
      console.log("🔔 [FCM] Setting up background message handler...");
      setBackgroundMessageHandler(messagingModule, async (remoteMessage) => {
        console.log("📨 [FCM] Background message received:", remoteMessage);
      });
      console.log("✅ [FCM] Background handler setup complete");

      // Token refresh
      console.log("🔔 [FCM] Setting up token refresh listener...");
      tokenRefreshUnsub = onTokenRefresh(
        messagingModule,
        async (newToken: string) => {
          console.log(
            "🔄 [FCM] Token refreshed:",
            newToken.substring(0, 20) + "..."
          );
          if (firebaseUser?.uid) {
            await sendFCMTokenToBackend(firebaseUser.uid, newToken);
          }
        }
      );
      console.log("✅ [FCM] Token refresh listener setup complete");

      console.log("🎉 [FCM] Full FCM setup completed successfully!");
    };

    // Only setup FCM if user is authenticated
    if (firebaseUser?.uid) {
      console.log("✅ [FCM] User authenticated, starting FCM setup...");
      setupFCM().catch((error) => {
        console.error("❌ [FCM] Setup failed:", error);
      });
    } else {
      console.log("⏳ [FCM] Waiting for user authentication...");
    }

    // Cleanup function - removes all listeners when component unmounts or user logs out
    return () => {
      console.log("🧹 [FCM] Cleaning up listeners...");
      if (unsubForeground) unsubForeground();
      if (tokenRefreshUnsub) tokenRefreshUnsub();
    };
  }, [firebaseUser]);
};

// Alias for convenience — the hook itself must be named with `use` to satisfy React Hooks rules.
export const initializeFCM = useInitializeFCM;
