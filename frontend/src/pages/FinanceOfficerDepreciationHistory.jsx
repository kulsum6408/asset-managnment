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
  History as HistoryIcon,
  Refresh as RefreshIcon,
  ReceiptLong as ReceiptIcon,
  Savings as AssetFinancialIcon,
  AttachMoney as DisposalFinancialIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

const drawerWidth = 250;
const topBarHeight = 64;

const FinanceOfficerDepreciationHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [records, setRecords] = useState([]);

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await API.get("/depreciation", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.depreciation)
        ? data.depreciation
        : Array.isArray(data?.records)
        ? data.records
        : [];

      setRecords(list);
    } catch (err) {
      console.error(
        "Failed to load depreciation history:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to load depreciation history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

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
      icon: <HistoryIcon />,
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

  const formatDate = (value) => {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString();
  };

  const formatMoney = (value) => {
    return Number(value || 0).toFixed(2);
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
            Depreciation History
          </Typography>

          <Button
            startIcon={<RefreshIcon />}
            onClick={loadHistory}
            disabled={loading}
            sx={{
              mr: 1,
              color: "#07548e",
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Refresh
          </Button>

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
          Depreciation History
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Review all depreciation calculations saved in the system.
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        {records.length === 0 ? (
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #e5e7eb",
            }}
          >
            <CardContent
              sx={{
                p: 6,
                textAlign: "center",
              }}
            >
              <HistoryIcon
                sx={{
                  fontSize: 52,
                  color: "#9ca3af",
                  mb: 1,
                }}
              />

              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ mb: 1 }}
              >
                No depreciation records found
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Calculate and save depreciation to see records here.
              </Typography>

              <Button
                variant="contained"
                onClick={() =>
                  navigate(
                    "/finance/depreciation"
                  )
                }
                sx={{
                  backgroundColor: "#07548e",
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                }}
              >
                Calculate Depreciation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {records.map((record, index) => (
              <Grid
                size={{ xs: 12, md: 6 }}
                key={
                  record.depreciation_id ||
                  index
                }
              >
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    border:
                      "1px solid #e5e7eb",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent:
                          "space-between",
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
                          {record.asset_name ||
                            "Unknown Asset"}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Depreciation ID:{" "}
                          {record.depreciation_id ||
                            "N/A"}
                        </Typography>
                      </Box>

                      <Chip
                        label={
                          record.method ||
                          "Straight Line"
                        }
                        color="primary"
                        size="small"
                        sx={{
                          fontWeight: 700,
                        }}
                      />
                    </Box>

                    <Divider
                      sx={{ mb: 2 }}
                    />

                    <Grid
                      container
                      spacing={2}
                    >
                      <Grid size={{ xs: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Asset ID
                        </Typography>

                        <Typography fontWeight={700}>
                          {record.asset_id ||
                            "N/A"}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Category
                        </Typography>

                        <Typography fontWeight={700}>
                          {record.category_name ||
                            "N/A"}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Serial Number
                        </Typography>

                        <Typography fontWeight={700}>
                          {record.serial_number ||
                            "N/A"}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Purchase Date
                        </Typography>

                        <Typography fontWeight={700}>
                          {formatDate(
                            record.purchase_date
                          )}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Purchase Cost
                        </Typography>

                        <Typography fontWeight={800}>
                          {formatMoney(
                            record.purchase_cost
                          )}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Current Value
                        </Typography>

                        <Typography
                          fontWeight={800}
                          color="#07548e"
                        >
                          {formatMoney(
                            record.current_value
                          )}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Total Depreciated
                        </Typography>

                        <Typography fontWeight={800}>
                          {formatMoney(
                            record.total_depreciated
                          )}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Useful Life
                        </Typography>

                        <Typography fontWeight={700}>
                          {record.useful_life_years ||
                            "N/A"}{" "}
                          years
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Rate
                        </Typography>

                        <Typography fontWeight={700}>
                          {record.rate_percent ??
                            "N/A"}
                          %
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Calculated At
                        </Typography>

                        <Typography fontWeight={700}>
                          {formatDate(
                            record.calculated_at
                          )}
                        </Typography>
                      </Grid>
                    </Grid>

                    {record.notes && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          borderRadius: 2,
                          backgroundColor:
                            "#f5f7fb",
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          <strong>
                            Notes:
                          </strong>{" "}
                          {record.notes}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default FinanceOfficerDepreciationHistory;