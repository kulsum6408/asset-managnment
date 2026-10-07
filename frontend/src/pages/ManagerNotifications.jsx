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
  Assignment as RequestIcon,
  Inventory2 as AssetIcon,
  Build as MaintenanceIcon,
  Assessment as ReportIcon,
  Notifications as NotificationIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  DoneAll as DoneAllIcon,
  Refresh as RefreshIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

const drawerWidth = 250;
const topBarHeight = 64;

const ManagerNotifications = () => {
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

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

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
      console.error("Failed to load Manager notifications:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const isUnread = (item) =>
    item.is_read === 0 ||
    item.is_read === false ||
    item.read === 0 ||
    item.read === false;

  const unreadCount = notifications.filter(isUnread).length;

  const markAsRead = async (notification) => {
    const notificationId =
      notification.notification_id ||
      notification.id ||
      notification.notificationId;

    if (!notificationId) return;

    try {
      const token = localStorage.getItem("token");

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
          const itemId =
            item.notification_id ||
            item.id ||
            item.notificationId;

          return itemId === notificationId
            ? { ...item, is_read: 1, read: 1 }
            : item;
        })
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);

      setError(
        err.response?.data?.error ||
          "Unable to mark notification as read."
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");

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
        err.response?.data?.error ||
          "Unable to mark all notifications as read."
      );
    }
  };

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/manager",
    },
    {
      text: "Requests",
      icon: <RequestIcon />,
      path: "/manager/requests",
    },
    {
      text: "Assets",
      icon: <AssetIcon />,
      path: "/manager/assets",
    },
    {
      text: "Disposals",
      icon: <AssetIcon />,
      path: "/manager/disposals",
    },
    {
      text: "Damage Review",
      icon: <AssetIcon />,
      path: "/manager/damage-review",
    },
    {
      text: "Maintenance",
      icon: <MaintenanceIcon />,
      path: "/manager/maintenance",
    },
    {
      text: "Cost Approvals",
      icon: <MaintenanceIcon />,
      path: "/manager/cost-approvals",
    },
    {
      text: "Transfers",
      icon: <RequestIcon />,
      path: "/manager/transfers",
    },
    {
      text: "Reports",
      icon: <ReportIcon />,
      path: "/manager/reports",
    },
    {
      text: "Notifications",
      icon: <NotificationIcon />,
      path: "/manager/notifications",
    },
    {
      text: "Settings",
      icon: <SettingsIcon />,
      path: "/manager/settings",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
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
        sx={{ borderColor: "rgba(255,255,255,0.15)" }}
      />

      <List sx={{ px: 1.5, mt: 2 }}>
        {menuItems.map((item) => {
          const selected =
            item.path === "/manager"
              ? location.pathname === "/manager"
              : location.pathname.startsWith(item.path);

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
                  color: "#fff",
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
                    color: "#fff",
                    minWidth: 42,
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                <ListItemText
                  primary={item.text}
                  slotProps={{ primary: {
                    fontWeight: selected ? 700 : 500,
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
                color: "#fff",
                "&:hover": {
                  backgroundColor:
                    "rgba(255,255,255,0.1)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: "#fff",
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
          backgroundColor: "#fff",
          color: "#1f2937",
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          sx={{
            minHeight: `${topBarHeight}px !important`,
          }}
        >
          <IconButton
            color="inherit"
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
            Manager Notifications
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
            {(user.name || "M").charAt(0).toUpperCase()}
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
            color: "#fff",
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
        ModalProps={{ keepMounted: true }}
        sx={{
          display: {
            xs: "block",
            sm: "none",
          },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#07548e",
            color: "#fff",
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
              fontWeight={800}
            >
              Notifications
            </Typography>

            <Typography color="text.secondary">
              Management-related alerts and updates.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<DoneAllIcon />}
            disabled={unreadCount === 0}
            onClick={markAllAsRead}
            sx={{
              backgroundColor: "#07548e",
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              "&:hover": {
                backgroundColor: "#064575",
              },
            }}
          >
            Mark All as Read
          </Button>
        </Box>

        {error && (
          <Alert
            severity="warning"
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
                {unreadCount} unread
              </Typography>
            </Box>

            {notifications.length === 0 ? (
              <Box
                sx={{
                  p: 5,
                  textAlign: "center",
                }}
              >
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

                return (
                  <Box
                    key={
                      notification.notification_id ||
                      notification.id ||
                      index
                    }
                    sx={{
                      p: 3,
                      borderBottom:
                        index !== notifications.length - 1
                          ? "1px solid #eeeeee"
                          : "none",
                      backgroundColor: unread
                        ? "#f5f9fc"
                        : "#fff",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
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
                            justifyContent: "space-between",
                            gap: 2,
                            alignItems: "flex-start",
                          }}
                        >
                          <Typography
                            fontWeight={unread ? 800 : 600}
                          >
                            {notification.title ||
                              notification.subject ||
                              "System Notification"}
                          </Typography>

                          {unread && (
                            <Chip
                              label="New"
                              color="primary"
                              size="small"
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
                            "No message."}
                        </Typography>

                        {unread && (
                          <Button
                            size="small"
                            onClick={() =>
                              markAsRead(notification)
                            }
                            sx={{
                              mt: 1,
                              p: 0,
                              textTransform: "none",
                              fontWeight: 700,
                              color: "#07548e",
                            }}
                          >
                            Mark as read
                          </Button>
                        )}
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

export default ManagerNotifications;