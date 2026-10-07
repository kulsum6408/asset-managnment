import React, { useEffect, useState } from "react";
import BackButton from "../components/BackButton";
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
  People as PeopleIcon,
  Inventory2 as AssetIcon,
  Category as CategoryIcon,
  Assignment as RequestIcon,
  AssignmentTurnedIn as AssignmentIcon,
  Assessment as ReportIcon,
  Notifications as NotificationIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  TrendingUp as ActivityIcon,
  ReceiptLong as BinCardIcon,
  Recycling as DisposalIcon,
  Autorenew as TransfersIcon,
  AssignmentReturn as ReturnsIcon,
  FactCheck as InventoryCheckIcon,
  AccountBalance as DepreciationIcon,
} from "@mui/icons-material";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import API from "../services/api";

const drawerWidth = 250;
const topBarHeight = 64;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [assets, setAssets] =
    useState([]);

  const [users, setUsers] =
    useState([]);

  const [requests, setRequests] =
    useState([]);

  const [assignments, setAssignments] =
    useState([]);

  const [notifications, setNotifications] =
    useState([]);

  // =====================================================
  // CURRENT USER
  // =====================================================

  let user = {};

  try {
    user = JSON.parse(
      localStorage.getItem("user") || "{}"
    );
  } catch {
    user = {};
  }

  // =====================================================
  // RESPONSE LIST HELPER
  // =====================================================

  const getList = (
    response,
    possibleKeys = []
  ) => {
    const data = response?.data;

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    for (const key of possibleKeys) {
      if (Array.isArray(data?.[key])) {
        return data[key];
      }
    }

    return [];
  };

  // =====================================================
  // LOAD ADMIN DASHBOARD DATA
  // =====================================================

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

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

      const results =
        await Promise.allSettled([
          API.get("/assets", {
            headers,
          }),

          API.get("/users", {
            headers,
          }),

          API.get("/requests", {
            headers,
          }),

          API.get("/assignments", {
            headers,
          }),

          API.get("/notifications", {
            headers,
          }),
        ]);

      // ===================================================
      // ASSETS
      // ===================================================

      if (
        results[0].status ===
        "fulfilled"
      ) {
        setAssets(
          getList(
            results[0].value,
            ["assets"]
          )
        );
      }

      // ===================================================
      // USERS
      // ===================================================

      if (
        results[1].status ===
        "fulfilled"
      ) {
        setUsers(
          getList(
            results[1].value,
            ["users"]
          )
        );
      }

      // ===================================================
      // REQUESTS
      // ===================================================

      if (
        results[2].status ===
        "fulfilled"
      ) {
        setRequests(
          getList(
            results[2].value,
            ["requests"]
          )
        );
      }

      // ===================================================
      // ASSIGNMENTS
      // ===================================================

      if (
        results[3].status ===
        "fulfilled"
      ) {
        setAssignments(
          getList(
            results[3].value,
            ["assignments"]
          )
        );
      }

      // ===================================================
      // NOTIFICATIONS
      // ===================================================

      if (
        results[4].status ===
        "fulfilled"
      ) {
        setNotifications(
          getList(
            results[4].value,
            ["notifications"]
          )
        );
      }

      // ===================================================
      // CHECK COMPLETE FAILURE
      // ===================================================

      const allFailed =
        results.every(
          (result) =>
            result.status ===
            "rejected"
        );

      if (allFailed) {
        setError(
          "Unable to load administrator dashboard information."
        );
      }
    } catch (err) {
      console.error(
        "Admin dashboard error:",
        err
      );

      setError(
        "Unable to load dashboard information."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // =====================================================
  // REFRESH NOTIFICATIONS
  // =====================================================

  useEffect(() => {
    const fetchNotifications =
      async () => {
        try {
          const token =
            localStorage.getItem(
              "token"
            );

          if (!token) return;

          const response =
            await API.get(
              "/notifications",
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

          setNotifications(
            getList(
              response,
              ["notifications"]
            )
          );
        } catch (err) {
          console.error(
            "Notification refresh error:",
            err
          );
        }
      };

    fetchNotifications();

    const interval =
      setInterval(
        fetchNotifications,
        30000
      );

    return () =>
      clearInterval(interval);
  }, []);

  // =====================================================
  // SYSTEM STATISTICS
  // =====================================================

  const totalAssets =
    assets.length;

  const totalUsers =
    users.length;

  const totalEmployees =
    users.filter((u) => {
      const role = String(
        u.role || ""
      ).toLowerCase();

      return role === "employee";
    }).length;

  const totalAssetOfficers =
    users.filter((u) => {
      const role = String(
        u.role || ""
      ).toLowerCase();

      return (
        role ===
        "asset_officer"
      );
    }).length;

  const totalMaintenanceOfficers =
    users.filter((u) => {
      const role = String(
        u.role || ""
      ).toLowerCase();

      return (
        role ===
          "maintenance_officer" ||
        role ===
          "maintenance staff"
      );
    }).length;

  const totalFinanceOfficers =
    users.filter((u) => {
      const role = String(
        u.role || ""
      ).toLowerCase();

      return (
        role ===
        "finance_officer"
      );
    }).length;

  const totalManagers =
    users.filter((u) => {
      const role = String(
        u.role || ""
      ).toLowerCase();

      return role === "manager";
    }).length;

  const availableAssets =
    assets.filter((asset) => {
      const status = String(
        asset.status || ""
      ).toLowerCase();

      return (
        status === "available" ||
        status === "in stock" ||
        status === "in_stock"
      );
    }).length;

  const assignedAssets =
    assets.filter((asset) => {
      const status = String(
        asset.status || ""
      ).toLowerCase();

      return status === "assigned";
    }).length;

  const pendingRequests =
    requests.filter((request) => {
      const status = String(
        request.status || ""
      ).toLowerCase();

      return status === "pending";
    }).length;

  const activeAssignments =
    assignments.filter(
      (assignment) => {
        const status = String(
          assignment.status || ""
        ).toLowerCase();

        return (
          status === "active" ||
          status === "assigned" ||
          status === "issued"
        );
      }
    ).length;

  const unreadNotifications =
    notifications.filter(
      (notification) =>
        Number(
          notification.is_read
        ) === 0 ||
        notification.is_read ===
          false ||
        Number(
          notification.read
        ) === 0 ||
        notification.read ===
          false
    ).length;

  // =====================================================
  // ADMIN MENU
  // =====================================================

  const menuItems = [
    
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      path: "/admin",
    },

    {
      text: "Users",
      icon: <PeopleIcon />,
      path: "/admin/users",
    },

    {
      text: "Assets",
      icon: <AssetIcon />,
      path: "/admin/assets",
    },

    {
      text: "Categories",
      icon: <CategoryIcon />,
      path: "/admin/categories",
    },

    {
      text: "Requests",
      icon: <RequestIcon />,
      path: "/admin/requests",
    },

    {
      text: "Assignments",
      icon: <AssignmentIcon />,
      path: "/admin/assignments",
    },

    {
      text: "Transfers",
      icon: <TransfersIcon />,
      path: "/admin/transfers",
    },

    {
      text: "Returns",
      icon: <ReturnsIcon />,
      path: "/admin/returns",
    },

    {
      text: "Disposals",
      icon: <DisposalIcon />,
      path: "/admin/disposal",
    },

    {
      text: "Depreciation",
      icon: <DepreciationIcon />,
      path: "/admin/depreciation",
    },

    {
      text: "Bin Card",
      icon: <BinCardIcon />,
      path: "/admin/bin-card",
    },

    {
      text: "Inventory Checks",
      icon: <InventoryCheckIcon />,
      path: "/admin/inventory-checks",
    },

    {
      text: "Reports",
      icon: <ReportIcon />,
      path: "/admin/reports",
    },

    {
      text: "Notifications",
      icon: <NotificationIcon />,
      path: "/admin/notifications",
    },

    {
      text: "Settings",
      icon: <SettingsIcon />,
      path: "/admin/settings",
    },
  ];

  // =====================================================
  // MENU CLICK
  // =====================================================

  const handleMenuClick = (
    path
  ) => {
    navigate(path);
    setMobileOpen(false);
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

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
          justifyContent:
            "center",
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
        {menuItems.map(
          (item) => {
            const isSelected =
              item.path === "/admin"
                ? location.pathname ===
                  "/admin"
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
                  selected={
                    isSelected
                  }
                  onClick={() =>
                    handleMenuClick(
                      item.path
                    )
                  }
                  sx={{
                    borderRadius: 2,
                    color:
                      "#ffffff",

                    "&.Mui-selected":
                      {
                        backgroundColor:
                          "rgba(255,255,255,0.16)",
                      },

                    "&.Mui-selected:hover":
                      {
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
                      color:
                        "#ffffff",
                      minWidth: 42,
                    }}
                  >
                    {
                      item.icon
                    }
                  </ListItemIcon>

                  <ListItemText
                    primary={
                      item.text
                    }
                    slotProps={{ primary: {
                      fontWeight:
                        isSelected
                          ? 700
                          : 500,
                    } }}
                  />
                </ListItemButton>
              </ListItem>
            );
          }
        )}

        <Box sx={{ mt: 3 }}>
          <ListItem
            disablePadding
          >
            <ListItemButton
              onClick={
                handleLogout
              }
              sx={{
                borderRadius: 2,
                color:
                  "#ffffff",

                "&:hover": {
                  backgroundColor:
                    "rgba(255,255,255,0.1)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color:
                    "#ffffff",
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
          minHeight:
            "100vh",
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
        }}
      >
        <CircularProgress
          sx={{
            color:
              "#07548e",
          }}
        />
      </Box>
    );
  }

  // =====================================================
  // ADMIN DASHBOARD
  // =====================================================

  return (
    <Box
      sx={{
     

        display: "flex",
        minHeight:
          "100vh",
        backgroundColor:
          "#f5f7fb",
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

          backgroundColor:
            "#ffffff",

          color:
            "#1f2937",

          boxShadow:
            "0 2px 10px rgba(0,0,0,0.06)",

          zIndex: (theme) =>
            theme.zIndex.drawer +
            1,
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
              setMobileOpen(
                true
              )
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
            Administrator
            Dashboard
          </Typography>

          {/* NOTIFICATIONS */}

          <Box
            sx={{
              position:
                "relative",
              mr: 2,
            }}
          >
            <IconButton
              color="inherit"
              onClick={() =>
                navigate(
                  "/admin/notifications"
                )
              }
              sx={{
                width: 42,
                height: 42,
              }}
            >
              <NotificationIcon />

              {unreadNotifications >
                0 && (
                <Box
                  sx={{
                    position:
                      "absolute",
                    top: 1,
                    right: 1,
                    minWidth: 19,
                    height: 19,
                    px: 0.4,
                    borderRadius:
                      "50%",
                    backgroundColor:
                      "#d32f2f",
                    color:
                      "#ffffff",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    fontSize:
                      "10px",
                    fontWeight:
                      800,
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
            {(
              user.name ||
              "A"
            )
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

          width:
            drawerWidth,

          flexShrink: 0,

          "& .MuiDrawer-paper":
            {
              width:
                drawerWidth,

              boxSizing:
                "border-box",

              backgroundColor:
                "#07548e",

              color:
                "#ffffff",

              border:
                "none",
            },
        }}
      >
        {
          drawerContent
        }
      </Drawer>

      {/* =================================================
          MOBILE SIDEBAR
      ================================================= */}

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() =>
          setMobileOpen(
            false
          )
        }
        ModalProps={{
          keepMounted:
            true,
        }}
        sx={{
          display: {
            xs: "block",
            sm: "none",
          },

          "& .MuiDrawer-paper":
            {
              width:
                drawerWidth,

              boxSizing:
                "border-box",

              backgroundColor:
                "#07548e",

              color:
                "#ffffff",
            },
        }}
      >
        {
          drawerContent
        }
      </Drawer>

      {/* =================================================
          MAIN CONTENT
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

          minHeight:
            "100vh",

          boxSizing:
            "border-box",
        }}
      >
        {/* =================================================
            WELCOME
        ================================================= */}

        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color:
                "#1f2937",
              mb: 1,
            }}
          >
            Welcome,{" "}
            {user.name ||
              "Administrator"}
          </Typography>

          <Typography
            sx={{
              color:
                "#6b7280",
            }}
          >
            Monitor and manage
            the complete Asset
            Management System.
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="warning"
            sx={{
              mb: 3,
            }}
          >
            {error}
          </Alert>
        )}

        {/* =================================================
            SYSTEM OVERVIEW
        ================================================= */}

        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            mb: 2,
          }}
        >
          System Overview
        </Typography>

        <Grid
          container
          spacing={3}
        >
          {[
            {
              title:
                "Total Users",
              value:
                totalUsers,
              icon: (
                <PeopleIcon fontSize="large" />
              ),
            },

            {
              title:
                "Total Employees",
              value:
                totalEmployees,
              icon: (
                <PeopleIcon fontSize="large" />
              ),
            },

            {
              title:
                "Total Assets",
              value:
                totalAssets,
              icon: (
                <AssetIcon fontSize="large" />
              ),
            },

            {
              title:
                "Available Assets",
              value:
                availableAssets,
              icon: (
                <AssetIcon fontSize="large" />
              ),
            },

            {
              title:
                "Assigned Assets",
              value:
                assignedAssets,
              icon: (
                <AssignmentIcon fontSize="large" />
              ),
            },

            {
              title:
                "Pending Requests",
              value:
                pendingRequests,
              icon: (
                <RequestIcon fontSize="large" />
              ),
            },

            {
              title:
                "Active Assignments",
              value:
                activeAssignments,
              icon: (
                <ActivityIcon fontSize="large" />
              ),
            },

            {
              title:
                "Notifications",
              value:
                unreadNotifications,
              icon: (
                <NotificationIcon fontSize="large" />
              ),
            },
          ].map(
            (stat) => (
              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                  lg: 3,
                }}
                key={
                  stat.title
                }
              >
                <Card
                  elevation={0}
                  sx={{
                    borderRadius:
                      3,

                    border:
                      "1px solid #e5e7eb",

                    backgroundColor:
                      "#ffffff",

                    height:
                      "100%",
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display:
                          "flex",

                        justifyContent:
                          "space-between",

                        alignItems:
                          "center",
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
                          {
                            stat.title
                          }
                        </Typography>

                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight:
                              800,
                            color:
                              "#1f2937",
                          }}
                        >
                          {
                            stat.value
                          }
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 2,
                          display:
                            "flex",
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
                        {
                          stat.icon
                        }
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )
          )}
        </Grid>

        {/* =================================================
            USER ROLE SUMMARY
        ================================================= */}

        <Card
          elevation={0}
          sx={{
            mt: 4,
            borderRadius:
              3,
            border:
              "1px solid #e5e7eb",
            backgroundColor:
              "#ffffff",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display:
                  "flex",
                alignItems:
                  "center",
                gap: 1,
                mb: 3,
              }}
            >
              <AdminIcon
                sx={{
                  color:
                    "#07548e",
                }}
              />

              <Typography
                variant="h6"
                sx={{
                  fontWeight:
                    700,
                }}
              >
                User Role Summary
              </Typography>
            </Box>

            <Grid
              container
              spacing={2}
            >
              {[
                {
                  label:
                    "Asset Officers",
                  value:
                    totalAssetOfficers,
                },

                {
                  label:
                    "Maintenance Officers",
                  value:
                    totalMaintenanceOfficers,
                },

                {
                  label:
                    "Finance Officers",
                  value:
                    totalFinanceOfficers,
                },

                {
                  label:
                    "Managers",
                  value:
                    totalManagers,
                },
              ].map(
                (item) => (
                  <Grid
                    size={{
                      xs: 12,
                      sm: 6,
                      md: 3,
                    }}
                    key={
                      item.label
                    }
                  >
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border:
                          "1px solid #e5e7eb",
                        backgroundColor:
                          "#f8fafc",
                      }}
                    >
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {
                          item.label
                        }
                      </Typography>

                      <Typography
                        variant="h5"
                        sx={{
                          mt: 1,
                          fontWeight:
                            800,
                        }}
                      >
                        {
                          item.value
                        }
                      </Typography>
                    </Box>
                  </Grid>
                )
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* =================================================
            ADMINISTRATOR QUICK ACTIONS
        ================================================= */}

        <Card
          elevation={0}
          sx={{
            mt: 4,
            borderRadius:
              3,
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
                fontWeight:
                  700,
                mb: 3,
              }}
            >
              Administrator Actions
            </Typography>

            <Grid
              container
              spacing={2}
            >
              {[
                {
                  title:
                    "Manage Users",
                  description:
                    "Create, update and manage system users and their roles.",
                  icon: (
                    <PeopleIcon />
                  ),
                  path:
                    "/admin/users",
                },

                {
                  title:
                    "Asset Overview",
                  description:
                    "View the complete asset inventory across the organization.",
                  icon: (
                    <AssetIcon />
                  ),
                  path:
                    "/admin/assets",
                },

                {
                  title:
                    "Categories",
                  description:
                    "Manage asset categories used throughout the system.",
                  icon: (
                    <CategoryIcon />
                  ),
                  path:
                    "/admin/categories",
                },

                {
                  title:
                    "Requests",
                  description:
                    "Monitor employee asset requests across the system.",
                  icon: (
                    <RequestIcon />
                  ),
                  path:
                    "/admin/requests",
                },

                {
                  title:
                    "Assignments",
                  description:
                    "Monitor assets assigned to employees.",
                  icon: (
                    <AssignmentIcon />
                  ),
                  path:
                    "/admin/assignments",
                },

                {
                  title:
                    "Transfers",
                  description:
                    "Monitor assets transferred between employees/locations.",
                  icon: (
                    <TransfersIcon />
                  ),
                  path:
                    "/admin/transfers",
                },

                {
                  title:
                    "Returns",
                  description:
                    "Monitor assets returned by employees.",
                  icon: (
                    <ReturnsIcon />
                  ),
                  path:
                    "/admin/returns",
                },

                {
                  title:
                    "Disposals",
                  description:
                    "Monitor disposed assets and reasons.",
                  icon: (
                    <DisposalIcon />
                  ),
                  path:
                    "/admin/disposal",
                },

                {
                  title:
                    "Depreciation",
                  description:
                    "Monitor asset depreciation and current values.",
                  icon: (
                    <DepreciationIcon />
                  ),
                  path:
                    "/admin/depreciation",
                },

                {
                  title:
                    "Bin Card",
                  description:
                    "Monitor bin card stock transactions.",
                  icon: (
                    <BinCardIcon />
                  ),
                  path:
                    "/admin/bin-card",
                },

                {
                  title:
                    "Inventory Checks",
                  description:
                    "Monitor inventory audit and discrepancies.",
                  icon: (
                    <InventoryCheckIcon />
                  ),
                  path:
                    "/admin/inventory-checks",
                },

                {
                  title:
                    "System Reports",
                  description:
                    "View system-wide reports and management information.",
                  icon: (
                    <ReportIcon />
                  ),
                  path:
                    "/admin/reports",
                },
              ].map(
                (action) => (
                  <Grid
                    size={{
                      xs: 12,
                      sm: 6,
                      md: 4,
                    }}
                    key={
                      action.title
                    }
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
                        cursor:
                          "pointer",
                        transition:
                          "0.2s",

                        "&:hover":
                          {
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
                        {
                          action.icon
                        }
                      </Box>

                      <Typography
                        fontWeight={
                          700
                        }
                      >
                        {
                          action.title
                        }
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 0.5,
                        }}
                      >
                        {
                          action.description
                        }
                      </Typography>
                    </Box>
                  </Grid>
                )
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* =================================================
            SYSTEM STATUS
        ================================================= */}

        <Card
          elevation={0}
          sx={{
            mt: 4,
            borderRadius:
              3,
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
                fontWeight:
                  700,
                mb: 3,
              }}
            >
              System Status
            </Typography>

            <Grid
              container
              spacing={2}
            >
              <Grid
                size={{
                  xs: 12,
                  md: 4,
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor:
                      "#f8fafc",
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                  }}
                >
                  <Box>
                    <Typography
                      fontWeight={
                        600
                      }
                    >
                      Asset Inventory
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      System asset records
                    </Typography>
                  </Box>

                  <Chip
                    label="Active"
                    size="small"
                    sx={{
                      fontWeight:
                        700,
                    }}
                  />
                </Box>
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 4,
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor:
                      "#f8fafc",
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                  }}
                >
                  <Box>
                    <Typography
                      fontWeight={
                        600
                      }
                    >
                      User Management
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Registered system users
                    </Typography>
                  </Box>

                  <Chip
                    label="Active"
                    size="small"
                    sx={{
                      fontWeight:
                        700,
                    }}
                  />
                </Box>
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 4,
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor:
                      "#f8fafc",
                    display:
                      "flex",
                    justifyContent:
                      "space-between",
                    alignItems:
                      "center",
                  }}
                >
                  <Box>
                    <Typography
                      fontWeight={
                        600
                      }
                    >
                      System Security
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Authentication and roles
                    </Typography>
                  </Box>

                  <Chip
                    label="Protected"
                    size="small"
                    sx={{
                      fontWeight:
                        700,
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default AdminDashboard;