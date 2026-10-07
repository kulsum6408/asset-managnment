import React, { useEffect, useState } from "react";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Avatar,
} from "@mui/material";

import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import API from "../services/api";

const MaintenanceOfficerCreateMaintenance = () => {
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    asset_id: "",
    maintenance_date: "",
    maintenance_type: "Preventive",
    cost: "",
    description: "",
    next_maintenance_date: "",
    status: "Scheduled",
  });

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
        console.error("Failed to load assets:", err);

        setError(
          err.response?.data?.error ||
            "Unable to load assets."
        );
      } finally {
        setLoadingAssets(false);
      }
    };

    loadAssets();
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!form.asset_id) {
      setError("Please select an asset.");
      return;
    }

    if (!form.description.trim()) {
      setError("Maintenance description is required.");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const payload = {
        asset_id: Number(form.asset_id),
        maintenance_date:
          form.maintenance_date || null,
        description: form.description.trim(),
        status: form.status,
        cost:
          form.cost === ""
            ? null
            : Number(form.cost),
        technician_id:
          user.user_id || null,
        maintenance_type:
          form.maintenance_type,
        next_maintenance_date:
          form.next_maintenance_date || null,
      };

      const response = await API.post(
        "/maintenance",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        response.data?.message ||
          "Maintenance record created successfully."
      );

      setForm({
        asset_id: "",
        maintenance_date: "",
        maintenance_type: "Preventive",
        cost: "",
        description: "",
        next_maintenance_date: "",
        status: "Scheduled",
      });
    } catch (err) {
      console.error(
        "Failed to create maintenance record:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to create maintenance record."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f5f7fb",
      }}
    >
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: "#ffffff",
          color: "#1f2937",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.06)",
        }}
      >
        <Toolbar>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() =>
              navigate("/maintenance-officer/requests")
            }
            sx={{
              color: "#07548e",
              textTransform: "none",
              fontWeight: 700,
              mr: 2,
            }}
          >
            Back
          </Button>

          <Typography
            sx={{
              flexGrow: 1,
              fontWeight: 700,
            }}
          >
            Create Maintenance Record
          </Typography>

          <Avatar
            sx={{
              width: 40,
              height: 40,
              backgroundColor: "#07548e",
            }}
          >
            {(user.name || "M")
              .charAt(0)
              .toUpperCase()}
          </Avatar>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          pt: 12,
          px: {
            xs: 2,
            sm: 4,
            md: 6,
          },
          pb: 5,
        }}
      >
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{ mb: 1 }}
        >
          New Maintenance Record
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Record maintenance work for an organizational asset.
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

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e5e7eb",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box
              component="form"
              onSubmit={handleSubmit}
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    required
                    select
                    label="Asset"
                    name="asset_id"
                    value={form.asset_id}
                    onChange={handleChange}
                    disabled={loadingAssets}
                  >
                    {loadingAssets ? (
                      <MenuItem disabled>
                        Loading assets...
                      </MenuItem>
                    ) : assets.length === 0 ? (
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
                            "Unnamed Asset"}{" "}
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
                    label="Status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <MenuItem value="Scheduled">
                      Scheduled
                    </MenuItem>

                    <MenuItem value="In Progress">
                      In Progress
                    </MenuItem>

                    <MenuItem value="Completed">
                      Completed
                    </MenuItem>

                    <MenuItem value="Cancelled">
                      Cancelled
                    </MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Maintenance Date"
                    name="maintenance_date"
                    value={form.maintenance_date}
                    onChange={handleChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    select
                    label="Maintenance Type"
                    name="maintenance_type"
                    value={form.maintenance_type}
                    onChange={handleChange}
                  >
                    <MenuItem value="Preventive">
                      Preventive
                    </MenuItem>

                    <MenuItem value="Corrective">
                      Corrective
                    </MenuItem>

                    <MenuItem value="Emergency">
                      Emergency
                    </MenuItem>

                    <MenuItem value="Routine">
                      Routine
                    </MenuItem>
                  </TextField>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Maintenance Cost"
                    name="cost"
                    value={form.cost}
                    onChange={handleChange}
                    inputProps={{
                      min: 0,
                      step: "0.01",
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Next Maintenance Date"
                    name="next_maintenance_date"
                    value={
                      form.next_maintenance_date
                    }
                    onChange={handleChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    required
                    multiline
                    minRows={6}
                    label="Maintenance Description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe the problem, inspection, repair, replacement, or maintenance work..."
                  />
                </Grid>
              </Grid>

              <Box
                sx={{
                  mt: 4,
                  display: "flex",
                  gap: 2,
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  variant="outlined"
                  onClick={() =>
                    navigate(
                      "/maintenance-officer/requests"
                    )
                  }
                  disabled={saving}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 2,
                  }}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={
                    saving ? (
                      <CircularProgress
                        size={18}
                        color="inherit"
                      />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  disabled={saving || loadingAssets}
                  sx={{
                    backgroundColor: "#07548e",
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 2,
                    "&:hover": {
                      backgroundColor: "#064575",
                    },
                  }}
                >
                  {saving
                    ? "Saving..."
                    : "Save Maintenance Record"}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Snackbar
        open={Boolean(message)}
        autoHideDuration={3500}
        onClose={() => setMessage("")}
        message={message}
      />
    </Box>
  );
};

export default MaintenanceOfficerCreateMaintenance;