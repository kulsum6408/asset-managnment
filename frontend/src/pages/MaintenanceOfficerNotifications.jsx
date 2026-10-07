import React, { useEffect, useState } from "react";
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
  CircularProgress,
  Alert,
  Chip,
  Button,
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
  DoneAll as DoneAllIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

const drawerWidth = 250;
const topBarHeight = 64;

const MaintenanceOfficerNotifications = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const getToken = () => localStorage.getItem("token");

  const loadNotifications = async () => {
    setLoading(true);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await API.get("/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.notifications)
        ? data.notifications
        : Array.isArray(data?.records)
        ? data.records
        : [];

      setNotifications(list);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const isUnread = (notification) =>
    notification.is_read === 0 ||
    notification.is_read === false ||
    notification.read === 0 ||
    notification.read === false;

  const unreadCount = notifications.filter(isUnread).length;

  const markAsRead = async (notification) => {
    const notificationId =
      notification.notification_id ||
      notification.id ||
      notification.notificationId;

    if (!notificationId) {
      return;
    }

    const token = getToken();

    try {
      await API.put(
        `/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((current) =>
        current.map((item) => {
          const currentId =
            item.notification_id ||
            item.id ||
            item.notificationId;

          if (currentId === notificationId) {
            return {
              ...item,
              is_read: 1,
              read: 1,
            };
          }

          return item;
        })
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    const token = getToken();

    try {
      await API.put(
        "/notifications/read-all",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: 1,
          read: 1,
        }))
      );
    } catch (err) {
      console.error(
        "Failed to mark all notifications as read:",
        err
      );

      setError(
        "Unable to mark all notifications as read."
      );
    }
  };

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
      text: "Maintenance History",
      icon: <HistoryIcon />,
      path: "/maintenance-officer/history",
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

    setMobileOpen(false);

    navigate("/login", {
      replace: true,
    });
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
              ? location.pathname === "/maintenance-officer"
              : location.pathname.startsWith(item.path);

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

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress sx={{ color: "#07548e" }} />
      </Box>
    );
  }

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
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
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
            Notifications
          </Typography>

          <Button
            startIcon={<RefreshIcon />}
            onClick={loadNotifications}
            sx={{
              mr: 1,
              color: "#07548e",
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Refresh
          </Button>

          <Avatar
            sx={{
              width: 40,
              height: 40,
              backgroundColor: "#07548e",
            }}
          >
            {(user.name || "M")
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

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: {
              xs: "flex-start",
              sm: "center",
            },
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: "#1f2937",
              }}
            >
              Notifications
            </Typography>

            <Typography color="text.secondary">
              Maintenance-related alerts and updates.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<DoneAllIcon />}
            disabled={unreadCount === 0}
            onClick={markAllAsRead}
            sx={{
              backgroundColor: "#07548e",
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              "&:hover": {
                backgroundColor: "#064575",
              },
            }}
          >
            Mark All as Read
          </Button>
        </Box>

        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <Box
              sx={{
                p: 3,
                borderBottom: "1px solid #eeeeee",
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
              >
                All Notifications
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {unreadCount} unread notification
                {unreadCount === 1 ? "" : "s"}
              </Typography>
            </Box>

            {notifications.length === 0 ? (
              <Box sx={{ p: 5, textAlign: "center" }}>
                <NotificationIcon
                  sx={{
                    fontSize: 48,
                    color: "#9ca3af",
                    mb: 1,
                  }}
                />

                <Typography
                  color="text.secondary"
                  fontWeight={600}
                >
                  No notifications found.
                </Typography>
              </Box>
            ) : (
              notifications.map((notification, index) => {
                const unread = isUnread(notification);

                const notificationId =
                  notification.notification_id ||
                  notification.id ||
                  notification.notificationId ||
                  index;

                return (
                  <Box
                    key={notificationId}
                    sx={{
                      p: 3,
                      borderBottom:
                        index !== notifications.length - 1
                          ? "1px solid #eeeeee"
                          : "none",
                      backgroundColor: unread
                        ? "#f5f9fc"
                        : "#ffffff",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        alignItems: "flex-start",
                      }}
                    >
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#e8f2fa",
                          color: "#07548e",
                        }}
                      >
                        <NotificationIcon />
                      </Box>

                      <Box sx={{ flexGrow: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            gap: 2,
                            alignItems: "flex-start",
                          }}
                        >
                          <Typography
                            fontWeight={unread ? 800 : 600}
                          >
                            {notification.title ||
                              notification.subject ||
                              "Maintenance Notification"}
                          </Typography>

                          {unread && (
                            <Chip
                              label="New"
                              size="small"
                              color="primary"
                              sx={{ fontWeight: 700 }}
                            />
                          )}
                        </Box>

                        <Typography
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          {notification.message ||
                            notification.description ||
                            notification.content ||
                            "No notification message."}
                        </Typography>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mt: 1.5,
                            flexWrap: "wrap",
                          }}
                        >
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {notification.created_at ||
                              notification.createdAt ||
                              ""}
                          </Typography>

                          {unread && (
                            <Button
                              size="small"
                              onClick={() =>
                                markAsRead(notification)
                              }
                              sx={{
                                textTransform: "none",
                                fontWeight: 700,
                                color: "#07548e",
                                p: 0,
                              }}
                            >
                              Mark as read
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                );
              })
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default MaintenanceOfficerNotifications;