import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Stack,
  Divider,
  MenuItem,
  Avatar,
} from "@mui/material";

import {
  Calculate as DepreciationIcon,
  Refresh as RefreshIcon,
  Inventory2 as AssetIcon,
} from "@mui/icons-material";

import API from "../services/api";
import BackButton from "../components/BackButton";

const AssetOfficerDepreciation = () => {
  const [assets, setAssets] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedAsset, setSelectedAsset] = useState("");
  const [calculation, setCalculation] = useState(null);

  const [form, setForm] = useState({
    method: "Straight Line",
    useful_life_years: "5",
    rate_percent: "",
    notes: "",
  });

  const fetchAll = async () => {
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

      const [assetsRes, recordsRes] =
        await Promise.allSettled([
          API.get("/assets", { headers }),
          API.get("/depreciation", { headers }),
        ]);

      if (assetsRes.status === "fulfilled") {
        const data = assetsRes.value.data;

        setAssets(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.assets)
            ? data.assets
            : []
        );
      }

      if (recordsRes.status === "fulfilled") {
        const data = recordsRes.value.data;

        setRecords(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.depreciation)
            ? data.depreciation
            : []
        );
      }
    } catch (err) {
      console.error(
        "Failed to load depreciation data:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Unable to load depreciation data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

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

      setCalculation(response.data);

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
        notes: form.notes.trim() || null,
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

      setCalculation(
        response.data.calculation || null
      );

      setSuccess(
        response.data.message ||
          "Depreciation calculated and saved successfully."
      );

      fetchAll();
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

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress sx={{ color: "#07548e" }} />
      </Box>
    );
  }

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
      {/* HEADER */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <BackButton to="/asset-officer" />

          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: "#1f2937",
              }}
            >
              Asset Depreciation
            </Typography>
          </Box>
        </Box>

        <Typography
          color="text.secondary"
          sx={{ mt: 1 }}
        >
          Calculate and record depreciation for store
          assets.
        </Typography>
      </Box>

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
        {/* ================================================
            FORM
        ================================================ */}

        <Grid item xs={12} md={7}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #e5e7eb",
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 1,
                }}
              >
                <DepreciationIcon
                  sx={{
                    color: "#07548e",
                    fontSize: 30,
                  }}
                />

                <Typography variant="h6" fontWeight={700}>
                  Depreciation Details
                </Typography>
              </Box>

              <Typography
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                Select an asset and calculate depreciation
                using the store's accounting method.
              </Typography>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    select
                    label="Asset"
                    value={selectedAsset}
                    onChange={(event) => {
                      setSelectedAsset(event.target.value);
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
                          key={asset.asset_id || asset.id}
                          value={asset.asset_id || asset.id}
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
                    value={form.useful_life_years}
                    onChange={handleChange}
                    inputProps={{ min: 1 }}
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

                <Grid size={{ xs: 12, md: 6 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={fetchAll}
                    sx={{
                      height: "100%",
                      minHeight: 56,
                      color: "#07548e",
                      borderColor: "#07548e",
                      textTransform: "none",
                      fontWeight: 700,
                    }}
                  >
                    Reload Assets
                  </Button>
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Notes"
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Optional depreciation notes..."
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Stack
                    direction={{
                      xs: "column",
                      sm: "row",
                    }}
                    spacing={2}
                  >
                    <Button
                      variant="contained"
                      onClick={handleCalculate}
                      disabled={
                        calculating ||
                        !selectedAsset
                      }
                      sx={{
                        flex: 1,
                        backgroundColor: "#07548e",
                        textTransform: "none",
                        fontWeight: 700,
                        py: 1.4,
                        "&:hover": {
                          backgroundColor: "#064675",
                        },
                      }}
                    >
                      {calculating
                        ? "Calculating..."
                        : "Preview Calculation"}
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={handleSave}
                      disabled={
                        saving || !selectedAsset
                      }
                      sx={{
                        flex: 1,
                        color: "#07548e",
                        borderColor: "#07548e",
                        textTransform: "none",
                        fontWeight: 700,
                        py: 1.4,
                      }}
                    >
                      {saving
                        ? "Saving..."
                        : "Calculate & Save"}
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* ================================================
            RESULT
        ================================================ */}

        <Grid item xs={12} md={5}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid #e5e7eb",
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{ mb: 3 }}
              >
                Calculation Result
              </Typography>

              {!calculation ? (
                <Alert severity="info">
                  Select an asset and preview the
                  depreciation calculation.
                </Alert>
              ) : (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        backgroundColor: "#e8f2fa",
                        color: "#07548e",
                      }}
                    >
                      <AssetIcon />
                    </Avatar>

                    <Box>
                      <Typography
                        variant="h6"
                        fontWeight={800}
                      >
                        {calculation.asset_name ||
                          selectedAssetData?.asset_name ||
                          "Asset"}
                      </Typography>

                      <Chip
                        label={
                          calculation.method ||
                          "Calculation"
                        }
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: "grid", gap: 2 }}>
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Purchase Cost
                      </Typography>

                      <Typography fontWeight={800}>
                        {Number(
                          calculation.purchase_cost || 0
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Salvage Value
                      </Typography>

                      <Typography fontWeight={800}>
                        {Number(
                          calculation.salvage_value || 0
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Age of Asset
                      </Typography>

                      <Typography fontWeight={800}>
                        {Number(
                          calculation.age_in_years || 0
                        ).toFixed(2)}{" "}
                        years
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
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
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
                        ).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
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

                        <Typography fontWeight={800}>
                          {Number(
                            calculation.annual_depreciation ||
                              0
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
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

              {records.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />

                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    sx={{ mb: 2 }}
                  >
                    Recent Records
                  </Typography>

                  <Box
                    sx={{
                      maxHeight: 220,
                      overflowY: "auto",
                      display: "grid",
                      gap: 1,
                    }}
                  >
                    {records.slice(0, 6).map((record) => (
                      <Box
                        key={record.depreciation_id}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          border:
                            "1px solid #e5e7eb",
                        }}
                      >
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            noWrap
                            sx={{ maxWidth: 180 }}
                          >
                            {record.asset_name ||
                              `Asset #${record.asset_id}`}
                          </Typography>

                          <Chip
                            size="small"
                            label={`${Number(
                              record.current_value || 0
                            ).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}`}
                            color="primary"
                            variant="outlined"
                          />
                        </Stack>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {record.method} ·{" "}
                          {record.calculated_at
                            ? new Date(
                                record.calculated_at
                              ).toLocaleDateString()
                            : ""}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AssetOfficerDepreciation;