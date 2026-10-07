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
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Grid,
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
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

const drawerWidth = 250;
const topBarHeight = 64;

const ManagerReports = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [assets, setAssets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [maintenance, setMaintenance] = useState([]);

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  useEffect(() => {
    const loadReports = async () => {
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
          assetsResponse,
          requestsResponse,
          maintenanceResponse,
        ] = await Promise.allSettled([
          API.get("/assets", { headers }),
          API.get("/requests", { headers }),
          API.get("/maintenance", { headers }),
        ]);

        if (assetsResponse.status === "fulfilled") {
          const data = assetsResponse.value.data;

          setAssets(
            Array.isArray(data)
              ? data
              : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data?.assets)
              ? data.assets
              : []
          );
        }

        if (requestsResponse.status === "fulfilled") {
          const data = requestsResponse.value.data;

          setRequests(
            Array.isArray(data)
              ? data
              : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data?.requests)
              ? data.requests
              : []
          );
        }

        if (maintenanceResponse.status === "fulfilled") {
          const data = maintenanceResponse.value.data;

          setMaintenance(
            Array.isArray(data)
              ? data
              : Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data?.maintenance)
              ? data.maintenance
              : []
          );
        }
      } catch (err) {
        console.error("Failed to load Manager reports:", err);

        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Unable to load reports."
        );
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [navigate]);

  const available = assets.filter(
    (a) =>
      String(a.status || "").toLowerCase() === "available"
  ).length;

  const assigned = assets.filter(
    (a) =>
      String(a.status || "").toLowerCase() === "assigned"
  ).length;

  const underMaintenance = assets.filter((a) =>
    ["maintenance", "under maintenance"].includes(
      String(a.status || "").toLowerCase()
    )
  ).length;

  const damaged = assets.filter((a) =>
    ["damaged", "poor", "broken"].includes(
      String(a.asset_condition || "").toLowerCase()
    )
  ).length;

  const pendingRequests = requests.filter((r) =>
    ["pending", "submitted"].includes(
      String(r.status || "").toLowerCase()
    )
  ).length;

  const approvedRequests = requests.filter((r) =>
    ["approved"].includes(
      String(r.status || "").toLowerCase()
    )
  ).length;

  const rejectedRequests = requests.filter((r) =>
    ["rejected", "cancelled"].includes(
      String(r.status || "").toLowerCase()
    )
  ).length;

  const pendingMaintenance = maintenance.filter((m) =>
    ["pending", "scheduled", "open"].includes(
      String(m.status || "").toLowerCase()
    )
  ).length;

  const completedMaintenance = maintenance.filter((m) =>
    ["completed", "resolved", "closed"].includes(
      String(m.status || "").toLowerCase()
    )
  ).length;

  const maintenanceCost = useMemo(
    () =>
      maintenance.reduce(
        (sum, item) => sum + Number(item.cost || 0),
        0
      ),
    [maintenance]
  );

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
          sx={{ fontWeight: 800, fontSize: "17px" }}
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
                    backgroundColor: "rgba(255,255,255,0.16)",
                  },
                  "&.Mui-selected:hover": {
                    backgroundColor: "rgba(255,255,255,0.2)",
                  },
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{ color: "#fff", minWidth: 42 }}
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
                  backgroundColor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              <ListItemIcon
                sx={{ color: "#fff", minWidth: 42 }}
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
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
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
              display: { xs: "block", sm: "none" },
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
            Manager Reports
          </Typography>

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
          display: { xs: "none", sm: "block" },
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
          display: { xs: "block", sm: "none" },
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
          px: { xs: 2, sm: 3, md: 4 },
          pb: 5,
        }}
      >
        <Typography
          variant="h5"
          fontWeight={800}
          sx={{ mb: 1 }}
        >
          Management Reports
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Management-level overview of assets, requests, and maintenance.
        </Typography>

        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {[
            ["Total Assets", assets.length],
            ["Available Assets", available],
            ["Assigned Assets", assigned],
            ["Under Maintenance", underMaintenance],
            ["Damaged Assets", damaged],
            ["Pending Requests", pendingRequests],
            ["Approved Requests", approvedRequests],
            ["Rejected Requests", rejectedRequests],
            ["Pending Maintenance", pendingMaintenance],
            ["Completed Maintenance", completedMaintenance],
          ].map(([title, value]) => (
            <Grid
              size={{ xs: 12, sm: 6, lg: 4 }}
              key={title}
            >
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: "1px solid #e5e7eb",
                }}
              >
                <CardContent>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {title}
                  </Typography>

                  <Typography
                    variant="h4"
                    fontWeight={800}
                    sx={{ mt: 1 }}
                  >
                    {value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

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
              fontWeight={800}
              sx={{ mb: 3 }}
            >
              Maintenance Financial Overview
            </Typography>

            <Typography
              variant="h3"
              fontWeight={800}
              sx={{ color: "#07548e" }}
            >
              {maintenanceCost.toFixed(2)}
            </Typography>

            <Typography color="text.secondary">
              Total recorded maintenance cost
            </Typography>
          </CardContent>
        </Card>

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
              fontWeight={800}
              sx={{ mb: 2 }}
            >
              Latest Requests
            </Typography>

            {requests.length === 0 ? (
              <Typography color="text.secondary">
                No requests found.
              </Typography>
            ) : (
              requests.slice(0, 8).map((item, index) => (
                <Box
                  key={item.request_id || item.id || index}
                  sx={{
                    py: 1.5,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    borderBottom:
                      index !== Math.min(requests.length, 8) - 1
                        ? "1px solid #eeeeee"
                        : "none",
                  }}
                >
                  <Box>
                    <Typography fontWeight={600}>
                      {item.asset_name || "Request"}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {item.employee_name ||
                        item.user_name ||
                        item.requested_by ||
                        "Employee"}
                    </Typography>
                  </Box>

                  <Chip
                    label={item.status || "Pending"}
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

export default ManagerReports;