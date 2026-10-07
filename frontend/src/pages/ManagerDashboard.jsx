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
  Assignment as RequestIcon,
  Inventory2 as AssetIcon,
  Build as MaintenanceIcon,
  Assessment as ReportIcon,
  Notifications as NotificationIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import API from "../services/api";

const drawerWidth = 250;
const topBarHeight = 64;

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [assets, setAssets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [notifications, setNotifications] =
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
  // LOAD DASHBOARD
  // =====================================================
  const loadDashboard = async () => {
    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        navigate("/login", {
          replace: true,
        });
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [
        assetsResponse,
        requestsResponse,
        maintenanceResponse,
        notificationsResponse,
      ] = await Promise.allSettled([
        API.get("/assets", { headers }),
        API.get("/requests", { headers }),
        API.get("/maintenance", { headers }),
        API.get("/notifications", { headers }),
      ]);

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
      // REQUESTS
      // =================================================
      if (
        requestsResponse.status === "fulfilled"
      ) {
        const data =
          requestsResponse.value.data;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.requests)
          ? data.requests
          : Array.isArray(data?.records)
          ? data.records
          : [];

        setRequests(list);
      }

      // =================================================
      // MAINTENANCE
      // =================================================
      if (
        maintenanceResponse.status === "fulfilled"
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
    } catch (err) {
      console.error(
        "Failed to load Manager Dashboard:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to load Manager Dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
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
      } catch (err) {
        console.error(
          "Failed to refresh Manager notifications:",
          err
        );
      }
    };

    fetchNotifications();

    const interval = setInterval(
      fetchNotifications,
      30000
    );

    return () => {
      clearInterval(interval);
    };
  }, []);

  // =====================================================
  // STATISTICS
  // =====================================================

  const availableAssets = assets.filter(
    (asset) =>
      String(asset.status || "")
        .toLowerCase()
        .trim() === "available"
  ).length;

  const assignedAssets = assets.filter(
    (asset) =>
      String(asset.status || "")
        .toLowerCase()
        .trim() === "assigned"
  ).length;

  const maintenanceAssets = assets.filter(
    (asset) =>
      [
        "maintenance",
        "under maintenance",
      ].includes(
        String(asset.status || "")
          .toLowerCase()
          .trim()
      )
  ).length;

  const pendingRequests = requests.filter(
    (request) =>
      ["pending", "submitted"].includes(
        String(request.status || "")
          .toLowerCase()
          .trim()
      )
  ).length;

  const pendingMaintenance =
    maintenance.filter(
      (item) =>
        [
          "pending",
          "scheduled",
          "open",
        ].includes(
          String(item.status || "")
            .toLowerCase()
            .trim()
        )
    ).length;

  const inProgressMaintenance =
    maintenance.filter(
      (item) =>
        [
          "in progress",
          "ongoing",
        ].includes(
          String(item.status || "")
            .toLowerCase()
            .trim()
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

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

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

      <List sx={{ px: 1.5, mt: 2 }}>
        {menuItems.map((item) => {
          const selected =
            item.path === "/manager"
              ? location.pathname ===
                "/manager"
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

              <ListItemText primary="Logout" />
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

      {/* =====================================================
          TOP BAR
      ===================================================== */}

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
            Manager Dashboard
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
                  "/manager/notifications"
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
                    alignItems:
                      "center",
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

      {/* =====================================================
          DESKTOP SIDEBAR
      ===================================================== */}

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

      {/* =====================================================
          MOBILE SIDEBAR
      ===================================================== */}

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

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

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
        }}
      >
        <Typography
          variant="h5"
          fontWeight={800}
          sx={{ mb: 1 }}
        >
          Welcome,{" "}
          {user.name || "Manager"}
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Review requests, monitor assets,
          and oversee maintenance activities.
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

        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <Grid container spacing={3}>
          {[
            {
              title: "Total Assets",
              value: assets.length,
              icon: (
                <AssetIcon fontSize="large" />
              ),
            },
            {
              title: "Available Assets",
              value: availableAssets,
              icon: (
                <AssetIcon fontSize="large" />
              ),
            },
            {
              title: "Assigned Assets",
              value: assignedAssets,
              icon: (
                <AssetIcon fontSize="large" />
              ),
            },
            {
              title: "Pending Requests",
              value: pendingRequests,
              icon: (
                <RequestIcon fontSize="large" />
              ),
            },
            {
              title: "Under Maintenance",
              value: maintenanceAssets,
              icon: (
                <MaintenanceIcon
                  fontSize="large"
                />
              ),
            },
            {
              title: "Pending Maintenance",
              value: pendingMaintenance,
              icon: (
                <MaintenanceIcon
                  fontSize="large"
                />
              ),
            },
          ].map((stat) => (
            <Grid
              size={{
                xs: 12,
                sm: 6,
                lg: 4,
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
                        color: "#07548e",
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

        {/* =====================================================
            MANAGEMENT OVERVIEW
        ===================================================== */}

        <Card
          elevation={0}
          sx={{
            mt: 4,
            borderRadius: 3,
            border:
              "1px solid #e5e7eb",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ mb: 3 }}
            >
              Management Overview
            </Typography>

            <Grid container spacing={2}>
              {[
                {
                  title:
                    "Requests & Approvals",
                  text:
                    "Review requests requiring management attention.",
                  icon: (
                    <RequestIcon />
                  ),
                  path:
                    "/manager/requests",
                },
                {
                  title:
                    "Asset Summary",
                  text:
                    "Monitor asset availability and assignment status.",
                  icon: (
                    <AssetIcon />
                  ),
                  path:
                    "/manager/assets",
                },
                {
                  title:
                    "Maintenance Summary",
                  text:
                    "Monitor pending and active maintenance work.",
                  icon: (
                    <MaintenanceIcon />
                  ),
                  path:
                    "/manager/maintenance",
                },
                {
                  title: "Reports",
                  text:
                    "Review management-level reports.",
                  icon: (
                    <ReportIcon />
                  ),
                  path:
                    "/manager/reports",
                },
              ].map((item) => (
                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 3,
                  }}
                  key={item.title}
                >
                  <Box
                    onClick={() =>
                      navigate(item.path)
                    }
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border:
                        "1px solid #e5e7eb",
                      cursor:
                        "pointer",
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
                      {item.icon}
                    </Box>

                    <Typography
                      fontWeight={700}
                    >
                      {item.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {item.text}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* =====================================================
            RECENT REQUESTS
        ===================================================== */}

        <Card
          elevation={0}
          sx={{
            mt: 4,
            borderRadius: 3,
            border:
              "1px solid #e5e7eb",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                mb: 2,
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
              >
                Recent Requests
              </Typography>

              <Chip
                label={`${pendingRequests} pending`}
                color={
                  pendingRequests > 0
                    ? "warning"
                    : "success"
                }
                sx={{
                  fontWeight: 700,
                }}
              />
            </Box>

            {requests.length === 0 ? (
              <Typography color="text.secondary">
                No requests found.
              </Typography>
            ) : (
              requests
                .slice(0, 5)
                .map((request, index) => (
                  <Box
                    key={
                      request.request_id ||
                      request.id ||
                      index
                    }
                    sx={{
                      py: 1.5,
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: 2,
                      borderBottom:
                        index !==
                        Math.min(
                          requests.length,
                          5
                        ) -
                          1
                          ? "1px solid #eeeeee"
                          : "none",
                    }}
                  >
                    <Box>
                      <Typography fontWeight={600}>
                        {request.asset_name ||
                          "Asset Request"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {request.user_name ||
                          request.employee_name ||
                          "Employee"}
                      </Typography>
                    </Box>

                    <Chip
                      label={
                        request.status ||
                        "Pending"
                      }
                      size="small"
                      sx={{
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                ))
            )}
          </CardContent>
        </Card>

        {/* =====================================================
            MAINTENANCE SUMMARY
        ===================================================== */}

        <Card
          elevation={0}
          sx={{
            mt: 4,
            borderRadius: 3,
            border:
              "1px solid #e5e7eb",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ mb: 2 }}
            >
              Maintenance Summary
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Chip
                label={`Pending: ${pendingMaintenance}`}
                color="warning"
                sx={{
                  fontWeight: 700,
                }}
              />

              <Chip
                label={`In Progress: ${inProgressMaintenance}`}
                color="primary"
                sx={{
                  fontWeight: 700,
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ManagerDashboard;