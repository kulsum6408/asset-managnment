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
  Grid,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Chip,
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
  History as HistoryIcon,
  Event as EventIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";

import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

const drawerWidth = 250;
const topBarHeight = 64;

const MaintenanceOfficerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [maintenance, setMaintenance] = useState([]);
  const [assets, setAssets] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [upcomingMaintenance, setUpcomingMaintenance] =
    useState([]);

  const [overdueMaintenance, setOverdueMaintenance] =
    useState([]);

  let user = {};

  try {
    user = JSON.parse(
      localStorage.getItem("user") || "{}"
    );
  } catch {
    user = {};
  }

  // =====================================================
  // LOAD DATA
  // =====================================================

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [
        maintenanceResponse,
        assetsResponse,
        notificationsResponse,
        upcomingResponse,
        overdueResponse,
      ] = await Promise.allSettled([
        API.get("/maintenance", { headers }),

        API.get("/assets", { headers }),

        API.get("/notifications", { headers }),

        API.get(
          "/maintenance/reminders/upcoming",
          { headers }
        ),

        API.get(
          "/maintenance/reminders/overdue",
          { headers }
        ),
      ]);

      // =================================================
      // MAINTENANCE
      // =================================================

      if (
        maintenanceResponse.status ===
        "fulfilled"
      ) {
        const data =
          maintenanceResponse.value.data;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(
              data?.maintenance
            )
          ? data.maintenance
          : Array.isArray(data?.records)
          ? data.records
          : [];

        setMaintenance(list);
      }

      // =================================================
      // ASSETS
      // =================================================

      if (
        assetsResponse.status === "fulfilled"
      ) {
        const data =
          assetsResponse.value.data;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.assets)
          ? data.assets
          : [];

        setAssets(list);
      }

      // =================================================
      // NOTIFICATIONS
      // =================================================

      if (
        notificationsResponse.status ===
        "fulfilled"
      ) {
        const data =
          notificationsResponse.value.data;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(
              data?.notifications
            )
          ? data.notifications
          : Array.isArray(data?.records)
          ? data.records
          : [];

        setNotifications(list);
      }

      // =================================================
      // UPCOMING MAINTENANCE
      // =================================================

      if (
        upcomingResponse.status ===
        "fulfilled"
      ) {
        const data =
          upcomingResponse.value.data;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.records)
          ? data.records
          : [];

        setUpcomingMaintenance(list);
      }

      // =================================================
      // OVERDUE MAINTENANCE
      // =================================================

      if (
        overdueResponse.status ===
        "fulfilled"
      ) {
        const data =
          overdueResponse.value.data;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.records)
          ? data.records
          : [];

        setOverdueMaintenance(list);
      }
    } catch (err) {
      console.error(
        "Failed to load Maintenance Staff dashboard:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to load maintenance dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [navigate]);

  // =====================================================
  // REFRESH NOTIFICATIONS
  // =====================================================

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token =
          localStorage.getItem("token");

        if (!token) return;

        const response = await API.get(
          "/notifications",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = response.data;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(
              data?.notifications
            )
          ? data.notifications
          : Array.isArray(data?.records)
          ? data.records
          : [];

        setNotifications(list);
      } catch (error) {
        console.error(
          "Failed to refresh notifications:",
          error
        );
      }
    };

    fetchNotifications();

    const interval = setInterval(
      fetchNotifications,
      30000
    );

    return () => clearInterval(interval);
  }, []);

  // =====================================================
  // STATISTICS
  // =====================================================

  const pendingMaintenance = maintenance.filter(
    (item) =>
      ["pending", "open", "scheduled"].includes(
        String(item.status || "")
          .trim()
          .toLowerCase()
      )
  ).length;

  const inProgressMaintenance =
    maintenance.filter(
      (item) =>
        ["in progress", "ongoing"].includes(
          String(item.status || "")
            .trim()
            .toLowerCase()
        )
    ).length;

  const completedMaintenance =
    maintenance.filter(
      (item) =>
        [
          "completed",
          "resolved",
          "closed",
        ].includes(
          String(item.status || "")
            .trim()
            .toLowerCase()
        )
    ).length;

  const damagedAssets = assets.filter(
    (asset) =>
      ["damaged", "poor", "broken"].includes(
        String(
          asset.asset_condition || ""
        )
          .trim()
          .toLowerCase()
      )
  ).length;

  const unreadNotifications =
    notifications.filter(
      (notification) =>
        Number(notification.is_read) === 0 ||
        notification.is_read === false ||
        Number(notification.read) === 0 ||
        notification.read === false
    ).length;

  // =====================================================
  // MENU
  // =====================================================

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

  const handleMenuClick = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setMobileOpen(false);

    navigate("/login", {
      replace: true,
    });
  };

  // =====================================================
  // SIDEBAR
  // =====================================================

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
          const isSelected =
            item.path ===
            "/maintenance-officer"
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
                onClick={() =>
                  handleMenuClick(item.path)
                }
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
                    fontWeight: isSelected
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

  // =====================================================
  // LOADING
  // =====================================================

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
        <CircularProgress
          sx={{ color: "#07548e" }}
        />
      </Box>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#f5f7fb",
      }}
    >
      <CssBaseline />

      {/* =================================================
          TOP BAR
      ================================================= */}

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
            Maintenance Staff Dashboard
          </Typography>

          {/* =================================================
              NOTIFICATION BUTTON
          ================================================= */}

          <Box
            sx={{
              position: "relative",
              mr: 2,
            }}
          >
            <IconButton
              color="inherit"
              aria-label="Notifications"
              onClick={() =>
                navigate(
                  "/maintenance-officer/notifications"
                )
              }
              sx={{
                width: 42,
                height: 42,
              }}
            >
              <NotificationIcon />

              {unreadNotifications > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 1,
                    right: 1,
                    minWidth: 19,
                    height: 19,
                    px: 0.4,
                    borderRadius: "50%",
                    backgroundColor:
                      "#d32f2f",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent:
                      "center",
                    fontSize: "10px",
                    fontWeight: 800,
                    lineHeight: 1,
                    border:
                      "2px solid #ffffff",
                  }}
                >
                  {unreadNotifications >
                  99
                    ? "99+"
                    : unreadNotifications}
                </Box>
              )}
            </IconButton>
          </Box>

          <Avatar
            sx={{
              width: 40,
              height: 40,
              backgroundColor:
                "#07548e",
            }}
          >
            {(user.name || "M")
              .charAt(0)
              .toUpperCase()}
          </Avatar>
        </Toolbar>
      </AppBar>

      {/* =================================================
          DESKTOP SIDEBAR
      ================================================= */}

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
            boxSizing:
              "border-box",
            backgroundColor:
              "#07548e",
            color: "#ffffff",
            border: "none",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* =================================================
          MOBILE SIDEBAR
      ================================================= */}

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
            boxSizing:
              "border-box",
            backgroundColor:
              "#07548e",
            color: "#ffffff",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* =================================================
          MAIN
      ================================================= */}

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
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: "#1f2937",
            mb: 1,
          }}
        >
          Welcome,{" "}
          {user.name || "Maintenance Staff"}
        </Typography>

        <Typography
          sx={{
            color: "#6b7280",
            mb: 3,
          }}
        >
          Manage reported problems,
          repairs and asset maintenance.
        </Typography>

        {error && (
          <Alert
            severity="warning"
            sx={{ mb: 3 }}
            onClose={() =>
              setError("")
            }
          >
            {error}
          </Alert>
        )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        <Grid container spacing={3}>
          {[
            {
              title: "Pending Repairs",
              value: pendingMaintenance,
              icon: (
                <MaintenanceIcon
                  fontSize="large"
                />
              ),
            },
            {
              title: "In Progress",
              value:
                inProgressMaintenance,
              icon: (
                <MaintenanceIcon
                  fontSize="large"
                />
              ),
            },
            {
              title: "Completed Repairs",
              value:
                completedMaintenance,
              icon: (
                <MaintenanceIcon
                  fontSize="large"
                />
              ),
            },
            {
              title: "Damaged Assets",
              value: damagedAssets,
              icon: (
                <AssetIcon fontSize="large" />
              ),
            },
            {
              title:
                "Unread Notifications",
              value:
                unreadNotifications,
              icon: (
                <NotificationIcon
                  fontSize="large"
                />
              ),
            },
          ].map((stat) => (
            <Grid
              size={{
                xs: 12,
                sm: 6,
                lg: 3,
              }}
              key={stat.title}
            >
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border:
                    "1px solid #e5e7eb",
                  backgroundColor:
                    "#ffffff",
                  height: "100%",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {stat.title}
                      </Typography>

                      <Typography
                        variant="h4"
                        fontWeight={800}
                      >
                        {stat.value}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 2,
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        backgroundColor:
                          "#e8f2fa",
                        color:
                          "#07548e",
                      }}
                    >
                      {stat.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* =================================================
            UPCOMING MAINTENANCE
        ================================================= */}

        <Card
          elevation={0}
          sx={{
            mt: 4,
            borderRadius: 3,
            border:
              "1px solid #e5e7eb",
            backgroundColor:
              "#ffffff",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Box>
                <Typography
                  variant="h6"
                  fontWeight={700}
                >
                  Upcoming Maintenance
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Scheduled maintenance tasks
                  coming due.
                </Typography>
              </Box>

              <Chip
                icon={<EventIcon />}
                label={
                  upcomingMaintenance.length
                }
                color="primary"
                sx={{
                  fontWeight: 700,
                }}
              />
            </Box>

            {upcomingMaintenance.length ===
            0 ? (
              <Typography color="text.secondary">
                No upcoming maintenance.
              </Typography>
            ) : (
              upcomingMaintenance
                .slice(0, 5)
                .map((item, index) => (
                  <Box
                    key={
                      item.maintenance_id ||
                      index
                    }
                    sx={{
                      py: 1.5,
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      gap: 2,
                      borderBottom:
                        index !==
                        Math.min(
                          upcomingMaintenance.length,
                          5
                        ) -
                          1
                          ? "1px solid #eeeeee"
                          : "none",
                    }}
                  >
                    <Box>
                      <Typography
                        fontWeight={600}
                      >
                        {item.asset_name ||
                          "Unknown Asset"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {item.maintenance_type ||
                          "Maintenance"}{" "}
                        •{" "}
                        {item.next_maintenance_date ||
                          "No date"}
                      </Typography>
                    </Box>

                    <Chip
                      label={
                        Number(
                          item.days_until_due
                        ) === 0
                          ? "Due today"
                          : `${item.days_until_due} days`
                      }
                      size="small"
                      color={
                        Number(
                          item.days_until_due
                        ) <= 7
                          ? "warning"
                          : "default"
                      }
                      sx={{
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    />
                  </Box>
                ))
            )}
          </CardContent>
        </Card>

        {/* =================================================
            OVERDUE MAINTENANCE
        ================================================= */}

        <Card
          elevation={0}
          sx={{
            mt: 3,
            borderRadius: 3,
            border:
              "1px solid #e5e7eb",
            backgroundColor:
              "#ffffff",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Box>
                <Typography
                  variant="h6"
                  fontWeight={700}
                >
                  Overdue Maintenance
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Tasks that have passed
                  their scheduled date.
                </Typography>
              </Box>

              <Chip
                icon={<WarningIcon />}
                label={
                  overdueMaintenance.length
                }
                color={
                  overdueMaintenance.length >
                  0
                    ? "error"
                    : "success"
                }
                sx={{
                  fontWeight: 700,
                }}
              />
            </Box>

            {overdueMaintenance.length ===
            0 ? (
              <Typography color="text.secondary">
                No overdue maintenance tasks.
              </Typography>
            ) : (
              overdueMaintenance
                .slice(0, 5)
                .map((item, index) => (
                  <Box
                    key={
                      item.maintenance_id ||
                      index
                    }
                    sx={{
                      py: 1.5,
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      gap: 2,
                      borderBottom:
                        index !==
                        Math.min(
                          overdueMaintenance.length,
                          5
                        ) -
                          1
                          ? "1px solid #eeeeee"
                          : "none",
                    }}
                  >
                    <Box>
                      <Typography
                        fontWeight={600}
                      >
                        {item.asset_name ||
                          "Unknown Asset"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {item.maintenance_type ||
                          "Maintenance"}{" "}
                        • Scheduled:{" "}
                        {item.next_maintenance_date ||
                          "N/A"}
                      </Typography>
                    </Box>

                    <Chip
                      label={`${item.days_overdue || 0} days overdue`}
                      color="error"
                      size="small"
                      sx={{
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    />
                  </Box>
                ))
            )}
          </CardContent>
        </Card>

        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <Card
          elevation={0}
          sx={{
            mt: 4,
            borderRadius: 3,
            border:
              "1px solid #e5e7eb",
            backgroundColor:
              "#ffffff",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ mb: 3 }}
            >
              Maintenance Actions
            </Typography>

            <Grid container spacing={2}>
              {[
                {
                  title:
                    "Maintenance Requests",
                  description:
                    "View and process reported problems.",
                  icon: (
                    <MaintenanceIcon />
                  ),
                  path:
                    "/maintenance-officer/requests",
                },
                {
                  title: "Assets",
                  description:
                    "View assets and their maintenance condition.",
                  icon: <AssetIcon />,
                  path:
                    "/maintenance-officer/assets",
                },
                {
                  title: "History",
                  description:
                    "Review completed maintenance work.",
                  icon: <HistoryIcon />,
                  path:
                    "/maintenance-officer/history",
                },
                {
                  title: "Reports",
                  description:
                    "Review maintenance activity and history.",
                  icon: <ReportIcon />,
                  path:
                    "/maintenance-officer/reports",
                },
                {
                  title:
                    "Notifications",
                  description:
                    "View maintenance-related notifications.",
                  icon: (
                    <NotificationIcon />
                  ),
                  path:
                    "/maintenance-officer/notifications",
                },
              ].map((action) => (
                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 3,
                  }}
                  key={action.title}
                >
                  <Box
                    onClick={() =>
                      navigate(
                        action.path
                      )
                    }
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border:
                        "1px solid #e5e7eb",
                      cursor: "pointer",
                      height: "100%",
                      transition:
                        "0.2s",

                      "&:hover": {
                        borderColor:
                          "#07548e",
                        backgroundColor:
                          "#f5f9fc",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        color:
                          "#07548e",
                        mb: 1,
                      }}
                    >
                      {action.icon}
                    </Box>

                    <Typography fontWeight={700}>
                      {action.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {action.description}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* =================================================
            RECENT MAINTENANCE
        ================================================= */}

        <Card
          elevation={0}
          sx={{
            mt: 4,
            borderRadius: 3,
            border:
              "1px solid #e5e7eb",
            backgroundColor:
              "#ffffff",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ mb: 2 }}
            >
              Recent Maintenance
            </Typography>

            {maintenance.length ===
            0 ? (
              <Typography color="text.secondary">
                No maintenance records
                found.
              </Typography>
            ) : (
              maintenance
                .slice(0, 5)
                .map((item, index) => (
                  <Box
                    key={
                      item.maintenance_id ||
                      item.id ||
                      index
                    }
                    sx={{
                      py: 1.5,
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      gap: 2,
                      borderBottom:
                        index !==
                        Math.min(
                          maintenance.length,
                          5
                        ) -
                          1
                          ? "1px solid #eeeeee"
                          : "none",
                    }}
                  >
                    <Box>
                      <Typography
                        fontWeight={600}
                      >
                        {item.asset_name ||
                          "Maintenance Record"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {item.description ||
                          item.issue_type ||
                          item.problem_type ||
                          "No description"}
                      </Typography>
                    </Box>

                    <Chip
                      label={
                        item.status ||
                        "Scheduled"
                      }
                      size="small"
                      color={
                        String(
                          item.status ||
                            ""
                        ).toLowerCase() ===
                        "completed"
                          ? "success"
                          : String(
                              item.status ||
                                ""
                            ).toLowerCase() ===
                            "in progress"
                          ? "warning"
                          : "default"
                      }
                      sx={{
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                ))
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default MaintenanceOfficerDashboard;