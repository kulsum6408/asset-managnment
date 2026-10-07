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
  Grid,
  Chip,
} from "@mui/material";

import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AccountBalanceWallet as FinanceIcon,
  Inventory2 as AssetIcon,
  Calculate as DepreciationIcon,
  Assessment as ReportIcon,
  Notifications as NotificationIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ReceiptLong as ReceiptIcon,
  Savings as AssetFinancialIcon,
  AttachMoney as DisposalFinancialIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Security as SecurityIcon,
  Lock as LockIcon,
  Email as EmailIcon,
  ArrowBack,
} from "@mui/icons-material";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import API from "../services/api";

const drawerWidth = 250;
const topBarHeight = 64;

const FinanceOfficerSettings = () => {
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

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/finance",
    },
    {
      text: "Financial Assets",
      icon: <AssetIcon />,
      path: "/finance/assets",
    },
    {
      text: "Depreciation",
      icon: <DepreciationIcon />,
      path: "/finance/depreciation",
    },
    {
      text: "Depreciation History",
      icon: <FinanceIcon />,
      path: "/finance/depreciation-history",
    },
    {
      text: "Asset Financial Info",
      icon: <AssetFinancialIcon />,
      path: "/finance/asset-financial",
    },
    {
      text: "Maintenance Cost",
      icon: <ReceiptIcon />,
      path: "/finance/maintenance-cost",
    },
    {
      text: "Disposal Financials",
      icon: <DisposalFinancialIcon />,
      path: "/finance/disposal-financial",
    },
    {
      text: "Reports",
      icon: <ReportIcon />,
      path: "/finance/reports",
    },
    {
      text: "Notifications",
      icon: <NotificationIcon />,
      path: "/finance/notifications",
    },
    {
      text: "Settings",
      icon: <SettingsIcon />,
      path: "/finance/settings",
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
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", {
          replace: true,
        });
        return;
      }

      const response = await API.put(
        "/users/profile",
        {
          name: name.trim(),
          email: email.trim(),
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
          name: name.trim(),
          email: email.trim(),
        };

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setSuccess(
        "Profile updated successfully."
      );
    } catch (err) {
      console.error(
        "Finance profile update failed:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to update profile."
      );
    }
  };

  const handlePasswordChange = async () => {
    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError(
        "Enter your current password."
      );
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
      setError(
        "New passwords do not match."
      );
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", {
          replace: true,
        });
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

      setSuccess(
        "Password changed successfully."
      );
    } catch (err) {
      console.error(
        "Finance password change failed:",
        err
      );

      setError(
        err.response?.data?.error ||
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
            fontSize: "17px",
          }}
        >
          ASSET MANAGEMENT
        </Typography>
      </Toolbar>

      <Divider
        sx={{
          borderColor:
            "rgba(255,255,255,0.15)",
        }}
      />

      <List
        sx={{
          px: 1.5,
          mt: 2,
        }}
      >
        {menuItems.map((item) => {
          const selected =
            item.path === "/finance"
              ? location.pathname === "/finance"
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
                selected={selected}
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
                    fontWeight: selected
                      ? 700
                      : 500,
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

              <ListItemText
                primary="Logout"
              />
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

      {/* TOP BAR */}

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
            onClick={() =>
              setMobileOpen(true)
            }
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
            Finance Settings
          </Typography>

          <Avatar
            sx={{
              width: 40,
              height: 40,
              backgroundColor: "#07548e",
            }}
          >
            {(name || "F")
              .charAt(0)
              .toUpperCase()}
          </Avatar>
        </Toolbar>
      </AppBar>

      {/* DESKTOP SIDEBAR */}

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

      {/* MOBILE SIDEBAR */}

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() =>
          setMobileOpen(false)
        }
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

      {/* MAIN */}

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
          onClick={() => navigate("/finance")}
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
          Settings
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Manage your Finance Officer account and security.
        </Typography>

        {success && (
          <Alert
            severity="success"
            sx={{ mb: 3 }}
            onClose={() =>
              setSuccess("")
            }
          >
            {success}
          </Alert>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() =>
              setError("")
            }
          >
            {error}
          </Alert>
        )}

        {/* =================================================
            PROFILE INFORMATION
        ================================================= */}

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border:
              "1px solid #e5e7eb",
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
                  backgroundColor:
                    "#07548e",
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
                  Update your personal account information.
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid
                size={{
                  xs: 12,
                  md: 6,
                }}
              >
                <TextField
                  fullWidth
                  label="Full Name"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 6,
                }}
              >
                <TextField
                  fullWidth
                  type="email"
                  label="Email Address"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            <Button
              variant="contained"
              onClick={
                handleProfileSave
              }
              sx={{
                mt: 3,
                backgroundColor:
                  "#07548e",
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,

                "&:hover": {
                  backgroundColor:
                    "#064575",
                },
              }}
            >
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* =================================================
            ACCOUNT ROLE
        ================================================= */}

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border:
              "1px solid #e5e7eb",
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 2,
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor:
                    "#e8f2fa",
                  color: "#07548e",
                }}
              >
                <FinanceIcon />
              </Box>

              <Box>
                <Typography
                  variant="h6"
                  fontWeight={800}
                >
                  Account Information
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Your system role is controlled by the authenticated backend account.
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Chip
                label={`Name: ${
                  name || "N/A"
                }`}
                sx={{
                  fontWeight: 600,
                }}
              />

              <Chip
                label={`Email: ${
                  email || "N/A"
                }`}
                sx={{
                  fontWeight: 600,
                }}
              />

              <Chip
                label="Role: Finance Officer"
                color="primary"
                sx={{
                  fontWeight: 700,
                }}
              />
            </Box>
          </CardContent>
        </Card>

        {/* =================================================
            SECURITY
        ================================================= */}

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border:
              "1px solid #e5e7eb",
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
                  backgroundColor:
                    "#e8f2fa",
                  color: "#07548e",
                }}
              >
                <SecurityIcon />
              </Avatar>

              <Box>
                <Typography
                  variant="h6"
                  fontWeight={800}
                >
                  Security
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Protect your Finance Officer account.
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <TextField
              fullWidth
              label="Current Password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={currentPassword}
              onChange={(e) =>
                setCurrentPassword(
                  e.target.value
                )
              }
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),

                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowPassword(
                          (value) =>
                            !value
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
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={newPassword}
              onChange={(e) =>
                setNewPassword(
                  e.target.value
                )
              }
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Confirm New Password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant="contained"
              onClick={
                handlePasswordChange
              }
              sx={{
                mt: 3,
                backgroundColor:
                  "#07548e",
                textTransform: "none",
                fontWeight: 700,
                borderRadius: 2,

                "&:hover": {
                  backgroundColor:
                    "#064575",
                },
              }}
            >
              Update Password
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default FinanceOfficerSettings;