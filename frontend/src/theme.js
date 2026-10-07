import { createTheme } from "@mui/material/styles";

export const getAppTheme = (mode) =>
  createTheme({
    palette: {
      mode,

      primary: {
        main: "#07548e",
      },

      background: {
        default: mode === "dark" ? "#111827" : "#f5f7fb",
        paper: mode === "dark" ? "#1f2937" : "#ffffff",
      },

      text: {
        primary: mode === "dark" ? "#f9fafb" : "#1f2937",
        secondary: mode === "dark" ? "#d1d5db" : "#6b7280",
      },
    },

    shape: {
      borderRadius: 12,
    },
  });