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
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
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
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

const drawerWidth = 250;
const topBarHeight = 64;

const FinanceMaintenanceCost = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [approvals, setApprovals] = useState([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [form, setForm] = useState({
    payment_status: "Processed",
    payment_method: "",
    finance_remarks: "",
  });
  const [saving, setSaving] = useState(false);

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const loadApprovals = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }
      const response = await API.get("/maintenance/cost-approvals/finance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setApprovals(list);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to load maintenance costs."
      );
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await loadApprovals();
      } catch (err) {
        console.error("Failed to load maintenance costs:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const openDialog = (row) => {
    setActiveRow(row);
    setForm({
      payment_status: row.payment_status || "Processed",
      payment_method: row.payment_method || "",
      finance_remarks: row.finance_remarks || "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setActiveRow(null);
    setSuccess("");
  };

  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!activeRow) return;
    setSaving(true);
    setSuccess("");
    setError("");
    try {
      const token = localStorage.getItem("token");
      await API.put(
        `/maintenance/cost-approvals/${activeRow.maintenance_id}/process`,
        form,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccess("Maintenance cost payment processed successfully.");
      await loadApprovals();
      closeDialog();
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to process maintenance cost."
      );
    } finally {
      setSaving(false);
    }
  };

  const statusColor = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "paid") return "success";
    if (s === "processed") return "primary";
    if (s === "pending") return "warning";
    if (s === "rejected") return "error";
    return "default";
  };

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
            item.path === "/finance"
              ? location.pathname === "/finance"
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
          sx={{ minHeight: `${topBarHeight}px !important` }}
        >
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
            Maintenance Cost Processing
          </Typography>

          <Avatar
            sx={{ width: 40, height: 40, backgroundColor: "#07548e" }}
          >
            {(user.name || "F").charAt(0).toUpperCase()}
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
          onClick={() => navigate("/finance")}
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
          Maintenance Cost Processing
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Review manager-approved maintenance costs, record financial
          processing, and track payment status.
        </Typography>

        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e5e7eb",
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
              Approved Maintenance Costs
            </Typography>

            {approvals.length === 0 ? (
              <Typography color="text.secondary">
                No approved maintenance costs available for review.
              </Typography>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Asset</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Cost</TableCell>
                      <TableCell>Payment Status</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Approved By</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {approvals.map((row) => (
                      <TableRow key={row.cost_approval_id || row.maintenance_id}>
                        <TableCell>
                          <Typography fontWeight={700}>
                            {row.asset_name || "Unknown"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {row.serial_number || "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.description || "—"}</TableCell>
                        <TableCell>
                          {Number(row.approved_cost || row.maintenance_cost || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.payment_status || "Pending"}
                            color={statusColor(row.payment_status)}
                            size="small"
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell>{row.payment_method || "—"}</TableCell>
                        <TableCell>{row.approved_by_name || "—"}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openDialog(row)}
                          >
                            Process
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Process Maintenance Cost</DialogTitle>
          <DialogContent>
            {activeRow && (
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid size={12}>
                  <Typography variant="body2" color="text.secondary">
                    Asset:{" "}
                    <strong>{activeRow.asset_name || "Unknown"}</strong> • Cost:{" "}
                    <strong>
                      {Number(
                        activeRow.approved_cost ||
                          activeRow.maintenance_cost ||
                          0
                      ).toFixed(2)}
                    </strong>
                  </Typography>
                </Grid>
                <Grid size={12}>
                  <TextField
                    select
                    fullWidth
                    label="Payment Status"
                    name="payment_status"
                    value={form.payment_status}
                    onChange={handleInput}
                  >
                    <MenuItem value="Processed">Processed</MenuItem>
                    <MenuItem value="Paid">Paid</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Rejected">Rejected</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Payment Method"
                    name="payment_method"
                    value={form.payment_method}
                    onChange={handleInput}
                    placeholder="e.g. Bank Transfer, Cash, Cheque"
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Remarks"
                    name="finance_remarks"
                    value={form.finance_remarks}
                    onChange={handleInput}
                    multiline
                    minRows={2}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              sx={{ backgroundColor: "#07548e" }}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default FinanceMaintenanceCost;