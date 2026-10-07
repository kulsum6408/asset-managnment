import React, { useMemo, useState } from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  ThemeProvider,
  CssBaseline,
} from "@mui/material";

import "./index.css";
import App from "./App.jsx";

import { getAppTheme } from "./theme";

function Root() {
  const [themeMode, setThemeMode] = useState(
    localStorage.getItem("themeMode") || "light"
  );

  const theme = useMemo(
    () => getAppTheme(themeMode),
    [themeMode]
  );

  window.setAppThemeMode = (mode) => {
    setThemeMode(mode);
    localStorage.setItem(
      "themeMode",
      mode
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <Root />
  </StrictMode>
);