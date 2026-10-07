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
  Tabs,
  Tab,
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

const FinanceOfficerReports = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(0);

  const [assetValue, setAssetValue] = useState({ rows: [], summary: {} });
  const [depreciation, setDepreciation] = useState({ rows: [], count: 0 });
  const [maintenance, setMaintenance] = useState({ rows: [], summary: {} });
  const [disposal, setDisposal] = useState({ rows: [], summary: {} });

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
        const headers = { Authorization: `Bearer ${token}` };

        const [av, dp, mt, ds] = await Promise.allSettled([
          API.get("/reports/finance/asset-value", { headers }),
          API.get("/reports/finance/depreciation", { headers }),
          API.get("/reports/finance/maintenance-expenditure", { headers }),
          API.get("/reports/finance/disposal", { headers }),
        ]);

        if (av.status === "fulfilled") {
          const d = av.value.data;
          setAssetValue({
            rows: Array.isArray(d?.rows) ? d.rows : [],
            summary: d?.summary || {},
          });
        }
        if (dp.status === "fulfilled") {
          const d = dp.value.data;
          setDepreciation({
            rows: Array.isArray(d?.rows) ? d.rows : [],
            count: d?.count || 0,
          });
        }
        if (mt.status === "fulfilled") {
          const d = mt.value.data;
          setMaintenance({
            rows: Array.isArray(d?.rows) ? d.rows : [],
            summary: d?.summary || {},
          });
        }
        if (ds.status === "fulfilled") {
          const d = ds.value.data;
          setDisposal({
            rows: Array.isArray(d?.rows) ? d.rows : [],
            summary: d?.summary || {},
          });
        }
      } catch (err) {
        console.error("Failed to load finance reports:", err);
        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Unable to load financial reports."
        );
      } finally {
        setLoading(false);
      }
    };
    loadReports();
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
            Financial Reports
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
          Financial Reports
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Depreciation, maintenance expenditure, asset financial value, and
          disposal financial reports.
        </Typography>

        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          sx={{ mb: 3, borderBottom: "1px solid #e5e7eb" }}
        >
          <Tab
            label="Asset Financial Value"
            icon={<AssetFinancialIcon />}
            iconPosition="start"
          />
          <Tab
            label="Depreciation"
            icon={<DepreciationIcon />}
            iconPosition="start"
          />
          <Tab
            label="Maintenance Expenditure"
            icon={<ReceiptIcon />}
            iconPosition="start"
          />
          <Tab
            label="Disposal Financial"
            icon={<DisposalFinancialIcon />}
            iconPosition="start"
          />
        </Tabs>

        {tab === 0 && (
          <Box>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {[
                ["Total Assets", fmt(assetValue.summary.total_assets)],
                ["Total Purchase Cost", fmt(assetValue.summary.total_purchase_cost)],
                ["Accumulated Depreciation", fmt(assetValue.summary.total_accumulated_depreciation)],
                ["Total Current Book Value", fmt(assetValue.summary.total_current_book_value)],
                ["Maintenance Expenditure", fmt(assetValue.summary.total_maintenance_expenditure)],
              ].map(([title, value]) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={title}>
                  <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb" }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        {title}
                      </Typography>
                      <Typography variant="h6" fontWeight={800} sx={{ mt: 1, color: "#07548e" }}>
                        {value}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb" }}>
              <CardContent sx={{ p: 3 }}>
                {assetValue.rows.length === 0 ? (
                  <Typography color="text.secondary">No asset financial data.</Typography>
                ) : (
                  <TableContainer component={Paper} elevation={0}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Asset</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Purchase Cost</TableCell>
                          <TableCell>Accumulated Depreciation</TableCell>
                          <TableCell>Current Book Value</TableCell>
                          <TableCell>Maintenance Expenditure</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {assetValue.rows.map((row) => (
                          <TableRow key={row.asset_id}>
                            <TableCell>
                              <Typography fontWeight={700}>{row.asset_name || "Unknown"}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {row.serial_number || "N/A"}
                              </Typography>
                            </TableCell>
                            <TableCell>{row.category_name || "—"}</TableCell>
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
        )}

        {tab === 1 && (
          <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                Depreciation Report
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                {depreciation.count} depreciation calculation record(s).
              </Typography>
              {depreciation.rows.length === 0 ? (
                <Typography color="text.secondary">
                  No depreciation records found. Run depreciation calculations
                  to generate this report.
                </Typography>
              ) : (
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Asset</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell>Useful Life</TableCell>
                        <TableCell>Purchase Cost</TableCell>
                        <TableCell>Accumulated Depreciation</TableCell>
                        <TableCell>Current Value</TableCell>
                        <TableCell>Calculated At</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {depreciation.rows.map((row) => (
                        <TableRow key={row.depreciation_id}>
                          <TableCell>
                            <Typography fontWeight={700}>{row.asset_name || "Unknown"}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {row.serial_number || "N/A"}
                            </Typography>
                          </TableCell>
                          <TableCell>{row.category_name || "—"}</TableCell>
                          <TableCell>{row.method || "—"}</TableCell>
                          <TableCell>{row.useful_life_years || "—"}</TableCell>
                          <TableCell>{fmt(row.purchase_cost)}</TableCell>
                          <TableCell>{fmt(row.total_depreciated)}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "#07548e" }}>
                            {fmt(row.current_value)}
                          </TableCell>
                          <TableCell>
                            {row.calculated_at ? String(row.calculated_at).slice(0, 10) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        )}

        {tab === 2 && (
          <Box>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {[
                ["Maintenance Count", fmt(maintenance.summary.maintenance_count)],
                ["Total Cost", fmt(maintenance.summary.total_cost)],
                ["Completed Cost", fmt(maintenance.summary.completed_cost)],
                ["Approved Cost", fmt(maintenance.summary.approved_cost)],
                ["Amount Paid", fmt(maintenance.summary.paid_cost)],
              ].map(([title, value]) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={title}>
                  <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb" }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        {title}
                      </Typography>
                      <Typography variant="h6" fontWeight={800} sx={{ mt: 1, color: "#07548e" }}>
                        {value}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb" }}>
              <CardContent sx={{ p: 3 }}>
                {maintenance.rows.length === 0 ? (
                  <Typography color="text.secondary">No maintenance expenditure data.</Typography>
                ) : (
                  <TableContainer component={Paper} elevation={0}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Asset</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Cost</TableCell>
                          <TableCell>Approved Cost</TableCell>
                          <TableCell>Cost Status</TableCell>
                          <TableCell>Payment</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {maintenance.rows.map((row) => (
                          <TableRow key={row.maintenance_id}>
                            <TableCell>
                              <Typography fontWeight={700}>{row.asset_name || "Unknown"}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {row.serial_number || "N/A"}
                              </Typography>
                            </TableCell>
                            <TableCell>{row.description || "—"}</TableCell>
                            <TableCell>{fmt(row.cost)}</TableCell>
                            <TableCell>{row.approved_cost != null ? fmt(row.approved_cost) : "—"}</TableCell>
                            <TableCell>
                              <Chip
                                label={row.cost_approval_status || "Pending"}
                                size="small"
                                sx={{ fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell>{row.payment_status || "Pending"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Box>
        )}

        {tab === 3 && (
          <Box>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {[
                ["Disposals", fmt(disposal.summary.disposal_count)],
                ["Total Book Value", fmt(disposal.summary.total_book_value)],
                ["Accumulated Depreciation", fmt(disposal.summary.total_accumulated_depreciation)],
                ["Total Disposal Value", fmt(disposal.summary.total_disposal_value)],
                ["Proceeds Received", fmt(disposal.summary.total_proceeds_received)],
              ].map(([title, value]) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={title}>
                  <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb" }}>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        {title}
                      </Typography>
                      <Typography variant="h6" fontWeight={800} sx={{ mt: 1, color: "#07548e" }}>
                        {value}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb" }}>
              <CardContent sx={{ p: 3 }}>
                {disposal.rows.length === 0 ? (
                  <Typography color="text.secondary">
                    No disposal financial records found.
                  </Typography>
                ) : (
                  <TableContainer component={Paper} elevation={0}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Asset</TableCell>
                          <TableCell>Method</TableCell>
                          <TableCell>Book Value</TableCell>
                          <TableCell>Accumulated Depreciation</TableCell>
                          <TableCell>Disposal Value</TableCell>
                          <TableCell>Financial Status</TableCell>
                          <TableCell>Payment</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {disposal.rows.map((row) => (
                          <TableRow key={row.disposal_id}>
                            <TableCell>
                              <Typography fontWeight={700}>{row.asset_name || "Unknown"}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {row.serial_number || "N/A"}
                              </Typography>
                            </TableCell>
                            <TableCell>{row.method || "—"}</TableCell>
                            <TableCell>{fmt(row.book_value)}</TableCell>
                            <TableCell>{fmt(row.accumulated_depreciation)}</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#07548e" }}>
                              {fmt(row.disposal_value)}
                            </TableCell>
                            <TableCell>{row.financial_status || "Pending"}</TableCell>
                            <TableCell>{row.payment_status || "Pending"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FinanceOfficerReports;