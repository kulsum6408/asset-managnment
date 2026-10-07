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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
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

const fmt = (v) => Number(v == null ? 0 : v).toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const FinanceAssetFinancial = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login", { replace: true });
          return;
        }
        const response = await API.get("/reports/finance/asset-value", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data;
        setRows(Array.isArray(data?.rows) ? data.rows : []);
        setSummary(data?.summary || {});
      } catch (err) {
        console.error("Failed to load asset financial info:", err);
        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Unable to load asset financial information."
        );
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [navigate]);

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/finance" },
    { text: "Financial Assets", icon: <AssetIcon />, path: "/finance/assets" },
    { text: "Depreciation", icon: <DepreciationIcon />, path: "/finance/depreciation" },
    { text: "Depreciation History", icon: <FinanceIcon />, path: "/finance/depreciation-history" },
    { text: "Asset Financial Info", icon: <AssetFinancialIcon />, path: "/finance/asset-financial" },
    { text: "Maintenance Cost", icon: <ReceiptIcon />, path: "/finance/maintenance-cost" },
    { text: "Disposal Financials", icon: <DisposalFinancialIcon />, path: "/finance/disposal-financial" },
    { text: "Reports", icon: <ReportIcon />, path: "/finance/reports" },
    { text: "Notifications", icon: <NotificationIcon />, path: "/finance/notifications" },
    { text: "Settings", icon: <SettingsIcon />, path: "/finance/settings" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const drawerContent = (
    <>
      <Toolbar sx={{ justifyContent: "center", minHeight: `${topBarHeight}px !important` }}>
        <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "17px" }}>
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
            Asset Financial Information
          </Typography>
          <Avatar sx={{ width: 40, height: 40, backgroundColor: "#07548e" }}>
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
          Asset Financial Information
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Purchase cost, accumulated depreciation, current book value, and
          maintenance expenditure for every asset.
        </Typography>

        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {[
            ["Total Assets", fmt(summary.total_assets)],
            ["Total Purchase Cost", fmt(summary.total_purchase_cost)],
            ["Total Accumulated Depreciation", fmt(summary.total_accumulated_depreciation)],
            ["Total Current Book Value", fmt(summary.total_current_book_value)],
            ["Total Maintenance Expenditure", fmt(summary.total_maintenance_expenditure)],
          ].map(([title, value]) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={title}>
              <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb" }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    {title}
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    sx={{ mt: 1, color: "#07548e" }}
                  >
                    {value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card elevation={0} sx={{ mt: 4, borderRadius: 3, border: "1px solid #e5e7eb" }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
              Asset Financial Details
            </Typography>

            {rows.length === 0 ? (
              <Typography color="text.secondary">
                No asset financial data found.
              </Typography>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Asset</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Purchase Cost</TableCell>
                      <TableCell>Accumulated Depreciation</TableCell>
                      <TableCell>Current Book Value</TableCell>
                      <TableCell>Maintenance Expenditure</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.asset_id}>
                        <TableCell>
                          <Typography fontWeight={700}>
                            {row.asset_name || "Unknown"}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {row.serial_number || "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.category_name || "—"}</TableCell>
                        <TableCell>
                          <Chip
                            label={row.status || "Unknown"}
                            size="small"
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell>{fmt(row.purchase_cost)}</TableCell>
                        <TableCell>{fmt(row.accumulated_depreciation)}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#07548e" }}>
                          {fmt(row.current_book_value)}
                        </TableCell>
                        <TableCell>{fmt(row.maintenance_expenditure)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default FinanceAssetFinancial;