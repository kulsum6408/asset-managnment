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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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
  DeleteForever as DisposalIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

const drawerWidth = 250;
const topBarHeight = 64;

const ManagerDisposal = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [disposals, setDisposals] = useState([]);

  const [decisionModal, setDecisionModal] = useState(null);
  const [decisionRemarks, setDecisionRemarks] = useState("");
  const [decisionType, setDecisionType] = useState("");

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  // =====================================================
  // LOAD DISPOSALS
  // =====================================================
  const loadDisposals = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await API.get("/disposals", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.disposals)
        ? data.disposals
        : Array.isArray(data?.records)
        ? data.records
        : [];

      setDisposals(list);
    } catch (err) {
      console.error("Failed to load manager disposals:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to load disposal information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisposals();
  }, []);

  // =====================================================
  // STATUS COLOR
  // =====================================================
  const getStatusColor = (status) => {
    const value = String(status || "").trim().toLowerCase();

    if (value === "approved") return "success";
    if (value === "pending") return "warning";
    if (value === "rejected") return "error";

    return "default";
  };

  // =====================================================
  // OPEN DECISION MODAL
  // =====================================================
  const openDecision = (disposal, type) => {
    setDecisionRemarks("");
    setDecisionType(type);
    setDecisionModal(disposal);
  };

  const closeDecision = () => {
    setDecisionModal(null);
    setDecisionType("");
    setDecisionRemarks("");
  };

  // =====================================================
  // SUBMIT DECISION
  // =====================================================
  const submitDecision = async () => {
    if (!decisionModal) return;

    setError("");
    setSuccess("");

    const disposalId = decisionModal.disposal_id;

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setActionLoading(`${decisionType}-${disposalId}`);

    try {
      const endpoint =
        decisionType === "approve"
          ? `/disposals/${disposalId}/approve`
          : `/disposals/${disposalId}/reject`;

      const response = await API.put(
        endpoint,
        {
          remarks: decisionRemarks.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data?.message ||
          (decisionType === "approve"
            ? "Disposal approved."
            : "Disposal rejected.")
      );

      closeDecision();
      await loadDisposals();
    } catch (err) {
      console.error("Disposal decision error:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to complete the decision."
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
      icon: <DisposalIcon />,
      path: "/manager/disposals",
    },
    {
      text: "Damage Review",
      icon: <DisposalIcon />,
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

      <Divider sx={{ borderColor: "rgba(255,255,255,0.15)" }} />

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
                <ListItemIcon sx={{ color: "#fff", minWidth: 42 }}>
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
                "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
              }}
            >
              <ListItemIcon sx={{ color: "#fff", minWidth: 42 }}>
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
        <CircularProgress sx={{ color: "#07548e" }} />
      </Box>
    );
  }

  // =====================================================
  // FILTER
  // =====================================================
  const pendingDisposals = disposals.filter(
    (item) =>
      String(item.status || "").trim().toLowerCase() === "pending"
  );

  const decisionLabel =
    decisionType === "approve" ? "Approve Disposal" : "Reject Disposal";

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
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          height: `${topBarHeight}px`,
          backgroundColor: "#fff",
          color: "#1f2937",
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: `${topBarHeight}px !important` }}>
          <IconButton
            color="inherit"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 2, display: { xs: "block", sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            sx={{ flexGrow: 1, fontWeight: 700 }}
          >
            Disposal Approvals
          </Typography>

          <Avatar
            sx={{ width: 40, height: 40, backgroundColor: "#07548e" }}
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
          width: { xs: "100%", sm: `calc(100% - ${drawerWidth}px)` },
          pt: `${topBarHeight + 24}px`,
          px: { xs: 2, sm: 3, md: 4 },
          pb: 5,
        }}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/manager")}
          sx={{
            mb: 3,
            color: "#07548e",
            fontWeight: 700,
            textTransform: "none",
          }}
        >
          Back to Dashboard
        </Button>

        <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>
          Disposal Approvals
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Review disposal recommendations. Disposals cannot be
          completed without manager approval.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
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
            <Typography variant="h6" fontWeight={700}>
              Pending Disposal Recommendations
            </Typography>

            <Typography color="text.secondary" variant="body2">
              {pendingDisposals.length} disposal
              {pendingDisposals.length === 1 ? "" : "s"} awaiting approval.
            </Typography>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {pendingDisposals.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Card
                elevation={0}
                sx={{ borderRadius: 3, border: "1px solid #e5e7eb" }}
              >
                <CardContent sx={{ p: 5, textAlign: "center" }}>
                  <DisposalIcon sx={{ fontSize: 48, color: "#2e7d32", mb: 1 }} />

                  <Typography fontWeight={700} color="text.secondary">
                    No pending disposal recommendations.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            pendingDisposals.map((disposal) => {
              const disposalId = disposal.disposal_id;

              return (
                <Grid
                  size={{ xs: 12, md: 6, lg: 4 }}
                  key={disposalId}
                >
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 2,
                          mb: 2,
                        }}
                      >
                        <Typography variant="h6" fontWeight={800}>
                          {disposal.asset_name || "Disposal"}
                        </Typography>

                        <Chip
                          label={disposal.status || "Pending"}
                          color={getStatusColor(disposal.status)}
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        <strong>Asset ID:</strong> {disposal.asset_id}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        <strong>Serial:</strong>{" "}
                        {disposal.serial_number || "N/A"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        <strong>Condition:</strong>{" "}
                        {disposal.asset_condition || "N/A"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        <strong>Submitted by:</strong>{" "}
                        {disposal.requested_by_name || "N/A"}
                      </Typography>

                      {disposal.source_maintenance_id && (
                        <Typography
                          variant="body2"
                          color="secondary"
                          sx={{ mb: 1, fontWeight: 700 }}
                        >
                          Recommended from maintenance #{" "}
                          {disposal.source_maintenance_id}
                          {disposal.maintenance_problem
                            ? ` — ${disposal.maintenance_problem}`
                            : ""}
                        </Typography>
                      )}

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        <strong>Reason:</strong> {disposal.reason || "N/A"}
                      </Typography>

                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          color="success"
                          startIcon={<ApproveIcon />}
                          disabled={actionLoading !== null}
                          onClick={() => openDecision(disposal, "approve")}
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 700,
                          }}
                        >
                          {actionLoading === `approve-${disposalId}`
                            ? "Approving..."
                            : "Approve"}
                        </Button>

                        <Button
                          fullWidth
                          variant="outlined"
                          color="error"
                          startIcon={<RejectIcon />}
                          disabled={actionLoading !== null}
                          onClick={() => openDecision(disposal, "reject")}
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 700,
                          }}
                        >
                          {actionLoading === `reject-${disposalId}`
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

        {/* =====================================================
            DECISION MODAL
        ===================================================== */}
        <Dialog
          open={decisionModal !== null}
          onClose={closeDecision}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            <Typography fontWeight={800}>{decisionLabel}</Typography>
          </DialogTitle>

          <DialogContent dividers>
            {decisionModal && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Asset:</strong>{" "}
                  {decisionModal.asset_name || "N/A"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Reason:</strong>{" "}
                  {decisionModal.reason || "N/A"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Submitted by:</strong>{" "}
                  {decisionModal.requested_by_name || "N/A"}
                </Typography>
              </Box>
            )}

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Decision Remarks (optional)"
              value={decisionRemarks}
              onChange={(e) => setDecisionRemarks(e.target.value)}
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={closeDecision} sx={{ textTransform: "none" }}>
              Cancel
            </Button>

            <Button
              variant={
                decisionType === "approve" ? "contained" : "outlined"
              }
              color={decisionType === "approve" ? "success" : "error"}
              startIcon={
                decisionType === "approve" ? <ApproveIcon /> : <RejectIcon />
              }
              disabled={actionLoading !== null}
              onClick={submitDecision}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              {actionLoading !== null ? "Processing..." : "Confirm"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default ManagerDisposal;