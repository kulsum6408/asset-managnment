import React, { useEffect, useMemo, useState } from "react";
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
} from "@mui/icons-material";

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import API from "../services/api";

const drawerWidth = 250;
const topBarHeight = 64;

const FinanceOfficerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [assets, setAssets] = useState([]);
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
  // LOAD FINANCE DASHBOARD
  // =====================================================
  useEffect(() => {
    const loadFinanceDashboard = async () => {
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
          notificationsResponse,
        ] = await Promise.allSettled([
          API.get("/assets", { headers }),
          API.get("/notifications", {
            headers,
          }),
        ]);

        // -------------------------------------------------
        // ASSETS
        // -------------------------------------------------
        if (
          assetsResponse.status ===
          "fulfilled"
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
            : Array.isArray(data?.records)
            ? data.records
            : [];

          setNotifications(list);
        }
      } catch (err) {
        console.error(
          "Failed to load Finance Officer dashboard:",
          err
        );

        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Unable to load financial information."
        );
      } finally {
        setLoading(false);
      }
    };

    loadFinanceDashboard();
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
          "Failed to refresh finance notifications:",
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
  // FINANCIAL CALCULATIONS
  // =====================================================

  const purchaseValue = useMemo(() => {
    return assets.reduce(
      (sum, asset) =>
        sum +
        Number(asset.purchase_cost || 0),
      0
    );
  }, [assets]);

  const assetCount = assets.length;

  const availableAssets = assets.filter(
    (asset) =>
      String(asset.status || "")
        .trim()
        .toLowerCase() ===
      "available"
  ).length;

  const assignedAssets = assets.filter(
    (asset) =>
      String(asset.status || "")
        .trim()
        .toLowerCase() ===
      "assigned"
  ).length;

  const maintenanceAssets = assets.filter(
    (asset) =>
      [
        "maintenance",
        "under maintenance",
      ].includes(
        String(asset.status || "")
          .trim()
          .toLowerCase()
      )
  ).length;

  const disposedAssets = assets.filter(
    (asset) =>
      String(asset.status || "")
        .trim()
        .toLowerCase() ===
      "disposed"
  ).length;

  // =====================================================
  // UNREAD NOTIFICATIONS
  // =====================================================
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
                    fontWeight: selected
                      ? 700
                      : 500,
                  } }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}

        {/* LOGOUT */}
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
          sx={{
            color: "#07548e",
          }}
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

          backgroundColor: "#fff",
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
            Finance Officer Dashboard
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
                  "/finance/notifications"
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
                    borderRadius:
                      "50%",
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
              backgroundColor: "#07548e",
            }}
          >
            {(user.name || "F")
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
            backgroundColor:
              "#07548e",
            color: "#fff",
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
            color: "#fff",
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
        }}
      >
        <Typography
          variant="h5"
          fontWeight={800}
          sx={{ mb: 1 }}
        >
          Welcome,{" "}
          {user.name || "Finance Officer"}
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Monitor asset financial values
          and depreciation.
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
            FINANCIAL SUMMARY
        ===================================================== */}

        <Grid container spacing={3}>
          {[
            {
              title: "Total Assets",
              value: assetCount,
              icon: (
                <AssetIcon fontSize="large" />
              ),
            },
            {
              title: "Total Purchase Value",
              value:
                purchaseValue.toFixed(2),
              icon: (
                <FinanceIcon fontSize="large" />
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
              title: "Under Maintenance",
              value: maintenanceAssets,
              icon: (
                <DepreciationIcon
                  fontSize="large"
                />
              ),
            },
            {
              title: "Disposed Assets",
              value: disposedAssets,
              icon: (
                <AssetIcon fontSize="large" />
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
                    "#fff",
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
                      >
                        {stat.title}
                      </Typography>

                      <Typography
                        variant="h4"
                        fontWeight={800}
                        sx={{ mt: 1 }}
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
            FINANCE ACTIONS
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
              fontWeight={800}
              sx={{ mb: 3 }}
            >
              Finance Actions
            </Typography>

            <Grid container spacing={2}>
              {[
                {
                  title:
                    "Financial Assets",
                  description:
                    "View asset purchase values and financial information.",
                  icon: <AssetIcon />,
                  path:
                    "/finance/assets",
                },
                {
                  title:
                    "Depreciation",
                  description:
                    "Calculate and manage asset depreciation.",
                  icon: (
                    <DepreciationIcon />
                  ),
                  path:
                    "/finance/depreciation",
                },
                {
                  title:
                    "Depreciation History",
                  description:
                    "Review previous depreciation records.",
                  icon: <FinanceIcon />,
                  path:
                    "/finance/depreciation-history",
                },
                {
                  title:
                    "Asset Financial Info",
                  description:
                    "Current book value and depreciation of assets.",
                  icon: (
                    <AssetFinancialIcon />
                  ),
                  path:
                    "/finance/asset-financial",
                },
                {
                  title:
                    "Maintenance Cost",
                  description:
                    "Process approved maintenance costs and payments.",
                  icon: <ReceiptIcon />,
                  path:
                    "/finance/maintenance-cost",
                },
                {
                  title:
                    "Disposal Financials",
                  description:
                    "Record disposal proceeds and financials.",
                  icon: (
                    <DisposalFinancialIcon />
                  ),
                  path:
                    "/finance/disposal-financial",
                },
                {
                  title: "Reports",
                  description:
                    "Review financial asset reports.",
                  icon: (
                    <ReportIcon />
                  ),
                  path:
                    "/finance/reports",
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
                      {action.icon}
                    </Box>

                    <Typography
                      fontWeight={700}
                    >
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
            ASSET FINANCIAL OVERVIEW
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
              fontWeight={800}
              sx={{ mb: 3 }}
            >
              Asset Financial Overview
            </Typography>

            {assets.length === 0 ? (
              <Typography color="text.secondary">
                No asset financial data
                found.
              </Typography>
            ) : (
              assets
                .slice(0, 8)
                .map((asset, index) => (
                  <Box
                    key={
                      asset.asset_id ||
                      asset.id ||
                      index
                    }
                    sx={{
                      py: 1.5,
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      gap: 2,
                      borderBottom:
                        index !==
                        Math.min(
                          assets.length,
                          8
                        ) - 1
                          ? "1px solid #eeeeee"
                          : "none",
                    }}
                  >
                    <Box>
                      <Typography fontWeight={700}>
                        {asset.asset_name ||
                          "Unknown Asset"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Serial:{" "}
                        {asset.serial_number ||
                          "N/A"}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        textAlign:
                          "right",
                      }}
                    >
                      <Typography
                        fontWeight={800}
                        color="#07548e"
                      >
                        {Number(
                          asset.purchase_cost ||
                            0
                        ).toFixed(2)}
                      </Typography>

                      <Chip
                        label={
                          asset.status ||
                          "Unknown"
                        }
                        size="small"
                        sx={{
                          mt: 0.5,
                          fontWeight:
                            700,
                        }}
                      />
                    </Box>
                  </Box>
                ))
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default FinanceOfficerDashboard;