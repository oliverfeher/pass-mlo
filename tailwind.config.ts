import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#15233B", brass: "#A9781F", paper: "#F1EDE4",
        good: "#2E7A57", bad: "#B2422A",
      },
    },
  },
  plugins: [],
};
export default config;
