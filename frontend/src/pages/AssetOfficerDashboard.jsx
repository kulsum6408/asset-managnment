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
} from "@mui/material";

import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory2 as AssetIcon,
  Inventory as BinCardIcon,
  Storefront as StoreIcon,
  Assignment as RequestIcon,
  AssignmentTurnedIn as AssignmentIcon,
  KeyboardReturn as ReturnIcon,
  SwapHoriz as TransferIcon,
  Build as MaintenanceIcon,
  Assessment as ReportIcon,
  Notifications as NotificationIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  QrCodeScanner as ScannerIcon,
  DeleteForever as DisposalIcon,
  FactCheck as InventoryCheckIcon,
  Calculate as DepreciationIcon,
} from "@mui/icons-material";

import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

const drawerWidth = 250;
const topBarHeight = 64;

const AssetOfficerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [assets, setAssets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [returns, setReturns] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [notifications, setNotifications] = useState([]);

  let user = {};

  try {
    user = JSON.parse(
      localStorage.getItem("user") || "{}"
    );
  } catch {
    user = {};
  }

  // =====================================================
  // LOAD DASHBOARD DATA
  // =====================================================

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [
        assetsResponse,
        requestsResponse,
        assignmentsResponse,
        returnsResponse,
        maintenanceResponse,
        notificationsResponse,
      ] = await Promise.allSettled([
        API.get("/assets", { headers }),
        API.get("/requests", { headers }),
        API.get("/assignments", { headers }),
        API.get("/returns", { headers }),
        API.get("/maintenance", { headers }),
        API.get("/notifications", { headers }),
      ]);

      // -------------------------------------------------
      // ASSETS
      // -------------------------------------------------

      if (assetsResponse.status === "fulfilled") {
        const data = assetsResponse.value.data;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.assets)
          ? data.assets
          : [];

        setAssets(list);
      }

      // -------------------------------------------------
      // REQUESTS
      // -------------------------------------------------

      if (requestsResponse.status === "fulfilled") {
        const data = requestsResponse.value.data;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.requests)
          ? data.requests
          : [];

        setRequests(list);
      }

      // -------------------------------------------------
      // ASSIGNMENTS
      // -------------------------------------------------

      if (assignmentsResponse.status === "fulfilled") {
        const data =
          assignmentsResponse.value.data;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.assignments)
          ? data.assignments
          : [];

        setAssignments(list);
      }

      // -------------------------------------------------
      // RETURNS
      // -------------------------------------------------

      if (returnsResponse.status === "fulfilled") {
        const data =
          returnsResponse.value.data;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.returns)
          ? data.returns
          : [];

        setReturns(list);
      }

      // -------------------------------------------------
      // MAINTENANCE
      // -------------------------------------------------

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
          : Array.isArray(data?.maintenance)
          ? data.maintenance
          : Array.isArray(data?.records)
          ? data.records
          : [];

        setMaintenance(list);
      }

      // -------------------------------------------------
      // NOTIFICATIONS
      // -------------------------------------------------

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
          : [];

        setNotifications(list);
      }
    } catch (err) {
      console.error(
        "Failed to load Asset Officer dashboard:",
        err
      );

      setError(
        "Unable to load dashboard information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [navigate]);

  // =====================================================
  // REFRESH UNREAD NOTIFICATIONS
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

  const totalAssets = assets.length;

  const availableAssets = assets.filter(
    (asset) =>
      String(asset.status || "")
        .toLowerCase() === "available"
  ).length;

  const assignedAssets = assets.filter(
    (asset) =>
      String(asset.status || "")
        .toLowerCase() === "assigned"
  ).length;

  const maintenanceAssets = assets.filter(
    (asset) =>
      [
        "maintenance",
        "under maintenance",
      ].includes(
        String(asset.status || "").toLowerCase()
      )
  ).length;

  const pendingRequests = requests.filter(
    (request) =>
      String(request.status || "")
        .toLowerCase() === "pending"
  ).length;

  const activeAssignments =
    assignments.filter(
      (assignment) =>
        String(assignment.status || "")
          .toLowerCase() === "active"
    );

  const overdueReturns =
    activeAssignments.filter(
      (assignment) => {
        if (!assignment.expected_return_date) {
          return false;
        }

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const returnDate = new Date(
          assignment.expected_return_date
        );

        returnDate.setHours(0, 0, 0, 0);

        return returnDate < today;
      }
    ).length;

  const openMaintenance = maintenance.filter(
    (item) => {
      const status = String(
        item.status || ""
      ).toLowerCase();

      return ![
        "completed",
        "closed",
        "resolved",
      ].includes(status);
    }
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
      path: "/asset-officer",
    },

    {
      text: "Assets",
      icon: <AssetIcon />,
      path: "/asset-officer/assets",
    },

    {
      text: "Store / Inventory",
      icon: <StoreIcon />,
      path: "/asset-officer/store",
    },

    {
      text: "Bin Card",
      icon: <BinCardIcon />,
      path: "/asset-officer/bin-card",
    },

    {
      text: "Asset Lookup",
      icon: <ScannerIcon />,
      path: "/asset-officer/asset-lookup",
    },

    {
      text: "Inventory Check",
      icon: <InventoryCheckIcon />,
      path: "/asset-officer/inventory-checks",
    },

    {
      text: "Depreciation",
      icon: <DepreciationIcon />,
      path: "/asset-officer/depreciation",
    },

    {
      text: "Requests",
      icon: <RequestIcon />,
      path: "/asset-officer/requests",
    },

    {
      text: "Assignments",
      icon: <AssignmentIcon />,
      path: "/asset-officer/assignments",
    },

    {
      text: "Returns",
      icon: <ReturnIcon />,
      path: "/asset-officer/returns",
    },

    {
      text: "Transfers",
      icon: <TransferIcon />,
      path: "/asset-officer/transfers",
    },

    {
      text: "Maintenance",
      icon: <MaintenanceIcon />,
      path: "/asset-officer/maintenance",
    },

    // ===================================================
    // DISPOSAL
    // ===================================================


    {
      text: "Disposal",
      icon: <DisposalIcon />,
      path: "/asset-officer/disposal",
    },

    {
      text: "Reports",
      icon: <ReportIcon />,
      path: "/asset-officer/reports",
    },

    {
      text: "Notifications",
      icon: <NotificationIcon />,
      path: "/asset-officer/notifications",
    },

    {
      text: "Settings",
      icon: <SettingsIcon />,
      path: "/asset-officer/settings",
    },
  ];

  // =====================================================
  // MENU CLICK
  // =====================================================

  const handleMenuClick = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  // =====================================================
  // LOGOUT
  // =====================================================

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
            item.path === "/asset-officer"
              ? location.pathname ===
                "/asset-officer"
              : location.pathname.startsWith(
                  item.path
                );

          return (
            <ListItem
              key={item.text}
              disablePadding
              sx={{
                mb: 0.5,
              }}
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
  // DASHBOARD
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
            Asset Officer Dashboard
          </Typography>

          {/* =====================================================
              NOTIFICATIONS
          ===================================================== */}

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
                  "/asset-officer/notifications"
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
                  {unreadNotifications > 99
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
              backgroundColor: "#07548e",
            }}
          >
            {(user.name || "A")
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
            boxSizing: "border-box",
            backgroundColor: "#07548e",
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
            boxSizing: "border-box",
            backgroundColor: "#07548e",
            color: "#ffffff",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* =====================================================
          MAIN
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
          {user.name || "Asset Officer"}
        </Typography>

        <Typography
          sx={{
            color: "#6b7280",
            mb: 3,
          }}
        >
          Manage assets, requests,
          assignments, returns, transfers,
          maintenance and disposal.
        </Typography>

        {error && (
          <Alert
            severity="warning"
            sx={{ mb: 3 }}
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
              value: totalAssets,
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
                <AssignmentIcon fontSize="large" />
              ),
            },

            {
              title: "Under Maintenance",
              value: maintenanceAssets,
              icon: (
                <MaintenanceIcon fontSize="large" />
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
              title: "Overdue Returns",
              value: overdueReturns,
              icon: (
                <ReturnIcon fontSize="large" />
              ),
            },

            {
              title: "Open Maintenance",
              value: openMaintenance,
              icon: (
                <MaintenanceIcon fontSize="large" />
              ),
            },

            {
              title: "Unread Notifications",
              value: unreadNotifications,
              icon: (
                <NotificationIcon fontSize="large" />
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
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            "#6b7280",
                          mb: 1,
                        }}
                      >
                        {stat.title}
                      </Typography>

                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 800,
                          color:
                            "#1f2937",
                        }}
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

        {/* =====================================================
            QUICK ACTIONS
        ===================================================== */}

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
              sx={{
                fontWeight: 700,
                mb: 3,
              }}
            >
              Asset Officer Actions
            </Typography>

            <Grid container spacing={2}>
              {[
                {
                  title: "Manage Assets",
                  description:
                    "Register, update and review assets.",
                  icon: <AssetIcon />,
                  path: "/asset-officer/assets",
                },

                {
                  title: "Store / Inventory",
                  description:
                    "Monitor store inventory and stock levels.",
                  icon: <StoreIcon />,
                  path: "/asset-officer/store",
                },

                {
                  title: "Bin Card",
                  description:
                    "View asset movement and transaction history.",
                  icon: <BinCardIcon />,
                  path: "/asset-officer/bin-card",
                },

                {
                  title: "Asset Lookup",
                  description:
                    "Find an asset quickly using its ID or serial number.",
                  icon: <ScannerIcon />,
                  path: "/asset-officer/asset-lookup",
                },

                {
                  title: "Inventory Check",
                  description:
                    "Perform and review annual physical inventory checks.",
                  icon: <InventoryCheckIcon />,
                  path: "/asset-officer/inventory-checks",
                },

                {
                  title: "Depreciation",
                  description:
                    "Calculate and record asset depreciation.",
                  icon: <DepreciationIcon />,
                  path: "/asset-officer/depreciation",
                },

                {
                  title: "Review Requests",
                  description:
                    "Review employee asset requests.",
                  icon: <RequestIcon />,
                  path: "/asset-officer/requests",
                },

                {
                  title: "Assign Assets",
                  description:
                    "Assign available assets to employees.",
                  icon: <AssignmentIcon />,
                  path: "/asset-officer/assignments",
                },

                {
                  title: "Process Returns",
                  description:
                    "Review and process returned assets.",
                  icon: <ReturnIcon />,
                  path: "/asset-officer/returns",
                },

                {
                  title: "Transfers",
                  description:
                    "Move assets between employees or locations.",
                  icon: <TransferIcon />,
                  path: "/asset-officer/transfers",
                },

                {
                  title: "Maintenance",
                  description:
                    "View assets requiring maintenance.",
                  icon: <MaintenanceIcon />,
                  path: "/asset-officer/maintenance",
                },

                // =================================================
                // DISPOSAL QUICK ACTION
                // =================================================

                {
                  title: "Disposal",
                  description:
                    "Dispose of damaged, obsolete or unusable assets.",
                  icon: <DisposalIcon />,
                  path: "/asset-officer/disposal",
                },

                {
                  title: "Reports",
                  description:
                    "View and generate asset reports.",
                  icon: <ReportIcon />,
                  path: "/asset-officer/reports",
                },
              ].map((action) => (
                <Grid
                  size={{
                    xs: 12,
                    sm: 6,
                    md: 4,
                  }}
                  key={action.title}
                >
                  <Box
                    onClick={() =>
                      navigate(action.path)
                    }
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border:
                        "1px solid #e5e7eb",
                      cursor: "pointer",
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
                        color: "#07548e",
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

        {/* =====================================================
            PENDING REQUESTS
        ===================================================== */}

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
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                }}
              >
                Pending Employee Requests
              </Typography>

              <Typography
                sx={{
                  color: "#07548e",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                onClick={() =>
                  navigate(
                    "/asset-officer/requests"
                  )
                }
              >
                View All
              </Typography>
            </Box>

            {requests.filter(
              (request) =>
                String(
                  request.status || ""
                ).toLowerCase() ===
                "pending"
            ).length === 0 ? (
              <Typography color="text.secondary">
                No pending requests.
              </Typography>
            ) : (
              requests
                .filter(
                  (request) =>
                    String(
                      request.status || ""
                    ).toLowerCase() ===
                    "pending"
                )
                .slice(0, 5)
                .map((request, index) => (
                  <Box
                    key={
                      request.request_id ||
                      index
                    }
                    sx={{
                      py: 1.5,
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      borderBottom:
                        index !== 4
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
                        {request.requester_name ||
                          request.employee_name ||
                          "Employee"}
                      </Typography>
                    </Box>

                    <Typography
                      sx={{
                        fontWeight: 700,
                        color: "#ed6c02",
                      }}
                    >
                      Pending
                    </Typography>
                  </Box>
                ))
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default AssetOfficerDashboard;