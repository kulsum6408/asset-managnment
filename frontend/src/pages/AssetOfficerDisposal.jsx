import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import {
  DeleteForever as DisposalIcon,
  Refresh as RefreshIcon,
  CheckCircle as CompleteIcon,
  ArrowBack,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import API from "../services/api";

const AssetOfficerDisposal = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [disposals, setDisposals] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    asset_id: "",
    disposal_date: "",
    reason: "",
  });

  const [completeModal, setCompleteModal] = useState(null);
  const [completeMethod, setCompleteMethod] = useState("");
  const [completeNotes, setCompleteNotes] = useState("");
  const [completing, setCompleting] = useState(false);

  // Reasons for submitting Maintenance-recommended disposals
  const [recommendReasons, setRecommendReasons] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  // =====================================================
  // GET LIST FROM API RESPONSE
  // =====================================================

  const getList = (data, key) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data?.[key])) {
      return data[key];
    }

    return [];
  };

  // =====================================================
  // LOAD ASSETS + DISPOSALS
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

      const [assetsResponse, disposalResponse] =
        await Promise.allSettled([
          API.get("/assets", { headers }),
          API.get("/disposals", { headers }),
        ]);

      // -------------------------------------------------
      // ASSETS
      // -------------------------------------------------

      if (assetsResponse.status === "fulfilled") {
        const assetList = getList(
          assetsResponse.value.data,
          "assets"
        );

        setAssets(assetList);
      } else {
        console.error(
          "Failed to load assets:",
          assetsResponse.reason
        );
      }

      // -------------------------------------------------
      // DISPOSALS
      // -------------------------------------------------

      if (disposalResponse.status === "fulfilled") {
        const disposalList = getList(
          disposalResponse.value.data,
          "disposals"
        );

        setDisposals(disposalList);

        setRecommendReasons((previous) => {
          const freshIds = disposalList
            .filter(
              (item) =>
                String(item.status || "").trim().toLowerCase() ===
                "recommended"
            )
            .map((item) => String(item.disposal_id));
          const next = {};
          Object.keys(previous).forEach((key) => {
            if (freshIds.includes(key)) next[key] = previous[key];
          });
          return next;
        });
      } else {
        console.error(
          "Failed to load disposals:",
          disposalResponse.reason
        );
      }
    } catch (err) {
      console.error(
        "Failed to load disposal information:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to load disposal information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // CLEAR FORM
  // =====================================================

  const clearForm = () => {
    setForm({
      asset_id: "",
      disposal_date: "",
      reason: "",
    });

    setError("");
    setSuccess("");
  };

  // =====================================================
  // SUBMIT DISPOSAL
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.asset_id) {
      setError("Please select an asset.");
      return;
    }

    if (!form.disposal_date) {
      setError("Disposal date is required.");
      return;
    }

    if (!form.reason.trim()) {
      setError("Please provide a disposal reason.");
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const payload = {
        asset_id: Number(form.asset_id),
        disposal_date: form.disposal_date,
        reason: form.reason.trim(),
      };

      const response = await API.post(
        "/disposals",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data?.message ||
          "Disposal recommendation submitted. Awaiting manager approval."
      );

      setForm({
        asset_id: "",
        disposal_date: "",
        reason: "",
      });

      await fetchData();
    } catch (err) {
      console.error(
        "Failed to dispose asset:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to dispose the asset."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // SUBMIT A MAINTENANCE-RECOMMENDED DISPOSAL
  // =====================================================

  const handleSubmitRecommended = async (disposal) => {
    setError("");
    setSuccess("");

    const reason =
      (recommendReasons[disposal.disposal_id] || "").trim() ||
      (disposal.reason || "").trim();

    if (!reason) {
      setError("Please provide a disposal reason.");
      return;
    }

    try {
      setSubmittingId(disposal.disposal_id);

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const response = await API.post(
        `/disposals/${disposal.disposal_id}/submit`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data?.message ||
          "Disposal request submitted. Awaiting manager approval."
      );

      setRecommendReasons((previous) => {
        const next = { ...previous };
        delete next[disposal.disposal_id];
        return next;
      });

      await fetchData();
    } catch (err) {
      console.error("Failed to submit recommended disposal:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to submit the disposal request."
      );
    } finally {
      setSubmittingId(null);
    }
  };

  // =====================================================
  // COMPLETE APPROVED DISPOSAL
  // =====================================================

  const openComplete = (disposal) => {
    setCompleteMethod("");
    setCompleteNotes("");
    setCompleteModal(disposal);
  };

  const closeComplete = () => {
    setCompleteModal(null);
    setCompleteMethod("");
    setCompleteNotes("");
  };

  const submitComplete = async () => {
    if (!completeModal) return;

    setError("");
    setSuccess("");

    const disposalId = completeModal.disposal_id;

    try {
      setCompleting(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setError("You are not logged in.");
        closeComplete();
        return;
      }

      const response = await API.put(
        `/disposals/${disposalId}/complete`,
        {
          method: completeMethod || null,
          notes: completeNotes.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        response.data?.message ||
          "Disposal completed. Asset marked as Disposed."
      );

      closeComplete();
      await fetchData();
    } catch (err) {
      console.error("Failed to complete disposal:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Unable to complete the disposal."
      );
    } finally {
      setCompleting(false);
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
          backgroundColor: "#f5f7fb",
        }}
      >
        <CircularProgress
          sx={{ color: "#07548e" }}
        />
      </Box>
    );
  }

  // =====================================================
  // AVAILABLE ASSETS
  // =====================================================

  const availableAssets = assets.filter(
    (asset) =>
      String(asset.status || "")
        .toLowerCase() !== "disposed" &&
      !disposals.some((d) =>
        String(d.status || "").trim().toLowerCase() !== "rejected" &&
        Number(d.asset_id) === Number(asset.asset_id)
      )
  );

  const approvedDisposals = disposals.filter(
    (item) =>
      String(item.status || "").trim().toLowerCase() === "approved"
  );

  const recommendedDisposals = disposals.filter(
    (item) =>
      String(item.status || "").trim().toLowerCase() === "recommended"
  );

  const getStatusColor = (status) => {
    switch (String(status || "").toLowerCase()) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "completed":
        return "primary";
      case "recommended":
        return "info";
      default:
        return "default";
    }
  };

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

      {/* =================================================
          HEADER
      ================================================= */}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: {
            xs: "flex-start",
            sm: "center",
          },
          flexDirection: {
            xs: "column",
            sm: "row",
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
            Asset Disposal
          </Typography>

          <Typography color="text.secondary">
            Dispose of assets that are damaged,
            obsolete, unusable, or no longer required.
          </Typography>
        </Box>

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
      </Box>

      {/* =================================================
          ALERTS
      ================================================= */}

      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess("")}
          sx={{ mb: 3 }}
        >
          {success}
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      <Alert
          severity="info"
          onClose={() => setError("")}
          sx={{ mb: 3 }}
        >
          Disposals require manager approval. Submitting a request
          will notify the manager for review, then you can complete
          the physical disposal once approved.
        </Alert>

      {/* =================================================
          DISPOSAL FORM
      ================================================= */}

      <Card
        elevation={0}
        sx={{
          maxWidth: 900,
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
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
            <DisposalIcon
              sx={{
                color: "#07548e",
                fontSize: 30,
              }}
            />

            <Typography
              variant="h6"
              fontWeight={700}
            >
              Record Asset Disposal
            </Typography>
          </Box>

          <Typography
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            This form is for manually initiating a disposal. If an asset
            appears under "Recommended for Disposal by Maintenance" above,
            submit it there instead — the asset is already selected for you.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Box
            component="form"
            onSubmit={handleSubmit}
          >
            <Grid container spacing={2}>

              {/* ASSET */}

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Asset"
                  name="asset_id"
                  value={form.asset_id}
                  onChange={handleChange}
                >
                  {availableAssets.length === 0 ? (
                    <MenuItem disabled>
                      No assets available
                    </MenuItem>
                  ) : (
                    availableAssets.map((asset) => (
                      <MenuItem
                        key={asset.asset_id}
                        value={asset.asset_id}
                      >
                        {asset.asset_name ||
                          `Asset #${asset.asset_id}`}

                        {asset.serial_number
                          ? ` — ${asset.serial_number}`
                          : ""}
                      </MenuItem>
                    ))
                  )}
                </TextField>
              </Grid>

              {/* DISPOSAL DATE */}

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Disposal Date"
                  name="disposal_date"
                  value={form.disposal_date}
                  onChange={handleChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>

              {/* REASON */}

              <Grid size={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  minRows={4}
                  label="Disposal Reason"
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  placeholder="Explain why this asset is being disposed..."
                />
              </Grid>
            </Grid>

            {/* BUTTONS */}

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
                variant="contained"
                fullWidth
                startIcon={<DisposalIcon />}
                disabled={saving}
                sx={{
                  py: 1.4,
                  backgroundColor: "#07548e",
                  textTransform: "none",
                  fontWeight: 700,

                  "&:hover": {
                    backgroundColor: "#064675",
                  },
                }}
              >
                {saving
                  ? "Processing..."
                  : "Submit Disposal Request"}
              </Button>

              <Button
                type="button"
                variant="outlined"
                fullWidth
                onClick={clearForm}
                disabled={saving}
                sx={{
                  py: 1.4,
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

      {/* =================================================
          MAINTENANCE-RECOMMENDED DISPOSALS - READY TO SUBMIT
      ================================================= */}

      <Card
        elevation={0}
        sx={{
          mt: 4,
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 1,
            }}
          >
            <DisposalIcon
              sx={{ color: "#07548e", fontSize: 28 }}
            />

            <Typography variant="h6" fontWeight={700}>
              Recommended for Disposal by Maintenance
            </Typography>
          </Box>

          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Maintenance has recommended these assets for disposal.
            Review the pre-selected asset, provide the disposal reason,
            and submit the request for manager approval. No re-selection
            is required.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {recommendedDisposals.length === 0 ? (
            <Typography color="text.secondary">
              No assets waiting to be submitted. When Maintenance
              recommends a disposal, the asset will appear here already
              selected.
            </Typography>
          ) : (
            <Stack spacing={3}>
              {recommendedDisposals.map((disposal) => (
                <Box
                  key={disposal.disposal_id}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#f6f9fc",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 2,
                      flexWrap: "wrap",
                      mb: 1,
                    }}
                  >
                    <Box>
                      <Typography fontWeight={700}>
                        {disposal.asset_name || "Asset"}
                      </Typography>

                      {disposal.serial_number && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Serial: {disposal.serial_number}
                        </Typography>
                      )}

                      <Chip
                        size="small"
                        label="Recommended"
                        color="info"
                        sx={{ mt: 0.5, fontWeight: 700 }}
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Asset ID: {disposal.asset_id || "N/A"} — Disposal #
                      {disposal.disposal_id}
                    </Typography>
                  </Box>

                  {disposal.maintenance_source_description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      <strong>Maintenance note:</strong>{" "}
                      {disposal.maintenance_source_description}
                    </Typography>
                  )}

                  {/* Pre-filled reason from Maintenance */}
                  <TextField
                    fullWidth
                    required
                    multiline
                    minRows={3}
                    label="Disposal Reason"
                    placeholder="Explain why this asset is being disposed..."
                    value={
                      recommendReasons[
                        disposal.disposal_id
                      ] !== undefined
                        ? recommendReasons[disposal.disposal_id]
                        : disposal.reason || ""
                    }
                    onChange={(e) =>
                      setRecommendReasons((previous) => ({
                        ...previous,
                        [disposal.disposal_id]: e.target.value,
                      }))
                    }
                    sx={{ mb: 2 }}
                  />

                  <Button
                    variant="contained"
                    startIcon={<DisposalIcon />}
                    disabled={submittingId === disposal.disposal_id}
                    onClick={() => handleSubmitRecommended(disposal)}
                    sx={{
                      backgroundColor: "#07548e",
                      textTransform: "none",
                      fontWeight: 700,
                      "&:hover": {
                        backgroundColor: "#064675",
                      },
                    }}
                  >
                    {submittingId === disposal.disposal_id
                      ? "Submitting..."
                      : "Submit Disposal Request"}
                  </Button>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* =================================================
          APPROVED DISPOSALS - READY TO COMPLETE
      ================================================= */}

      <Card
        elevation={0}
        sx={{
          mt: 4,
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 1,
            }}
          >
            <CompleteIcon
              sx={{ color: "#07548e", fontSize: 28 }}
            />

            <Typography variant="h6" fontWeight={700}>
              Approved Disposals - Ready to Complete
            </Typography>
          </Box>

          <Typography color="text.secondary" sx={{ mb: 3 }}>
            The manager has approved these disposals. Complete the
            physical disposal to mark the asset as Disposed.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {approvedDisposals.length === 0 ? (
            <Typography color="text.secondary">
              No approved disposals waiting to be completed.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {approvedDisposals.map((disposal) => (
                <Box
                  key={disposal.disposal_id}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Box>
                      <Typography fontWeight={700}>
                        {disposal.asset_name || "Disposed Asset"}
                      </Typography>

                      <Chip
                        size="small"
                        label={disposal.status || "Approved"}
                        color="success"
                        sx={{ mt: 0.5, fontWeight: 700 }}
                      />
                    </Box>

                    <Button
                      variant="contained"
                      startIcon={<CompleteIcon />}
                      disabled={completing}
                      onClick={() => openComplete(disposal)}
                      sx={{
                        backgroundColor: "#07548e",
                        textTransform: "none",
                        fontWeight: 700,
                        "&:hover": {
                          backgroundColor: "#064675",
                        },
                      }}
                    >
                      Complete Disposal
                    </Button>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Asset ID: {disposal.asset_id || "N/A"} — Disposal
                    #{disposal.disposal_id}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Reason: {disposal.reason || "N/A"}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* =================================================
          DISPOSAL HISTORY
      ================================================= */}

      <Card
        elevation={0}
        sx={{
          mt: 4,
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{ mb: 3 }}
          >
            Disposal History
          </Typography>

          {disposals.length === 0 ? (
            <Typography color="text.secondary">
              No disposal records found.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {disposals
                .slice(0, 10)
                .map((disposal, index) => (
                  <Box
                    key={
                      disposal.disposal_id ||
                      index
                    }
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border:
                        "1px solid #e5e7eb",
                      backgroundColor:
                        "#ffffff",
                    }}
                  >
                    <Typography
                      fontWeight={700}
                      sx={{ mb: 0.5 }}
                    >
                      {disposal.asset_name ||
                        "Disposed Asset"}
                    </Typography>

                    <Chip
                      size="small"
                      label={disposal.status || "Pending"}
                      color={getStatusColor(disposal.status)}
                      sx={{ mb: 1 }}
                    />

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Asset ID:{" "}
                      {disposal.asset_id || "N/A"}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Serial Number:{" "}
                      {disposal.serial_number ||
                        "N/A"}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Disposal Date:{" "}
                      {disposal.disposal_date
                        ? new Date(
                            disposal.disposal_date
                          ).toLocaleDateString()
                        : "N/A"}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Reason:{" "}
                      {disposal.reason ||
                        "N/A"}
                    </Typography>
                  </Box>
                ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* =================================================
          COMPLETE DISPOSAL DIALOG
      ================================================= */}

      <Dialog
        open={completeModal !== null}
        onClose={closeComplete}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Typography fontWeight={800}>
            Complete Physical Disposal
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {completeModal && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Asset:</strong>{" "}
                {completeModal.asset_name || "N/A"}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                <strong>Asset ID:</strong>{" "}
                {completeModal.asset_id || "N/A"}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                <strong>Reason:</strong>{" "}
                {completeModal.reason || "N/A"}
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            required
            select
            label="Disposal Method"
            value={completeMethod}
            onChange={(e) => setCompleteMethod(e.target.value)}
            sx={{ mb: 2 }}
          >
            <MenuItem value="Sold">Sold</MenuItem>
            <MenuItem value="Donated">Donated</MenuItem>
            <MenuItem value="Scrapped">Scrapped</MenuItem>
            <MenuItem value="Written Off">Written Off</MenuItem>
            <MenuItem value="Auction">Auction</MenuItem>
          </TextField>

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Completion Notes (optional)"
            value={completeNotes}
            onChange={(e) => setCompleteNotes(e.target.value)}
          />
        </DialogContent>

        <DialogActions>
          <Button
            onClick={closeComplete}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            startIcon={<CompleteIcon />}
            disabled={completing || !completeMethod}
            onClick={submitComplete}
            sx={{
              backgroundColor: "#07548e",
              textTransform: "none",
              fontWeight: 700,
              "&:hover": {
                backgroundColor: "#064675",
              },
            }}
          >
            {completing ? "Completing..." : "Complete Disposal"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssetOfficerDisposal;