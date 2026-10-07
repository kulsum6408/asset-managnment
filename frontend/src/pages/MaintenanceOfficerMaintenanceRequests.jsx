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
  Visibility as VisibilityIcon,
  Add as AddIcon,
  History as HistoryIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

const drawerWidth = 250;
const topBarHeight = 64;

const MaintenanceOfficerMaintenanceRequests = () => {
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
          "Failed to load maintenance requests:",
          err
        );

        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Unable to load maintenance requests."
        );
      } finally {
        setLoading(false);
      }
    };

    loadMaintenance();
  }, [navigate]);

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
      ["cancelled", "rejected"].includes(value)
    ) {
      return "default";
    }

    if (
      ["scheduled", "pending", "open"].includes(value)
    ) {
      return "error";
    }

    return "default";
  };

  const handleViewRequest = (item) => {
    const requestId =
      item.maintenance_id ||
      item.id ||
      item.maintenanceId;

    if (!requestId) {
      setError(
        "This maintenance request does not have a valid ID."
      );
      return;
    }

    navigate(
      `/maintenance-officer/requests/${requestId}`
    );
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
            Maintenance Requests
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

      {/* MAIN CONTENT */}
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
            justifyContent:
              "space-between",
            alignItems: {
              xs: "flex-start",
              sm: "center",
            },
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            gap: 2,
            mb: 1,
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
              Maintenance Requests
            </Typography>

            <Typography
              sx={{
                color: "#6b7280",
              }}
            >
              Review and process reported asset
              problems.
            </Typography>
          </Box>

          {/* NEW MAINTENANCE RECORD */}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() =>
              navigate(
                "/maintenance-officer/create"
              )
            }
            sx={{
              backgroundColor: "#07548e",
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              whiteSpace: "nowrap",
              "&:hover": {
                backgroundColor: "#064575",
              },
            }}
          >
            New Maintenance Record
          </Button>
        </Box>

        {error && (
          <Alert
            severity="warning"
            sx={{ mb: 3, mt: 3 }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        <Grid
          container
          spacing={3}
          sx={{ mt: 1 }}
        >
          {maintenance.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border:
                    "1px solid #e5e7eb",
                  backgroundColor:
                    "#ffffff",
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Typography
                    textAlign="center"
                    color="text.secondary"
                  >
                    No maintenance requests
                    found.
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent:
                        "center",
                      mt: 2,
                    }}
                  >
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() =>
                        navigate(
                          "/maintenance-officer/create"
                        )
                      }
                      sx={{
                        backgroundColor:
                          "#07548e",
                        textTransform:
                          "none",
                        fontWeight: 700,
                        borderRadius: 2,
                        "&:hover": {
                          backgroundColor:
                            "#064575",
                        },
                      }}
                    >
                      Create Maintenance Record
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            maintenance.map((item, index) => {
              const requestId =
                item.maintenance_id ||
                item.id ||
                item.maintenanceId;

              return (
                <Grid
                  size={{
                    xs: 12,
                    md: 6,
                    lg: 4,
                  }}
                  key={
                    requestId || index
                  }
                >
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      border:
                        "1px solid #e5e7eb",
                      backgroundColor:
                        "#ffffff",
                      transition:
                        "0.2s",

                      "&:hover": {
                        transform:
                          "translateY(-2px)",
                        boxShadow:
                          "0 8px 24px rgba(0,0,0,0.08)",
                      },
                    }}
                  >
                    <CardContent
                      sx={{ p: 3 }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "flex-start",
                          gap: 2,
                          mb: 2,
                        }}
                      >
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          sx={{
                            wordBreak:
                              "break-word",
                          }}
                        >
                          {item.asset_name ||
                            item.assetName ||
                            "Unknown Asset"}
                        </Typography>

                        <Chip
                          label={
                            item.status ||
                            "Scheduled"
                          }
                          color={getStatusColor(
                            item.status
                          )}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        />
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        <strong>
                          Issue:
                        </strong>{" "}
                        {item.issue_type ||
                          item.problem_type ||
                          item.description ||
                          "No description"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        <strong>
                          Asset ID:
                        </strong>{" "}
                        {item.asset_id ||
                          item.assetId ||
                          "N/A"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        <strong>
                          Request ID:
                        </strong>{" "}
                        {requestId ||
                          "N/A"}
                      </Typography>

                      {item.technician_name && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          <strong>
                            Technician:
                          </strong>{" "}
                          {item.technician_name}
                        </Typography>
                      )}

                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={
                          <VisibilityIcon />
                        }
                        disabled={!requestId}
                        onClick={() =>
                          handleViewRequest(
                            item
                          )
                        }
                        sx={{
                          borderRadius: 2,
                          textTransform:
                            "none",
                          fontWeight: 700,
                          color:
                            "#07548e",
                          borderColor:
                            "#07548e",

                          "&:hover": {
                            borderColor:
                              "#07548e",
                            backgroundColor:
                              "#f5f9fc",
                          },
                        }}
                      >
                        View Request
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default MaintenanceOfficerMaintenanceRequests;