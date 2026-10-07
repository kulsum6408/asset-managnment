import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";

import {
  ArrowBack,
  Send,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import API from "../services/api";

const EmployeeRequestAsset = () => {
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [assetId, setAssetId] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // LOAD AVAILABLE ASSETS
  // =====================================================

  useEffect(() => {
    const fetchAssets = async () => {
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

        const availableAssets = list.filter(
          (asset) =>
            String(asset.status).toLowerCase() ===
            "available"
        );

        setAssets(availableAssets);
      } catch (err) {
        console.error(
          "Failed to load available assets:",
          err
        );

        setError(
          err.response?.data?.error ||
            "Failed to load available assets."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [navigate]);

  // =====================================================
  // SUBMIT REQUEST
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!assetId) {
      setError("Please select an asset.");
      return;
    }

    if (!reason.trim()) {
      setError("Please provide a reason for the request.");
      return;
    }

    try {
      setSubmitting(true);

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await API.post(
        "/requests",
        {
          asset_id: Number(assetId),
          reason: reason.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data?.message ||
          "Request submitted successfully."
      );

      setAssetId("");
      setReason("");

      setTimeout(() => {
        navigate("/employee/my-requests");
      }, 1500);
    } catch (err) {
      console.error(
        "Failed to submit asset request:",
        err
      );

      setError(
        err.response?.data?.error ||
          "Failed to submit asset request."
      );
    } finally {
      setSubmitting(false);
    }
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
          sx={{ color: "#07548e" }}
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
        onClick={() => navigate("/employee")}
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

      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          color: "#1f2937",
          mb: 1,
        }}
      >
        Request an Asset
      </Typography>

      <Typography
        sx={{
          color: "#6b7280",
          mb: 4,
        }}
      >
        Select the asset you need and tell us why.
      </Typography>

      {/* FORM */}

      <Card
        elevation={0}
        sx={{
          maxWidth: 750,
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 2,
              sm: 4,
            },
          }}
        >
          {assets.length === 0 ? (
            <Alert severity="info">
              There are currently no available assets to
              request.
            </Alert>
          ) : (
            <Box
              component="form"
              onSubmit={handleSubmit}
            >
              {/* ASSET */}

              <TextField
                select
                fullWidth
                required
                label="Select Asset"
                value={assetId}
                onChange={(e) =>
                  setAssetId(e.target.value)
                }
                sx={{ mb: 3 }}
              >
                {assets.map((asset) => (
                  <MenuItem
                    key={asset.asset_id}
                    value={asset.asset_id}
                  >
                    {asset.asset_name}
                    {asset.serial_number
                      ? ` — ${asset.serial_number}`
                      : ""}
                  </MenuItem>
                ))}
              </TextField>

              {/* REASON */}

              <TextField
                fullWidth
                required
                multiline
                rows={4}
                label="Reason"
                placeholder="Explain why you need this asset..."
                value={reason}
                onChange={(e) =>
                  setReason(e.target.value)
                }
                sx={{ mb: 3 }}
              />

              {/* SUBMIT */}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                startIcon={<Send />}
                disabled={submitting}
                sx={{
                  py: 1.5,
                  backgroundColor: "#07548e",
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: "none",

                  "&:hover": {
                    backgroundColor: "#064575",
                  },
                }}
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Request"}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ERROR */}

      <Snackbar
        open={Boolean(error)}
        autoHideDuration={5000}
        onClose={() => setError("")}
      >
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* SUCCESS */}

      <Snackbar
        open={Boolean(success)}
        autoHideDuration={3000}
        onClose={() => setSuccess("")}
      >
        <Alert
          severity="success"
          onClose={() => setSuccess("")}
          sx={{ width: "100%" }}
        >
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeeRequestAsset;