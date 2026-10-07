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
  Warning as WarningIcon,
  Handyman as RepairIcon,
  CheckCircle as ApproveIcon,
  DeleteForever as DisposalIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

const drawerWidth = 250;
const topBarHeight = 64;

const ManagerDamageReview = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [assets, setAssets] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // Disposal recommendation modal
  const [disposalModal, setDisposalModal] = useState(null);
  const [disposalReason, setDisposalReason] = useState("");
  const [disposalDate, setDisposalDate] = useState("");

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const getList = (data, key) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.[key])) return data[key];
    if (Array.isArray(data?.records)) return data.records;
    return [];
  };

  // =====================================================
  // LOAD DATA
  // =====================================================
  const loadData = async () => {
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

      const [assetsRes, maintenanceRes, assignmentsRes] =
        await Promise.allSettled([
          API.get("/assets", { headers }),
          API.get("/maintenance", { headers }),
          API.get("/assignments", { headers }),
        ]);

      if (assetsRes.status === "fulfilled") {
        setAssets(getList(assetsRes.value.data, "assets"));
      }

      if (maintenanceRes.status === "fulfilled") {
        setMaintenance(getList(maintenanceRes.value.data, "maintenance"));
      }

      if (assignmentsRes.status === "fulfilled") {
        setAssignments(getList(assignmentsRes.value.data, "assignments"));
      }
    } catch (err) {
      console.error("Failed to load damage review data:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to load damage review information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =====================================================
  // CALCULATIONS
  // =====================================================

  const damagedConditionValues = [
    "damaged",
    "poor",
    "broken",
  ];

  const isDamaged = (asset) =>
    damagedConditionValues.includes(
      String(asset.asset_condition || "")
        .trim()
        .toLowerCase()
    );

  const damagedAssets = assets.filter(isDamaged);

  const getAssignedEmployee = (assetId) => {
    const assignment = assignments.find(
      (a) =>
        Number(a.asset_id) === Number(assetId) &&
        String(a.status || "").toLowerCase() === "active"
    );

    return assignment?.employee_name || assignment?.user_name || "Unassigned";
  };

  const getMaintenanceForAsset = (assetId) =>
    maintenance.filter(
      (m) => Number(m.asset_id) === Number(assetId)
    );

  const getEstimatedCost = (assetId) =>
    getMaintenanceForAsset(assetId).reduce(
      (sum, m) => sum + Number(m.cost || 0),
      0
    );

  const getConditionColor = (condition) => {
    const value = String(condition || "").trim().toLowerCase();
    if (["good", "new", "excellent"].includes(value)) return "success";
    if (["fair", "average"].includes(value)) return "warning";
    if (["damaged", "poor", "broken"].includes(value)) return "error";
    return "default";
  };

  const getStatusColor = (status) => {
    const value = String(status || "").trim().toLowerCase();
    if (["approved", "completed"].includes(value)) return "success";
    if (["rejected"].includes(value)) return "error";
    if (["pending", "scheduled", "in progress", "in repair"].includes(value))
      return "warning";
    return "default";
  };

  // =====================================================
  // RECOMMEND DISPOSAL
  // =====================================================
  const openDisposalModal = (asset) => {
    setDisposalReason("");
    setDisposalDate("");
    setDisposalModal(asset);
  };

  const closeDisposalModal = () => {
    setDisposalModal(null);
    setDisposalReason("");
    setDisposalDate("");
  };

  const submitDisposal = async () => {
    if (!disposalModal) return;

    setError("");
    setSuccess("");

    if (!disposalReason.trim()) {
      setError("Please provide a disposal recommendation reason.");
      return;
    }

    if (!disposalDate) {
      setError("Please select a disposal date.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setActionLoading(`disposal-${disposalModal.asset_id}`);

    try {
      const response = await API.post(
        "/disposals",
        {
          asset_id: Number(disposalModal.asset_id),
          disposal_date: disposalDate,
          reason: disposalReason.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data?.message ||
          "Disposal recommendation submitted for manager approval."
      );

      closeDisposalModal();
    } catch (err) {
      console.error("Disposal recommendation error:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to submit disposal recommendation."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // =====================================================
  // APPROVE REPAIR (forward cost to finance)
  // =====================================================
  const approveRepair = async (asset) => {
    setError("");
    setSuccess("");

    const maintenanceItems = getMaintenanceForAsset(asset.asset_id);
    const pendingCost = maintenanceItems.find(
      (m) => m.cost && Number(m.cost) > 0
    );

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setActionLoading(`repair-${asset.asset_id}`);

    try {
      if (pendingCost) {
        const response = await API.put(
          `/maintenance/cost-approvals/${pendingCost.maintenance_id}/approve`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSuccess(
          response.data?.message ||
            "Repair approved and maintenance cost forwarded to finance."
        );
      } else {
        setSuccess("Repair approved. No maintenance cost recorded for this asset.");
      }
    } catch (err) {
      console.error("Repair approval error:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to approve the repair."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // =====================================================
  // RETURN REPAIRED ASSET TO STORE
  // =====================================================
  const returnToStore = async (asset) => {
    setError("");
    setSuccess("");

    const maintenanceItems = getMaintenanceForAsset(asset.asset_id);
    const target =
      maintenanceItems.find((m) => m.maintenance_id) ||
      maintenanceItems[0];

    if (!target) {
      setError(
        "No maintenance record found for this asset. Cannot return it to store."
      );
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setActionLoading(`return-${asset.asset_id}`);

    try {
      const response = await API.put(
        `/maintenance/${target.maintenance_id}/return-to-store`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data?.message ||
          "Repaired asset returned to store. Maintenance history preserved."
      );
      loadData();
    } catch (err) {
      console.error("Return to store error:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to return the asset to store."
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
      icon: <WarningIcon />,
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
            Damage Review
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
          Damage Review
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Review seriously damaged assets, their maintenance reports,
          and estimated costs to make a decision.
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
            <WarningIcon sx={{ color: "#d32f2f", mb: 1 }} />

            <Typography variant="h6" fontWeight={800}>
              {damagedAssets.length} Seriously Damaged Assets
            </Typography>

            <Typography color="text.secondary" variant="body2">
              Assets with a damaged, poor, or broken condition require
              management review.
            </Typography>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {damagedAssets.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Card
                elevation={0}
                sx={{ borderRadius: 3, border: "1px solid #e5e7eb" }}
              >
                <CardContent sx={{ p: 5, textAlign: "center" }}>
                  <RepairIcon sx={{ fontSize: 48, color: "#2e7d32", mb: 1 }} />

                  <Typography fontWeight={700} color="text.secondary">
                    No seriously damaged assets found.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            damagedAssets.map((asset) => {
              const assetId = asset.asset_id;
              const maintenanceItems = getMaintenanceForAsset(assetId);
              const estimatedCost = getEstimatedCost(assetId);

              return (
                <Grid
                  size={{ xs: 12, md: 6, lg: 4 }}
                  key={assetId}
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
                          {asset.asset_name || "Damaged Asset"}
                        </Typography>

                        <Chip
                          label={asset.asset_condition || "Damaged"}
                          color={getConditionColor(asset.asset_condition)}
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        <strong>Asset ID:</strong> {assetId}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        <strong>Serial:</strong>{" "}
                        {asset.serial_number || "N/A"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        <strong>Assigned Employee:</strong>{" "}
                        {getAssignedEmployee(assetId)}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        <strong>Location:</strong> {asset.location || "N/A"}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="#07548e"
                        sx={{ mb: 2 }}
                      >
                        <strong>Estimated Maintenance Cost:</strong>{" "}
                        {estimatedCost.toFixed(2)}
                      </Typography>

                      <Divider sx={{ mb: 2 }} />

                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ mb: 1 }}
                      >
                        Maintenance Report
                      </Typography>

                      {maintenanceItems.length === 0 ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          No maintenance records found for this asset.
                        </Typography>
                      ) : (
                        maintenanceItems.slice(0, 3).map((item, index) => (
                          <Box key={item.maintenance_id || index} sx={{ mb: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {item.maintenance_date
                                ? new Date(
                                    item.maintenance_date
                                  ).toLocaleDateString()
                                : "Unknown date"}
                              {" "}
                              — {item.description || "Maintenance"}
                            </Typography>

                            <Chip
                              label={item.status || "Scheduled"}
                              color={getStatusColor(item.status)}
                              size="small"
                              sx={{ fontWeight: 700 }}
                            />
                          </Box>
                        ))
                      )}

                      <Divider sx={{ mb: 2 }} />

                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          color="success"
                          startIcon={<ApproveIcon />}
                          disabled={actionLoading !== null}
                          onClick={() => approveRepair(asset)}
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 700,
                          }}
                        >
                          {actionLoading === `repair-${assetId}`
                            ? "Approving..."
                            : "Approve Repair"}
                        </Button>

                        <Button
                          fullWidth
                          variant="outlined"
                          color="success"
                          startIcon={<RepairIcon />}
                          disabled={actionLoading !== null}
                          onClick={() => returnToStore(asset)}
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 700,
                          }}
                        >
                          {actionLoading === `return-${assetId}`
                            ? "Returning to Store..."
                            : "Return to Store"}
                        </Button>

                        <Button
                          fullWidth
                          variant="outlined"
                          color="error"
                          startIcon={<DisposalIcon />}
                          disabled={actionLoading !== null}
                          onClick={() => openDisposalModal(asset)}
                          sx={{
                            borderRadius: 2,
                            textTransform: "none",
                            fontWeight: 700,
                          }}
                        >
                          Recommend Disposal
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
            DISPOSAL RECOMMENDATION MODAL
        ===================================================== */}
        <Dialog
          open={disposalModal !== null}
          onClose={closeDisposalModal}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            <Typography fontWeight={800}>Recommend Disposal</Typography>
          </DialogTitle>

          <DialogContent dividers>
            {disposalModal && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Asset:</strong>{" "}
                  {disposalModal.asset_name || "N/A"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <strong>Condition:</strong>{" "}
                  {disposalModal.asset_condition || "N/A"}
                </Typography>
              </Box>
            )}

            <TextField
              fullWidth
              type="date"
              label="Disposal Date"
              value={disposalDate}
              onChange={(e) => setDisposalDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Recommendation Reason"
              value={disposalReason}
              onChange={(e) => setDisposalReason(e.target.value)}
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={closeDisposalModal} sx={{ textTransform: "none" }}>
              Cancel
            </Button>

            <Button
              variant="contained"
              color="error"
              startIcon={<DisposalIcon />}
              disabled={actionLoading !== null}
              onClick={submitDisposal}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              {actionLoading !== null
                ? "Submitting..."
                : "Submit Recommendation"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default ManagerDamageReview;