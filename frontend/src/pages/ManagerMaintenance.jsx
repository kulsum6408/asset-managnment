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
  Chip,
  Grid,
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
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

const drawerWidth = 250;
const topBarHeight = 64;

const ManagerMaintenance = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [maintenance, setMaintenance] = useState([]);

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  useEffect(() => {
    const loadMaintenance = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        const response = await API.get("/maintenance", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data;

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
      } catch (err) {
        console.error(
          "Failed to load Manager maintenance:",
          err
        );

        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Unable to load maintenance information."
        );
      } finally {
        setLoading(false);
      }
    };

    loadMaintenance();
  }, [navigate]);

  const pending = useMemo(
    () =>
      maintenance.filter((item) =>
        ["pending", "scheduled", "open"].includes(
          String(item.status || "")
            .trim()
            .toLowerCase()
        )
      ),
    [maintenance]
  );

  const inProgress = useMemo(
    () =>
      maintenance.filter((item) =>
        ["in progress", "ongoing"].includes(
          String(item.status || "")
            .trim()
            .toLowerCase()
        )
      ),
    [maintenance]
  );

  const completed = useMemo(
    () =>
      maintenance.filter((item) =>
        ["completed", "resolved", "closed"].includes(
          String(item.status || "")
            .trim()
            .toLowerCase()
        )
      ),
    [maintenance]
  );

  const totalCost = useMemo(
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

  const getStatusColor = (status) => {
    const value = String(status || "")
      .trim()
      .toLowerCase();

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

    if (
      ["pending", "scheduled", "open"].includes(value)
    ) {
      return "error";
    }

    return "default";
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
          borderColor: "rgba(255,255,255,0.15)",
        }}
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
            Maintenance Summary
          </Typography>

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
        <Typography
          variant="h5"
          fontWeight={800}
          sx={{ mb: 1 }}
        >
          Maintenance Summary
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Monitor maintenance activity at management level.
        </Typography>

        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

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
                <PendingIcon
                  sx={{
                    color: "#f57c00",
                    mb: 1,
                  }}
                />

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Pending
                </Typography>

                <Typography
                  variant="h4"
                  fontWeight={800}
                >
                  {pending.length}
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
                <MaintenanceIcon
                  sx={{
                    color: "#07548e",
                    mb: 1,
                  }}
                />

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  In Progress
                </Typography>

                <Typography
                  variant="h4"
                  fontWeight={800}
                >
                  {inProgress.length}
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
                <CheckCircleIcon
                  sx={{
                    color: "#2e7d32",
                    mb: 1,
                  }}
                />

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Completed
                </Typography>

                <Typography
                  variant="h4"
                  fontWeight={800}
                >
                  {completed.length}
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
                  variant="body2"
                  color="text.secondary"
                >
                  Total Maintenance Cost
                </Typography>

                <Typography
                  variant="h4"
                  fontWeight={800}
                >
                  {totalCost.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
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
              Recent Maintenance Activity
            </Typography>

            {maintenance.length === 0 ? (
              <Typography color="text.secondary">
                No maintenance records found.
              </Typography>
            ) : (
              maintenance.slice(0, 10).map(
                (item, index) => (
                  <Box
                    key={
                      item.maintenance_id ||
                      item.id ||
                      index
                    }
                    sx={{
                      py: 2,
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      gap: 2,
                      borderBottom:
                        index !==
                        Math.min(
                          maintenance.length,
                          10
                        ) - 1
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
                        {item.description ||
                          item.maintenance_type ||
                          "Maintenance activity"}
                      </Typography>
                    </Box>

                    <Chip
                      label={
                        item.status || "Scheduled"
                      }
                      color={getStatusColor(
                        item.status
                      )}
                      size="small"
                      sx={{
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                )
              )
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ManagerMaintenance;