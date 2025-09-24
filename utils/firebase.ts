// utils/firebase.ts
// Lazy, safe getters for React Native Firebase modules. We avoid calling
// native module factories at module import time so the JS can be loaded in
// environments where native modules are not available (Expo web/dev clients
// without the native plugin installed), and to prevent TurboModuleRegistry errors.

// Firebase config for reference (RN Firebase reads google-services.json / GoogleService-Info.plist)
export const firebaseConfig: Record<string, string | undefined> = {
  apiKey: process.env.EXPO_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.EXPO_FIREBASE_PROJECT_ID
    ? `https://${process.env.EXPO_FIREBASE_PROJECT_ID}.firebaseio.com`
    : undefined,
};

// Each getter dynamically imports the native module and returns the instance
// if available, otherwise returns null and logs a friendly warning.

export async function getFirestoreInstance(): Promise<any | null> {
  try {
    const mod = await import("@react-native-firebase/firestore");
    const inst = mod.default();

    // Try enabling persistence if supported
    try {
      // Some versions return a promise from settings
      // @ts-ignore
      const maybePromise = inst.settings({
        persistence: true,
      });
      if (maybePromise && typeof maybePromise.catch === "function") {
        maybePromise.catch((err: any) => {
          console.warn("Firestore persistence not enabled:", err);
        });
      }
    } catch (err) {
      // non-fatal
      console.warn("Error while configuring Firestore persistence:", err);
    }

    return inst;
  } catch (err) {
    console.warn("Firestore native module not available:", err);
    return null;
  }
}

export async function getAuth(): Promise<any | null> {
  try {
    const mod = await import("@react-native-firebase/auth");
    return mod.default();
  } catch (err) {
    console.warn("Firebase Auth native module not available:", err);
    return null;
  }
}

export async function getAnalytics(): Promise<any | null> {
  try {
    const mod = await import("@react-native-firebase/analytics");
    return mod.default();
  } catch (err) {
    console.warn("Firebase Analytics native module not available:", err);
    return null;
  }
}

export async function getStorage(): Promise<any | null> {
  try {
    const mod = await import("@react-native-firebase/storage");
    return mod.default();
  } catch (err) {
    console.warn("Firebase Storage native module not available:", err);
    return null;
  }
}
