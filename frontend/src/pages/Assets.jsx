import BackButton from "../components/BackButton";

import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
} from "@mui/material";

import {
  Search as SearchIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";

import API from "../services/api";

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [openView, setOpenView] = useState(false);

  // =====================================================
  // GET ASSETS
  // =====================================================
  const fetchAssets = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No authentication token found.");
        setAssets([]);
        return;
      }

      const response = await API.get("/assets", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("ASSETS RESPONSE:", response.data);

      const data = response.data;

      if (Array.isArray(data)) {
        setAssets(data);
      } else if (Array.isArray(data.assets)) {
        setAssets(data.assets);
      } else if (Array.isArray(data.data)) {
        setAssets(data.data);
      } else {
        setAssets([]);
      }
    } catch (error) {
      console.error("Failed to load assets:", error);

      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Response:", error.response.data);
      }

      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // =====================================================
  // FILTER ASSETS
  // =====================================================
  const filteredAssets = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesSearch =
        String(asset.asset_name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(asset.serial_number || "")
          .toLowerCase()
          .includes(searchText) ||
        String(asset.category_name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(asset.location || "")
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        String(asset.status || "") === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [assets, search, statusFilter]);

  // =====================================================
  // STATUS COUNTS
  // =====================================================
  const statusCounts = {
    All: assets.length,
    Available: assets.filter(
      (asset) => asset.status === "Available"
    ).length,
    Assigned: assets.filter(
      (asset) => asset.status === "Assigned"
    ).length,
    "Under Maintenance": assets.filter(
      (asset) => asset.status === "Under Maintenance"
    ).length,
    Transferred: assets.filter(
      (asset) => asset.status === "Transferred"
    ).length,
    Disposed: assets.filter(
      (asset) => asset.status === "Disposed"
    ).length,
    Lost: assets.filter(
      (asset) => asset.status === "Lost"
    ).length,
  };

  // =====================================================
  // STATUS COLOR
  // =====================================================
  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
        return "success";

      case "Assigned":
        return "primary";

      case "Under Maintenance":
        return "warning";

      case "Disposed":
        return "default";

      case "Lost":
        return "error";

      case "Transferred":
        return "info";

      default:
        return "default";
    }
  };

  // =====================================================
  // VIEW ASSET
  // =====================================================
  const handleViewAsset = async (asset) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setSelectedAsset(asset);
        setOpenView(true);
        return;
      }

      const response = await API.get(
        `/assets/${asset.asset_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSelectedAsset(response.data);
      setOpenView(true);
    } catch (error) {
      console.error(
        "Failed to load asset details:",
        error
      );

      setSelectedAsset(asset);
      setOpenView(true);
    }
  };

  // =====================================================
  // CLOSE ASSET VIEW
  // =====================================================
  const handleCloseView = () => {
    setOpenView(false);
    setSelectedAsset(null);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f5f7fb",
        p: {
          xs: 2,
          sm: 3,
          md: 4,
        },
      }}
    >
      {/* =================================================
          HEADER
      ================================================= */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        <BackButton to="/admin" />

        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "#1f2937",
            }}
          >
            Assets
          </Typography>

          <Typography
            sx={{
              color: "#6b7280",
              mt: 0.5,
            }}
          >
            Monitor and view assets across the system.
          </Typography>
        </Box>
      </Box>


      {/* =================================================
          STATUS SUMMARY
      ================================================= */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(3, 1fr)",
            lg: "repeat(6, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          "All",
          "Available",
          "Assigned",
          "Under Maintenance",
          "Transferred",
          "Disposed",
        ].map((status) => (
          <Card
            key={status}
            onClick={() => setStatusFilter(status)}
            elevation={0}
            sx={{
              cursor: "pointer",
              borderRadius: 3,
              border:
                statusFilter === status
                  ? "2px solid #07548e"
                  : "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
              transition: "0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
              },
            }}
          >
            <CardContent>
              <Typography
                variant="body2"
                sx={{
                  color: "#6b7280",
                  mb: 1,
                }}
              >
                {status}
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: "#1f2937",
                }}
              >
                {statusCounts[status]}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* =================================================
          FILTERS
      ================================================= */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          mb: 3,
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <TextField
              fullWidth
              placeholder="Search asset..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              sx={{
                flex: 1,
                minWidth: 240,

                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{
                        color: "#6b7280",
                      }}
                    />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl
              sx={{
                minWidth: 220,
              }}
            >
              <InputLabel>Status</InputLabel>

              <Select
                value={statusFilter}
                label="Status"
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                sx={{
                  borderRadius: 2,
                }}
              >
                <MenuItem value="All">
                  All Assets
                </MenuItem>

                <MenuItem value="Available">
                  Available
                </MenuItem>

                <MenuItem value="Assigned">
                  Assigned
                </MenuItem>

                <MenuItem value="Under Maintenance">
                  Under Maintenance
                </MenuItem>

                <MenuItem value="Transferred">
                  Transferred
                </MenuItem>

                <MenuItem value="Disposed">
                  Disposed
                </MenuItem>

                <MenuItem value="Lost">
                  Lost
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* =================================================
          ASSET TABLE
      ================================================= */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 8,
              }}
            >
              <CircularProgress
                sx={{
                  color: "#07548e",
                }}
              />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700 }}>
                      Asset
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Serial Number
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Category
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Status
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Condition
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      Location
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700 }}
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredAssets.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        align="center"
                        sx={{
                          py: 7,
                          color: "#6b7280",
                        }}
                      >
                        No assets found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssets.map((asset) => (
                      <TableRow
                        key={asset.asset_id}
                        hover
                      >
                        <TableCell>
                          <Typography
                            sx={{
                              fontWeight: 600,
                            }}
                          >
                            {asset.asset_name || "-"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {asset.serial_number || "-"}
                        </TableCell>

                        <TableCell>
                          {asset.category_name || "-"}
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={
                              asset.status || "Unknown"
                            }
                            color={getStatusColor(
                              asset.status
                            )}
                            size="small"
                            sx={{
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          {asset.asset_condition || "-"}
                        </TableCell>

                        <TableCell>
                          {asset.location || "-"}
                        </TableCell>

                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ViewIcon />}
                            onClick={() =>
                              handleViewAsset(asset)
                            }
                            sx={{
                              textTransform: "none",
                              borderColor: "#07548e",
                              color: "#07548e",
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* =================================================
          VIEW ASSET DIALOG
      ================================================= */}
      <Dialog
        open={openView}
        onClose={handleCloseView}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
          }}
        >
          Asset Details
        </DialogTitle>

        <DialogContent>
          {selectedAsset && (
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  color: "#1f2937",
                }}
              >
                {selectedAsset.asset_name || "-"}
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 1fr",
                  },
                  gap: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Asset ID
                  </Typography>

                  <Typography>
                    {selectedAsset.asset_id || "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Serial Number
                  </Typography>

                  <Typography>
                    {selectedAsset.serial_number || "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Category
                  </Typography>

                  <Typography>
                    {selectedAsset.category_name || "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Status
                  </Typography>

                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={
                        selectedAsset.status || "Unknown"
                      }
                      color={getStatusColor(
                        selectedAsset.status
                      )}
                      size="small"
                    />
                  </Box>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Condition
                  </Typography>

                  <Typography>
                    {selectedAsset.asset_condition || "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Location
                  </Typography>

                  <Typography>
                    {selectedAsset.location || "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Purchase Date
                  </Typography>

                  <Typography>
                    {selectedAsset.purchase_date || "-"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Purchase Cost
                  </Typography>

                  <Typography>
                    {selectedAsset.purchase_cost ?? "-"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCloseView}
            sx={{
              textTransform: "none",
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Assets;