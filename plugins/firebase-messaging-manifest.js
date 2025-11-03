const {
  withAndroidManifest,
  withDangerousMod,
} = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

/**
 * Custom Expo config plugin to add tools:replace attribute to Firebase notification channel meta-data
 * This resolves the manifest merger conflict with @react-native-firebase/messaging
 */
const withFirebaseMessagingManifest = (config) => {
  // Modify the main manifest using Expo's config plugin system
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application?.[0];

    // Find the Firebase messaging notification channel meta-data
    if (application?.["meta-data"]) {
      const metaDataArray = application["meta-data"];

      // Find the notification channel ID meta-data entry
      const notificationChannelMetaData = metaDataArray.find(
        (meta) =>
          meta.$["android:name"] ===
          "com.google.firebase.messaging.default_notification_channel_id"
      );

      if (notificationChannelMetaData) {
        // Add tools:replace attribute to resolve manifest merger conflict
        notificationChannelMetaData.$["tools:replace"] = "android:value";
        console.log(
          "✅ Added tools:replace to Firebase notification channel meta-data in main manifest"
        );
      }
    }

    return config;
  });

  // Use withDangerousMod to modify both main and debug manifests after they've been generated
  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const mainManifestPath = path.join(
        projectRoot,
        "android/app/src/main/AndroidManifest.xml"
      );
      const debugManifestPath = path.join(
        projectRoot,
        "android/app/src/debug/AndroidManifest.xml"
      );

      // Helper function to add tools:replace to manifest
      const addToolsReplace = (manifestPath, manifestType) => {
        if (fs.existsSync(manifestPath)) {
          let manifestContent = fs.readFileSync(manifestPath, "utf8");

          // Check if the notification channel meta-data already exists
          if (
            !manifestContent.includes(
              "com.google.firebase.messaging.default_notification_channel_id"
            )
          ) {
            // Add the meta-data to the manifest's application tag
            manifestContent = manifestContent.replace(
              /<application([^>]*)>/,
              `<application$1>\n    <meta-data android:name="com.google.firebase.messaging.default_notification_channel_id" android:value="default" tools:replace="android:value"/>`
            );

            fs.writeFileSync(manifestPath, manifestContent, "utf8");
            console.log(
              `✅ Added Firebase notification channel meta-data to ${manifestType} manifest`
            );
          } else {
            // If it exists but doesn't have tools:replace, add it
            manifestContent = manifestContent.replace(
              /<meta-data android:name="com\.google\.firebase\.messaging\.default_notification_channel_id" android:value="default"\/>/,
              '<meta-data android:name="com.google.firebase.messaging.default_notification_channel_id" android:value="default" tools:replace="android:value"/>'
            );

            fs.writeFileSync(manifestPath, manifestContent, "utf8");
            console.log(
              `✅ Updated Firebase notification channel meta-data in ${manifestType} manifest with tools:replace`
            );
          }
        }
      };

      // Apply to both manifests
      addToolsReplace(mainManifestPath, "main");
      addToolsReplace(debugManifestPath, "debug");

      return config;
    },
  ]);

  return config;
};

module.exports = withFirebaseMessagingManifest;
