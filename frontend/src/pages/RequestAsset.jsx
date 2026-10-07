import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
} from "@mui/material";

import API from "../services/api";

const RequestAsset = () => {
  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [assetId, setAssetId] = useState("");
  const [reason, setReason] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] =
    useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // =====================================================
  // LOAD AVAILABLE ASSETS
  // =====================================================
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoadingAssets(true);
        setErrorMessage("");

        const token = localStorage.getItem("token");

        if (!token) {
          setErrorMessage("You are not logged in.");
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
          : Array.isArray(data.assets)
          ? data.assets
          : Array.isArray(data.data)
          ? data.data
          : [];

        setAssets(
          list.filter(
            (asset) =>
              asset.status === "Available"
          )
        );
      } catch (error) {
        console.error(
          "Failed to load available assets:",
          error
        );

        setErrorMessage(
          error.response?.data?.error ||
            error.response?.data?.message ||
            "Failed to load available assets."
        );
      } finally {
        setLoadingAssets(false);
      }
    };

    fetchAssets();
  }, []);

  // =====================================================
  // SUBMIT REQUEST
  // =====================================================
  const handleSubmit = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    if (!assetId) {
      setErrorMessage(
        "Please select an asset."
      );
      return;
    }

    if (!expectedReturnDate) {
      setErrorMessage(
        "Please select an expected return date."
      );
      return;
    }

    const selectedDate = new Date(
      `${expectedReturnDate}T00:00:00`
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setErrorMessage(
        "Expected return date cannot be in the past."
      );
      return;
    }

    try {
      setSubmitting(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setErrorMessage(
          "You are not logged in."
        );
        return;
      }

      const response = await API.post(
        "/requests",
        {
          asset_id: Number(assetId),
          reason: reason.trim() || null,
          expected_return_date:
            expectedReturnDate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccessMessage(
        response.data?.message ||
          "Request submitted successfully."
      );

      setAssetId("");
      setReason("");
      setExpectedReturnDate("");
    } catch (error) {
      console.error(
        "Failed to submit request:",
        error
      );

      setErrorMessage(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to submit request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "background.default",
        p: {
          xs: 2,
          sm: 3,
          md: 4,
        },
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: "text.primary",
          }}
        >
          Request Asset
        </Typography>

        <Typography
          sx={{
            color: "text.secondary",
            mt: 0.5,
          }}
        >
          Submit a request for an available asset.
        </Typography>
      </Box>

      {successMessage && (
        <Alert
          severity="success"
          onClose={() =>
            setSuccessMessage("")
          }
          sx={{ mb: 2 }}
        >
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert
          severity="error"
          onClose={() =>
            setErrorMessage("")
          }
          sx={{ mb: 2 }}
        >
          {errorMessage}
        </Alert>
      )}

      <Card
        elevation={0}
        sx={{
          maxWidth: 700,
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "background.paper",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {loadingAssets ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 6,
              }}
            >
              <CircularProgress
                sx={{
                  color: "#07548e",
                }}
              />
            </Box>
          ) : (
            <>
              <TextField
                select
                fullWidth
                required
                label="Select Asset"
                value={assetId}
                onChange={(event) =>
                  setAssetId(event.target.value)
                }
                margin="normal"
              >
                {assets.length === 0 ? (
                  <MenuItem disabled value="">
                    No available assets
                  </MenuItem>
                ) : (
                  assets.map((asset) => (
                    <MenuItem
                      key={asset.asset_id}
                      value={asset.asset_id}
                    >
                      {asset.asset_name ||
                        "Unnamed Asset"}
                      {asset.serial_number
                        ? ` — ${asset.serial_number}`
                        : ""}
                    </MenuItem>
                  ))
                )}
              </TextField>

              <TextField
                fullWidth
                label="Reason"
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                multiline
                rows={4}
                margin="normal"
                placeholder="Why do you need this asset?"
              />

              <TextField
                fullWidth
                required
                label="Expected Return Date"
                type="date"
                value={expectedReturnDate}
                onChange={(event) =>
                  setExpectedReturnDate(
                    event.target.value
                  )
                }
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: new Date()
                    .toISOString()
                    .split("T")[0],
                }}
                helperText="Enter the date you expect to return the asset."
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  loadingAssets ||
                  assets.length === 0
                }
                sx={{
                  mt: 3,
                  backgroundColor: "#07548e",
                  textTransform: "none",
                  fontWeight: 600,
                  py: 1.3,
                  "&:hover": {
                    backgroundColor: "#064570",
                  },
                }}
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Request"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default RequestAsset;