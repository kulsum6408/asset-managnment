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
  Grid,
  Button,
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
  SwapHoriz as TransferIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Gavel as DisposalIcon,
  Warning as DamageIcon,
  AttachMoney as CostIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

const drawerWidth = 250;
const topBarHeight = 64;

const ManagerTransfers = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [transfers, setTransfers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [openView, setOpenView] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const loadTransfers = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }
      const response = await API.get("/transfers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.transfers)
        ? data.transfers
        : [];
      setTransfers(list);
    } catch (err) {
      console.error("Failed to load manager transfers:", err);
      setError(
        err.response?.data?.error ||
          "Unable to load transfer information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, []);

  const handleApprove = async (transfer) => {
    try {
      setActionLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      await API.put(
        `/transfers/${transfer.transfer_id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`Transfer #${transfer.transfer_id} approved successfully.`);
      loadTransfers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to approve transfer.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = (transfer) => {
    setSelected(transfer);
    setRejectReason("");
    setOpenRejectDialog(true);
  };

  const handleRejectConfirm = async () => {
    try {
      setActionLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      await API.put(
        `/transfers/${selected.transfer_id}/reject`,
        { rejection_reason: rejectReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`Transfer #${selected.transfer_id} rejected.`);
      setOpenRejectDialog(false);
      setSelected(null);
      loadTransfers();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reject transfer.");
    } finally {
      setActionLoading(false);
    }
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/manager" },
    { text: "Requests", icon: <RequestIcon />, path: "/manager/requests" },
    { text: "Assets", icon: <AssetIcon />, path: "/manager/assets" },
    { text: "Disposals", icon: <DisposalIcon />, path: "/manager/disposals" },
    { text: "Damage Review", icon: <DamageIcon />, path: "/manager/damage-review" },
    { text: "Maintenance", icon: <MaintenanceIcon />, path: "/manager/maintenance" },
    { text: "Cost Approvals", icon: <CostIcon />, path: "/manager/cost-approvals" },
    { text: "Transfers", icon: <TransferIcon />, path: "/manager/transfers" },
    { text: "Reports", icon: <ReportIcon />, path: "/manager/reports" },
    { text: "Notifications", icon: <NotificationIcon />, path: "/manager/notifications" },
    { text: "Settings", icon: <SettingsIcon />, path: "/manager/settings" },
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
        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "17px" }}>
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
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={selected}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  color: "#fff",
                  "&.Mui-selected": { backgroundColor: "rgba(255,255,255,0.16)" },
                  "&.Mui-selected:hover": { backgroundColor: "rgba(255,255,255,0.2)" },
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
                }}
              >
                <ListItemIcon sx={{ color: "#fff", minWidth: 42 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  slotProps={{ primary: { fontWeight: selected ? 700 : 500 } }}
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

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "warning";
      case "Approved": return "info";
      case "Rejected": return "error";
      case "Completed": return "success";
      default: return "default";
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress sx={{ color: "#07548e" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#f5f7fb" }}>
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
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Transfer Approvals
          </Typography>
          <Avatar sx={{ width: 40, height: 40, backgroundColor: "#07548e" }}>
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
        <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>
          Transfer Approvals
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Review and approve or reject asset transfer requests.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess("")}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {transfers.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb" }}>
                <CardContent sx={{ p: 5, textAlign: "center" }}>
                  <TransferIcon sx={{ fontSize: 48, color: "#9ca3af", mb: 1 }} />
                  <Typography fontWeight={700} color="text.secondary">
                    No transfer requests found.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            transfers.map((transfer) => {
              const tid = transfer.transfer_id || transfer.id;
              const isPending = transfer.status === "Pending";
              return (
                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={tid}>
                  <Card
                    elevation={0}
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      border: isPending ? "2px solid #f59e0b" : "1px solid #e5e7eb",
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1, mb: 2 }}>
                        <Typography variant="h6" fontWeight={800} sx={{ fontSize: "1rem" }}>
                          {transfer.asset_name || "Asset Transfer"}
                        </Typography>
                        <Chip
                          label={transfer.status || "Pending"}
                          size="small"
                          color={getStatusColor(transfer.status)}
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>Serial:</strong> {transfer.serial_number || "N/A"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>From:</strong> {transfer.from_user_name || transfer.from_location || "Unassigned"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>To:</strong> {transfer.to_user_name || transfer.to_location || "N/A"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>From Location:</strong> {transfer.from_location || "N/A"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>To Location:</strong> {transfer.to_location || "N/A"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>Reason:</strong> {transfer.reason || "N/A"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        <strong>Date:</strong> {transfer.transfer_date ? new Date(transfer.transfer_date).toLocaleDateString() : "N/A"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        <strong>Notes:</strong> {transfer.notes || "N/A"}
                      </Typography>

                      {transfer.status === "Rejected" && transfer.rejection_reason && (
                        <Alert severity="error" sx={{ mb: 2, py: 0 }}>
                          <Typography variant="body2"><strong>Rejection Reason:</strong> {transfer.rejection_reason}</Typography>
                        </Alert>
                      )}
                      {transfer.approved_by_name && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>{transfer.status === "Rejected" ? "Rejected" : "Approved"} by:</strong> {transfer.approved_by_name}
                        </Typography>
                      )}

                      <Divider sx={{ my: 1.5 }} />

                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ViewIcon />}
                          onClick={() => { setSelected(transfer); setOpenView(true); }}
                          sx={{ textTransform: "none", borderColor: "#07548e", color: "#07548e", flex: 1 }}
                        >
                          View
                        </Button>
                        {isPending && (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<ApproveIcon />}
                              disabled={actionLoading}
                              onClick={() => handleApprove(transfer)}
                              sx={{ textTransform: "none", backgroundColor: "#2e7d32", flex: 1, "&:hover": { backgroundColor: "#1b5e20" } }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<RejectIcon />}
                              disabled={actionLoading}
                              onClick={() => handleRejectClick(transfer)}
                              sx={{ textTransform: "none", backgroundColor: "#c62828", flex: 1, "&:hover": { backgroundColor: "#b71c1c" } }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>

        {/* View Details Dialog */}
        <Dialog
          open={openView}
          onClose={() => { setOpenView(false); setSelected(null); }}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle sx={{ fontWeight: 800 }}>Transfer Details</DialogTitle>
          <DialogContent>
            {selected && (
              <Box>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                  <Box><Typography variant="caption" color="text.secondary">Asset</Typography><Typography fontWeight={600}>{selected.asset_name || "-"}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Serial Number</Typography><Typography>{selected.serial_number || "-"}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Status</Typography><Chip label={selected.status} size="small" color={getStatusColor(selected.status)} sx={{ fontWeight: 700 }} /></Box>
                  <Box><Typography variant="caption" color="text.secondary">Transfer Date</Typography><Typography>{selected.transfer_date ? new Date(selected.transfer_date).toLocaleString() : "-"}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">From Employee</Typography><Typography>{selected.from_user_name || "Unassigned"}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">To Employee</Typography><Typography>{selected.to_user_name || "N/A"}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">From Location</Typography><Typography>{selected.from_location || "-"}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">To Location</Typography><Typography>{selected.to_location || "-"}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Requested By</Typography><Typography>{selected.transferred_by_name || "-"}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">Approved By</Typography><Typography>{selected.approved_by_name || "Pending"}</Typography></Box>
                  <Box sx={{ gridColumn: { xs: "auto", sm: "1 / -1" } }}><Typography variant="caption" color="text.secondary">Reason</Typography><Typography>{selected.reason || "-"}</Typography></Box>
                  <Box sx={{ gridColumn: { xs: "auto", sm: "1 / -1" } }}><Typography variant="caption" color="text.secondary">Notes</Typography><Typography>{selected.notes || "-"}</Typography></Box>
                  {selected.rejection_reason && (
                    <Box sx={{ gridColumn: { xs: "auto", sm: "1 / -1" } }}><Typography variant="caption" color="error">Rejection Reason</Typography><Typography color="error">{selected.rejection_reason}</Typography></Box>
                  )}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => { setOpenView(false); setSelected(null); }} sx={{ textTransform: "none" }}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog
          open={openRejectDialog}
          onClose={() => { setOpenRejectDialog(false); setSelected(null); }}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle sx={{ fontWeight: 800 }}>Reject Transfer Request</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>
              Please provide a reason for rejecting this transfer request.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Rejection Reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
            />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => { setOpenRejectDialog(false); setSelected(null); }}
              sx={{ textTransform: "none" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleRejectConfirm}
              disabled={actionLoading}
              sx={{ textTransform: "none", backgroundColor: "#c62828", "&:hover": { backgroundColor: "#b71c1c" } }}
            >
              {actionLoading ? "Rejecting..." : "Reject Transfer"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default ManagerTransfers;
