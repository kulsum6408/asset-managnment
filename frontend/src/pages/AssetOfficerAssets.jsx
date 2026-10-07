import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Alert,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Stack,
} from "@mui/material";

import {
  Search as SearchIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Inventory2 as AssetIcon,
  History as HistoryIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import API from "../services/api";

const AssetOfficerAssets = () => {
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  const [form, setForm] = useState({
    asset_name: "",
    category_id: "",
    serial_number: "",
    purchase_date: "",
    purchase_cost: "",
    status: "Available",
    asset_condition: "Good",
    location: "",
  });

  // =====================================================
  // HELPERS
  // =====================================================

  const getList = (data, key) => {
    if (Array.isArray(data)) return data;

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data?.[key])) {
      return data[key];
    }

    return [];
  };

  // =====================================================
  // LOAD DATA
  // =====================================================

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [assetsResponse, categoriesResponse] =
        await Promise.allSettled([
          API.get("/assets", { headers }),
          API.get("/categories", { headers }),
        ]);

      if (assetsResponse.status === "fulfilled") {
        setAssets(
          getList(
            assetsResponse.value.data,
            "assets"
          )
        );
      } else {
        setError(
          assetsResponse.reason?.response?.data
            ?.error ||
            "Unable to load assets."
        );
      }

      if (
        categoriesResponse.status ===
        "fulfilled"
      ) {
        setCategories(
          getList(
            categoriesResponse.value.data,
            "categories"
          )
        );
      }
    } catch (err) {
      console.error(
        "Failed to load Asset Officer assets:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Unable to load asset inventory."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =====================================================
  // FILTER
  // =====================================================

  const filteredAssets = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return assets.filter((asset) => {
      const matchesSearch =
        !searchValue ||
        String(
          asset.asset_name || ""
        )
          .toLowerCase()
          .includes(searchValue) ||
        String(
          asset.serial_number || ""
        )
          .toLowerCase()
          .includes(searchValue) ||
        String(
          asset.location || ""
        )
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        String(asset.status || "")
          .toLowerCase() ===
          statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [assets, search, statusFilter]);

  // =====================================================
  // FORM
  // =====================================================

  const resetForm = () => {
    setForm({
      asset_name: "",
      category_id: "",
      serial_number: "",
      purchase_date: "",
      purchase_cost: "",
      status: "Available",
      asset_condition: "Good",
      location: "",
    });
  };

  const openAddDialog = () => {
    setEditingAsset(null);
    resetForm();
    setError("");
    setSuccess("");
    setDialogOpen(true);
  };

  const openEditDialog = (asset) => {
    setEditingAsset(asset);

    setForm({
      asset_name: asset.asset_name || "",
      category_id:
        asset.category_id || "",
      serial_number:
        asset.serial_number || "",
      purchase_date: asset.purchase_date
        ? String(
            asset.purchase_date
          ).slice(0, 10)
        : "",
      purchase_cost:
        asset.purchase_cost ?? "",
      status:
        asset.status || "Available",
      asset_condition:
        asset.asset_condition || "Good",
      location:
        asset.location || "",
    });

    setError("");
    setSuccess("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;

    setDialogOpen(false);
    setEditingAsset(null);
    resetForm();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // SAVE
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.asset_name.trim()) {
      setError("Asset name is required.");
      return;
    }

    if (!form.category_id) {
      setError("Please select a category.");
      return;
    }

    if (!form.serial_number.trim()) {
      setError("Serial number is required.");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const payload = {
        asset_name: form.asset_name.trim(),
        category_id: Number(form.category_id),
        serial_number:
          form.serial_number.trim(),
        purchase_date:
          form.purchase_date || null,
        purchase_cost:
          form.purchase_cost === ""
            ? null
            : Number(form.purchase_cost),
        status: form.status,
        asset_condition:
          form.asset_condition,
        location:
          form.location.trim() || null,
      };

      if (editingAsset) {
        const response = await API.put(
          `/assets/${editingAsset.asset_id}`,
          payload,
          { headers }
        );

        setSuccess(
          response.data?.message ||
            "Asset updated successfully."
        );
      } else {
        const response = await API.post(
          "/assets",
          payload,
          { headers }
        );

        setSuccess(
          response.data?.message ||
            "Asset created successfully."
        );
      }

      closeDialog();
      await fetchData();
    } catch (err) {
      console.error(
        "Failed to save asset:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to save asset."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // STATUS COLOR
  // =====================================================

  const getStatusColor = (status) => {
    const value = String(
      status || ""
    ).toLowerCase();

    if (value === "available") {
      return "success";
    }

    if (value === "assigned") {
      return "primary";
    }

    if (
      value === "maintenance" ||
      value === "under maintenance"
    ) {
      return "warning";
    }

    if (value === "disposed") {
      return "error";
    }

    return "default";
  };

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
        <CircularProgress
          sx={{
            color: "#07548e",
          }}
        />
      </Box>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

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
      {/* BACK */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate("/asset-officer")}
        sx={{
          mb: 3,
          color: "#07548e",
          fontWeight: 700,
          textTransform: "none",
        }}
      >
        Back to Dashboard
      </Button>

      {/* HEADER */}

      <Box
        sx={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: {
            xs: "flex-start",
            md: "center",
          },
          flexDirection: {
            xs: "column",
            md: "row",
          },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: "#1f2937",
              mb: 1,
            }}
          >
            Asset Inventory
          </Typography>

          <Typography
            sx={{
              color: "#6b7280",
            }}
          >
            Register, search, update and monitor
            organization assets.
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
        >
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            sx={{
              borderColor: "#07548e",
              color: "#07548e",
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAddDialog}
            sx={{
              backgroundColor: "#07548e",
              textTransform: "none",
              fontWeight: 700,

              "&:hover": {
                backgroundColor:
                  "#064675",
              },
            }}
          >
            Add Asset
          </Button>
        </Stack>
      </Box>

      {/* MESSAGES */}

      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess("")}
          sx={{
            mb: 3,
            borderRadius: 2,
          }}
        >
          {success}
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{
            mb: 3,
            borderRadius: 2,
          }}
        >
          {error}
        </Alert>
      )}

      {/* SEARCH/FILTER */}

      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border:
            "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <CardContent>
          <Grid
            container
            spacing={2}
          >
            <Grid
              size={{
                xs: 12,
                md: 8,
              }}
            >
              <TextField
                fullWidth
                label="Search assets"
                placeholder="Search by name, serial number or location..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid
              size={{
                xs: 12,
                md: 4,
              }}
            >
              <TextField
                fullWidth
                select
                label="Status"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value
                  )
                }
              >
                <MenuItem value="All">
                  All Statuses
                </MenuItem>

                <MenuItem value="Available">
                  Available
                </MenuItem>

                <MenuItem value="Assigned">
                  Assigned
                </MenuItem>

                <MenuItem value="Maintenance">
                  Maintenance
                </MenuItem>

                <MenuItem value="Disposed">
                  Disposed
                </MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ASSET LIST */}

      {filteredAssets.length === 0 ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border:
              "1px solid #e5e7eb",
            backgroundColor:
              "#ffffff",
          }}
        >
          <CardContent
            sx={{
              py: 7,
              textAlign: "center",
            }}
          >
            <AssetIcon
              sx={{
                fontSize: 60,
                color: "#07548e",
                mb: 2,
              }}
            />

            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 1,
              }}
            >
              No Assets Found
            </Typography>

            <Typography color="text.secondary">
              No assets match your current search or filter.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredAssets.map((asset) => (
            <Grid
              size={{
                xs: 12,
                sm: 6,
                lg: 4,
              }}
              key={asset.asset_id}
            >
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  border:
                    "1px solid #e5e7eb",
                  backgroundColor:
                    "#ffffff",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          display: "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          backgroundColor:
                            "#e8f2fa",
                          color:
                            "#07548e",
                        }}
                      >
                        <AssetIcon />
                      </Box>

                      <Box>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                        >
                          {asset.asset_name}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          #
                          {asset.asset_id}
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      label={
                        asset.status ||
                        "Unknown"
                      }
                      color={getStatusColor(
                        asset.status
                      )}
                      size="small"
                      sx={{
                        fontWeight: 700,
                      }}
                    />
                  </Box>

                  <Stack spacing={1}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Serial Number:{" "}
                      <strong>
                        {asset.serial_number ||
                          "N/A"}
                      </strong>
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Condition:{" "}
                      <strong>
                        {asset.asset_condition ||
                          "N/A"}
                      </strong>
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Location:{" "}
                      <strong>
                        {asset.location ||
                          "N/A"}
                      </strong>
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Purchase Cost:{" "}
                      <strong>
                        {asset.purchase_cost !==
                        null &&
                        asset.purchase_cost !==
                          undefined
                          ? Number(
                              asset.purchase_cost
                            ).toLocaleString()
                          : "N/A"}
                      </strong>
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Purchase Date:{" "}
                      <strong>
                        {asset.purchase_date
                          ? new Date(
                              asset.purchase_date
                            ).toLocaleDateString()
                          : "N/A"}
                      </strong>
                    </Typography>
                  </Stack>

                  {/* EDIT ASSET */}

                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() =>
                      openEditDialog(asset)
                    }
                    sx={{
                      mt: 3,
                      borderColor:
                        "#07548e",
                      color: "#07548e",
                      textTransform:
                        "none",
                      fontWeight: 700,
                    }}
                  >
                    Edit Asset
                  </Button>

                  {/* VIEW HISTORY — NEW */}

                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<HistoryIcon />}
                    onClick={() =>
                      navigate(
                        `/asset-officer/assets/${asset.asset_id}/history`
                      )
                    }
                    sx={{
                      mt: 1.5,
                      backgroundColor:
                        "#07548e",
                      textTransform:
                        "none",
                      fontWeight: 700,

                      "&:hover": {
                        backgroundColor:
                          "#064675",
                      },
                    }}
                  >
                    View History
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* ADD / EDIT DIALOG */}

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
          }}
        >
          {editingAsset
            ? "Edit Asset"
            : "Register New Asset"}
        </DialogTitle>

        <Box
          component="form"
          onSubmit={handleSubmit}
        >
          <DialogContent>
            <Grid
              container
              spacing={2}
              sx={{ mt: 0 }}
            >
              <Grid
                size={{
                  xs: 12,
                  md: 6,
                }}
              >
                <TextField
                  fullWidth
                  required
                  label="Asset Name"
                  name="asset_name"
                  value={
                    form.asset_name
                  }
                  onChange={handleChange}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 6,
                }}
              >
                <TextField
                  fullWidth
                  required
                  select
                  label="Category"
                  name="category_id"
                  value={
                    form.category_id
                  }
                  onChange={handleChange}
                >
                  {categories.length ===
                  0 ? (
                    <MenuItem disabled>
                      No categories available
                    </MenuItem>
                  ) : (
                    categories.map(
                      (category) => (
                        <MenuItem
                          key={
                            category.category_id
                          }
                          value={
                            category.category_id
                          }
                        >
                          {category.category_name ||
                            category.name}
                        </MenuItem>
                      )
                    )
                  )}
                </TextField>
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 6,
                }}
              >
                <TextField
                  fullWidth
                  required
                  label="Serial Number"
                  name="serial_number"
                  value={
                    form.serial_number
                  }
                  onChange={handleChange}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 6,
                }}
              >
                <TextField
                  fullWidth
                  type="date"
                  label="Purchase Date"
                  name="purchase_date"
                  value={
                    form.purchase_date
                  }
                  onChange={handleChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 6,
                }}
              >
                <TextField
                  fullWidth
                  type="number"
                  label="Purchase Cost"
                  name="purchase_cost"
                  value={
                    form.purchase_cost
                  }
                  onChange={handleChange}
                  inputProps={{
                    min: 0,
                    step: "0.01",
                  }}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 6,
                }}
              >
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 6,
                }}
              >
                <TextField
                  fullWidth
                  select
                  label="Status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <MenuItem value="Available">
                    Available
                  </MenuItem>

                  <MenuItem value="Assigned">
                    Assigned
                  </MenuItem>

                  <MenuItem value="Maintenance">
                    Maintenance
                  </MenuItem>

                  <MenuItem value="Disposed">
                    Disposed
                  </MenuItem>
                </TextField>
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 6,
                }}
              >
                <TextField
                  fullWidth
                  select
                  label="Condition"
                  name="asset_condition"
                  value={
                    form.asset_condition
                  }
                  onChange={handleChange}
                >
                  <MenuItem value="Good">
                    Good
                  </MenuItem>

                  <MenuItem value="Fair">
                    Fair
                  </MenuItem>

                  <MenuItem value="Damaged">
                    Damaged
                  </MenuItem>

                  <MenuItem value="Poor">
                    Poor
                  </MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={closeDialog}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              sx={{
                backgroundColor:
                  "#07548e",
                textTransform:
                  "none",
                fontWeight: 700,

                "&:hover": {
                  backgroundColor:
                    "#064675",
                },
              }}
            >
              {saving
                ? "Saving..."
                : editingAsset
                ? "Save Changes"
                : "Register Asset"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};

export default AssetOfficerAssets;