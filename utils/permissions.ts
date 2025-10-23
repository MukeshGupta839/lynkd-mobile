import { getApp } from "@react-native-firebase/app";
import {
  AuthorizationStatus,
  getMessaging,
  registerDeviceForRemoteMessages,
  requestPermission,
} from "@react-native-firebase/messaging";
import { Camera } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import { PermissionsAndroid, Platform } from "react-native";

const messagingModule = getMessaging(getApp());

/**
 * Request all app permissions at startup
 * This includes:
 * - Camera
 * - Media Library (Photos/Videos)
 * - Push Notifications
 * - Tracking (iOS)
 * - Location (Android - for notifications)
 */
export async function requestAllPermissions(): Promise<void> {
  try {
    console.log("🔐 Requesting all app permissions...");

    // 1. Request tracking permissions (iOS only)
    if (Platform.OS === "ios") {
      try {
        const { status } = await requestTrackingPermissionsAsync();
        if (status === "granted") {
          console.log("✅ Tracking permission granted");
        } else {
          console.log("❌ Tracking permission denied");
        }
      } catch (error) {
        console.error("Error requesting tracking permission:", error);
      }
    }

    // 2. Request Camera permissions
    try {
      const cameraResponse = await Camera.requestCameraPermissionsAsync();
      if (cameraResponse.status === "granted") {
        console.log("✅ Camera permission granted");
      } else {
        console.log("❌ Camera permission denied");
      }
    } catch (error) {
      console.error("Error requesting camera permission:", error);
    }

    // 3. Request Media Library permissions
    try {
      const mediaLibraryResponse = await MediaLibrary.requestPermissionsAsync();
      if (mediaLibraryResponse.status === "granted") {
        console.log("✅ Media Library permission granted");
      } else {
        console.log("❌ Media Library permission denied");
      }
    } catch (error) {
      console.error("Error requesting media library permission:", error);
    }

    // 4. Request Notification permissions
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log("✅ Notification permission granted (Android)");
        } else {
          console.log("❌ Notification permission denied (Android)");
        }
      } else if (Platform.OS === "ios") {
        const status = await requestPermission(messagingModule);
        const enabled =
          status === AuthorizationStatus.AUTHORIZED ||
          status === AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          await registerDeviceForRemoteMessages(messagingModule);
          console.log("✅ Notification permission granted (iOS)");
        } else {
          console.log("❌ Notification permission denied (iOS)");
        }
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }

    // 5. Request Microphone permissions (for video recording)
    if (Platform.OS === "android") {
      try {
        const microphoneGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        if (microphoneGranted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log("✅ Microphone permission granted (Android)");
        } else {
          console.log("❌ Microphone permission denied (Android)");
        }
      } catch (error) {
        console.error("Error requesting microphone permission:", error);
      }
    }

    // 6. Request Location permissions (Android - if needed for notifications)
    if (Platform.OS === "android") {
      try {
        const locationGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (locationGranted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log("✅ Location permission granted (Android)");
        } else {
          console.log("❌ Location permission denied (Android)");
        }
      } catch (error) {
        console.error("Error requesting location permission:", error);
      }
    }

    console.log("✅ All permission requests completed");
  } catch (error) {
    console.error("Error in requestAllPermissions:", error);
  }
}

/**
 * Check if all critical permissions are granted
 */
export async function checkPermissionsStatus(): Promise<{
  camera: boolean;
  mediaLibrary: boolean;
  notifications: boolean;
}> {
  try {
    const cameraStatus = await Camera.getCameraPermissionsAsync();
    const mediaLibraryStatus = await MediaLibrary.getPermissionsAsync();

    let notificationsGranted = false;
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      notificationsGranted = granted;
    } else if (Platform.OS === "ios") {
      const status = await requestPermission(messagingModule);
      notificationsGranted =
        status === AuthorizationStatus.AUTHORIZED ||
        status === AuthorizationStatus.PROVISIONAL;
    }

    return {
      camera: cameraStatus.status === "granted",
      mediaLibrary: mediaLibraryStatus.status === "granted",
      notifications: notificationsGranted,
    };
  } catch (error) {
    console.error("Error checking permissions status:", error);
    return {
      camera: false,
      mediaLibrary: false,
      notifications: false,
    };
  }
}
