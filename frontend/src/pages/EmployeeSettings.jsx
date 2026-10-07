import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Divider,
  Avatar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Stack,
} from "@mui/material";

import {
  Person as PersonIcon,
  Lock as LockIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  CameraAlt as CameraIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  SettingsBrightness as SystemThemeIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import API from "../services/api";

const EmployeeSettings = () => {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // =====================================================
  // CURRENT EMPLOYEE
  // =====================================================

  let user = {};

  try {
    user = JSON.parse(
      localStorage.getItem("user") || "{}"
    );
  } catch {
    user = {};
  }

  const userId = user.user_id || user.id || "employee";
  const role = user.role || "employee";

  // =====================================================
  // STORAGE KEYS
  // =====================================================

  const profileStorageKey = `profileImage_${userId}`;
  const languageStorageKey = `language_${userId}`;
  const themeStorageKey = `themeMode_${userId}`;

  const requestNotificationKey =
    `requestNotifications_${userId}`;

  const maintenanceNotificationKey =
    `maintenanceNotifications_${userId}`;

  const systemNotificationKey =
    `systemNotifications_${userId}`;

  // =====================================================
  // PROFILE IMAGE
  // =====================================================

  const [profileImage, setProfileImage] = useState(
    localStorage.getItem(profileStorageKey) || ""
  );

  // =====================================================
  // LANGUAGE
  // =====================================================

  const [language, setLanguage] = useState(
    localStorage.getItem(languageStorageKey) ||
      "English"
  );

  // =====================================================
  // THEME
  // =====================================================

  const [themeMode, setThemeMode] = useState(
    localStorage.getItem(themeStorageKey) ||
      localStorage.getItem("themeMode") ||
      "light"
  );

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  const [notifications, setNotifications] = useState({
    requestNotifications:
      localStorage.getItem(
        requestNotificationKey
      ) !== "false",

    maintenanceNotifications:
      localStorage.getItem(
        maintenanceNotificationKey
      ) !== "false",

    systemNotifications:
      localStorage.getItem(
        systemNotificationKey
      ) !== "false",
  });

  // =====================================================
  // PASSWORD
  // =====================================================

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // =====================================================
  // LOAD SAVED SETTINGS
  // =====================================================

  useEffect(() => {
    const savedLanguage =
      localStorage.getItem(languageStorageKey);

    const savedTheme =
      localStorage.getItem(themeStorageKey) ||
      localStorage.getItem("themeMode");

    const savedProfileImage =
      localStorage.getItem(profileStorageKey);

    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    if (savedTheme) {
      setThemeMode(savedTheme);
    }

    if (savedProfileImage) {
      setProfileImage(savedProfileImage);
    }
  }, [
    languageStorageKey,
    themeStorageKey,
    profileStorageKey,
  ]);

  // =====================================================
  // PROFILE IMAGE
  // =====================================================

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage(
        "Please select a valid image file."
      );
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage(
        "Profile picture must be smaller than 2MB."
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result;

      setProfileImage(imageData);

      localStorage.setItem(
        profileStorageKey,
        imageData
      );

      setSuccessMessage(
        "Profile picture updated successfully."
      );

      setErrorMessage("");
    };

    reader.readAsDataURL(file);
  };

  // =====================================================
  // LANGUAGE
  // =====================================================

  const handleLanguageChange = (event) => {
    const selectedLanguage = event.target.value;

    setLanguage(selectedLanguage);

    localStorage.setItem(
      languageStorageKey,
      selectedLanguage
    );

    setSuccessMessage(
      `Language changed to ${selectedLanguage}.`
    );

    setErrorMessage("");
  };

  // =====================================================
  // THEME
  // =====================================================

  const handleThemeChange = (event) => {
    const mode = event.target.value;

    setThemeMode(mode);

    localStorage.setItem(
      themeStorageKey,
      mode
    );

    localStorage.setItem(
      "themeMode",
      mode
    );

    if (
      typeof window.setAppThemeMode === "function"
    ) {
      window.setAppThemeMode(mode);
    }

    const themeName =
      mode === "light"
        ? "Light"
        : mode === "dark"
        ? "Dark"
        : "System Default";

    setSuccessMessage(
      `Theme changed to ${themeName}.`
    );

    setErrorMessage("");
  };

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  const handleNotificationChange =
    (setting) => (event) => {
      const value = event.target.checked;

      setNotifications((previous) => ({
        ...previous,
        [setting]: value,
      }));

      const keyMap = {
        requestNotifications:
          requestNotificationKey,

        maintenanceNotifications:
          maintenanceNotificationKey,

        systemNotifications:
          systemNotificationKey,
      };

      localStorage.setItem(
        keyMap[setting],
        String(value)
      );

      setSuccessMessage(
        "Notification settings updated."
      );

      setErrorMessage("");
    };

  // =====================================================
  // PASSWORD INPUT
  // =====================================================

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswordForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  const handleChangePassword = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = passwordForm;

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setErrorMessage(
        "Please fill in all password fields."
      );
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage(
        "New password must be at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(
        "New passwords do not match."
      );
      return;
    }

    try {
      setSavingPassword(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setErrorMessage(
          "You are not logged in."
        );
        return;
      }

      const response = await API.put(
        "/auth/change-password",
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccessMessage(
        response.data?.message ||
          "Password changed successfully."
      );

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error(
        "Failed to change password:",
        error
      );

      setErrorMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to change password."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "background.default",
        color: "text.primary",
        p: {
          xs: 2,
          sm: 3,
          md: 4,
        },
      }}
    >
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate("/employee")}
        sx={{
          mb: 3,
          color: "#07548e",
          fontWeight: 700,
          textTransform: "none",
        }}
      >
        Back to Dashboard
      </Button>

      {/* HEADER */}

      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: "text.primary",
          }}
        >
          Settings
        </Typography>

        <Typography
          sx={{
            color: "text.secondary",
            mt: 0.5,
          }}
        >
          Manage your profile, appearance,
          language, notifications, and password.
        </Typography>
      </Box>

      {/* SUCCESS */}

      {successMessage && (
        <Alert
          severity="success"
          onClose={() => setSuccessMessage("")}
          sx={{
            mb: 2,
            borderRadius: 2,
          }}
        >
          {successMessage}
        </Alert>
      )}

      {/* ERROR */}

      {errorMessage && (
        <Alert
          severity="error"
          onClose={() => setErrorMessage("")}
          sx={{
            mb: 2,
            borderRadius: 2,
          }}
        >
          {errorMessage}
        </Alert>
      )}

      {/* =====================================================
          PROFILE
      ===================================================== */}

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "background.paper",
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 3,
            }}
          >
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={
                  profileImage || undefined
                }
                sx={{
                  width: 80,
                  height: 80,
                  backgroundColor: "#07548e",
                  fontSize: 30,
                }}
              >
                {!profileImage &&
                  (user.name || "E")
                    .charAt(0)
                    .toUpperCase()}
              </Avatar>

              <Button
                component="label"
                variant="contained"
                size="small"
                startIcon={<CameraIcon />}
                sx={{
                  position: "absolute",
                  bottom: -8,
                  left: "50%",
                  transform:
                    "translateX(-50%)",
                  whiteSpace: "nowrap",
                  backgroundColor: "#07548e",
                  textTransform: "none",

                  "&:hover": {
                    backgroundColor: "#064570",
                  },
                }}
              >
                Photo

                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={
                    handleProfileImageChange
                  }
                />
              </Button>
            </Box>

            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                }}
              >
                Employee Profile
              </Typography>

              <Typography
                sx={{
                  color: "text.secondary",
                }}
              >
                Update your profile picture
                and account preferences.
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
              },
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              label="Name"
              value={user.name || "Employee"}
              InputProps={{
                readOnly: true,
                startAdornment: (
                  <PersonIcon
                    sx={{
                      mr: 1,
                      color: "text.secondary",
                    }}
                  />
                ),
              }}
            />

            <TextField
              fullWidth
              label="Email"
              value={
                user.email || "Not available"
              }
              InputProps={{
                readOnly: true,
              }}
            />

            <TextField
              fullWidth
              label="Role"
              value="Employee"
              InputProps={{
                readOnly: true,
              }}
            />

            <TextField
              fullWidth
              label="Status"
              value="Active"
              InputProps={{
                readOnly: true,
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* =====================================================
          APPEARANCE
      ===================================================== */}

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "background.paper",
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 1,
            }}
          >
            {themeMode === "dark" ? (
              <DarkModeIcon
                sx={{ color: "#07548e" }}
              />
            ) : themeMode === "light" ? (
              <LightModeIcon
                sx={{ color: "#07548e" }}
              />
            ) : (
              <SystemThemeIcon
                sx={{ color: "#07548e" }}
              />
            )}

            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
            >
              Appearance
            </Typography>
          </Box>

          <Typography
            sx={{
              color: "text.secondary",
              mb: 3,
            }}
          >
            Choose how the application looks.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <FormControl
            fullWidth
            sx={{ maxWidth: 500 }}
          >
            <InputLabel>Theme</InputLabel>

            <Select
              value={themeMode}
              label="Theme"
              onChange={handleThemeChange}
            >
              <MenuItem value="light">
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <LightModeIcon fontSize="small" />
                  Light
                </Box>
              </MenuItem>

              <MenuItem value="dark">
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <DarkModeIcon fontSize="small" />
                  Dark
                </Box>
              </MenuItem>

              <MenuItem value="system">
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <SystemThemeIcon fontSize="small" />
                  System Default
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* =====================================================
          LANGUAGE
      ===================================================== */}

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "background.paper",
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 1,
            }}
          >
            <LanguageIcon
              sx={{ color: "#07548e" }}
            />

            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
            >
              Language
            </Typography>
          </Box>

          <Typography
            sx={{
              color: "text.secondary",
              mb: 3,
            }}
          >
            Choose the language used by the application.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <FormControl
            fullWidth
            sx={{ maxWidth: 500 }}
          >
            <InputLabel>
              Application Language
            </InputLabel>

            <Select
              value={language}
              label="Application Language"
              onChange={handleLanguageChange}
            >
              <MenuItem value="English">
                English
              </MenuItem>

              <MenuItem value="Amharic">
                Amharic
              </MenuItem>

              <MenuItem value="Oromo">
                Afaan Oromo
              </MenuItem>

              <MenuItem value="Arabic">
                Arabic
              </MenuItem>
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* =====================================================
          NOTIFICATIONS
      ===================================================== */}

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "background.paper",
          mb: 3,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 1,
            }}
          >
            <NotificationsIcon
              sx={{ color: "#07548e" }}
            />

            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
            >
              Notifications
            </Typography>
          </Box>

          <Typography
            sx={{
              color: "text.secondary",
              mb: 3,
            }}
          >
            Choose which notifications you want to receive.
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Stack spacing={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={
                    notifications.requestNotifications
                  }
                  onChange={handleNotificationChange(
                    "requestNotifications"
                  )}
                />
              }
              label="Asset request notifications"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={
                    notifications.maintenanceNotifications
                  }
                  onChange={handleNotificationChange(
                    "maintenanceNotifications"
                  )}
                />
              }
              label="Maintenance notifications"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={
                    notifications.systemNotifications
                  }
                  onChange={handleNotificationChange(
                    "systemNotifications"
                  )}
                />
              }
              label="System notifications"
            />
          </Stack>
        </CardContent>
      </Card>

      {/* =====================================================
          CHANGE PASSWORD
      ===================================================== */}

      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "background.paper",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 1,
            }}
          >
            <LockIcon
              sx={{ color: "#07548e" }}
            />

            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
            >
              Change Password
            </Typography>
          </Box>

          <Typography
            sx={{
              color: "text.secondary",
              mb: 3,
            }}
          >
            Change your account password securely.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ maxWidth: 600 }}>
            <TextField
              fullWidth
              type="password"
              label="Current Password"
              name="currentPassword"
              value={
                passwordForm.currentPassword
              }
              onChange={handlePasswordChange}
              margin="normal"
            />

            <TextField
              fullWidth
              type="password"
              label="New Password"
              name="newPassword"
              value={
                passwordForm.newPassword
              }
              onChange={handlePasswordChange}
              margin="normal"
              helperText="Minimum 6 characters"
            />

            <TextField
              fullWidth
              type="password"
              label="Confirm New Password"
              name="confirmPassword"
              value={
                passwordForm.confirmPassword
              }
              onChange={handlePasswordChange}
              margin="normal"
            />

            <Button
              variant="contained"
              onClick={handleChangePassword}
              disabled={savingPassword}
              sx={{
                mt: 2,
                backgroundColor: "#07548e",
                textTransform: "none",
                fontWeight: 600,
                px: 3,

                "&:hover": {
                  backgroundColor: "#064570",
                },
              }}
            >
              {savingPassword
                ? "Changing..."
                : "Change Password"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmployeeSettings;