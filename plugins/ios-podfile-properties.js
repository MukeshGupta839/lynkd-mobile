const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

// Minimal config plugin that ensures ios.podfileProperties from app.json
// are present in ios/Podfile.properties.json. This keeps podfile properties
// in sync for local dev and CI. It's intentionally non-invasive and will
// merge keys without clobbering unrelated values.
module.exports = function withIosPodfileProperties(config) {
  return withDangerousMod(config, [
    "ios",
    async (props) => {
      try {
        const projectRoot =
          props.modRequest.projectRoot ||
          props.modResults.projectRoot ||
          process.cwd();
        const iosDir = path.join(projectRoot, "ios");
        const destFile = path.join(iosDir, "Podfile.properties.json");

        const podfilePropsFromConfig =
          config.ios && config.ios.podfileProperties
            ? config.ios.podfileProperties
            : null;

        // Read existing file if present
        let existing = {};
        if (fs.existsSync(destFile)) {
          try {
            existing = JSON.parse(fs.readFileSync(destFile, "utf8")) || {};
          } catch (_e) {
            // If parsing fails, back up the file and start fresh
            fs.copyFileSync(destFile, destFile + ".bak");
            existing = {};
          }
        }

        // Merge podfile properties from config into existing. If the repo has no
        // explicit setting for ios.useModularHeaders, default it to "true"
        const merged = Object.assign(
          {},
          existing,
          podfilePropsFromConfig || {}
        );
        if (merged["ios.useModularHeaders"] === undefined) {
          merged["ios.useModularHeaders"] = "true";
        }

        // Write JSON with stable formatting (only if we have values to write)
        fs.mkdirSync(iosDir, { recursive: true });
        fs.writeFileSync(destFile, JSON.stringify(merged, null, 2) + "\n");
        // Also patch ios/Podfile to ensure required post_install build-settings
        const podfilePath = path.join(iosDir, "Podfile");
        if (fs.existsSync(podfilePath)) {
          let podfile = fs.readFileSync(podfilePath, "utf8");

          // Ensure Podfile contains a use_modular_headers! directive when requested
          if (
            merged["ios.useModularHeaders"] === "true" &&
            !podfile.includes("use_modular_headers!")
          ) {
            // Insert right after the platform declaration (platform :ios, ...)
            const platformIdx = podfile.indexOf("platform :ios");
            if (platformIdx !== -1) {
              const nl = podfile.indexOf("\n", platformIdx);
              const insertAt = nl + 1;
              podfile =
                podfile.slice(0, insertAt) +
                "\n# Added by with-ios-podfile-properties plugin\nuse_modular_headers!\n" +
                podfile.slice(insertAt);
              fs.writeFileSync(podfilePath, podfile, "utf8");
            }
          }

          const injectBlock = `    # Workaround: allow non-modular includes inside framework modules for pods that\n    # import React headers (e.g. @react-native-firebase). This avoids "include of\n    # non-modular header inside framework module" Xcode errors by relaxing the\n    # compiler check. See Podfile comments and RNFB troubleshooting docs.\n    installer.pods_project.targets.each do |target|\n      target.build_configurations.each do |config|\n        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'\n      end\n    end\n    # Enable module-related flags for React and Firebase related pods so that\n    # React headers (RCT_EXTERN, RCTPromiseRejectBlock, etc.) are visible to\n    # other pods compiled as frameworks. This helps with type and macro errors\n    # that occur when headers are treated as non-modular.\n    installer.pods_project.targets.each do |target|\n      if target.name.start_with?('React') || target.name.start_with?('RNFB') || target.name.start_with?('Firebase') || target.name.start_with?('Expo') || target.name.include?('React-Core')\n        target.build_configurations.each do |config|\n          config.build_settings['DEFINES_MODULE'] = 'YES'\n          config.build_settings['CLANG_ENABLE_MODULES'] = 'YES'\n        end\n      end\n    end\n`;

          // Insert the block only if the podfile contains a post_install block and does not already include our marker
          if (
            podfile.includes("post_install do |installer|") &&
            !podfile.includes(
              "CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES"
            )
          ) {
            // Find react_native_post_install call line and insert after it
            const lines = podfile.split("\n");
            let inserted = false;
            for (let i = 0; i < lines.length; i++) {
              if (lines[i].includes("react_native_post_install(")) {
                // insert after the next blank line or after this line
                let insertAtLine = i + 1;
                // skip any trailing lines that are part of the method args
                while (
                  insertAtLine < lines.length &&
                  lines[insertAtLine].trim().endsWith(",")
                ) {
                  insertAtLine++;
                }
                // find the first newline after insertAtLine
                const before = lines.slice(0, insertAtLine + 1).join("\n");
                const after = lines.slice(insertAtLine + 1).join("\n");
                podfile = before + "\n" + injectBlock + after;
                fs.writeFileSync(podfilePath, podfile, "utf8");
                inserted = true;
                break;
              }
            }
            if (!inserted) {
              // Fallback: append the injectBlock before the final 'end' of the post_install block
              const postIdx = podfile.indexOf("post_install do |installer|");
              if (postIdx !== -1) {
                const endIdx = podfile.lastIndexOf(
                  "\nend",
                  podfile.indexOf("target", postIdx) > -1
                    ? podfile.indexOf("target", postIdx)
                    : podfile.length
                );
                if (endIdx !== -1) {
                  const before = podfile.slice(0, endIdx);
                  const after = podfile.slice(endIdx);
                  podfile = before + "\n" + injectBlock + after;
                  fs.writeFileSync(podfilePath, podfile, "utf8");
                }
              }
            }
          }
        }
      } catch (err) {
        // Non-fatal: log to console so users can see if something went wrong
        console.error("with-ios-podfile-properties failed:", err);
      }
      return props;
    },
  ]);
};
