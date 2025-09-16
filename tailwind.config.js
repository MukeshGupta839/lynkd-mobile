/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      spacing: {
        2: "0.5rem",
        6: "1.5rem",
        8.5: "2.125rem",
        13: "3.125rem",
      },
      borderRadius: {
        10: "0.625rem",
      },
      fontSize: {
        xxs: ["10px", { lineHeight: "12px" }],
        tab: 12,
      },
      fontFamily: {
        "worksans-200": ["WorkSans_200ExtraLight"],
        "worksans-300": ["WorkSans_300Light"],
        "worksans-400": ["WorkSans_400Regular"],
        "worksans-500": ["WorkSans_500Medium"],
        "worksans-600": ["WorkSans_600SemiBold"],
        "worksans-700": ["WorkSans_700Bold"],
        "worksans-800": ["WorkSans_800ExtraBold"],
        "worksans-900": ["WorkSans_900Black"],
        "poppins-light": ["Poppins-Light"],
        "poppins-regular": ["Poppins-Regular"],
        "poppins-medium": ["Poppins-Medium"],
        "poppins-semibold": ["Poppins-SemiBold"],
        "poppins-bold": ["Poppins-Bold"],
        "opensans-light": ["OpenSans-Light"],
        "opensans-regular": ["OpenSans-Regular"],
        "opensans-semibold": ["OpenSans-SemiBold"],
        "opensans-bold": ["OpenSans-Bold"],
        "opensans-italic": ["OpenSans-Italic"],
        "opensans-semibolditalic": ["OpenSans-SemiBoldItalic"],
        "opensans-bolditalic": ["OpenSans-BoldItalic"],
      },
      letterSpacing: {
        "ultra-wide": "30px",
      },
      rotate: {
        "-45": "-45deg",
      },
    },
  },
  plugins: [],
};
