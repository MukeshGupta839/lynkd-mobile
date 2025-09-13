module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Move plugins outside of env to ensure they run in all environments
      "react-native-paper/babel",
      "react-native-worklets/plugin",
    ],
    env: {
      production: {
        plugins: [],
      },
    },
  };
};
