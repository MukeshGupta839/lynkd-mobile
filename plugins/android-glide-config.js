const {
  withAppBuildGradle,
  withGradleProperties,
} = require("@expo/config-plugins");

/**
 * Expo Config Plugin to fix Glide duplicate class issue with react-native-fast-image
 */
const withGlideConfig = (config) => {
  // Add gradle properties to disable Glide annotation processing
  config = withGradleProperties(config, (config) => {
    config.modResults.push({
      type: "property",
      key: "android.disableAutomaticComponentCreation",
      value: "true",
    });
    return config;
  });

  // Modify app/build.gradle
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.contents) {
      let contents = config.modResults.contents;

      // Add multiDexEnabled if not already present
      if (!contents.includes("multiDexEnabled")) {
        contents = contents.replace(
          /defaultConfig\s*{/,
          `defaultConfig {
        multiDexEnabled true`
        );
      }

      // Add packaging options to handle duplicate files
      if (!contents.includes("pickFirst 'lib/x86/libc++_shared.so'")) {
        const packagingOptionsBlock = `
    packagingOptions {
        pickFirst 'lib/x86/libc++_shared.so'
        pickFirst 'lib/x86_64/libc++_shared.so'
        pickFirst 'lib/armeabi-v7a/libc++_shared.so'
        pickFirst 'lib/arm64-v8a/libc++_shared.so'
    }`;

        // Find the closing brace of android block and add before it
        const androidBlockRegex =
          /(android\s*{[\s\S]*?)(}\s*\n\s*dependencies)/;
        if (androidBlockRegex.test(contents)) {
          contents = contents.replace(
            androidBlockRegex,
            `$1${packagingOptionsBlock}\n$2`
          );
        }
      }

      // Exclude Glide annotation processor from all configurations
      if (
        !contents.includes(
          "exclude group: 'com.github.bumptech.glide', module: 'compiler'"
        )
      ) {
        const configBlock = `
    configurations.all {
        exclude group: 'com.github.bumptech.glide', module: 'compiler'
    }
`;
        // Add at the beginning of dependencies block
        contents = contents.replace(
          /dependencies\s*{/,
          `dependencies {${configBlock}`
        );
      }

      config.modResults.contents = contents;
    }
    return config;
  });

  return config;
};

module.exports = withGlideConfig;
