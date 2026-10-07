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
  Grid,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Button,
  TextField,
  InputAdornment,
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
  People as PeopleIcon,
  Inventory2 as AssetIcon,
  Inventory as StoreIcon,
  Category as CategoryIcon,
  Assignment as RequestIcon,
  AssignmentTurnedIn as AssignmentIcon,
  KeyboardReturn as ReturnIcon,
  SwapHoriz as TransferIcon,
  Build as MaintenanceIcon,
  Assessment as ReportIcon,
  Notifications as NotificationIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle as AvailableIcon,
  AssignmentInd as AssignedIcon,
  BuildCircle as WarningIcon,
  DeleteForever as DisposalIcon,
} from "@mui/icons-material";

import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

const drawerWidth = 250;
const topBarHeight = 64;

const InventoryStore = ({ role = "asset_officer" }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState({
    total_assets: 0,
    available_assets: 0,
    assigned_assets: 0,
    maintenance_assets: 0,
    disposed_assets: 0,
    lost_assets: 0,
    categories_summary: [],
  });

 const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("All");
const [categoryFilter, setCategoryFilter] = useState("All");

// Admin inventory year
const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  // =====================================================
  // FETCH INVENTORY DATA (SINGLE SOURCE OF TRUTH)
  // =====================================================
  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [inventoryRes, summaryRes] = await Promise.allSettled([
        API.get("/inventory", { headers }),
        API.get("/inventory/summary", { headers }),
      ]);

      if (inventoryRes.status === "fulfilled") {
        const data = inventoryRes.value.data;
        setInventory(Array.isArray(data) ? data : data.data || []);
      } else {
        setError(inventoryRes.reason?.response?.data?.error || "Failed to load inventory.");
      }

      if (summaryRes.status === "fulfilled") {
        setSummary(summaryRes.value.data || {});
      }
    } catch (err) {
      console.error("Failed to load inventory store data:", err);
      setError(err.response?.data?.error || "Unable to load store inventory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  // =====================================================
  // FILTERING LOGIC
  // =====================================================
  const filteredInventory = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return inventory.filter((item) => {
      const matchesSearch =
        !searchText ||
        String(item.asset_name || "").toLowerCase().includes(searchText) ||
        String(item.serial_number || "").toLowerCase().includes(searchText) ||
        String(item.category_name || "").toLowerCase().includes(searchText) ||
        String(item.location || "").toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        String(item.status || "").toLowerCase() === statusFilter.toLowerCase();

      const matchesCategory =
        categoryFilter === "All" ||
        String(item.category_name || "").toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [inventory, search, statusFilter, categoryFilter]);

  // =====================================================
  // STATUS CHIP COLOR
  // =====================================================
  const getStatusColor = (status) => {
    const value = String(status || "").toLowerCase();
    if (value === "available") return "success";
    if (value === "assigned") return "primary";
    if (value === "under maintenance" || value === "maintenance") return "warning";
    if (value === "disposed") return "default";
    if (value === "lost") return "error";
    return "default";
  };

  // =====================================================
  // NAVIGATION MENU ITEMS
  // =====================================================
  const isAdmin = role === "admin";

  const menuItems = isAdmin
    ? [
        { text: "Dashboard", icon: <DashboardIcon />, path: "/admin" },
        { text: "Users", icon: <PeopleIcon />, path: "/admin/users" },
        { text: "Store / Inventory", icon: <StoreIcon />, path: "/admin/inventory" },
        { text: "Assets", icon: <AssetIcon />, path: "/admin/assets" },
        { text: "Categories", icon: <CategoryIcon />, path: "/admin/categories" },
        { text: "Requests", icon: <RequestIcon />, path: "/admin/requests" },
        { text: "Maintenance", icon: <MaintenanceIcon />, path: "/admin/maintenance" },
        { text: "Reports", icon: <ReportIcon />, path: "/admin/reports" },
        { text: "Notifications", icon: <NotificationIcon />, path: "/admin/notifications" },
        { text: "Settings", icon: <SettingsIcon />, path: "/admin/settings" },
      ]
    : [
        { text: "Dashboard", icon: <DashboardIcon />, path: "/asset-officer" },
        { text: "Store / Inventory", icon: <StoreIcon />, path: "/asset-officer/store" },
        { text: "Asset Management", icon: <AssetIcon />, path: "/asset-officer/assets" },
        { text: "Requests", icon: <RequestIcon />, path: "/asset-officer/requests" },
        { text: "Assignments", icon: <AssignmentIcon />, path: "/asset-officer/assignments" },
        { text: "Returns", icon: <ReturnIcon />, path: "/asset-officer/returns" },
        { text: "Transfers", icon: <TransferIcon />, path: "/asset-officer/transfers" },
        { text: "Maintenance", icon: <MaintenanceIcon />, path: "/asset-officer/maintenance" },
        { text: "Reports", icon: <ReportIcon />, path: "/asset-officer/reports" },
        { text: "Notifications", icon: <NotificationIcon />, path: "/asset-officer/notifications" },
        { text: "Settings", icon: <SettingsIcon />, path: "/asset-officer/settings" },
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
          const selected = location.pathname === item.path;
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
                <ListItemIcon sx={{ color: "#fff", minWidth: 42 }}>{item.icon}</ListItemIcon>
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

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#f5f7fb" }}>
      <CssBaseline />

      {/* TOP APP BAR */}
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
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            {isAdmin ? "Admin Store Inventory" : "Asset Store & Inventory"}
          </Typography>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchInventoryData}
            disabled={loading}
            sx={{ mr: 2, borderColor: "#07548e", color: "#07548e", textTransform: "none", fontWeight: 700 }}
          >
            Refresh
          </Button>

          <Avatar sx={{ width: 40, height: 40, backgroundColor: "#07548e" }}>
            {(user.name || (isAdmin ? "A" : "O")).charAt(0).toUpperCase()}
          </Avatar>
        </Toolbar>
      </AppBar>

      {/* SIDEBAR DRAWERS */}
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

      {/* MAIN CONTENT AREA */}
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
        {/* TITLE & DESCRIPTION */}
        <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5, color: "#1f2937" }}>
          Store Inventory & Stock Levels
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {isAdmin
            ? "System-wide real-time inventory visibility and store balance."
            : "Manage and monitor real-time operational store inventory and stock balances."}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* STORE SUMMARY CARDS */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb", backgroundColor: "#fff" }}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ backgroundColor: "#e8f2fa", color: "#07548e", width: 48, height: 48 }}>
                  <StoreIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    Total Items
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="#1f2937">
                    {summary.total_assets || 0}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb", backgroundColor: "#fff" }}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ backgroundColor: "#edf7ed", color: "#2e7d32", width: 48, height: 48 }}>
                  <AvailableIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    Available in Store
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="#2e7d32">
                    {summary.available_assets || 0}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb", backgroundColor: "#fff" }}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ backgroundColor: "#e3f2fd", color: "#0288d1", width: 48, height: 48 }}>
                  <AssignedIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    Currently Assigned
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="#0288d1">
                    {summary.assigned_assets || 0}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb", backgroundColor: "#fff" }}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ backgroundColor: "#fff4e5", color: "#ed6c02", width: 48, height: 48 }}>
                  <WarningIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    In Maintenance
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="#ed6c02">
                    {summary.maintenance_assets || 0}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* FILTERS CARD */}
        <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb", mb: 3, backgroundColor: "#fff" }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search store inventory by asset name, serial, category or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Status Filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="All">All Statuses</MenuItem>
                  <MenuItem value="Available">Available (In Store)</MenuItem>
                  <MenuItem value="Assigned">Assigned (Issued)</MenuItem>
                  <MenuItem value="Under Maintenance">Under Maintenance</MenuItem>
                  <MenuItem value="Disposed">Disposed</MenuItem>
                  <MenuItem value="Lost">Lost</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Category Filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="All">All Categories</MenuItem>
                  {(summary.categories_summary || []).map((cat) => (
                    <MenuItem key={cat.category_id} value={cat.category_name}>
                      {cat.category_name} ({cat.total_count})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* INVENTORY TABLE CARD */}
        <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb", backgroundColor: "#fff" }}>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress sx={{ color: "#07548e" }} />
              </Box>
            ) : filteredInventory.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <StoreIcon sx={{ fontSize: 48, color: "#9ca3af", mb: 1 }} />
                <Typography fontWeight={700} color="text.secondary">
                  No inventory items match your current filter.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead sx={{ backgroundColor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Asset Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Serial Number</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Condition</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Created Date</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredInventory.map((item) => (
                      <TableRow key={item.asset_id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {item.asset_name || "-"}
                        </TableCell>

                        <TableCell>{item.serial_number || "-"}</TableCell>

                        <TableCell>{item.category_name || "-"}</TableCell>

                        <TableCell>{item.asset_condition || "-"}</TableCell>

                        <TableCell>
                          <Chip
                            label={item.status || "Unknown"}
                            color={getStatusColor(item.status)}
                            size="small"
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>

                        <TableCell>{item.location || "Store Room"}</TableCell>

                        <TableCell>
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString()
                            : "-"}
                        </TableCell>
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

export default InventoryStore;
