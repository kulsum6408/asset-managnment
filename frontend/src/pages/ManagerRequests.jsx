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
  Grid,
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
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

const drawerWidth = 250;
const topBarHeight = 64;

const ManagerRequests = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [requests, setRequests] = useState([]);

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  // =====================================================
  // LOAD REQUESTS
  // =====================================================
  const loadRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await API.get("/requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

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
    } catch (err) {
      console.error("Failed to load manager requests:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          `Unable to load requests. ${
            err.message || ""
          }`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // =====================================================
  // STATUS COLOR
  // =====================================================
  const getStatusColor = (status) => {
    const value = String(status || "")
      .trim()
      .toLowerCase();

    if (["approved", "assigned"].includes(value)) {
      return "success";
    }

    if (["rejected", "cancelled"].includes(value)) {
      return "error";
    }

    if (["pending", "submitted"].includes(value)) {
      return "warning";
    }

    return "default";
  };

  // =====================================================
  // APPROVE
  // =====================================================
  const handleApprove = async (request) => {
    setError("");
    setSuccess("");

    const requestId = request.request_id;

    if (!requestId) {
      setError("Request ID is missing.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setActionLoading(`approve-${requestId}`);

    try {
      console.log(
        "APPROVING REQUEST:",
        requestId
      );

      const response = await API.put(
        `/requests/${requestId}/approve`,
        {
          remarks: "Approved by manager",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "APPROVAL RESPONSE:",
        response.data
      );

      setSuccess(
        response.data?.message ||
          "Request approved and asset assigned successfully."
      );

      // Remove this request from pending list immediately
      setRequests((previous) =>
        previous.map((item) =>
          item.request_id === requestId
            ? {
                ...item,
                status: "Approved",
              }
            : item
        )
      );

      // Reload from backend
      await loadRequests();
    } catch (err) {
      console.error(
        "APPROVAL ERROR:",
        err
      );

      console.error(
        "SERVER RESPONSE:",
        err.response?.data
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Approval failed."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // =====================================================
  // REJECT
  // =====================================================
  const handleReject = async (request) => {
    setError("");
    setSuccess("");

    const requestId = request.request_id;

    if (!requestId) {
      setError("Request ID is missing.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setActionLoading(`reject-${requestId}`);

    try {
      const response = await API.put(
        `/requests/${requestId}/reject`,
        {
          remarks: "Rejected by manager",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data?.message ||
          "Request rejected successfully."
      );

      await loadRequests();
    } catch (err) {
      console.error(
        "REJECTION ERROR:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to reject request."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // =====================================================
  // NAVIGATION
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
        sx={{
          borderColor:
            "rgba(255,255,255,0.15)",
        }}
      />

      <List sx={{ px: 1.5, mt: 2 }}>
        {menuItems.map((item) => {
          const selected =
            item.path === "/manager"
              ? location.pathname === "/manager"
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
          sx={{ color: "#07548e" }}
        />
      </Box>
    );
  }

  // =====================================================
  // FILTER
  // =====================================================
  const pendingRequests = requests.filter(
    (item) =>
      String(item.status || "")
        .trim()
        .toLowerCase() === "pending"
  );

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
            Requests & Approvals
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
          Requests & Approvals
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Review requests requiring management
          attention.
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            mb: 3,
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              fontWeight={700}
            >
              Pending Requests
            </Typography>

            <Typography
              color="text.secondary"
              variant="body2"
            >
              {pendingRequests.length} request
              {pendingRequests.length === 1
                ? ""
                : "s"}{" "}
              awaiting review.
            </Typography>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {pendingRequests.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border:
                    "1px solid #e5e7eb",
                }}
              >
                <CardContent
                  sx={{
                    p: 5,
                    textAlign: "center",
                  }}
                >
                  <ApproveIcon
                    sx={{
                      fontSize: 48,
                      color: "#2e7d32",
                      mb: 1,
                    }}
                  />

                  <Typography
                    fontWeight={700}
                    color="text.secondary"
                  >
                    No pending requests.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            pendingRequests.map((request) => {
              const requestId =
                request.request_id;

              return (
                <Grid
                  size={{
                    xs: 12,
                    md: 6,
                    lg: 4,
                  }}
                  key={requestId}
                >
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      border:
                        "1px solid #e5e7eb",
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
                          fontWeight={800}
                        >
                          {request.asset_name ||
                            "Asset Request"}
                        </Typography>

                        <Chip
                          label={
                            request.status ||
                            "Pending"
                          }
                          color={getStatusColor(
                            request.status
                          )}
                          size="small"
                          sx={{
                            fontWeight: 700,
                          }}
                        />
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        <strong>
                          Employee:
                        </strong>{" "}
                        {request.requester_name ||
                          request.employee_name ||
                          "N/A"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        <strong>
                          Asset ID:
                        </strong>{" "}
                        {request.asset_id}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        <strong>
                          Request ID:
                        </strong>{" "}
                        {requestId}
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                        }}
                      >
                        <Button
                          fullWidth
                          variant="contained"
                          color="success"
                          startIcon={
                            <ApproveIcon />
                          }
                          disabled={
                            actionLoading !==
                            null
                          }
                          onClick={() =>
                            handleApprove(
                              request
                            )
                          }
                          sx={{
                            borderRadius: 2,
                            textTransform:
                              "none",
                            fontWeight: 700,
                          }}
                        >
                          {actionLoading ===
                          `approve-${requestId}`
                            ? "Approving..."
                            : "Approve"}
                        </Button>

                        <Button
                          fullWidth
                          variant="outlined"
                          color="error"
                          startIcon={
                            <RejectIcon />
                          }
                          disabled={
                            actionLoading !==
                            null
                          }
                          onClick={() =>
                            handleReject(
                              request
                            )
                          }
                          sx={{
                            borderRadius: 2,
                            textTransform:
                              "none",
                            fontWeight: 700,
                          }}
                        >
                          {actionLoading ===
                          `reject-${requestId}`
                            ? "Rejecting..."
                            : "Reject"}
                        </Button>
                      </Box>
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

export default ManagerRequests;