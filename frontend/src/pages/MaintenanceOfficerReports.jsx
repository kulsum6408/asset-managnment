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
  Refresh as RefreshIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

const drawerWidth = 250;
const topBarHeight = 64;

const MaintenanceOfficerReports = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [maintenance, setMaintenance] = useState([]);
  const [assets, setAssets] = useState([]);

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const loadReports = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [maintenanceResponse, assetsResponse] =
        await Promise.allSettled([
          API.get("/maintenance", { headers }),
          API.get("/assets", { headers }),
        ]);

      if (maintenanceResponse.status === "fulfilled") {
        const data = maintenanceResponse.value.data;

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
    } catch (err) {
      console.error("Failed to load maintenance reports:", err);
      setError("Unable to load maintenance reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const pending = maintenance.filter((item) =>
    ["pending", "open"].includes(
      String(item.status || "").toLowerCase()
    )
  ).length;

  const inProgress = maintenance.filter((item) =>
    ["in progress", "ongoing"].includes(
      String(item.status || "").toLowerCase()
    )
  ).length;

  const completed = maintenance.filter((item) =>
    ["completed", "resolved", "closed"].includes(
      String(item.status || "").toLowerCase()
    )
  ).length;

  const damaged = assets.filter((asset) =>
    ["damaged", "poor"].includes(
      String(asset.asset_condition || "").toLowerCase()
    )
  ).length;

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

  const getStatusColor = (status) => {
    const value = String(status || "").toLowerCase();

    if (
      ["completed", "resolved", "closed"].includes(value)
    ) {
      return "success";
    }

    if (
      ["in progress", "ongoing"].includes(value)
    ) {
      return "warning";
    }

    return "error";
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
            Maintenance Reports
          </Typography>

          <Button
            startIcon={<RefreshIcon />}
            onClick={loadReports}
            sx={{
              mr: 2,
              textTransform: "none",
              fontWeight: 700,
              color: "#07548e",
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
          sx={{
            fontWeight: 800,
            color: "#1f2937",
            mb: 1,
          }}
        >
          Maintenance Reports
        </Typography>

        <Typography
          sx={{
            color: "#6b7280",
            mb: 3,
          }}
        >
          Monitor maintenance activity and asset condition.
        </Typography>

        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* SUMMARY */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e5e7eb",
              }}
            >
              <CardContent>
                <Typography
                  color="text.secondary"
                  variant="body2"
                  sx={{ mb: 1 }}
                >
                  Pending
                </Typography>

                <Typography
                  variant="h4"
                  fontWeight={800}
                >
                  {pending}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e5e7eb",
              }}
            >
              <CardContent>
                <Typography
                  color="text.secondary"
                  variant="body2"
                  sx={{ mb: 1 }}
                >
                  In Progress
                </Typography>

                <Typography
                  variant="h4"
                  fontWeight={800}
                >
                  {inProgress}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e5e7eb",
              }}
            >
              <CardContent>
                <Typography
                  color="text.secondary"
                  variant="body2"
                  sx={{ mb: 1 }}
                >
                  Completed
                </Typography>

                <Typography
                  variant="h4"
                  fontWeight={800}
                >
                  {completed}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e5e7eb",
              }}
            >
              <CardContent>
                <Typography
                  color="text.secondary"
                  variant="body2"
                  sx={{ mb: 1 }}
                >
                  Damaged Assets
                </Typography>

                <Typography
                  variant="h4"
                  fontWeight={800}
                >
                  {damaged}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* MAINTENANCE HISTORY */}
        <Card
          elevation={0}
          sx={{
            mt: 4,
            borderRadius: 3,
            border: "1px solid #e5e7eb",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ mb: 3 }}
            >
              Maintenance History
            </Typography>

            {maintenance.length === 0 ? (
              <Typography color="text.secondary">
                No maintenance records available.
              </Typography>
            ) : (
              maintenance.slice(0, 10).map((item, index) => (
                <Box
                  key={
                    item.maintenance_id ||
                    item.id ||
                    index
                  }
                  sx={{
                    py: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    borderBottom:
                      index !==
                      Math.min(maintenance.length, 10) - 1
                        ? "1px solid #eeeeee"
                        : "none",
                  }}
                >
                  <Box>
                    <Typography fontWeight={700}>
                      {item.asset_name ||
                        "Unknown Asset"}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {item.issue_type ||
                        item.problem_type ||
                        item.description ||
                        "No description"}
                    </Typography>
                  </Box>

                  <Chip
                    label={item.status || "Pending"}
                    color={getStatusColor(item.status)}
                    size="small"
                    sx={{ fontWeight: 700 }}
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

export default MaintenanceOfficerReports;