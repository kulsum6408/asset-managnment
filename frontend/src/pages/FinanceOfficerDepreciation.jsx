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
  TextField,
  MenuItem,
  Button,
  Chip,
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

import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import API from "../services/api";

const drawerWidth = 250;
const topBarHeight = 64;

const FinanceOfficerDepreciation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState("");

  const [calculation, setCalculation] = useState(null);

  const [form, setForm] = useState({
    method: "Straight Line",
    useful_life_years: "5",
    rate_percent: "",
  });

  let user = {};

  try {
    user = JSON.parse(
      localStorage.getItem("user") || "{}"
    );
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
        console.error(
          "Failed to load Finance assets:",
          err
        );

        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            "Unable to load assets."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAssets();
  }, [navigate]);

  const selectedAssetData = assets.find(
    (asset) =>
      String(asset.asset_id || asset.id) ===
      String(selectedAsset)
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setCalculation(null);
    setSuccess("");
  };

  const handleCalculate = async () => {
    setError("");
    setSuccess("");
    setCalculation(null);

    if (!selectedAsset) {
      setError("Please select an asset.");
      return;
    }

    if (!form.useful_life_years) {
      setError("Please enter useful life.");
      return;
    }

    try {
      setCalculating(true);

      const token = localStorage.getItem("token");

      const response = await API.get(
        `/depreciation/calculate/${selectedAsset}`,
        {
          params: {
            years: Number(form.useful_life_years),
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = response.data;

      setCalculation(result);

      setSuccess(
        "Depreciation calculated successfully."
      );
    } catch (err) {
      console.error(
        "Failed to calculate depreciation:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to calculate depreciation."
      );
    } finally {
      setCalculating(false);
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!selectedAsset) {
      setError("Please select an asset.");
      return;
    }

    if (!form.useful_life_years) {
      setError("Please enter useful life.");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      const payload = {
        asset_id: Number(selectedAsset),
        method: form.method,
        useful_life_years: Number(
          form.useful_life_years
        ),
        rate_percent:
          form.rate_percent === ""
            ? undefined
            : Number(form.rate_percent),
      };

      const response = await API.post(
        "/depreciation",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = response.data;

      setCalculation(result.calculation || null);

      setSuccess(
        result.message ||
          "Depreciation calculated and saved successfully."
      );
    } catch (err) {
      console.error(
        "Failed to save depreciation:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to save depreciation."
      );
    } finally {
      setSaving(false);
    }
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

    navigate("/login", {
      replace: true,
    });
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
            item.path === "/finance"
              ? location.pathname === "/finance"
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
            onClick={() =>
              setMobileOpen(true)
            }
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
            Depreciation
          </Typography>

          <Avatar
            sx={{
              width: 40,
              height: 40,
              backgroundColor: "#07548e",
            }}
          >
            {(user.name || "F")
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
        onClose={() =>
          setMobileOpen(false)
        }
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
        }        }
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
          Asset Depreciation
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Calculate and save depreciation using the
          existing backend service.
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{ mb: 3 }}
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border:
                  "1px solid #e5e7eb",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{ mb: 3 }}
                >
                  Depreciation Details
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      select
                      label="Asset"
                      value={selectedAsset}
                      onChange={(e) => {
                        setSelectedAsset(
                          e.target.value
                        );
                        setCalculation(null);
                        setSuccess("");
                        setError("");
                      }}
                    >
                      {assets.length === 0 ? (
                        <MenuItem disabled>
                          No assets available
                        </MenuItem>
                      ) : (
                        assets.map((asset) => (
                          <MenuItem
                            key={
                              asset.asset_id ||
                              asset.id
                            }
                            value={
                              asset.asset_id ||
                              asset.id
                            }
                          >
                            {asset.asset_name ||
                              "Unknown Asset"}{" "}
                            —{" "}
                            {asset.serial_number ||
                              "No serial number"}
                          </MenuItem>
                        ))
                      )}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      select
                      label="Method"
                      name="method"
                      value={form.method}
                      onChange={handleChange}
                    >
                      <MenuItem value="Straight Line">
                        Straight Line
                      </MenuItem>

                      <MenuItem value="Declining Balance">
                        Declining Balance
                      </MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Useful Life (Years)"
                      name="useful_life_years"
                      value={
                        form.useful_life_years
                      }
                      onChange={handleChange}
                      inputProps={{
                        min: 1,
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Rate (%)"
                      name="rate_percent"
                      value={form.rate_percent}
                      onChange={handleChange}
                      inputProps={{
                        min: 0,
                        max: 100,
                        step: "0.01",
                      }}
                      helperText="Leave empty to let the backend calculate the rate."
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2,
                        flexWrap: "wrap",
                      }}
                    >
                      <Button
                        variant="contained"
                        onClick={
                          handleCalculate
                        }
                        disabled={calculating}
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
                        {calculating
                          ? "Calculating..."
                          : "Calculate"}
                      </Button>

                      <Button
                        variant="outlined"
                        onClick={handleSave}
                        disabled={saving}
                        sx={{
                          color: "#07548e",
                          borderColor:
                            "#07548e",
                          textTransform:
                            "none",
                          fontWeight: 700,
                          borderRadius: 2,
                        }}
                      >
                        {saving
                          ? "Saving..."
                          : "Save Depreciation"}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border:
                  "1px solid #e5e7eb",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{ mb: 3 }}
                >
                  Calculation Result
                </Typography>

                {!calculation ? (
                  <Typography
                    color="text.secondary"
                  >
                    Select an asset and calculate
                    depreciation.
                  </Typography>
                ) : (
                  <>
                    <Typography
                      variant="h6"
                      fontWeight={800}
                      sx={{ mb: 2 }}
                    >
                      {calculation.asset_name ||
                        selectedAssetData?.asset_name ||
                        "Asset"}
                    </Typography>

                    <Box
                      sx={{
                        display: "grid",
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Purchase Cost
                        </Typography>

                        <Typography
                          fontWeight={800}
                        >
                          {Number(
                            calculation.purchase_cost ||
                              0
                          ).toFixed(2)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Salvage Value
                        </Typography>

                        <Typography
                          fontWeight={800}
                        >
                          {Number(
                            calculation.salvage_value ||
                              0
                          ).toFixed(2)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Current Book Value
                        </Typography>

                        <Typography
                          variant="h5"
                          fontWeight={800}
                          color="#07548e"
                        >
                          {Number(
                            calculation.current_book_value ??
                              calculation.current_value ??
                              0
                          ).toFixed(2)}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Accumulated Depreciation
                        </Typography>

                        <Typography
                          variant="h6"
                          fontWeight={800}
                        >
                          {Number(
                            calculation.accumulated_depreciation ??
                              calculation.total_depreciated ??
                              0
                          ).toFixed(2)}
                        </Typography>
                      </Box>

                      {calculation.annual_depreciation !==
                        undefined && (
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Annual Depreciation
                          </Typography>

                          <Typography
                            fontWeight={800}
                          >
                            {Number(
                              calculation.annual_depreciation ||
                                0
                            ).toFixed(2)}
                          </Typography>
                        </Box>
                      )}

                      <Chip
                        label="Backend calculation"
                        color="success"
                        sx={{
                          width: "fit-content",
                          fontWeight: 700,
                        }}
                      />
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default FinanceOfficerDepreciation;