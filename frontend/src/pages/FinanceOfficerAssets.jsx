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
  TextField,
  InputAdornment,
  Grid,
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
  Search as SearchIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

const drawerWidth = 250;
const topBarHeight = 64;

const FinanceOfficerAssets = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState("");

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        const response = await API.get("/assets", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.assets)
          ? data.assets
          : [];

        setAssets(list);
      } catch (err) {
        console.error("Failed to load financial assets:", err);

        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Unable to load financial assets."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAssets();
  }, [navigate]);

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return assets;
    }

    return assets.filter((asset) =>
      [
        asset.asset_name,
        asset.asset_id,
        asset.serial_number,
        asset.location,
        asset.status,
        asset.category_name,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query)
        )
    );
  }, [assets, search]);

  const totalPurchaseValue = useMemo(
    () =>
      assets.reduce(
        (sum, asset) => sum + Number(asset.purchase_cost || 0),
        0
      ),
    [assets]
  );

  const visiblePurchaseValue = useMemo(
    () =>
      filteredAssets.reduce(
        (sum, asset) => sum + Number(asset.purchase_cost || 0),
        0
      ),
    [filteredAssets]
  );

  const getStatusColor = (status) => {
    const value = String(status || "").toLowerCase();

    if (value === "available") return "success";
    if (value === "assigned") return "primary";

    if (
      value === "maintenance" ||
      value === "under maintenance"
    ) {
      return "warning";
    }

    if (value === "disposed") return "error";

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
            item.path === "/finance"
              ? location.pathname === "/finance"
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
                  color: "#ffffff",

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
                color: "#ffffff",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
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
          backgroundColor: "#ffffff",
          color: "#1f2937",
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          zIndex: (theme) => theme.zIndex.drawer + 1,
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
            Financial Assets
          </Typography>

          <Avatar
            sx={{
              width: 40,
              height: 40,
              backgroundColor: "#07548e",
            }}
          >
            {(user.name || "F").charAt(0).toUpperCase()}
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
            color: "#ffffff",
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
            color: "#ffffff",
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

        <Typography
          variant="h5"
          fontWeight={800}
          sx={{ mb: 1 }}
        >
          Financial Assets
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          View purchase values and financial information for organizational assets.
        </Typography>

        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
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
                  Total Purchase Value
                </Typography>

                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    mt: 1,
                    color: "#07548e",
                  }}
                >
                  {totalPurchaseValue.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
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
                  Filtered Purchase Value
                </Typography>

                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{ mt: 1 }}
                >
                  {visiblePurchaseValue.toFixed(2)}
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
          <CardContent>
            <TextField
              fullWidth
              placeholder="Search asset, serial number, ID, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </CardContent>
        </Card>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 3, mb: 2 }}
        >
          Showing {filteredAssets.length} of {assets.length} assets
        </Typography>

        <Grid container spacing={3}>
          {filteredAssets.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: "1px solid #e5e7eb",
                }}
              >
                <CardContent sx={{ p: 5, textAlign: "center" }}>
                  <Typography color="text.secondary">
                    No financial assets found.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            filteredAssets.map((asset, index) => (
              <Grid
                size={{ xs: 12, md: 6, lg: 4 }}
                key={asset.asset_id || asset.id || index}
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
                      <Box>
                        <Typography
                          variant="h6"
                          fontWeight={800}
                        >
                          {asset.asset_name || "Unknown Asset"}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Asset ID: {asset.asset_id || "N/A"}
                        </Typography>
                      </Box>

                      <Chip
                        label={asset.status || "Unknown"}
                        color={getStatusColor(asset.status)}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      <strong>Serial Number:</strong>{" "}
                      {asset.serial_number || "N/A"}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      <strong>Purchase Date:</strong>{" "}
                      {asset.purchase_date || "N/A"}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      <strong>Purchase Cost:</strong>{" "}
                      {Number(asset.purchase_cost || 0).toFixed(2)}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      <strong>Location:</strong>{" "}
                      {asset.location || "N/A"}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      <strong>Condition:</strong>{" "}
                      {asset.asset_condition || "N/A"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default FinanceOfficerAssets;