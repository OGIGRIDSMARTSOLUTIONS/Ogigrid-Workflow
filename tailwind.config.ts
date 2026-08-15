import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F8FA",
        panel: "#FFFFFF",
        border: {
          DEFAULT: "#E4E7EC",
          strong: "#D0D5DD",
        },
        ink: {
          DEFAULT: "#1D2433",
          muted: "#5B6472",
          faint: "#8A93A3",
        },
        brand: {
          50: "#EEF3FC",
          100: "#DCE7F8",
          200: "#B7CDF0",
          300: "#8FB1E7",
          400: "#5D8FDB",
          500: "#3568C9",
          600: "#2A55A8",
          700: "#22447F",
          800: "#1B3766",
          900: "#152A4D",
        },
        status: {
          progress: "#2A55A8",
          progressBg: "#EAF0FB",
          notstarted: "#8A93A3",
          notstartedBg: "#F1F2F4",
          completed: "#1B7A54",
          completedBg: "#E7F5EE",
          submitted: "#1B7A54",
          submittedBg: "#E7F5EE",
          notsubmitted: "#B23B3B",
          notsubmittedBg: "#FBEAEA",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(16, 24, 40, 0.04)",
        panel: "0 1px 3px rgba(16, 24, 40, 0.06)",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
