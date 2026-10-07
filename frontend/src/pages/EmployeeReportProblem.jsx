import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  MenuItem,
  CircularProgress,
} from "@mui/material";

import { ArrowBack } from "@mui/icons-material";

import { useNavigate } from "react-router-dom";

import API from "../services/api";

const EmployeeReportProblem = () => {
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [assetId, setAssetId] = useState("");
  const [problemType, setProblemType] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");

  const [loadingAssets, setLoadingAssets] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // =====================================================
  // LOAD MY ASSIGNED ASSETS
  // =====================================================

  useEffect(() => {
    const fetchMyAssets = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        const response = await API.get("/assignments", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.assignments)
          ? data.assignments
          : [];

        const active = list.filter((item) => {
          const status = String(
            item.status || ""
          )
            .trim()
            .toLowerCase();
          return (
            status === "active" ||
            status === "assigned" ||
            status === "approved"
          );
        });

        setAssets(active);
      } catch (err) {
        console.error(
          "Failed to load my assets:",
          err
        );
      } finally {
        setLoadingAssets(false);
      }
    };

    fetchMyAssets();
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSuccess("");
    setError("");

    if (!assetId || !problemType || !description) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const response = await API.post(
        "/maintenance/report",
        {
          asset_id: Number(assetId),
          issue_type: problemType,
          description,
          priority,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data?.message ||
          "Problem reported to maintenance team successfully."
      );

      setAssetId("");
      setProblemType("");
      setDescription("");
      setPriority("Medium");
    } catch (err) {
      console.error(
        "Failed to report problem:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to report the problem."
      );
    } finally {
      setLoading(false);
    }
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

      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: "#1f2937",
            mb: 1,
          }}
        >
          Report Asset Problem
        </Typography>

        <Typography
          sx={{
            color: "#6b7280",
          }}
        >
          Report a problem with an asset assigned to you.
          The maintenance team will receive it for repair.
        </Typography>
      </Box>

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

      <Card
        elevation={0}
        sx={{
          maxWidth: 700,
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {loadingAssets ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                py: 6,
              }}
            >
              <CircularProgress
                sx={{ color: "#07548e" }}
              />
            </Box>
          ) : (
          <Box
            component="form"
            onSubmit={handleSubmit}
          >
            <TextField
              fullWidth
              select
              label="Assigned Asset"
              value={assetId}
              onChange={(e) =>
                setAssetId(e.target.value)
              }
              placeholder="Select the assigned asset"
              required
              sx={{ mb: 3 }}
              helperText={
                assets.length === 0
                  ? "You have no active assigned assets."
                  : "Only assets assigned to you are shown."
              }
            >
              {assets.map((asset) => (
                <MenuItem
                  key={
                    asset.assignment_id ||
                    asset.asset_id
                  }
                  value={
                    asset.asset_id
                  }
                >
                  {asset.asset_name}
                  {asset.serial_number
                    ? ` — ${asset.serial_number}`
                    : ""}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              select
              label="Problem Type"
              value={problemType}
              onChange={(e) =>
                setProblemType(e.target.value)
              }
              required
              sx={{ mb: 3 }}
            >
              <MenuItem value="Hardware">
                Hardware Problem
              </MenuItem>

              <MenuItem value="Software">
                Software Problem
              </MenuItem>

              <MenuItem value="Damage">
                Physical Damage
              </MenuItem>

              <MenuItem value="Performance">
                Performance Problem
              </MenuItem>

              <MenuItem value="Other">
                Other
              </MenuItem>
            </TextField>

            <TextField
              fullWidth
              select
              label="Priority"
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value)
              }
              sx={{ mb: 3 }}
            >
              <MenuItem value="Low">
                Low
              </MenuItem>

              <MenuItem value="Medium">
                Medium
              </MenuItem>

              <MenuItem value="High">
                High
              </MenuItem>

              <MenuItem value="Urgent">
                Urgent
              </MenuItem>
            </TextField>

            <TextField
              fullWidth
              multiline
              minRows={5}
              label="Problem Description"
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              placeholder="Describe the problem..."
              required
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={loading || assets.length === 0}
              sx={{
                backgroundColor: "#07548e",
                textTransform: "none",
                fontWeight: 600,
                px: 4,
                py: 1.2,

                "&:hover": {
                  backgroundColor: "#064570",
                },
              }}
            >
              {loading
                ? "Submitting..."
                : "Report Problem"}
            </Button>
          </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmployeeReportProblem;
