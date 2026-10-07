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
  Stack,
  Divider,
} from "@mui/material";

import {
  QrCodeScanner as ScannerIcon,
  Search as SearchIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Inventory2 as AssetIcon,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import API from "../services/api";
import BackButton from "../components/BackButton";

const AssetOfficerAssetLookup = () => {
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [searchCode, setSearchCode] = useState("");

  const [selectedAsset, setSelectedAsset] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // LOAD ASSETS
  // =====================================================

  const fetchAssets = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
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
        "Failed to load assets for lookup:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Unable to load assets."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // =====================================================
  // LOOKUP
  // =====================================================

  const normalize = (value) =>
    String(value == null ? "" : value)
      .trim()
      .toLowerCase();

  const handleLookup = async (event) => {
    event?.preventDefault();

    setError("");
    setSuccess("");
    setSelectedAsset(null);

    const rawValue = searchCode.trim();

    if (!rawValue) {
      setError(
        "Enter or scan an asset ID or serial number."
      );
      return;
    }

    const value = normalize(rawValue);

    setSearching(true);

    try {
      // -------------------------------------------------
      // 1) EXACT match against already-loaded assets
      //    (by serial number first, then asset id)
      // -------------------------------------------------
      let found =
        assets.find(
          (asset) =>
            normalize(asset.serial_number) === value
        ) ||
        assets.find(
          (asset) =>
            normalize(asset.asset_id) === value
        ) ||
        null;

      // -------------------------------------------------
      // 2) If not found by exact match, query the backend
      //    with the search term and resolve partial matches
      // -------------------------------------------------
      if (!found) {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("You are not logged in.");
          return;
        }

        const response = await API.get("/assets", {
          params: { search: value },
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

        // Prefer an exact serial/id match from the results,
        // otherwise pick the single best partial match.
        found =
          list.find(
            (asset) =>
              normalize(asset.serial_number) === value
          ) ||
          list.find(
            (asset) =>
              normalize(asset.asset_id) === value
          ) ||
          (list.length === 1 ? list[0] : null);
      }

      if (!found) {
        setError(
          `No asset found for "${rawValue}".`
        );
      } else {
        setSelectedAsset(found);

        setSuccess(
          "Asset found successfully."
        );
      }
    } catch (err) {
      console.error(
        "Failed to search assets:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Unable to search assets."
      );
    } finally {
      setSearching(false);
    }
  };

  const clearLookup = () => {
    setSearchCode("");
    setSelectedAsset(null);
    setError("");
    setSuccess("");
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
          justifyContent: "center",
          alignItems: "center",
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
              Asset Lookup
            </Typography>
          </Box>
        </Box>

        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Scan or enter an asset ID, serial number, or name to
          find the asset quickly.
        </Typography>
      </Box>

      {/* LOOKUP CARD */}

      <Card
        elevation={0}
        sx={{
          maxWidth: 900,
          borderRadius: 3,
          border:
            "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          mb: 3,
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
            <ScannerIcon
              sx={{
                color: "#07548e",
                fontSize: 30,
              }}
            />

            <Typography
              variant="h6"
              fontWeight={800}
            >
              Find Asset
            </Typography>
          </Box>

          <Typography
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Search by asset ID, serial number, or asset
            name.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Box
            component="form"
            onSubmit={handleLookup}
          >
            <TextField
              fullWidth
              label="Asset ID, Serial Number or Name"
              placeholder="Example: 25, DELL-00125 or Laptop"
              value={searchCode}
              onChange={(event) =>
                setSearchCode(
                  event.target.value
                )
              }
              autoFocus
              InputProps={{
                startAdornment: (
                  <ScannerIcon
                    sx={{
                      mr: 1,
                      color: "#07548e",
                    }}
                  />
                ),
              }}
            />

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={2}
              sx={{ mt: 3 }}
            >
              <Button
                type="submit"
                fullWidth
                variant="contained"
                startIcon={<SearchIcon />}
                disabled={searching}
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
                {searching
                  ? "Searching..."
                  : "Find Asset"}
              </Button>

              <Button
                type="button"
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={clearLookup}
                sx={{
                  borderColor: "#07548e",
                  color: "#07548e",
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                Clear
              </Button>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* MESSAGES */}

      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess("")}
          sx={{
            maxWidth: 900,
            mb: 3,
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
            maxWidth: 900,
            mb: 3,
          }}
        >
          {error}
        </Alert>
      )}

      {/* RESULT */}

      {selectedAsset && (
        <Card
          elevation={0}
          sx={{
            maxWidth: 900,
            borderRadius: 3,
            border:
              "1px solid #e5e7eb",
            backgroundColor:
              "#ffffff",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: {
                  xs: "flex-start",
                  sm: "center",
                },
                flexDirection: {
                  xs: "column",
                  sm: "row",
                },
                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 60,
                    height: 60,
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
                  <AssetIcon fontSize="large" />
                </Box>

                <Box>
                  <Typography
                    variant="h5"
                    fontWeight={800}
                  >
                    {selectedAsset.asset_name}
                  </Typography>

                  <Typography
                    color="text.secondary"
                  >
                    Asset ID:{" "}
                    {selectedAsset.asset_id}
                  </Typography>
                </Box>
              </Box>

              <Chip
                label={
                  selectedAsset.status ||
                  "Unknown"
                }
                color={getStatusColor(
                  selectedAsset.status
                )}
                sx={{
                  fontWeight: 700,
                }}
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            <Grid
              container
              spacing={3}
            >
              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Serial Number
                </Typography>

                <Typography fontWeight={700}>
                  {selectedAsset.serial_number ||
                    "N/A"}
                </Typography>
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Condition
                </Typography>

                <Typography fontWeight={700}>
                  {selectedAsset.asset_condition ||
                    "N/A"}
                </Typography>
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Location
                </Typography>

                <Typography fontWeight={700}>
                  {selectedAsset.location ||
                    "N/A"}
                </Typography>
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Purchase Date
                </Typography>

                <Typography fontWeight={700}>
                  {selectedAsset.purchase_date
                    ? new Date(
                        selectedAsset.purchase_date
                      ).toLocaleDateString()
                    : "N/A"}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={2}
            >
              <Button
                fullWidth
                variant="contained"
                startIcon={<HistoryIcon />}
                onClick={() =>
                  navigate(
                    `/asset-officer/assets/${selectedAsset.asset_id}/history`
                  )
                }
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
                View Asset History
              </Button>

              <Button
                fullWidth
                variant="outlined"
                onClick={() =>
                  navigate(
                    "/asset-officer/assets"
                  )
                }
                sx={{
                  borderColor:
                    "#07548e",
                  color:
                    "#07548e",
                  textTransform:
                    "none",
                  fontWeight: 700,
                }}
              >
                Open Asset Inventory
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AssetOfficerAssetLookup;