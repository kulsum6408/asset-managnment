import React, { useEffect, useState } from "react";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Grid,
  Divider,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Snackbar,
  MenuItem,
} from "@mui/material";

import {
  ArrowBack as ArrowBackIcon,
  Build as MaintenanceIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  PaidOutlined as PaidOutlinedIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";

import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";

const steps = ["Scheduled", "In Progress", "Completed"];

const MaintenanceOfficerRequestDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [problemRecord, setProblemRecord] = useState("");
  const [inspectionResult, setInspectionResult] = useState("");
  const [repairRequirements, setRepairRequirements] = useState("");
  const [repairKeyword, setRepairKeyword] = useState("");
  const [maintenanceDate, setMaintenanceDate] = useState("");
  const [maintenanceType, setMaintenanceType] =
    useState("Preventive");
  const [cost, setCost] = useState("");
  const [nextMaintenanceDate, setNextMaintenanceDate] =
    useState("");
  const [materials, setMaterials] = useState([]);
  const [recommendedDisposal, setRecommendedDisposal] =
    useState(false);
  const [disposalRecommendation, setDisposalRecommendation] =
    useState("");

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const getToken = () => localStorage.getItem("token");

  const formatDateForInput = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toISOString().split("T")[0];
  };

  const loadRequest = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await API.get(`/maintenance/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      const result =
        data?.data ||
        data?.maintenance ||
        data?.record ||
        data;

      setRequest(result);

      setDescription(result?.description || "");

      setNotes(result?.notes || "");

      setProblemRecord(result?.problem_record || "");

      setInspectionResult(
        result?.inspection_result || ""
      );

      setRepairRequirements(
        result?.repair_requirements || ""
      );

      setRepairKeyword(result?.repair_keyword || "");

      setMaintenanceDate(
        formatDateForInput(result?.maintenance_date)
      );

      setMaintenanceType(
        result?.maintenance_type || "Preventive"
      );

      setCost(
        result?.cost === null ||
        result?.cost === undefined
          ? ""
          : String(result.cost)
      );

      setNextMaintenanceDate(
        formatDateForInput(
          result?.next_maintenance_date
        )
      );

      setRecommendedDisposal(
        Boolean(result?.recommended_disposal)
      );

      setDisposalRecommendation(
        result?.disposal_recommendation || ""
      );

      const loadedMaterials = Array.isArray(
        result?.materials
      )
        ? result.materials.map((m) => ({
            material_name: m.material_name || "",
            quantity:
              m.quantity === null ||
              m.quantity === undefined
                ? ""
                : String(m.quantity),
            unit: m.unit || "",
            unit_cost:
              m.unit_cost === null ||
              m.unit_cost === undefined
                ? ""
                : String(m.unit_cost),
          }))
        : [];
      setMaterials(loadedMaterials);
    } catch (err) {
      console.error(
        "Failed to load maintenance request:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to load this maintenance request."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequest();
  }, [id]);

  const normalizedStatus = String(
    request?.status || "Scheduled"
  )
    .trim()
    .toLowerCase();

  const getActiveStep = () => {
    if (
      ["cancelled", "canceled"].includes(
        normalizedStatus
      )
    ) {
      return -1;
    }

    if (
      ["beyond repair"].includes(
        normalizedStatus
      )
    ) {
      return -2;
    }

    if (
      ["under inspection", "scheduled"].includes(
        normalizedStatus
      )
    ) {
      return 0;
    }

    if (
      ["pending repair", "in progress", "ongoing"].includes(
        normalizedStatus
      )
    ) {
      return 1;
    }

    if (
      ["completed", "resolved", "closed"].includes(
        normalizedStatus
      )
    ) {
      return 2;
    }

    return 0;
  };

  const activeStep = getActiveStep();

  const updateMaintenance = async (newStatus) => {
    setError("");
    setMessage("");

    if (!description.trim()) {
      setError("Maintenance description is required.");
      return;
    }

    if (!maintenanceDate) {
      setError("Maintenance date is required.");
      return;
    }

    if (!maintenanceType) {
      setError("Maintenance type is required.");
      return;
    }

    try {
      setSaving(true);

      const token = getToken();

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const payload = {
        maintenance_date: maintenanceDate,
        description: description.trim(),
        status: newStatus,
        cost:
          cost === "" ? null : Number(cost),
        notes: notes.trim() || null,
        problem_record:
          problemRecord.trim() || null,
        inspection_result:
          inspectionResult || null,
        repair_requirements:
          repairRequirements.trim() || null,
        repair_keyword:
          repairKeyword.trim() || null,
        technician_id:
          request?.technician_id ||
          user?.user_id ||
          null,
        maintenance_type: maintenanceType,
        next_maintenance_date:
          nextMaintenanceDate || null,
        materials_summary: buildMaterialsSummary(),
        materials: materials
          .filter(
            (m) =>
              m.material_name &&
              m.material_name.trim()
          )
          .map((m) => ({
            material_name: m.material_name.trim(),
            quantity: Number(m.quantity) || 0,
            unit: m.unit || null,
            unit_cost: Number(m.unit_cost) || 0,
          })),
      };

      const response = await API.put(
        `/maintenance/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        response.data?.message ||
          "Maintenance updated successfully."
      );

      await loadRequest();
    } catch (err) {
      console.error(
        "Failed to update maintenance:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to update maintenance."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStartRepair = () => {
    updateMaintenance("In Progress");
  };

  const handleMarkPendingRepair = () => {
    updateMaintenance("Pending Repair");
  };

  const handleMarkBeyondRepair = () => {
    updateMaintenance("Beyond Repair");
  };

  const handleCompleteRepair = () => {
    updateMaintenance("Completed");
  };

  const handleCancelRepair = () => {
    setError("");
    setMessage("");

    if (!description.trim()) {
      setError("Maintenance description is required.");
      return;
    }

    if (!maintenanceDate) {
      setError("Maintenance date is required.");
      return;
    }

    updateMaintenance("Cancelled");
  };

  const handleSubmitCostForApproval = async () => {
    setError("");
    setMessage("");

    const token = getToken();

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setSaving(true);

    try {
      const response = await API.post(
        `/maintenance/cost-approvals/submit/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        response.data?.message ||
          "Maintenance cost submitted for approval."
      );

      await loadRequest();
    } catch (err) {
      console.error("Failed to submit cost:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to submit maintenance cost for approval."
      );
    } finally {
      setSaving(false);
    }
  };

  const buildMaterialsSummary = () => {
    const valid = materials.filter(
      (m) => m.material_name && m.material_name.trim()
    );
    if (!valid.length) return null;
    const total = valid.reduce(
      (sum, m) =>
        sum +
        (Number(m.quantity) || 0) *
          (Number(m.unit_cost) || 0),
      0
    );
    const items = valid
      .map(
        (m) =>
          `${m.material_name} x${Number(m.quantity) || 0}` +
          (m.unit ? ` ${m.unit}` : "")
      )
      .join("; ");
    return `${items} (total ${Number(total.toFixed(2))})`;
  };

  const addMaterialRow = () => {
    setMaterials((prev) => [
      ...prev,
      { material_name: "", quantity: "", unit: "", unit_cost: "" },
    ]);
  };

  const removeMaterialRow = (idx) => {
    setMaterials((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateMaterial = (idx, field, value) => {
    setMaterials((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  };

  const handleRecommendDisposal = async () => {
    setError("");
    setMessage("");

    const token = getToken();
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setSaving(true);
    try {
      const recommendationText =
        disposalRecommendation.trim() ||
        `Asset assessed as beyond economical repair (maintenance #${id}).`;
      await API.put(
        `/maintenance/${id}/recommend-disposal`,
        { recommendation: recommendationText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(
        "Disposal recommended. The manager has been notified for approval."
      );
      await loadRequest();
    } catch (err) {
      console.error("Failed to recommend disposal:", err);
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to recommend disposal."
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
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress sx={{ color: "#07548e" }} />
      </Box>
    );
  }

  if (!request) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#f5f7fb",
          p: 4,
        }}
      >
        <Alert severity="error">
          Maintenance request not found.
        </Alert>
      </Box>
    );
  }

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
            Maintenance Request
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
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            fontWeight={800}
          >
            {request.asset_name ||
              "Unknown Asset"}
          </Typography>

          <Typography color="text.secondary">
            Request ID:{" "}
            {request.maintenance_id || id}
          </Typography>
        </Box>

        {/* STATUS WORKFLOW */}

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h6"
              fontWeight={800}
              sx={{ mb: 3 }}
            >
              Maintenance Status
            </Typography>

            <Stepper activeStep={activeStep >= 0 ? activeStep : 0}>
              {steps.map((step) => (
                <Step key={step}>
                  <StepLabel>
                    {step}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={{ mt: 2 }}>
              <Chip
                label={request.status || "Under Inspection"}
                color={
                  activeStep === 2
                    ? "success"
                    : activeStep === -2
                    ? "error"
                    : activeStep === 1
                    ? "warning"
                    : "info"
                }
                size="small"
                sx={{ fontWeight: 700 }}
              />
            </Box>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* REQUEST INFORMATION */}

          <Grid size={{ xs: 12, md: 7 }}>
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
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#e8f2fa",
                      color: "#07548e",
                    }}
                  >
                    <MaintenanceIcon />
                  </Box>

                  <Box>
                    <Typography
                      variant="h6"
                      fontWeight={800}
                    >
                      Reported Problem
                    </Typography>

                    <Chip
                      label={
                        request.status ||
                        "Scheduled"
                      }
                      color={
                        activeStep === 2
                          ? "success"
                          : activeStep === 1
                          ? "warning"
                          : "error"
                      }
                      size="small"
                      sx={{
                        mt: 0.5,
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Current Description
                </Typography>

                <Typography sx={{ mb: 3 }}>
                  {request.description ||
                    "No description provided."}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Technician
                </Typography>

                <Typography>
                  {request.technician_name ||
                    user.name ||
                    "Maintenance Staff"}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1, mt: 2 }}
                >
                  Reported By
                </Typography>

                <Typography>
                  {request.employee_name ||
                    "Staff Member"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* ASSET INFORMATION */}

          <Grid size={{ xs: 12, md: 5 }}>
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
                  fontWeight={800}
                  sx={{ mb: 3 }}
                >
                  Asset Information
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Asset ID
                  </Typography>

                  <Typography fontWeight={700}>
                    {request.asset_id || "N/A"}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Asset Name
                  </Typography>

                  <Typography fontWeight={700}>
                    {request.asset_name ||
                      "N/A"}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Serial Number
                  </Typography>

                  <Typography fontWeight={700}>
                    {request.serial_number ||
                      "N/A"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Location
                  </Typography>

                  <Typography fontWeight={700}>
                    {request.location || "N/A"}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* MAINTENANCE FORM */}

          <Grid size={{ xs: 12 }}>
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
                  fontWeight={800}
                  sx={{ mb: 1 }}
                >
                  Maintenance Record
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Record the work performed on this asset.
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Maintenance Date"
                      value={maintenanceDate}
                      onChange={(e) =>
                        setMaintenanceDate(
                          e.target.value
                        )
                      }
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
                      value={maintenanceType}
                      onChange={(e) =>
                        setMaintenanceType(
                          e.target.value
                        )
                      }
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
                      value={cost}
                      onChange={(e) =>
                        setCost(e.target.value)
                      }
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
                      value={nextMaintenanceDate}
                      onChange={(e) =>
                        setNextMaintenanceDate(
                          e.target.value
                        )
                      }
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={5}
                      label="Maintenance Description"
                      value={description}
                      onChange={(e) =>
                        setDescription(e.target.value)
                      }
                      placeholder="Describe the problem, inspection, repair performed, parts replaced, or other maintenance work..."
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Repair Notes"
                      value={notes}
                      onChange={(e) =>
                        setNotes(e.target.value)
                      }
                      placeholder="Internal notes about the repair (parts, labor, follow-up, or status remarks)..."
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Record the Problem"
                      value={problemRecord}
                      onChange={(e) =>
                        setProblemRecord(e.target.value)
                      }
                      placeholder="Describe the problem recorded during inspection/receipt..."
                    />
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      select
                      label="Inspection Result"
                      value={inspectionResult}
                      onChange={(e) =>
                        setInspectionResult(e.target.value)
                      }
                    >
                      <MenuItem value="">-- Select --</MenuItem>
                      <MenuItem value="Good">Good</MenuItem>
                      <MenuItem value="Repairable">
                        Repairable
                      </MenuItem>
                      <MenuItem value="Beyond Repair">
                        Beyond Repair
                      </MenuItem>
                      <MenuItem value="Failed Inspection">
                        Failed Inspection
                      </MenuItem>
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Repair Keyword"
                      value={repairKeyword}
                      onChange={(e) =>
                        setRepairKeyword(e.target.value)
                      }
                      placeholder="e.g. Replacement, Calibration, Overhaul"
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Repair Requirements"
                      value={repairRequirements}
                      onChange={(e) =>
                        setRepairRequirements(e.target.value)
                      }
                      placeholder="List what is required to complete the repair..."
                    />
                  </Grid>
                </Grid>

                {/* MATERIALS USED */}
                <Box sx={{ mt: 4 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                    >
                      Materials Used
                    </Typography>

                    <Button
                      size="small"
                      onClick={addMaterialRow}
                      disabled={saving || activeStep === -1}
                      startIcon={<PlayArrowIcon />}
                      sx={{ textTransform: "none" }}
                    >
                      Add Material
                    </Button>
                  </Box>

                  {materials.length === 0 ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      No materials recorded yet. Add materials to
                      track parts used in this repair.
                    </Typography>
                  ) : (
                    materials.map((m, idx) => (
                      <Grid
                        container
                        spacing={1}
                        alignItems="center"
                        key={idx}
                        sx={{ mb: 1 }}
                      >
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            size="small"
                            fullWidth
                            label="Material"
                            value={m.material_name}
                            onChange={(e) =>
                              updateMaterial(
                                idx,
                                "material_name",
                                e.target.value
                              )
                            }
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 2 }}>
                          <TextField
                            size="small"
                            fullWidth
                            type="number"
                            label="Qty"
                            value={m.quantity}
                            onChange={(e) =>
                              updateMaterial(
                                idx,
                                "quantity",
                                e.target.value
                              )
                            }
                            inputProps={{ min: 0 }}
                          />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 2 }}>
                          <TextField
                            size="small"
                            fullWidth
                            label="Unit"
                            value={m.unit}
                            onChange={(e) =>
                              updateMaterial(
                                idx,
                                "unit",
                                e.target.value
                              )
                            }
                            placeholder="pcs"
                          />
                        </Grid>
                        <Grid size={{ xs: 8, sm: 2 }}>
                          <TextField
                            size="small"
                            fullWidth
                            type="number"
                            label="Unit Cost"
                            value={m.unit_cost}
                            onChange={(e) =>
                              updateMaterial(
                                idx,
                                "unit_cost",
                                e.target.value
                              )
                            }
                            inputProps={{ min: 0, step: "0.01" }}
                          />
                        </Grid>
                        <Grid size={{ xs: 4, sm: 2 }}>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => removeMaterialRow(idx)}
                          >
                            Remove
                          </Button>
                        </Grid>
                      </Grid>
                    ))
                  )}
                </Box>

                {/* DISPOSAL RECOMMENDATION */}
                {activeStep === -2 && (
                  <Box
                    sx={{
                      mt: 3,
                      p: 2,
                      border: "1px solid #fee2e2",
                      borderRadius: 2,
                      backgroundColor: "#fff5f5",
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      color="error"
                      sx={{ mb: 1 }}
                    >
                      Asset Beyond Repair
                    </Typography>

                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Disposal Recommendation"
                      value={disposalRecommendation}
                      onChange={(e) =>
                        setDisposalRecommendation(
                          e.target.value
                        )
                      }
                      placeholder="Explain why this asset should be disposed of..."
                      disabled={recommendedDisposal}
                    />

                    <Button
                      variant="contained"
                      color="error"
                      onClick={handleRecommendDisposal}
                      disabled={
                        saving || recommendedDisposal
                      }
                      sx={{
                        mt: 2,
                        textTransform: "none",
                        fontWeight: 700,
                        borderRadius: 2,
                      }}
                    >
                      {recommendedDisposal
                        ? "Disposal Already Recommended"
                        : saving
                        ? "Submitting..."
                        : "Recommend Disposal"}
                    </Button>

                    {recommendedDisposal && (
                      <Alert
                        severity="info"
                        sx={{ mt: 2 }}
                      >
                        This asset has been recommended for
                        disposal. Awaiting manager approval.
                      </Alert>
                    )}
                  </Box>
                )}

                <Box
                  sx={{
                    mt: 3,
                    display: "flex",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  {(normalizedStatus === "under inspection" ||
                    normalizedStatus === "scheduled" ||
                    normalizedStatus === "pending repair") && (
                    <Button
                      variant="contained"
                      startIcon={
                        <PlayArrowIcon />
                      }
                      onClick={
                        normalizedStatus === "pending repair"
                          ? handleStartRepair
                          : handleMarkPendingRepair
                      }
                      disabled={saving}
                      sx={{
                        backgroundColor:
                          "#07548e",
                        textTransform: "none",
                        fontWeight: 700,
                        borderRadius: 2,
                        "&:hover": {
                          backgroundColor:
                            "#064575",
                        },
                      }}
                    >
                      {saving
                        ? "Saving..."
                        : normalizedStatus === "pending repair"
                        ? "Start Repair"
                        : "Inspect & Proceed to Repair"}
                    </Button>
                  )}

                  {activeStep === 1 && (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={
                        <CheckCircleIcon />
                      }
                      onClick={handleCompleteRepair}
                      disabled={saving}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        borderRadius: 2,
                      }}
                    >
                      {saving
                        ? "Completing..."
                        : "Complete Repair"}
                    </Button>
                  )}

                  {activeStep === -2 && (
                    <Alert
                      severity="error"
                      sx={{ width: "100%" }}
                    >
                      Asset marked as beyond repair. Review the
                      disposal recommendation above.
                    </Alert>
                  )}

                  {activeStep >= 0 &&
                    activeStep !== 1 &&
                    activeStep !== 2 &&
                    normalizedStatus !==
                      "pending repair" && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={
                        <CancelIcon />
                      }
                      onClick={
                        normalizedStatus ===
                          "under inspection" ||
                        normalizedStatus ===
                          "scheduled"
                          ? handleMarkBeyondRepair
                          : handleCancelRepair
                      }
                      disabled={saving}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        borderRadius: 2,
                      }}
                    >
                      {saving
                        ? "Saving..."
                        : normalizedStatus ===
                            "under inspection" ||
                          normalizedStatus ===
                            "scheduled"
                        ? "Mark Beyond Repair"
                        : "Cancel Repair"}
                    </Button>
                  )}

                  {request?.cost &&
                    Number(request.cost) > 0 &&
                    activeStep !== 2 && (
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={
                        <PaidOutlinedIcon />
                      }
                      onClick={
                        handleSubmitCostForApproval
                      }
                      disabled={saving}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        borderRadius: 2,
                      }}
                    >
                      {saving
                        ? "Submitting..."
                        : "Submit Cost for Approval"}
                    </Button>
                  )}

                  {activeStep === 2 && (
                    <Alert
                      severity="success"
                      sx={{ width: "100%" }}
                    >
                      This maintenance record has been
                      completed and saved.
                    </Alert>
                  )}

                  {activeStep === -1 && (
                    <Alert
                      severity="warning"
                      sx={{ width: "100%" }}
                    >
                      This maintenance record has been
                      cancelled.
                    </Alert>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Snackbar
        open={Boolean(message)}
        autoHideDuration={3000}
        onClose={() => setMessage("")}
        message={message}
      />
    </Box>
  );
};

export default MaintenanceOfficerRequestDetails;