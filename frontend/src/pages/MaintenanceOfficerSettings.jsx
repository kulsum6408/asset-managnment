import React, { useState } from "react";
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Card,
  CardContent,
  Avatar,
  Divider,
  TextField,
  Button,
  Alert,
  InputAdornment,
} from "@mui/material";

import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Build as MaintenanceIcon,
  Inventory2 as AssetIcon,
  Notifications as NotificationIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

const drawerWidth = 250;
const topBarHeight = 64;

const MaintenanceOfficerSettings = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  let storedUser = {};

  try {
    storedUser = JSON.parse(
      localStorage.getItem("user") || "{}"
    );
  } catch {
    storedUser = {};
  }

  const [name, setName] = useState(
    storedUser.name || ""
  );

  const [email, setEmail] = useState(
    storedUser.email || ""
  );

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/maintenance-officer",
    },
    {
      text: "Maintenance Requests",
      icon: <MaintenanceIcon />,
      path: "/maintenance-officer/requests",
    },
    {
      text: "Assets",
      icon: <AssetIcon />,
      path: "/maintenance-officer/assets",
    },
    {
      text: "Reports",
      icon: <ReportIcon />,
      path: "/maintenance-officer/reports",
    },
    {
      text: "Notifications",
      icon: <NotificationIcon />,
      path: "/maintenance-officer/notifications",
    },
    {
      text: "Settings",
      icon: <SettingsIcon />,
      path: "/maintenance-officer/settings",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };

  const handleProfileSave = async () => {
    setSuccess("");
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      /*
       * This endpoint is intentionally isolated to the
       * current logged-in user.
       *
       * If your backend uses a different endpoint,
       * we will connect the exact endpoint later.
       */
      const response = await API.put(
        "/users/profile",
        {
          name,
          email,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedUser =
        response.data?.user ||
        response.data?.data ||
        {
          ...storedUser,
          name,
          email,
        };

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setSuccess("Profile updated successfully.");
    } catch (err) {
      console.error("Profile update failed:", err);

      setError(
        err.response?.data?.message ||
          "Unable to update profile."
      );
    }
  };

  const handlePasswordChange = async () => {
    setSuccess("");
    setError("");

    if (!currentPassword) {
      setError("Enter your current password.");
      return;
    }

    if (!newPassword) {
      setError("Enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError(
        "New password must contain at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      await API.put(
        "/users/change-password",
        {
          currentPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setSuccess("Password changed successfully.");
    } catch (err) {
      console.error("Password change failed:", err);

      setError(
        err.response?.data?.message ||
          "Unable to change password."
      );
    }
  };

  const drawerContent = (
    <>
      <Toolbar
        sx={{
          justifyContent: "center",
          minHeight: `${topBarHeight}px !important`,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            letterSpacing: 0.4,
            fontSize: "17px",
          }}
        >
          ASSET MANAGEMENT
        </Typography>
      </Toolbar>

      <Divider
        sx={{
          borderColor: "rgba(255,255,255,0.15)",
        }}
      />

      <List sx={{ px: 1.5, mt: 2 }}>
        {menuItems.map((item) => {
          const isSelected =
            item.path === "/maintenance-officer"
              ? location.pathname ===
                "/maintenance-officer"
              : location.pathname.startsWith(
                  item.path
                );

          return (
            <ListItem
              key={item.text}
              disablePadding
              sx={{ mb: 0.5 }}
            >
              <ListItemButton
                selected={isSelected}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  color: "#ffffff",

                  "&.Mui-selected": {
                    backgroundColor:
                      "rgba(255,255,255,0.16)",
                  },

                  "&.Mui-selected:hover": {
                    backgroundColor:
                      "rgba(255,255,255,0.2)",
                  },

                  "&:hover": {
                    backgroundColor:
                      "rgba(255,255,255,0.1)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: "#ffffff",
                    minWidth: 42,
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                <ListItemText
                  primary={item.text}
                  slotProps={{ primary: {
                    fontWeight: isSelected ? 700 : 500,
                  } }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}

        <Box sx={{ mt: 3 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                borderRadius: 2,
                color: "#ffffff",
                "&:hover": {
                  backgroundColor:
                    "rgba(255,255,255,0.1)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: "#ffffff",
                  minWidth: 42,
                }}
              >
                <LogoutIcon />
              </ListItemIcon>

              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </Box>
      </List>
    </>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f5f7fb",
      }}
    >
      <CssBaseline />

      <AppBar
        position="fixed"
        sx={{
          width: {
            sm: `calc(100% - ${drawerWidth}px)`,
          },
          ml: {
            sm: `${drawerWidth}px`,
          },
          height: `${topBarHeight}px`,
          backgroundColor: "#ffffff",
          color: "#1f2937",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.06)",
          zIndex: (theme) =>
            theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          sx={{
            minHeight: `${topBarHeight}px !important`,
          }}
        >
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{
              mr: 2,
              display: {
                xs: "block",
                sm: "none",
              },
            }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
            }}
          >
            Settings
          </Typography>

          <Avatar
            sx={{
              width: 40,
              height: 40,
              backgroundColor: "#07548e",
            }}
          >
            {(name || "M")
              .charAt(0)
              .toUpperCase()}
          </Avatar>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          display: {
            xs: "none",
            sm: "block",
          },
          width: drawerWidth,
          flexShrink: 0,

          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#07548e",
            color: "#ffffff",
            border: "none",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: {
            xs: "block",
            sm: "none",
          },

          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#07548e",
            color: "#ffffff",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: {
            xs: "100%",
            sm: `calc(100% - ${drawerWidth}px)`,
          },
          pt: `${topBarHeight + 24}px`,
          px: {
            xs: 2,
            sm: 3,
            md: 4,
          },
          pb: 5,
        }}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/maintenance-officer")}
          sx={{
            mb: 3,
            color: "#07548e",
            fontWeight: 700,
            textTransform: "none",
          }}
        >
          Back to Dashboard
        </Button>

        <Typography
          variant="h5"
          fontWeight={800}
          sx={{ mb: 1 }}
        >
          Account Settings
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Manage your Maintenance Staff account.
        </Typography>

        {success && (
          <Alert
            severity="success"
            sx={{ mb: 3 }}
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 3,
              }}
            >
              <Avatar
                sx={{
                  width: 58,
                  height: 58,
                  backgroundColor: "#07548e",
                }}
              >
                <PersonIcon />
              </Avatar>

              <Box>
                <Typography
                  variant="h6"
                  fontWeight={800}
                >
                  Profile Information
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Update your account information.
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "1fr 1fr",
                },
                gap: 2,
              }}
            >
              <TextField
                fullWidth
                label="Name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
              />

              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />
            </Box>

            <Button
              variant="contained"
              onClick={handleProfileSave}
              sx={{
                mt: 3,
                backgroundColor: "#07548e",
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                "&:hover": {
                  backgroundColor: "#064575",
                },
              }}
            >
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e5e7eb",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{ mb: 1 }}
            >
              Change Password
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              Keep your account secure by using a strong
              password.
            </Typography>

            <Box
              sx={{
                display: "grid",
                gap: 2,
              }}
            >
              <TextField
                fullWidth
                label="Current Password"
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) =>
                  setCurrentPassword(e.target.value)
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setShowPassword(
                            (current) => !current
                          )
                        }
                        edge="end"
                      >
                        {showPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="New Password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
              />

              <TextField
                fullWidth
                label="Confirm New Password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
              />
            </Box>

            <Button
              variant="contained"
              onClick={handlePasswordChange}
              sx={{
                mt: 3,
                backgroundColor: "#07548e",
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,
                "&:hover": {
                  backgroundColor: "#064575",
                },
              }}
            >
              Change Password
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default MaintenanceOfficerSettings;